import { log } from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
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
      height: 650,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
    });
  }

  /** @override */
  get template() {
    const path = "systems/arm5e/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the item object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Add the item's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;

    context.metadata = CONFIG.ARM5E;
    if (itemData.type == "weapon") {
      let abilitiesSelect = {};
      const temp = {
        id: "",
        name: "N/A"
      };
      abilitiesSelect["a0"] = temp;
      if (this.actor != null) {
        // find the actor habilities and create the select
        for (let [key, i] of this.actor.data.items.entries()) {
          if (i.type === "ability") {
            const temp = {
              id: i.id,
              name: i.name
            };
            //abilitiesSelect.push(temp);
            abilitiesSelect["a" + key] = temp;
          }
        }
      }

      context.data.abilities = abilitiesSelect;
      itemData.data.abilities = abilitiesSelect;

      //console.log("item-sheet get data weapon")
      //console.log(data)
    } else if (itemData.type == "spell" || itemData.type == "enchantment" || itemData.type == "laboratoryText") {
      context.enforceMagicRules = game.settings.get("arm5e", "magicRulesEnforcement");
    } else if (itemData.type == "ability") {
      // TODO add other categories
      context.abilityKeysList = CONFIG.ARM5E.ALL_ABILITIES;
    }

    context.metagame = game.settings.get("arm5e", "metagame");

    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(CONFIG.ARM5E.MODULE_ID);

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(this.item.effects);

    log(false, "item-sheet get data");
    log(false, context);
    // console.log('item-sheet get data');
    // console.log(context);

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 380;
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
    html.find(".increase-ability").click((event) => this._increaseScore(this.item));
    html.find(".decrease-ability").click((event) => this._deccreaseScore(this.item));
    html.find(".default-characteristic").change((event) => this._onSelectDefaultCharacteristic(this.item, event));
    html.find(".item-enchant").click((event) => this._enchantItemQuestion(this.item));

    // Active Effect management
    html.find(".effect-control").click((ev) => ArM5eActiveEffect.onManageActiveEffect(ev, this.item));
  }

  async _onSelectDefaultCharacteristic(item, event) {
    event.preventDefault();
    await item.update(
      {
        data: {
          defaultChaAb: $(".default-characteristic").find("option:selected").val()
        }
      },
      {}
    );
    return false;
  }

  async _increaseScore(item) {
    let oldXp = item.data.data.xp;
    await item.update(
      {
        data: {
          xp: ((item.data.data.derivedScore + 1) * (item.data.data.derivedScore + 2) * 5) / 2
        }
      },
      {}
    );
    let newXp = item.data.data.xp;
    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }
  async _deccreaseScore(item) {
    let newScore = 0;
    if (item.data.data.derivedScore != 0) {
      let oldXp = item.data.data.xp;

      await item.update(
        {
          data: {
            xp: ((item.data.data.derivedScore - 1) * item.data.data.derivedScore * 5) / 2
          }
        },
        {}
      );
      let newXp = item.data.data.xp;
      let delta = newXp - oldXp;
      console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
    }
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
    var codex = game.actors.filter((a) => a.data.type === "magicCodex");

    if (codex.length === 0) {
      ui.notifications.warn(game.i18n.localize("arm5e.notification.codex.enchant"), {
        permanent: false
      });
      return;
    }
    this.item.data.data.list = codex[0].items.filter((i) => i.data.type === "enchantment");

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

export async function createMagicItem(html, item, codex) {
  let found = html.find(".SelectedItem");
  if (found.length === 0) {
    return null;
  } else {
    log(false, found[0].value);
    const enchantment = codex.items.get(found[0].value).data;
    let itemData = [
      {
        name: item.name,
        type: "magicItem",
        data: foundry.utils.deepClone(enchantment.data)
      }
    ];

    // prepend the item description
    // itemData[0].data.enchantmentName = enchantment.name;
    itemData[0].data.description = `<p>${item.data.data.description}</p>` + itemData[0].data.description;
    let item = await ArM5eItemSheet.createDocument();

    log(false, itemData);
  }
}
