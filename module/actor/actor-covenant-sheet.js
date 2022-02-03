import { log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";

import { effectToLabText, resetOwnerFields } from "../item/item-converter.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5eCovenantActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-covenant-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "attributes"
        }
      ]
    });
  }

  /* -------------------------------------------- */
  /**
   *     @override
   */

  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    context.metadata = CONFIG.ARM5E;
    log(false, "Covenant-sheet getData");
    log(false, context);
    context.data.world = {};
    context.data.world.people = game.actors
      .filter((a) => a.type == "player" || a.type == "npc")
      .map(({ name, id }) => ({
        name,
        id
      }));

    if (context.data.world.people.length > 1) {
      for (let person of context.data.habitants.magi) {
        let per = context.data.world.people.filter((p) => p.name == person.name);
        if (per.length > 0) {
          person.data.linked = true;
          person.data.actorId = per[0].id;
        } else {
          person.data.linked = false;
        }
      }
      for (let person of context.data.habitants.companion) {
        let per = context.data.world.people.filter((p) => p.name == person.name);
        if (per.length > 0) {
          person.data.linked = true;
          person.data.actorId = per[0].id;
        } else {
          person.data.linked = false;
        }
      }
      for (let person of context.data.habitants.habitants) {
        let per = context.data.world.people.filter((p) => p.name == person.name);
        if (per.length > 0) {
          person.data.linked = true;
          person.data.actorId = per[0].id;
        } else {
          person.data.linked = false;
        }
      }
    }
    context.data.world.labs = game.actors
      .filter((a) => a.type == "laboratory")
      .map(({ name, id }) => ({
        name,
        id
      }));

    if (context.data.labs) {
      for (let sanctum of context.data.labs) {
        let lab = context.data.world.labs.filter((p) => p.name == sanctum.name);
        if (lab.length > 0) {
          sanctum.data.linked = true;
          sanctum.data.actorId = lab[0].id;
        } else {
          sanctum.data.linked = false;
        }
      }
    }

    return context;
  }

  isItemDropAllowed(type) {
    switch (type) {
      case "spell":
      case "vis":
      case "book":
      case "virtue":
      case "flaw":
      case "magicItem":
      case "reputation":
      case "habitantMagi":
      case "habitantCompanion":
      case "habitantSpecialists":
      case "habitantHabitants":
      case "habitantHorses":
      case "habitantLivestock":
      case "possessionsCovenant":
      case "visSourcesCovenant":
      case "visStockCovenant":
      case "magicalEffect":
      case "calendarCovenant":
      case "incomingSource":
      case "laboratoryText":
      case "mundaneBook":
      case "enchantment":
        return true;
      default:
        return false;
    }
  }

  isActorDropAllowed(type) {
    switch (type) {
      case "player":
      case "npc":
      case "laboratory":
        return true;
      default:
        return false;
    }
  }

  // tells whether or not a type of item needs to be converted when dropped to a specific sheet.
  needConversion(type) {
    switch (type) {
      case "spell":
      case "magicalEffect":
      case "enchantment":
        return true;
      default:
        return false;
    }
  }

  // Overloaded core functions (TODO: review at each Foundry update)

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  async _onDropItem(event, data) {
    let itemData = {};
    let type;
    if (data.pack) {
      // coming from a pack
      const item = await Item.implementation.fromDropData(data);
      itemData = item.toObject();
      type = itemData.type;
    } else if (data.actorId === undefined) {
      const item = await Item.implementation.fromDropData(data);
      itemData = item.toObject();
      type = itemData.type;
    } else {
      type = data.data.type;
      itemData = data.data;
    }
    // transform input into labText
    if (type == "spell" || type == "magicalEffect" || type == "enchantment") {
      log(false, "Valid drop");
      // create a labText data:
      data.data = effectToLabText(foundry.utils.deepClone(itemData));
    }
    // }
    const res = await super._onDropItem(event, data);
    return res;
  }

  /**
   * Handle dropping of an actor reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  async _bindActor(actor) {
    // add person to covenant inhabitants
    let targetActor = this.actor;
    if (actor._isMagus()) {
      let pts = 5;
      if (targetActor.data.data.season == "summer" || targetActor.data.data.season == "autumn") {
        pts = 10;
      }
      // TODO: fill other fields?
      const itemData = [
        {
          name: actor.data.name,
          type: "habitantMagi",
          data: {
            job:
              actor.data.data.description.title.value +
              " " +
              game.i18n.localize("arm5e.sheet.house") +
              " " +
              CONFIG.ARM5E.character.houses[actor.data.data.house.value].label,
            points: pts,
            yearBorn: actor.data.data.description.born.value
          }
        }
      ];
      // check if it is already bound
      let magi = targetActor.data.data.habitants.magi.filter((h) => h.name == actor.name);
      if (magi.length == 0) {
        log(false, "Added to inhabitants Magi");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = magi[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    } else if (actor._isCompanion()) {
      let pts = 3;
      if (targetActor.data.data.season == "summer" || targetActor.data.data.season == "autumn") {
        pts = 5;
      }
      // TODO: fill other fields?
      const itemData = [
        {
          name: actor.data.name,
          type: "habitantCompanion",
          data: {
            job: actor.data.data.description.title.value,
            points: pts,
            yearBorn: actor.data.data.description.born.value
          }
        }
      ];

      // check if it is already bound
      let comp = targetActor.data.data.habitants.companion.filter((h) => h.name == actor.name);
      if (comp.length == 0) {
        log(false, "Added to inhabitants Companion");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = comp[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    } else if (actor._isGrog() || (actor.data.type == "npc" && actor.data.data.charType.value == "mundane")) {
      let pts = 1;
      // if (targetActor.data.data.season == "summer" || targetActor.data.data.season == "autumn") {
      //     pts = 5;
      // }
      // TODO: fill other fields?
      const itemData = [
        {
          name: actor.data.name,
          type: "habitantHabitants",
          data: {
            job: actor.data.data.description.title.value,
            points: pts,
            yearBorn: actor.data.data.description.born.value
          }
        }
      ];

      // check if it is already bound
      let hab = targetActor.data.data.habitants.habitants.filter((h) => h.name == actor.name);
      if (hab.length == 0) {
        log(false, "Added to inhabitants");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = hab[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    } else if (actor.data.type == "laboratory") {
      const itemData = [
        {
          name: actor.data.name,
          type: "labCovenant",
          data: {
            owner: actor.data.data.owner.value,
            quality: actor.data.data.generalQuality.value,
            upkeep: actor.data.data.maintenance.value
          }
        }
      ];
      // check if it is already bound
      let lab = targetActor.data.data.labs.filter((h) => h.name == actor.name);
      if (lab.length == 0) {
        log(false, "Added to sanctums");
        return await this.actor.createEmbeddedDocuments("Item", itemData, {});
      } else {
        itemData[0]._id = lab[0]._id;
        return await this.actor.updateEmbeddedDocuments("Item", itemData, {});
      }
    }
    return {};
  }

  /**
   * TODO: Review in case of Foundry update
   * Handle dropping of a Folder on an Actor Sheet.
   * Currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Item[]>}
   * @private
   */

  async _onDropFolder(event, data) {
    // log(false, "_onDropFolder");

    if (!this.actor.isOwner) return [];
    if (data.documentName !== "Item") return [];
    const folder = game.folders.get(data.id);
    if (!folder) return [];
    let nonConvertibleItems = folder.contents.filter((e) => this.needConversion(e.type) === false);
    let res = await this._onDropItemCreate(nonConvertibleItems.map((e) => e.toObject()));
    let convertibleItems = folder.contents.filter((e) => this.needConversion(e.type) === true);
    for (let item of convertibleItems) {
      // let actorID = this.actor.id;
      let itemData = {
        // actorId: actorID,
        data: item.data,
        type: "Item"
      };
      res.push(await this._onDropItem(event, itemData));
    }
    return res;
  }
}
