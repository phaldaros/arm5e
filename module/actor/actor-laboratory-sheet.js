import { ARM5E } from "../config.js";
import { computeLabTotal, computeLevel } from "../helpers/magic.js";
import { ArM5eItemMagicSheet } from "../item/item-magic-sheet.js";
import { ArM5eItem } from "../item/item.js";
import { log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";
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
      dragDrop: [{ dragSelector: null, dropSelector: ".workbench" }]
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
      let newSpell = await Item.create(
        {
          name: "New spell",
          type: "spell"
          // system:
        },
        { temporary: true }
      );
      context.planning = {
        type: "inventSpell",
        data: newSpell.toObject(),
        visibility: { desc: "hide", attr: "hide", options: "hide" },
        modifiers: { generic: 0 }
      };
      await this.actor.setFlag(ARM5E.SYSTEM_ID, "planning", context.planning);
      log(false, `Reset planning`);
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
      } else {
        context.system.owner.linked = false;
        this._prepareCharacterItems(context);

        log(false, "lab-sheet getData");
        log(false, context);

        return context;
      }
    }

    // tmp TODO remove
    if (context.planning.modifiers == undefined) {
      context.planning.modifiers = {};
    }

    context.planning.modifiers.labQuality = this.actor.system.generalQuality.total;
    if (context.system.covenant.linked) {
      context.planning.modifiers.aura = Number(context.covenant.system.levelAura);
      // TODO fix covenant date
    }
    context.planning.date = game.settings.get("arm5e", "currentDate");

    switch (context.planning.type) {
      case "inventSpell": {
      }
      case "learnSpell":
        {
          let labTot = computeLabTotal(
            context.planning.data,
            context.owner,
            context.owner.magicTheory.score
          );
          for (let mod of Object.values(context.planning.modifiers)) {
            labTot += mod;
          }

          context.planning.data.system.level = computeLevel(
            context.planning.data.system,
            context.planning.type
          );
          context.planning.label = ArM5eItem.GetEffectAttributesLabel(context.planning.data);
          context.planning.labTotal = labTot;
        }
        break;
    }

    let result = context.config.activities.lab[context.planning.type].validation(context.planning);

    if (!result.valid) {
      context.edition.schedule = "disabled";
      if (result.duration == 0) {
        context.planning.message = result.message;
      } else {
        context.planning.message = "Multi-seasons activities not supported yet";
      }
    } else {
      context.edition.schedule = "";
      context.planning.message = `Laboratory points unused: ${result.waste}.`;
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

    html.find(".reset-planning").click(async () => this._resetPlanning());
    html.find(".refresh").click(this._refreshValues.bind(this));
    html.find(".schedule").click(async () => this._schedule());
  }

  async _resetPlanning() {
    await this.actor.unsetFlag(ARM5E.SYSTEM_ID, "planning");
    this.render();
  }

  _refreshValues() {
    this.render(true);
  }

  async _schedule() {
    // TODO remove hardcoded values
    let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
    let spellLevel = computeLevel(planning.data.system, planning.type);
    const entryData = [
      {
        name: "Invent spell",
        type: "diaryEntry",
        system: {
          cappedGain: false,
          dates: [{ season: planning.date.season, year: planning.date.year, applied: false }],
          sourceQuality: spellLevel,
          activity: planning.type,
          progress: {
            abilities: [],
            arts: [],
            spells: [],
            newSpells: [
              {
                name: planning.data.name,
                label: `${planning.data.name}`,
                level: spellLevel,
                spellData: planning.data.system
              }
            ]
          },
          optionKey: "standard",
          duration: 1,
          description: "Invented a new spell!"
        }
      }
    ];

    switch (planning.type) {
      case "inventSpell":
        break;
    }
    let owner = game.actors.get(this.actor.system.owner.actorId);
    let entry = await owner.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  async _onDrop(event) {
    const dropData = TextEditor.getDragEventData(event);
    if (dropData.type == "Item" && event.currentTarget.dataset.drop === "workbench") {
      // if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
      const item = await Item.implementation.fromDropData(dropData);
      let planning = this.actor.getFlag(ARM5E.SYSTEM_ID, "planning");
      switch (item.type) {
        case "labText": {
          if (item.system.type !== "spell") {
            break;
          }
        }
        case "spell": {
          let newSpell = await Item.create(item.toObject(), { temporary: true });
          planning.type = "learnSpell";
          planning.data = newSpell.toObject();
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
