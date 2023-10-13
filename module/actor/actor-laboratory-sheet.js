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
import { HERMETIC_FILTER, TIME_FILTER, TOPIC_FILTER } from "../constants/userdata.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
/**
 * Extend the basic ArM5eActorSheet with some very simple modifications
 * @extends {ArM5eActorSheet}
 */
export class ArM5eLaboratoryActorSheet extends ArM5eActorSheet {
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
        { dragSelector: null, dropSelector: ".workbench" },
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
            laboratoryTexts: HERMETIC_FILTER
          },
          bookTopics: {
            abilitiesTopics: TOPIC_FILTER,
            artsTopics: TOPIC_FILTER,
            masteriesTopics: HERMETIC_FILTER
          },
          events: {
            diaryEvents: TIME_FILTER
          }
        }
      };

      sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    }
    return usercache[this.actor.id];
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    let context = await super.getData();

    context = await ArM5eItemMagicSheet.GetFilteredMagicalAttributes(context);

    context.config = CONFIG.ARM5E;
    context.namePrefix = "flags.arm5e.planning.data";

    context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
    if (context.planning === undefined) {
      await this._resetPlanning("inventSpell");
      context.planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
    }

    context.edition = context.config.activities.lab[context.planning.type].edition;

    // Covenant
    if (context.system.covenant) {
      if (context.system.covenant.linked) {
        this.actor.apps[context.system.covenant.document.sheet.appId] =
          context.system.covenant.document.sheet;
        this.actor.apps[context.system.covenant.document.sheet.appId] =
          context.system.covenant.document.sheet;
        context.edition.aura = "readonly";
      } else {
        context.edition.aura = "";
        context.classes = { aura: "editable" };
        if (context.planning.modifiers.aura == undefined) context.planning.modifiers.aura = 0;
      }
    }

    if (context.system.owner) {
      if (context.system.owner.linked) {
        this.actor.apps[context.system.owner.document.sheet.appId] =
          context.system.owner.document.sheet;
        context.system.owner.magicTheory =
          context.system.owner.document.getAbilityStats("magicTheory");
        context.planning.modifiers.apprentice =
          (context.system.owner.document.system.apprentice?.int ?? 0) +
          (context.system.owner.document.system.apprentice?.magicTheory ?? 0);
        context.system.owner.document.apps[this.appId] = this;
      } else {
        // this._prepareCharacterItems(context);
        context.planning.modifiers.apprentice = 0;
        log(false, "lab-sheet getData");
        log(false, context);

        return context;
      }
    }

    // Owner

    context.planning.modifiers.labQuality = this.actor.system.generalQuality.total;

    context.planning.modifiers.aura = this.actor.system.aura.computeMaxAuraModifier(
      context.system.owner.document.system.realms
    );

    // TODO fix covenant date
    if (context.planning.date == undefined)
      context.planning.date = game.settings.get("arm5e", "currentDate");
    else if (context.planning.date.year == null) {
      context.planning.date.year = game.settings.get("arm5e", "currentDate").year;
    }

    context.planning.display = context.config.activities.lab[context.planning.type].display;

    switch (context.planning.type) {
      case "inventSpell":
      case "learnSpell":
        {
          let labTot = this._computeLabTotal(context);

          context.planning.data.system.level = computeLevel(
            context.planning.data.system,
            context.planning.type
          );
          context.planning.label = ArM5eItem.GetEffectAttributesLabel(context.planning.data);
          context.planning.labTotal = { score: labTot.score, label: labTot.label };
        }
        break;
      case "visExtraction":
        {
          context.planning.data.system.technique.value = "cr";
          context.planning.data.system.form.value = "vi";
          let labTot = this._computeLabTotal(context);
          context.planning.labTotal = { score: labTot.score, label: labTot.label };
        }
        break;
    }

    let result = context.config.activities.lab[context.planning.type].validation(context.planning);

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

  _computeLabTotal(context) {
    let labTot = computeRawCastingTotal(context.planning.data, context.system.owner.document);

    let total = labTot.total;
    labTot.label += `+ ${game.i18n.localize("arm5e.sheet.int")} (${
      context.system.owner.document.system.characteristics.int.value
    }) &#10`;
    total += context.system.owner.document.system.characteristics.int.value;

    labTot.label += `+ ${game.i18n.localize("arm5e.skill.arcane.magicTheory")} (${
      context.system.owner.magicTheory.score
    }`;
    total += context.system.owner.magicTheory.score;
    if (context.planning.magicThSpecApply) {
      labTot.label += ` + 1`;
      total++;
    }
    labTot.label += `)&#10`;

    for (let [key, mod] of Object.entries(context.planning.modifiers)) {
      total += mod;
      if (mod != 0) {
        labTot.label += `+ ${game.i18n.localize("arm5e.lab.bonus." + key)} (${mod}) &#10`;
      }
    }

    // lab specialties
    let labSpec = this.actor.system.specialty[context.planning.data.system.technique.value].bonus;
    context.planning.labSpecTotal = labSpec;
    if (labSpec != 0) {
      total += labSpec;
      labTot.label += `+ ${game.i18n.localize("arm5e.sheet.speciality")} ${
        CONFIG.ARM5E.magic.arts[context.planning.data.system.technique.value].short
      } (${labSpec}) &#10`;
    }
    labSpec = this.actor.system.specialty[context.planning.data.system.form.value].bonus;
    context.planning.labSpecTotal += labSpec;
    if (labSpec != 0) {
      total += labSpec;
      labTot.label += `+ ${game.i18n.localize("arm5e.sheet.speciality")} ${
        CONFIG.ARM5E.magic.arts[context.planning.data.system.form.value].short
      } (${labSpec}) &#10`;
    }

    switch (context.planning.type) {
      case "inventSpell":
        labSpec = this.actor.system.specialty.spells.bonus;

        if (labSpec != 0) {
          context.planning.labSpecTotal += labSpec;
          total += labSpec;
          labTot.label += `+ ${game.i18n.localize("arm5e.sheet.speciality")} ${game.i18n.localize(
            "arm5e.lab.specialty.spells"
          )} (${labSpec}) &#10`;
        }
        break;
      case "learnSpell":
        labSpec = this.actor.system.specialty.texts.bonus;
        if (labSpec != 0) {
          context.planning.labSpecTotal += labSpec;
          total += labSpec;
          labTot.label += `+ ${game.i18n.localize("arm5e.sheet.speciality")} ${game.i18n.localize(
            "arm5e.lab.specialty.texts"
          )} (${labSpec}) &#10`;
        }
        break;
      case "visExtraction":
        labSpec = this.actor.system.specialty.visExtraction.bonus;
        if (labSpec != 0) {
          context.planning.labSpecTotal += labSpec;
          total += labSpec;
          labTot.label += `+ ${game.i18n.localize("arm5e.sheet.speciality")} ${game.i18n.localize(
            "arm5e.lab.specialty.visExtraction"
          )} (${labSpec}) &#10`;
        }
        break;
      default:
        break;
    }

    let effects = ArM5eActiveEffect.findAllActiveEffectsWithSubtypeFiltered(
      context.system.owner.document.effects,
      context.planning.type
    );

    context.planning.activityBonus = 0;
    for (let e of effects) {
      for (let ch of e.changes) {
        context.planning.activityBonus += Number(ch.value);
      }
    }
    if (context.planning.activityBonus > 0) {
      total += context.planning.activityBonus;
      labTot.label += `+ ${game.i18n.localize("arm5e.lab.bonus.activity")} (${
        context.planning.activityBonus
      })&#10`;
    }

    let deficiencyDivider = 1;
    if (labTot.deficientTech && labTot.deficientForm) {
      deficiencyDivider = 4;
    } else if (labTot.deficientTech || labTot.deficientForm) {
      deficiencyDivider = 2;
    }
    if (deficiencyDivider > 1) {
      labTot.label += game.i18n.format("arm5e.lab.planning.msg.artDeficiency", {
        divisor: deficiencyDivider
      });
    }
    let coeff = CONFIG.ARM5E.activities.distractions[context.planning.distractions ?? "none"].coeff;
    if (coeff != 1) {
      labTot.label += `* ${coeff.toFixed(2)} (${game.i18n.localize(
        "arm5e.lab.distraction.label"
      )})&#10`;
    }

    return { score: Math.round((total / deficiencyDivider) * coeff), label: labTot.label };
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

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

    switch (activity) {
      case "inventSpell":
      case "learnSpell":
        switch (chosenActivity) {
          case "inventSpell":
          case "learnSpell":
            break;
          default:
            await this._resetPlanning(chosenActivity);
            break;
        }
        break;
      case "visExtraction":
        switch (chosenActivity) {
          case "inventSpell":
          case "learnSpell":
            await this._resetPlanning(chosenActivity);
            break;
          default:
            break;
        }
        break;
    }
  }

  async _resetPlanning(activity) {
    let newSpell = await Item.create(
      {
        name: "New spell",
        type: "spell"
        // system:
      },
      { temporary: true }
    );
    let planning = {
      type: activity,
      data: newSpell.toObject(),
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

    switch (planning.type) {
      case "inventSpell":
      case "learnSpell":
        sourceQuality = computeLevel(planning.data.system, planning.type);
        break;
      case "visExtraction":
        applied = true;
        const visEntry = [
          {
            name: "Vim vis",
            type: "vis",
            system: {
              art: "vi",
              pawns: Math.ceil(planning.labTotal.score / 10),
              description: game.i18n.format("arm5e.lab.planning.msg.visExtracted2", {
                covenant: owner.system.covenant.value
              })
            }
          }
        ];
        let vis = await this.actor.createEmbeddedDocuments("Item", visEntry, {});
        externalIds.push({ actorId: this.actor._id, itemId: vis[0]._id });
        break;
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
    if (dropData.type == "Item" && event.currentTarget.dataset.drop === "workbench") {
      // if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
      const item = await Item.implementation.fromDropData(dropData);
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
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
        default:
          return await super._onDrop(event);
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
    return await super._updateObject(event, formData);
    if (!this.object.id) return;
  }
}
