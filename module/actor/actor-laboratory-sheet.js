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
    context.system.world = {};
    context.system.world.covenants = game.actors
      .filter(a => a.type == "covenant")
      .map(({ name, id }) => ({
        name,
        id
      }));
    if (context.system.covenant) {
      let cov = context.system.world.covenants.filter(c => c.name == context.system.covenant.value);
      if (cov.length > 0) {
        context.system.covenant.linked = true;
        context.system.covenant.actorId = cov[0].id;
        context.covenant = game.actors.get(cov[0].id);
        context.edition.aura = "readonly";
      } else {
        context.classes = { aura: "editable" };
        context.system.covenant.linked = false;
      }
    }
    // Owner
    context.system.world.magi = game.actors
      .filter(a => a._isMagus() === true)
      .map(({ name, id }) => ({
        name,
        id
      }));
    if (context.system.world.magi.length > 0) {
      let per = context.system.world.magi.filter(p => p.name == context.system.owner.value);
      if (per.length > 0) {
        context.system.owner.linked = true;
        context.system.owner.actorId = per[0].id;
        context.owner = game.actors.get(per[0].id);
        context.owner.magicTheory = context.owner.getAbilityStats("magicTheory");
        context.owner.apprentice =
          (context.owner.system.apprentice?.int ?? 0) +
          (context.owner.system.apprentice?.magicTheory ?? 0);
      } else {
        context.system.owner.linked = false;
        this._prepareCharacterItems(context);

        log(false, "lab-sheet getData");
        log(false, context);

        return context;
      }
    }

    // // tmp TODO remove
    // if (context.planning.modifiers == undefined) {
    //   context.planning.modifiers = {};
    // }
    // if (context.planning.modifiers.generic == undefined) {
    //   context.planning.modifiers.generic = 0;
    // }
    if (context.owner.system.apprentice?.magicTheory ?? 0 > 0) {
      context.planning.modifiers.apprentice =
        (context.owner.system.apprentice?.int ?? 0) + context.owner.system.apprentice?.magicTheory;
    } else {
      context.planning.modifiers.apprentice = 0;
    }
    context.planning.modifiers.labQuality = this.actor.system.generalQuality.total;
    if (context.system.covenant.linked && context.planning.modifiers.aura == undefined) {
      context.planning.modifiers.aura = Number(context.covenant.system.levelAura);
      // TODO fix covenant date
    }
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
      if (result.duration == 0) {
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
    }
    context.planning.duration = result.duration;

    // Prepare items.
    this._prepareCharacterItems(context);

    log(false, "lab-sheet getData");
    log(false, context);

    return context;
  }

  _computeLabTotal(context) {
    let labTot = computeRawCastingTotal(context.planning.data, context.owner);

    let total = labTot.total;
    labTot.label += `+ ${game.i18n.localize("arm5e.sheet.int")} (${
      context.owner.system.characteristics.int.value
    }) &#10`;
    total += context.owner.system.characteristics.int.value;

    labTot.label += `+ ${game.i18n.localize("arm5e.skill.arcane.magicTheory")} (${
      context.owner.magicTheory.score
    }`;
    total += context.owner.magicTheory.score;
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
      context.owner.effects,
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

    return { score: Math.round(total / deficiencyDivider), label: labTot.label };
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

    html.find(".lab-activity").change(async event => this._changeActivity(this.actor, event));
    html.find(".reset-planning").click(async () => {
      this._resetPlanning();
      this.render();
    });
    html.find(".refresh").click(this._refreshValues.bind(this));
    html.find(".schedule").click(async () => this._schedule());
    html.find(".moreinfo").click(async ev => {
      const actorId = $(ev.currentTarget).data("id");
      game.actors.get(actorId).sheet.render(true);
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
      modifiers: { generic: 0 },
      magicThSpecApply: false
    };
    await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", planning);
  }

  _refreshValues() {
    this.render(true);
  }

  async _schedule() {
    let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");

    let owner = game.actors.get(this.actor.system.owner.actorId);
    const labLog = [
      {
        name: game.i18n.format("arm5e.activity.title.labinuse", {
          activity: game.i18n.localize(CONFIG.ARM5E.activities.lab[planning.type].label),
          user: owner.name
        }),
        type: "diaryEntry",
        system: {
          dates: [{ season: planning.date.season, year: planning.date.year, applied: true }],
          activity: "lab",
          duration: 1,
          description: ""
        }
      }
    ];
    let log = await this.actor.createEmbeddedDocuments("Item", labLog, {});
    let externalIds = [{ actorId: this.actor._id, itemId: log[0]._id }];
    let sourceQuality = 0;
    let applied = false;
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
              pawns: Math.floor(planning.labTotal.score / 10),
              description: game.i18n.format("arm5e.lab.planning.msg.visExtracted2", {
                covenant: owner.system.covenant.value
              })
            }
          }
        ];
        let vis = await owner.createEmbeddedDocuments("Item", visEntry, {});
        externalIds.push({ actorId: owner._id, itemId: vis[0]._id });
        break;
    }

    const entryData = [
      {
        name: game.i18n.localize(CONFIG.ARM5E.activities.lab[planning.type].label),
        type: "diaryEntry",
        system: {
          cappedGain: false,
          dates: [{ season: planning.date.season, year: planning.date.year, applied: applied }],
          sourceQuality: sourceQuality,
          activity: planning.type,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: []
          },
          optionKey: "standard",
          duration: 1,
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
      // case "personality":
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
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
    } else if (actor.type == "player" || actor.type == "npc") {
      updateData["system.owner.value"] = actor.name;
    }
    return await this.actor.update(updateData, {});
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    return await super._updateObject(event, formData);
    if (!this.object.id) return;
  }
}
