import { log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";

import { labTextToEffect } from "../item/item-converter.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5ePCActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-pc-sheet.html",
      width: 790,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        },
        {
          navSelector: ".abilities-tabs",
          contentSelector: ".abilities-body",
          initial: "abilities"
        },
        {
          navSelector: ".desc-tabs",
          contentSelector: ".desc-body",
          initial: "desc"
        },
        {
          navSelector: ".arts-tabs",
          contentSelector: ".arts-body",
          initial: "arts-subtab"
        },
        {
          navSelector: ".lab-tabs",
          contentSelector: ".lab-body",
          initial: "lab"
        }
      ]
    });
  }

  /* -------------------------------------------- */
  /** @override */
  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER)) {
      return `systems/arm5e/templates/actor/actor-pc-sheet.html`;
    }
    return `systems/arm5e/templates/actor/actor-limited-sheet.html`;
  }

  /** @override */
  getData() {
    const context = super.getData();

    context.config = CONFIG.ARM5E;
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare items.
    this._prepareCharacterItems(context);
    log(false, "Player-sheet getData");
    log(false, context);
    console.log(context);
    return context;
  }

  _prepareCharacterItems(actorData) {
    super._prepareCharacterItems(actorData);
  }

  _onRoll(evt) {
    super._onRoll(evt);
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.data.type.value) {
          case "laboratoryOutfitting":
          case "laboratoryStructure":
          case "laboratorySupernatural":
          case "covenantSite":
          case "covenantResources":
          case "covenantResidents":
          case "covenantExternalRelations":
          case "covenantSurroundings":
            return false;
          default:
            return true;
        }
      case "weapon":
      case "armor":
      case "spell":
      case "vis":
      case "item":
      case "book":
      case "ability":
      case "abilityFamiliar":
      case "diaryEntry":
      case "powerFamiliar":
      case "speciality":
      case "distinctive":
      case "sanctumRoom":
      case "magicItem":
      case "personality":
      case "reputation":
      case "magicalEffect":
      case "laboratoryText":
      case "mundaneBook":
        return true;
      default:
        return false;
    }
  }

  isActorDropAllowed(type) {
    switch (type) {
      case "laboratory":
      case "covenant":
        return true;
      default:
        return false;
    }
  }

  async _onDropItem(event, data) {
    let itemData = {};
    let type;
    if (data.pack) {
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
    if (type == "laboratoryText") {
      if (itemData.data.type == "spell") {
        log(false, "Valid drop");
        // create a spell or enchantment data:
        data.data = labTextToEffect(foundry.utils.deepClone(itemData));
      } else {
        log(false, "Invalid drop");
        return false;
      }
    } else if (type == "ability") {
      if (this.actor.hasSkill(itemData.data.key)) {
        ui.notifications.warn(
          `${game.i18n.localize("arm5e.notification.doubleAbility")} : ${itemData.name}`
        );
      }
    }
    const res = await super._onDropItem(event, data);
    if (res.length == 1) {
      res[0].sheet.render(true);
    }
    return res;
  }

  async _bindActor(actor) {
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["data.covenant.value"] = actor.name;
    } else if (actor.type == "laboratory") {
      updateData["data.sanctum.value"] = actor.name;
    }
    return await this.actor.update(updateData, {});
  }
}
