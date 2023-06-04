import { ARM5E } from "../config.js";
import { stressDie } from "../dice.js";
import { log } from "../tools.js";
import {
  boolOption,
  convertToInteger,
  convertToNumber,
  itemBase,
  XpField
} from "./commonSchemas.js";
const fields = foundry.data.fields;

export class VisSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      art: new fields.StringField({
        required: false,
        blank: false,
        initial: "cr",
        choices: Object.keys(ARM5E.magic.arts)
      }),
      pawns: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      })
    };
  }

  static migrateData(data) {
    // if (data.art == "") {
    //   data.art = "cr";
    // } else
    if (data.art?.value) {
      data.art = data.art.value;
    }

    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.art.value !== undefined) {
      updateData["system.art"] = itemData.system.art.value;
    } else if (itemData.system.art == "") {
      updateData["system.art"] = "cr";
    }
    // get ride of form of vis field
    if (
      itemData.system.form != undefined &&
      itemData.system.form !== "Physical form of the raw vis." &&
      itemData.system.form !== ""
    ) {
      updateData["system.description"] = itemData.system.description + itemData.system.form;
      updateData["system.-=form"] = null;
    }

    return updateData;
  }

  hasQuantity() {
    return { name: "pawns", qty: this.pawns };
  }

  async studyVis(itemId, actor) {
    let artStats = actor.getArtStats(this.art);
    let amount = Math.max(1, Math.ceil(artStats.derivedScore / 5));
    if (amount > this.pawns) {
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
      art: CONFIG.ARM5E.magic.arts[this.art].label,
      bonusActiveEffects: actor.system.bonuses.activities.visStudy
    };
    let auraLabel = game.i18n.localize("arm5e.sheet.aura");
    let dataset = {
      roll: "option",
      name: "",
      option1: aura,
      txtoption1: 0,
      physicalcondition: false,
      moredata: { id: itemId, art: this.art, amount: amount }
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
            callback: async (html) => {
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
            done: true,
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
