import { log } from "../tools.js";
import { ArM5eItemSheet } from "./item-sheet.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemDiarySheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 750,
      // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        },
        {
          navSelector: ".diary-tabs",
          contentSelector: ".diary-body",
          initial: "abilities"
        }
      ]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the item object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();
    const itemData = context.item.data;

    if (this.actor == null) {
      context.showTab = false;
      return context;
    }

    // TODO remove to enable code again.
    context.showTab = false;
    context.ui.showXp = true;
    return context;

    if (this.actor._isMagus()) {
      context.ui.showMagicProgress = true;
    }
    context.showTab = true;

    // legacy diary or just a simple recounting of events
    if (context.data.activity == "none") {
      context.showTab = false;
      return;
    } else if (context.data.activity == "aging") {
      context.ui.showXp = false;
      context.ui.showProgress = false;
      context.ui.buttonRollback = this.actor;
    } else if (context.data.activity == "adventuring") {
      context.ui.showXp = true;
      context.ui.showProgress = true;
    } else {
      context.ui.showXp = false;
      context.ui.showProgress = false;
    }
    if (!itemData.data.progress) {
      context.data.progress = {};
    }

    context.diary = { abilities: [] };
    for (const ability of this.actor.data.data.abilities) {
      let tmp = {
        id: ability._id,
        category: CONFIG.ARM5E.ALL_ABILITIES[ability.data.key]?.category ?? "general",
        name: ability.name,
        key: ability.data.key,
        option: ability.data.option
      };
      context.diary.abilities.push(tmp);
    }

    if (!isObjectEmpty(itemData.data.progress)) {
      if (itemData.data.progress.abilities.length > 0) {
        context.diary.selectedAbilities = itemData.data.progress.abilities;
      }
      // if (this.actor._isMagus()) {
      //   if (itemData.data.progress.arts.length > 0) {
      //     context.diary.selectedArts = itemData.data.progress.arts;
      //   }
      //   if (itemData.data.progress.spells.length > 0) {
      //     context.diary.selectedSpells = itemData.data.progress.spells;
      //   }
      // }
    }

    log(false, "item-diary-sheet get data");
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

    html.find(".progress-control").click(this._onProgressControl.bind(this));
    html.find(".progress-category").click(this._setType.bind(this));
    html.find(".progress-ability").click(this._setAbility.bind(this));
  }

  async _onProgressControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const idx = button.dataset.idx;
    let currentData = this.item.data.data.progress[button.dataset.type] ?? [];
    let updateData = {};
    switch (button.dataset.action) {
      case "add":
        // updateData[`data.progress`] = {};
        // this.item.update(updateData, {});
        const data = { id: "", name: "none", category: "general", key: "", option: "", xp: 0 };
        currentData.push(data);
        updateData[`data.progress.abilities`] = currentData;
        this.item.update(updateData, {});
        break;
      case "delete":
        currentData.splice(idx, 1);
        button.closest(".diary-progress").remove();
        return this.submit({ preventClose: true, updateData: currentData }).then(() =>
          this.render()
        );
        break;
      default:
    }
  }

  async _setType(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const idx = button.dataset.idx;
    const value = button.selectedOptions[0];
    let currentData = this.item.data.data.progress[button.dataset.type] ?? [];

    currentData[idx].category = value;
    // if (this.actor.)

    let updateData;
    updateData[`data.progress.${button.dataset.type}`] = currentData;

    // also update subtype
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    arraySubtypes[index] = Object.keys(ACTIVE_EFFECTS_TYPES[value].subtypes)[0];
    let arrayOptions = this.object.getFlag("arm5e", "option");
    arrayOptions[index] = ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].option || null;

    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
    // await this.object.setFlag("arm5e", "type", arrayTypes);
  }

  async _setAbility(event) {
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    let arrayOptions = this.object.getFlag("arm5e", "option");
    arraySubtypes[index] = value;
    arrayOptions[index] =
      ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].option || null;
    let computedKey = ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[value].key;
    if (arrayOptions[index] != null) {
      computedKey = computedKey.replace("#OPTION#", arrayOptions[index]);
    }
    let update = {
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes,
          option: arrayOptions
        }
      },
      [`changes.${index}`]: {
        mode: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[value].mode,
        key: computedKey,
        value: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].default
      }
    };

    this.submit({ preventClose: true, updateData: update }).then(() => this.render());
  }

  async _addAbility() {
    const idx = this.document.data.changes.length;
    return this.submit({
      preventClose: true,
      updateData: {
        [`changes.${idx}`]: { key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "" },
        flags: updateFlags
      }
    });
  }
}
