import { getUuidInfo, log } from "../tools.js";
import { ArM5eActorSheet } from "./actor-sheet.js";

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */

export class ArM5eBeastActorSheet extends ArM5eActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-beast-sheet.html",
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
        }
      ]
    });
  }
  /** @override */
  get template() {
    if (this.actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      return `systems/arm5e/templates/actor/actor-beast-sheet.html`;
    }
    return `systems/arm5e/templates/actor/actor-limited-sheet.html`;
  }
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    context.config = CONFIG.ARM5E;
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare items.
    this._prepareCharacterItems(context);
    //}
    log(false, "Beast-sheet getData");
    log(false, context);

    return context;
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
    //let actorData = sheetData.actor.data;
  }

  isItemDropAllowed(itemData) {
    switch (itemData.type) {
      case "virtue":
      case "flaw":
        switch (itemData.system.type) {
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
      case "diaryEntry":
      case "powerFamiliar":
      case "magicItem":
      case "personalityTrait":
      case "reputation":
      case "magicalEffect":
        return true;
      default:
        return false;
    }
  }

  async _bindActor(actor) {
    let updateData = {};
    if (actor.type == "covenant") {
      updateData["system.covenant.value"] = actor.name;
    } else if (actor.type == "laboratory") {
      updateData["system.sanctum.value"] = actor.name;
    }
    return await this.actor.update(updateData, {});
  }
  async _onDropItem(event, data) {
    const info = getUuidInfo(data.uuid);
    const item = await fromUuid(data.uuid);
    const type = item.type;
    if (this.actor.uuid !== item.parent?.uuid) {
      if (info.ownerType === "Actor" && info.type === "Item" && item.system.hasQuantity) {
        if (!event.shiftKey) {
          if (this.isItemDropAllowed(item)) {
            return this._handleTransfer(info, item);
          }
        }
      }
    }
    if (type == "ability") {
      if (this.actor.hasSkill(item.system.key)) {
        ui.notifications.warn(
          `${game.i18n.localize("arm5e.notification.doubleAbility")} : ${item.name}`
        );
      }
    }
    const res = await super._onDropItem(event, data);
    // not dropped in the same actor
    if (this.actor.uuid !== item.parent?.uuid) {
      if (res && res.length == 1) {
        res[0].sheet.render(true);
      }
    }
    return res;
  }
}
