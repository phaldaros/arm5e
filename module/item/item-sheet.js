import { log } from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ARM5E_DEFAULT_ICONS, getConfirmation } from "../constants/ui.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 650,
      height: 750,
      // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
    });
  }

  constructor(data, options) {
    super(data, options);
  }

  /** @override */
  get template() {
    const path = "systems/arm5e/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.

    switch (this.item.type) {
      case "vis":
        this.options.tabs = [];
        break;
      default:
        break;
    }

    if (this.item.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)) {
      if (this.item.type === "inhabitant") {
        switch (this.item.system.category) {
          case "magi":
            return `${path}/item-habitantMagi-sheet.html`;
          case "companions":
            return `${path}/item-habitantCompanion-sheet.html`;
          case "specialists":
          case "craftmen":
            return `${path}/item-habitantSpecialists-sheet.html`;
          case "grogs":
          case "servants":
          case "laborers":
          case "teamsters":
          case "dependants":
            return `${path}/item-habitantHabitants-sheet.html`;
            break;
          case "horses":
            return `${path}/item-habitantHorses-sheet.html`;
            break;
          case "livestock":
            return `${path}/item-habitantLivestock-sheet.html`;
        }
      }

      return `${path}/item-${this.item.type}-sheet.html`;
    }
    return `${path}/item-limited-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Add the item's data to context.system for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;
    context.ui = { flavor: "Neutral" };
    context.config = CONFIG.ARM5E;
    if (itemData.type == "weapon" && this.item.isOwned && this.item.actor._isCharacter()) {
      context.system.abilities = this.actor.system.abilities.map((v) => {
        return { id: v._id, name: `${v.name} (${v.system.speciality}) - ${v.system.finalScore}` };
      });
      context.system.abilities.unshift({
        id: "",
        name: "N/A"
      });
      //console.log("item-sheet get data weapon")
      //console.log(data)
    } else if (
      itemData.type == "ability" ||
      itemData.type == "diaryEntry" ||
      itemData.type == "book"
    ) {
      context.abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;
    }
    context.isOwned = this.item.isOwned;
    if (context.isOwned) {
      switch (this.actor.type) {
        case "player":
          context.ui.flavor = "PC";
          break;
        case "npc":
          context.ui.flavor = "NPC";
          break;
        case "beast":
          context.ui.flavor = "Beast";
          break;
        case "covenant":
          context.ui.flavor = "Covenant";
          break;
        case "magicCodex":
          context.ui.flavor = "Codex";
          break;
        case "laboratory":
          context.ui.flavor = "Lab";
          break;
        default:
          break;
      }
    }

    if (itemData.type == "virtue" || itemData.type == "flaw") {
      if (context.isOwned) {
        context.system.effectCreation = CONFIG.ISV10 ? false : true;
        switch (context.item.parent.type) {
          case "laboratory":
            context.config.virtueFlawTypes.available = {
              ...context.config.virtueFlawTypes.laboratory,
              ...context.config.virtueFlawTypes.all
            };
            break;
          case "covenant":
            context.config.virtueFlawTypes.available = {
              ...context.config.virtueFlawTypes.covenant,
              ...context.config.virtueFlawTypes.all
            };
            break;
          case "player":
          case "npc":
            context.config.virtueFlawTypes.available = {
              ...context.config.virtueFlawTypes.character,
              ...context.config.virtueFlawTypes.all
            };
            break;
        }
      } else {
        context.system.effectCreation = true;
        context.config.virtueFlawTypes.available = {
          ...context.config.virtueFlawTypes.character,
          ...context.config.virtueFlawTypes.laboratory,
          ...context.config.virtueFlawTypes.covenant,
          ...context.config.virtueFlawTypes.all
        };
      }
    }

    context.metagame = game.settings.get("arm5e", "metagame");

    context.devMode = game.modules
      .get("_dev-mode")
      ?.api?.getPackageDebugValue(CONFIG.ARM5E.SYSTEM_ID);

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(this.item.effects);

    log(false, "item-sheet get data");
    log(false, context);

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 500;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // data-id and data-attr needed
    html.find(".increase-score").click(async () => await this.item.system._increaseScore());
    html.find(".decrease-score").click(async () => await this.item.system._decreaseScore());

    html
      .find(".default-characteristic")
      .change((event) => this._onSelectDefaultCharacteristic(this.item, event));
    html.find(".item-enchant").click((event) => this._enchantItemQuestion(this.item));
    html.find(".ability-option").change((event) => this._cleanUpOption(this.item, event));
    html
      .find(".category-change")
      .change((event) => this._changeInhabitantCategory(this.item, event));
    html.find(".change-abilitykey").change((event) => this._changeAbilitykey(this.item, event));
    html.find(".change-VFType").change((event) => this._changeVFType(this.item, event));

    // Active Effect management
    html
      .find(".effect-control")
      .click((ev) => ArM5eActiveEffect.onManageActiveEffect(ev, this.item));

    html.find(".study-labtext").click((event) => this.item._studyLabText(this.item, event));

    html.find(".migrate").click((event) => this.item.migrate());

    html.find(".item-delete-confirm").click(async () => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let itemId = this.item._id;
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        itemId = itemId instanceof Array ? itemId : [itemId];
        this.actor.deleteEmbeddedDocuments("Item", itemId, {});
      }
    });

    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
  }

  async _changeAbilitykey(item, event) {
    event.preventDefault();
    await this.item._updateIcon("system.key", event.target.value);
  }

  async _changeInhabitantCategory(item, event) {
    event.preventDefault();
    await this.item._updateIcon("system.category", event.target.value);
  }

  async _changeVFType(item, event) {
    event.preventDefault();
    await this.item._updateIcon("system.type", event.target.value);
  }

  async _onSelectDefaultCharacteristic(item, event) {
    event.preventDefault();
    await this.item.update(
      {
        system: {
          defaultChaAb: $(".default-characteristic").find("option:selected").val()
        }
      },
      {}
    );
    return false;
  }

  async _cleanUpOption(item, event) {
    event.preventDefault();
    if (event.currentTarget.value == "") {
      event.currentTarget.value = "optionName";
    } else {
      // remove any non alphanumeric character
      event.currentTarget.value = event.currentTarget.value.replace(/[^a-zA-Z0-9]/gi, "");
    }
    await this.item.update(
      {
        system: {
          option: event.currentTarget.value
        }
      },
      {}
    );
  }

  async _enchantItemQuestion(item) {
    const question = game.i18n.localize("arm5e.dialog.enchant-question");
    new Dialog({
      title: game.i18n.localize("arm5e.sheet.enchantment"),
      content: `<p>${question}</p>`,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("arm5e.dialog.button.yes"),
          callback: () => this._onEnchant(item)
        },
        no: {
          icon: "<i class='fas fa-ban'></i>",
          label: game.i18n.localize("arm5e.dialog.button.no"),
          callback: null
        }
      }
    }).render(true);
  }

  async _onEnchant(item) {
    var codex = game.actors.filter((a) => a.type === "magicCodex");

    if (codex.length === 0) {
      ui.notifications.warn(game.i18n.localize("arm5e.notification.codex.enchant"), {
        permanent: false
      });
      return;
    }
    this.item.system.list = codex[0].items.filter((i) => i.type === "enchantment");

    let template = "systems/arm5e/templates/generic/simpleListPicker.html";
    var item = this.item;
    renderTemplate(template, this.item).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.sheet.enchantment"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: (html) => createMagicItem(html, item, codex[0])
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: `Cancel`,
              callback: null
            }
          }
        },
        {
          height: "140px",
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }
}

export class ArM5eItemSheetNoDesc extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    // No tabs
    return mergeObject(super.defaultOptions, {
      tabs: []
    });
  }
  /** @override */
  async getData() {
    return await super.getData();
  }
}

export async function createMagicItem(html, item, codex) {
  let found = html.find(".SelectedItem");
  if (found.length === 0) {
    return null;
  } else {
    log(false, found[0].value);
    const enchantment = codex.items.get(found[0].value).system;
    let itemData = [
      {
        name: item.name,
        type: "magicItem",
        system: foundry.utils.deepClone(enchantment.system)
      }
    ];

    // prepend the item description
    // itemData[0].system.enchantmentName = enchantment.name;
    itemData[0].system.description =
      `<p>${item.system.description}</p>` + itemData[0].system.description;
    let item = await ArM5eItemSheet.createDocument();

    log(false, itemData);
  }
}
