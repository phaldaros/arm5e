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
import {
  LabActivity,
  LongevityRitualActivity,
  MinorEnchantment,
  SpellActivity,
  VisExtractionActivity
} from "../seasonal-activities/activity.js";
/**
 * Extend the basic ArM5eActorSheet with some very simple modifications
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
    let context = await super.getData();
    context.ui = this.getUserCache();
    context = await ArM5eItemMagicSheet.GetFilteredMagicalAttributes(context);

    // owner
    if (context.system.owner && context.system.owner.linked) {
      this.actor.apps[context.system.owner.document.sheet.appId] =
        context.system.owner.document.sheet;

      context.system.owner.document.apps[this.appId] = this;
    } else {
      // this._prepareCharacterItems(context);
      // context.planning.modifiers.apprentice = 0;
      log(false, "lab-sheet getData");
      log(false, context);

      return context;
    }

    context.config = CONFIG.ARM5E;

    context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
    if (context.planning === undefined) {
      let newData = await this.activity.getDefaultData();
      context.planning = {
        type: "inventSpell",
        data: newData,
        visibility: { desc: "hide", attr: "hide", options: "hide" },
        modifiers: { generic: 0, aura: 0 },
        distrations: "none",
        magicThSpecApply: false
      };
    }
    context.edition = context.config.activities.lab[context.planning.type].edition;

    // Covenant
    if (context.system.covenant) {
      if (context.system.covenant.linked) {
        this.actor.apps[context.system.covenant.document.sheet.appId] =
          context.system.covenant.document.sheet;
        context.edition.aura = "readonly";
      } else {
        context.edition.aura = "";
        context.classes = { aura: "editable" };
        if (context.planning.modifiers.aura == undefined) context.planning.modifiers.aura = 0;
      }
    }

    context.system.owner.magicTheory = context.system.owner.document.getAbilityStats("magicTheory");
    context.planning.modifiers.apprentice =
      (context.system.owner.document.system.apprentice?.int ?? 0) +
      (context.system.owner.document.system.apprentice?.magicTheory ?? 0);

    context.planning.modifiers.labQuality = this.actor.system.generalQuality.total;

    context.planning.modifiers.aura = this.actor.system.aura.computeMaxAuraModifier(
      context.system.owner.document.system.realms
    );

    context.planning.modifiers.magicThSpecApply = context.planning.magicThSpecApply ? 1 : 0;

    // TODO fix covenant date
    if (context.planning.date == undefined)
      context.planning.date = game.settings.get("arm5e", "currentDate");
    else if (context.planning.date.year == null) {
      context.planning.date.year = game.settings.get("arm5e", "currentDate").year;
    }

    context.planning.display = context.config.activities.lab[context.planning.type].display;
    context.namePrefix = "flags.arm5e.planning.data.";
    switch (context.planning.type) {
      case "inventSpell":
      case "learnSpell":
        {
          context.planning.data.system.level = computeLevel(context.planning.data.system, "spell");
          context.planning.label = ArM5eItem.GetEffectAttributesLabel(context.planning.data);
        }
        break;
      case "minorEnchantment":
        {
          context.planning.data.enchantment.system.level = computeLevel(
            context.planning.data.enchantment.system,
            "enchantment"
          );
          context.planning.label = ArM5eItem.GetEffectAttributesLabel(
            context.planning.data.enchantment
          );
          context.enchantPrefix = "flags.arm5e.planning.data.enchantment.";
          context.receptaclePrefix = "flags.arm5e.planning.data.receptacle.";
        }
        break;
      case "visExtraction":
        {
          context.planning.data.system.technique.value = "cr";
          context.planning.data.system.form.value = "vi";
        }
        break;
      case "longevityRitual":
        {
          context.planning.data.system.technique.value = "cr";
          context.planning.data.system.form.value = "co";
        }
        break;
    }
    this.activity.modifiers = context.planning.modifiers;
    context.activitySheet = this.activity.activitySheet;

    let labTot = this.activity.computeLabTotal(
      context.planning.data,
      context.planning.distractions
    );
    context.planning.activityBonus = this.activity.ownerActivityMod;
    context.planning.labSpecTotal = this.activity.labActivitySpec;
    context.planning.labTotal = { score: labTot.score, label: labTot.label };

    this.activity.prepareData(context);
    context.hasVisCost = this.activity.hasVisCost;

    // if (this.activity.hasVisCost) {
    //   const visCost = this.activity.getVisCost(context.planning);
    //   context.planning.data.visCost = {
    //     technique: visCost.technique,
    //     form: visCost.form,
    //     amount: visCost.amount,
    //     magus: [
    //       { label: "Vis from aura", art: "vi", amount: 2 },
    //       { label: "Purple flowers", art: "im", amount: 3 }
    //     ],
    //     lab: [{ label: "Scales of basilic", art: "te", amount: 10 }]
    //   };
    // }

    let result = this.activity.validation(context.planning);

    if (!result.valid) {
      context.edition.schedule = "disabled";
      if (result.duration <= 1) {
        context.planning.message = result.message;
      } else {
        context.planning.message =
          game.i18n.localize("arm5e.lab.planning.msg.unsupported") +
          "<br/>" +
          game.i18n.format("arm5e.lab.planning.msg.waste", {
            points: result.waste
          });
      }
    } else {
      context.edition.schedule = "";
      context.planning.message = `${result.message}&#10${game.i18n.format(
        "arm5e.lab.planning.msg.waste",
        {
          points: result.waste
        }
      )}`;
      if (context.system.owner.document.system.penalties.wounds.total != 0) {
        context.planning.message += `<br/> ${game.i18n.format("arm5e.lab.planning.msg.wounded", {
          penalty: context.system.owner.document.system.penalties.wounds.total
        })}`;
      }
    }
    context.planning.duration = result.duration;

    // Prepare items.
    this._prepareCharacterItems(context);

    log(false, "lab-sheet getData");
    log(false, context);

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
        planning.type === "inventSpell" ? "" : "disabled"
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
      this._resetPlanning(planning.type);
      this.render();
    });
    html.find(".refresh").click(this._refreshValues.bind(this));
    html.find(".schedule").click(async () => this._schedule());
    html.find(".moreinfo").click(async (ev) => {
      const actorId = $(ev.currentTarget).data("id");
      game.actors.get(actorId).sheet.render(true, { focus: true });
    });
  }
  async _changeActivity(item, event) {
    event.preventDefault();
    const activity = getDataset(event).activity;
    let chosenActivity = $(".lab-activity").find("option:selected")[0].value;
    this.activity = LabActivity.ActivityFactory(this.actor, chosenActivity);
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
    // await this.actor.unsetFlag(ARM5E.SYSTEM_ID, "planning");
    let newData = await this.activity.getDefaultData();
    let planning = {
      type: activity,
      data: newData,
      visibility: { desc: "hide", attr: "hide", options: "hide" },
      modifiers: { generic: 0, aura: 0 },
      distrations: "none",
      magicThSpecApply: false
    };
    await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
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
      case "longevityRitual":
      case "minorEnchantment":
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
      // case "speciality":
      // case "distinctive":
      // case "sanctumRoom":
      case "magicItem":
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
    const expanded = expandObject(formData);
    return super._updateObject(event, formData);
  }
}
