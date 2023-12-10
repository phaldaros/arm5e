import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { computeLevel, computeRawCastingTotal } from "../helpers/magic.js";
import { spellFormLabel, spellTechniqueLabel } from "../helpers/spells.js";
import { resetOwnerFields } from "../item/item-converter.js";
import { ArM5eItemMagicSheet } from "../item/item-magic-sheet.js";
import { ArM5eItem } from "../item/item.js";
import { getDataset, log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
import { ArM5eItemDiarySheet } from "../item/item-diary-sheet.js";
import {
  HERMETIC_FILTER,
  HERMETIC_TOPIC_FILTER,
  TIME_FILTER,
  TOPIC_FILTER
} from "../constants/userdata.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { LabActivity, SpellActivity } from "../seasonal-activities/activity.js";
/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5eLaboratoryActorSheet extends ArM5eActorSheet {
  constructor(object, options) {
    super(object, options);
    if (this.actor.system.owner.linked) {
      this.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      if (this.planning) {
        this.activity = LabActivity.ActivityFactory(this.actor, this.planning.type);
      } else {
        this.activity = new SpellActivity(
          this.actor,
          this.actor.system.owner.document,
          "inventSpell"
        );
      }
    }
  }
  /** @override */
  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return `systems/arm5e/templates/actor/actor-laboratory-sheet.html`;
    }
    return `systems/arm5e/templates/actor/lab-limited-sheet.html`;
  }

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-laboratory-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "planning"
        },
        {
          navSelector: ".inventory-tabs",
          contentSelector: ".inventory-body",
          initial: "inventory"
        }
      ],
      dragDrop: [
        { dragSelector: null, dropSelector: ".drop-spell" },
        { dragSelector: null, dropSelector: ".drop-enchant" },
        { dragSelector: null, dropSelector: ".mainLaboratory" }
      ]
    });
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.actor.id] == undefined) {
      usercache[this.actor.id] = {
        filters: {
          hermetic: {
            spells: HERMETIC_FILTER,
            magicalEffects: HERMETIC_FILTER,
            laboratoryTexts: HERMETIC_FILTER
          },
          bookTopics: {
            abilitiesTopics: TOPIC_FILTER,
            artsTopics: TOPIC_FILTER,
            masteriesTopics: HERMETIC_TOPIC_FILTER
          },
          events: {
            diaryEvents: TIME_FILTER
          }
        },
        sections: {
          visibility: { common: {}, planning: {} }
        }
      };
    } else {
      let sections = { visibility: { common: {}, planning: {} } };
      mergeObject(sections, usercache[this.actor.id].sections);
      usercache[this.actor.id].sections = sections;
    }
    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    return usercache[this.actor.id];
  }

  /* -------------------------------------------- */

  /** @override */
  /**
   * Description
   * @returns {any}
   */
  async getData() {
    log(false, "GET WORKBENCH DATA");
    let context = await super.getData();
    let isValid = true;
    context = await ArM5eItemMagicSheet.GetFilteredMagicalAttributes(context);
    // owner
    if (context.system.owner && context.system.owner.linked) {
      this.actor.apps[context.system.owner.document.sheet.appId] =
        context.system.owner.document.sheet;

      context.system.owner.document.apps[this.appId] = this;
      if (this.activity == undefined) {
        this.activity = new SpellActivity(
          this.actor,
          this.actor.system.owner.document,
          "inventSpell"
        );
      }
    } else {
      this._prepareCharacterItems(context);
      // this.planning.modifiers.apprentice = 0;
      log(false, "lab-sheet getData");
      log(false, context);

      return context;
    }

    context.config = CONFIG.ARM5E;

    // context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");

    if (this.planning === undefined) {
      let newData = await this.activity.getDefaultData();
      this.planning = {
        type: "inventSpell",
        data: newData,
        visibility: { desc: "hide", attr: "hide", options: "hide" },
        modifiers: { generic: 0, aura: 0 },
        distractions: "none",
        magicThSpecApply: false
      };
    }
    context.edition = context.config.activities.lab[this.planning.type].edition;
    this.planning.messages = [];

    // Covenant
    if (context.system.covenant) {
      if (context.system.covenant.linked) {
        this.actor.apps[context.system.covenant.document.sheet.appId] =
          context.system.covenant.document.sheet;
        context.edition.aura = "readonly";
      } else {
        context.edition.aura = "";
        context.classes = { aura: "editable" };
        if (this.planning.modifiers == undefined) this.planning.modifiers = { aura: 0 };
        else if (this.planning.modifiers.aura == undefined) this.planning.modifiers.aura = 0;
      }
    }

    context.system.owner.magicTheory = context.system.owner.document.getAbilityStats("magicTheory");
    this.planning.modifiers.apprentice =
      (context.system.owner.document.system.apprentice?.int ?? 0) +
      (context.system.owner.document.system.apprentice?.magicTheory ?? 0);

    this.planning.modifiers.labQuality = this.actor.system.generalQuality.total;

    this.planning.modifiers.aura = this.actor.system.aura.computeMaxAuraModifier(
      context.system.owner.document.system.realms
    );

    this.planning.modifiers.magicThSpecApply = this.planning.magicThSpecApply ? 1 : 0;

    // TODO fix covenant date
    if (this.planning.date == undefined)
      this.planning.date = game.settings.get("arm5e", "currentDate");
    else if (this.planning.date.year == null) {
      this.planning.date.year = game.settings.get("arm5e", "currentDate").year;
    }

    this.planning.display = context.config.activities.lab[this.planning.type].display;

    this.planning.namePrefix = "flags.arm5e.planning.data.";
    this.planning.expiryAllowed = false;
    switch (this.planning.type) {
      case "inventSpell":
      case "learnSpell":
        {
          this.planning.data.system.level = computeLevel(this.planning.data.system, "spell");
          this.planning.label = ArM5eItem.GetEffectAttributesLabel(this.planning.data);
        }
        break;
      case "minorEnchantment":
        {
          this.planning.data.enchantment.system.level = computeLevel(
            this.planning.data.enchantment.system,
            "enchantment"
          );
          this.planning.label = ArM5eItem.GetEffectAttributesLabel(this.planning.data.enchantment);
          context.enchantPrefix = "flags.arm5e.planning.data.enchantment.";
          context.receptaclePrefix = "flags.arm5e.planning.data.receptacle.";
          // If settings were too restrictive, allow existing Items to keep their value.
          const aspect = this.planning.data.receptacle.system.enchantments.aspects[0].aspect;
          this.planning.data.ASPECTS[aspect] = CONFIG.ARM5E.ASPECTS[aspect];
        }
        break;
      case "visExtraction":
        {
          this.planning.data.system.technique.value = "cr";
          this.planning.data.system.form.value = "vi";
        }
        break;
      case "longevityRitual":
        {
          this.planning.data.system.technique.value = "cr";
          this.planning.data.system.form.value = "co";
        }
        break;
    }
    this.activity.modifiers = this.planning.modifiers;
    context.activitySheet = this.activity.activitySheet;

    let labTot = this.activity.computeLabTotal(this.planning.data, this.planning.distractions);
    this.planning.activityBonus = this.activity.ownerActivityMod;
    this.planning.labSpecTotal = this.activity.labActivitySpec;
    this.planning.labTotal = { score: labTot.score, label: labTot.label };
    this.activity.prepareData(this.planning);
    context.hasVisCost = this.activity.hasVisCost;

    if (this.activity.hasVisCost) {
      const visCost = this.activity.getVisCost(this.planning);

      let magusStock = context.system.owner.document.system.vis
        .filter((v) => {
          return v.system.art == visCost.technique || v.system.art == visCost.form;
        })
        .reduce((res, current) => {
          res[current._id] = {
            label: current.name,
            amount: current.system.pawns,
            art: CONFIG.ARM5E.magic.arts[current.system.art].short,
            used: this.planning.data.visCost?.magus[current._id]?.used ?? 0
          };
          return res;
        }, {});

      let labStock = this.actor.system.rawVis
        .filter((v) => {
          return v.system.art == visCost.technique || v.system.art == visCost.form;
        })
        .reduce((res, current) => {
          res[current._id] = {
            label: current.name,
            amount: current.system.pawns,
            art: CONFIG.ARM5E.magic.arts[current.system.art].short,
            used: this.planning.data.visCost?.lab[current._id]?.used ?? 0
          };
          return res;
        }, {});

      this.planning.data.visCost = {
        technique: CONFIG.ARM5E.magic.arts[visCost.technique].label,
        form: CONFIG.ARM5E.magic.arts[visCost.form].label,
        amount: visCost.amount,
        magus: magusStock,
        lab: labStock
      };
      // check if vis cost is more than 2 x magic theory
      if (
        visCost.amount >
        (context.system.owner.magicTheory.score + this.planning.modifiers.magicThSpecApply) * 2
      ) {
        this.planning.messages.push(
          game.i18n.format("arm5e.lab.planning.msg.tooMuchVis", {
            num: visCost.amount
          })
        );
        isValid = false;
      }

      let res = this.activity.validateVisCost(this.planning.data.visCost);
      if (!res.valid) {
        this.planning.messages.push(res.message);
      }
      isValid &= res.valid;
    }

    let result = this.activity.validation(this.planning);
    isValid &= result.valid;
    if (!isValid) {
      context.edition.schedule = "disabled";
      if (result.duration <= 1) {
        this.planning.messages.push(result.message);
      } else {
        this.planning.messages.push(
          game.i18n.localize("arm5e.lab.planning.msg.unsupported") +
            "<br/>" +
            game.i18n.format("arm5e.lab.planning.msg.waste", {
              points: result.waste
            })
        );
      }
    } else {
      context.edition.schedule = "";
      this.planning.messages.push(
        `${result.message}&#10${game.i18n.format("arm5e.lab.planning.msg.waste", {
          points: result.waste
        })}`
      );
      if (context.system.owner.document.system.penalties.wounds.total != 0) {
        this.planning.messages.push(
          `${game.i18n.format("arm5e.lab.planning.msg.wounded", {
            penalty: context.system.owner.document.system.penalties.wounds.total
          })}`
        );
      }
    }
    this.planning.duration = result.duration;

    // Prepare items.
    this._prepareCharacterItems(context);

    log(false, "lab-sheet getData");
    log(false, context);
    context.planning = this.planning;
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (this.activity) {
      this.activity.activateListeners(html);
    }
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    html.find(".advanced-req").click(async () => {
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      let update = await ArM5eItemMagicSheet.PickRequisites(
        planning.data.system,
        "Lab",
        planning.type === "learnSpell" ? "disabled" : ""
      );
      if (update) {
        let tmp = mergeObject(planning.data, update);
        planning.data = tmp;
        await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
      }
    });

    html.find(".lab-activity").change(async (event) => this._changeActivity(this.actor, event));
    html.find(".reset-planning").click(async (event) => {
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      event.preventDefault();
      await this._resetPlanning(planning?.type ?? "inventSpell");
      this.render();
    });
    html.find(".vis-use").change(async (event) => this._useVis(event));
    html.find(".refresh").click(this._refreshValues.bind(this));
    html.find(".schedule").click(async () => this._schedule());
    html.find(".moreinfo").click(async (ev) => {
      const actorId = $(ev.currentTarget).data("id");
      game.actors.get(actorId).sheet.render(true, { focus: true });
    });
    html.find(".type-change").change(async (event) => {
      event.preventDefault();
      let newType = event.currentTarget.selectedOptions[0].value;
      this.planning.data.itemType = newType;
      const receptacle = this.planning.data.receptacle;
      let newReceptacle = await Item.create(
        {
          name: receptacle.name,
          type: newType,
          img: receptacle.img,
          system: receptacle.system
        },
        { temporary: true, render: false }
      );
      newReceptacle = newReceptacle.toObject();
      this.submit({
        preventClose: true,
        updateData: { "flags.arm5e.planning.data.receptacle": newReceptacle }
      });
    });

    html.find(".aspect-change").change(async (e) => {
      const dataset = getDataset(e);
      // let aspects = this.actor.flags.arm5e.planning.data.receptacle.system.enchantments.aspects;
      let aspects = this.planning.data.receptacle.system.enchantments.aspects;
      let aspect = e.currentTarget.selectedOptions[0].value;
      const effect = Object.keys(CONFIG.ARM5E.ASPECTS[aspect].effects)[0];
      aspects[Number(dataset.index)].aspect = aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus = CONFIG.ARM5E.ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects = CONFIG.ARM5E.ASPECTS[aspect].effects;
      this.submit({
        preventClose: true,
        updateData: { "flags.arm5e.planning.data.receptacle.system.enchantments.aspects": aspects }
      });
    });
    html.find(".effect-change").change(async (e) => {
      const dataset = getDataset(e);
      // let aspects = this.actor.flags.arm5e.planning.data.receptacle.system.enchantments.aspects;
      let aspects = this.planning.data.receptacle.system.enchantments.aspects;
      const effect = e.currentTarget.selectedOptions[0].value;
      const aspect = aspects[Number(dataset.index)].aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus = CONFIG.ARM5E.ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects = CONFIG.ARM5E.ASPECTS[aspect].effects;
      this.submit({
        preventClose: true,
        updateData: { "flags.arm5e.planning.data.receptacle.system.enchantments.aspects": aspects }
      });
    });
  }

  async _useVis(event) {
    event.preventDefault();
    const dataset = getDataset(event);

    const amount = Number(dataset.amount);
    let val = Number(event.target.value);
    if (val > amount) {
      val = amount;
      event.target.value = amount;
    }
    const planning = this.planning;
    planning.data.visCost[dataset.stock][dataset.id].used = val;

    await this.submit({
      preventClose: true,
      updateData: { "flags.arm5e.planning.data.visCost": planning.data.visCost }
    });
    // this.render();
  }

  async _changeActivity(item, event) {
    event.preventDefault();
    const activity = getDataset(event).activity;
    let chosenActivity = $(".lab-activity").find("option:selected")[0].value;
    switch (chosenActivity) {
      case "inventSpell":
      case "learnSpell":
        switch (activity) {
          case "inventSpell":
          case "learnSpell":
            break;
          default:
            await this._resetPlanning(chosenActivity);
            break;
        }
        return;
      case "minorEnchantment":
      case "visExtraction":
      case "longevityRitual":
        break;
    }
    await this._resetPlanning(chosenActivity);
  }

  async _resetPlanning(activity) {
    await this.actor.update({ "flags.arm5e.planning.-=data": null }, { render: false });
    this.activity = LabActivity.ActivityFactory(this.actor, activity ?? "inventSpell");
    let newData = await this.activity.getDefaultData();
    this.planning.type = activity;
    this.planning.data = newData;
    this.planning.visibility = { desc: "hide", attr: "hide", options: "hide" };
    this.planning.modifiers = { generic: 0, aura: 0 };
    this.planning.distractions = "none";
    this.planning.magicThSpecApply = false;
    // await this.submit({ preventClose: true, updateData: { "flags.arm5e.planning": this.planning } });
    await this.actor.update({ "flags.arm5e.planning": this.planning }, { recursive: true });
  }

  _refreshValues(event) {
    event.preventDefault();
    this.render(true);
  }

  async _schedule() {
    let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");

    let owner = this.actor.system.owner.document;
    let applied = false;
    let dates = DiaryEntrySchema.buildSchedule(
      planning.duration,
      planning.date.year,
      planning.date.season
    );

    // Add a lab diary entry for occupation
    const labLog = [
      {
        name: game.i18n.format("arm5e.activity.title.labinuse", {
          activity: game.i18n.localize(CONFIG.ARM5E.activities.lab[planning.type].label),
          user: owner.name
        }),
        type: "diaryEntry",
        system: {
          dates: dates,
          activity: "lab",
          duration: planning.duration,
          description: "",
          done: false
        }
      }
    ];
    let log = await this.actor.createEmbeddedDocuments("Item", labLog, {});
    let externalIds = [{ actorId: this.actor._id, itemId: log[0]._id, flags: 2 }];
    let sourceQuality = 0;
    let achievements = [];
    let achievement = this.activity.activityAchievement(planning);
    if (achievement != null) {
      achievements.push(achievement);
    }

    switch (planning.type) {
      case "inventSpell":
      case "learnSpell":
        sourceQuality = computeLevel(planning.data.system, planning.type);
        break;
      case "visExtraction":
        break;
      case "longevityRitual":
      case "minorEnchantment":
        {
          for (let [k, vis] of Object.entries(planning.data.visCost.magus)) {
            if (Number(vis.used) > 0) {
              externalIds.push({
                actorId: owner._id,
                itemId: k,
                flags: 1,
                data: { amountLabel: "pawns", amount: vis.used }
              });
            }
          }
          for (let [k, vis] of Object.entries(planning.data.visCost.lab)) {
            if (Number(vis.used) > 0) {
              externalIds.push({
                actorId: this.actor._id,
                itemId: k,
                flags: 1,
                data: { amountLabel: "pawns", amount: vis.used }
              });
            }
          }
        }
        break;
      default:
        throw "Unsupported activity";
    }

    const entryData = [
      {
        name: game.i18n.localize(CONFIG.ARM5E.activities.lab[planning.type].label),
        type: "diaryEntry",
        system: {
          done: false,
          cappedGain: false,
          dates: dates,
          sourceQuality: sourceQuality,
          activity: planning.type,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: planning.duration,
          description: `${game.i18n.localize("arm5e.sheet.labTotal")}: <b>${
            planning.labTotal.score
          }</b> <br/> ${planning.labTotal.label}`,
          achievements: achievements,
          externalIds: externalIds
        }
      }
    ];

    let entry = await owner.createEmbeddedDocuments("Item", entryData, {});
    switch (planning.type) {
      case "inventSpell":
      case "learnSpell":
        await entry[0].sheet._addNewSpell(planning.data);
        break;
      default:
        break;
    }
    entry[0].sheet.render(true);
  }

  async _onDrop(event) {
    const dropData = TextEditor.getDragEventData(event);
    if (dropData.type == "Item") {
      // if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
      const item = await Item.implementation.fromDropData(dropData);
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");

      if (event.currentTarget.dataset.drop === "spell") {
        switch (item.type) {
          case "laboratoryText": {
            if (item.system.type !== "spell") {
              break;
            }
          }
          case "magicalEffect":
          case "spell": {
            let newSpell = await Item.create(item.toObject(), { temporary: true });
            planning.type = "learnSpell";
            let data = newSpell.toObject();
            planning.data = resetOwnerFields(data);
            await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
            return true;
          }
          case "enchantment": {
            let newEnchant = await Item.create(item.toObject(), { temporary: true });
            planning.type = "learnSpell";
            let data = newEnchant.toObject();
            planning.data = resetOwnerFields(data);
            await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
          }
          default:
            return await super._onDrop(event);
        }
      } else if (event.currentTarget.dataset.drop === "enchant") {
        //   switch (item.type) {
        //   case "laboratoryText": {
        //     if (item.system.type !== "spell") {
        //       break;
        //     }
        //   }
        //   case "magicalEffect":
        //   case "spell": {
        //     let newSpell = await Item.create(item.toObject(), { temporary: true });
        //     planning.type = "learnSpell";
        //     let data = newSpell.toObject();
        //     planning.data = resetOwnerFields(data);
        //     await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
        //     return true;
        //   }
        //   case "enchantment": {
        //     let newEnchant = await Item.create(item.toObject(), { temporary: true });
        //     planning.type = "minorEnchant";
        //     let data = newEnchant.toObject();
        //     planning.data = resetOwnerFields(data);
        //     await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
        //   }
        //   case "item": {
        //   }
        // }
      }
    }
    return await super._onDrop(event);
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    super._prepareCharacterItems(sheetData);
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.system.type) {
          case "laboratoryOutfitting":
          case "laboratoryStructure":
          case "laboratorySupernatural":
          case "other":
            return true;
          default:
            return false;
        }
      case "spell":
      case "vis":
      case "item":
      case "book":
      case "personalityTrait":
      case "magicalEffect":
      case "laboratoryText":
        return true;
      default:
        return false;
    }
  }

  isActorDropAllowed(type) {
    switch (type) {
      case "player":
      case "npc":
      case "covenant":
        return true;
      default:
        return false;
    }
  }

  async _bindActor(actor) {
    if (!["covenant", "player", "npc", "beast"].includes(actor.type)) return false;
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
      updateData["system.covenant.actorId"] = actor._id;
    } else if (["player", "npc", "beast"].includes(actor.type)) {
      updateData["system.owner.value"] = actor.name;
      updateData["system.owner.actorId"] = actor._id;
    }

    return await this.actor.update(updateData, {});
  }

  async _unbindActor(actor) {
    if (!["covenant", "player", "npc", "beast"].includes(actor.type)) return false;
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = "";
      updateData["system.covenant.actorId"] = null;
    } else if (["player", "npc", "beast"].includes(actor.type)) {
      updateData["system.owner.value"] = "";
      updateData["system.owner.actorId"] = null;
    }
    return await this.actor.update(updateData, {});
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    if (!this.object.id) return;
    const expanded = expandObject(formData);
    const source = this.object.toObject();

    const planning = expanded.flags?.arm5e?.planning;
    if (planning) {
      foundry.utils.mergeObject(this.planning, planning, {
        recursive: true
      });
      expanded.flags.arm5e.planning = this.planning;
    }

    return super._updateObject(event, expanded);
  }
}
