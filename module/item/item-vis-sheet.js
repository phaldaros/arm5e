import { stressDie } from "../dice.js";
import { debug, log } from "../tools.js";
import { ArM5eItemSheet, ArM5eItemSheetNoDesc } from "./item-sheet.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemVisSheet extends ArM5eItemSheetNoDesc {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800
    });
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    context.displayStudyIcon = this.item.isOwned && this.item.actor._isMagus();
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".vis-study").click(async () => {
      await this.studyVis();
    });
  }

  async studyVis() {
    const item = this.item;
    if (!this.item.isOwned) return;
    const actor = item.actor;
    if (!actor._isMagus()) return;
    let artStats = actor.getArtStats(item.system.art);
    let amount = Math.max(1, Math.ceil(artStats.derivedScore / 5));
    if (amount > item.system.pawns) {
      ui.notifications.info(
        game.i18n.format("arm5e.notification.noEnoughVis", { name: actor.name })
      );
      return;
    }
    let aura = 0;
    if (actor.system.covenant.linked) {
      aura = game.actors.get(actor.system.covenant.actorId).system.levelAura;
    }
    let dialogData = {
      aura: aura,
      amount: amount,
      art: CONFIG.ARM5E.magic.arts[item.system.art].label,
      bonusActiveEffects: actor.system.bonuses.activities.visStudy
    };
    let auraLabel = game.i18n.localize("arm5e.sheet.aura");
    let dataset = {
      roll: "option",
      name: "",
      option1: aura,
      txtoption1: 0,
      physicalcondition: false,
      moredata: { id: item.id, art: item.system.art, amount: amount }
    };
    actor.rollData.init(dataset, actor);
    const html = await renderTemplate("systems/arm5e/templates/generic/vis-study.html", dialogData);
    new Dialog(
      {
        title: game.i18n.localize("arm5e.activity.visStudy"),
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.dialog.button.roll"),
            callback: async html => {
              let val = html.find('input[name="aura"]');
              actor.rollData.setGenericField(auraLabel, Number(val.val()), 1, "+");
              await stressDie(actor, dataset.roll, 0, this.applyResults);
            }
          }
        },
        default: "yes",
        close: null
      },
      {
        jQuery: true,
        height: "140px",
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  }

  async applyResults(actor, roll, message, rollData) {
    let currentDate = game.settings.get("arm5e", "currentDate");
    if (roll.botches > 0) {
      await actor.update({
        "system.warping.points": actorCaster.system.warping.points + roll.botches
      });
      //ui.notifications.info()
    } else {
      const xpGain = roll.total + actor.system.bonuses.activities.visStudy;
      const amount = rollData.additionalData.amount;
      let item = actor.items.get(rollData.additionalData.id);
      const entryData = [
        {
          name: game.i18n.format("arm5e.activity.title.visStudy", {
            art: game.i18n.localize(CONFIG.ARM5E.magic.arts[rollData.additionalData.art].label)
          }),
          type: "diaryEntry",
          system: {
            cappedGain: false,
            dates: [
              { season: currentDate.season, date: "", year: currentDate.year, applied: true }
            ],
            sourceQuality: xpGain,
            activity: "visStudy",
            progress: {
              abilities: [],
              arts: [
                {
                  key: rollData.additionalData.art,
                  maxLevel: 0,
                  xp: xpGain
                }
              ],
              spells: [],
              newSpells: []
            },
            optionKey: "standard",
            duration: 1,
            description: game.i18n.format("arm5e.activity.desc.visStudy", {
              amount: amount,
              art: game.i18n.localize(CONFIG.ARM5E.magic.arts[rollData.additionalData.art].label),
              xp: xpGain
            }),
            externalIds: [
              {
                actorId: actor.id,
                itemId: item.id,
                flags: 1,
                data: { amountLabel: "pawns", amount: amount }
              }
            ]
          }
        }
      ];
      await actor.changeHermeticArt(rollData.additionalData.art, xpGain);
      await item.update({ "system.pawns": item.system.pawns - amount });
      let entry = await actor.createEmbeddedDocuments("Item", entryData, {});
      entry[0].sheet.render(true);
    }
  }
}
