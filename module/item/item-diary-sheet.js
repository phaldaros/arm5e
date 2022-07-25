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
    // context.showTab = false;
    // context.ui.showXp = true;
    // return context;

    if (this.actor._isMagus()) {
      context.ui.showMagicProgress = true;
    }
    context.showTab = true;

    // legacy diary or just a simple recounting of events
    if (context.data.activity == "none") {
      context.showTab = false;
      return context;
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

    // create the actor abilities tree
    context.data.ownedAbilities = {};
    context.data.defaultAbility = "";
    let firstAb = true;

    // for each progressed ability, list the category and abilities available
    for (const ability of this.actor.data.data.abilities) {
      if (context.data.ownedAbilities[ability.data.category] == undefined)
        context.data.ownedAbilities[ability.data.category] = [];
      let tmp = {
        id: ability._id,
        category: ability.data.category,
        name: ability.name,
        key: ability.data.key,
        option: ability.data.option
      };
      if (firstAb) {
        let filteredList = Object.values(context.data.progress.abilities).filter(e => {
          return e.id === ability._id;
        });
        log(false, `Length of filterd abilities is ${filteredList.length}`);
        if (
          // if ability doesn't exist in rows, set it as next default
          filteredList.length === 0
        ) {
          context.data.defaultAbility = ability._id;
          log(false, `Default ability is ${ability.name}`);
          firstAb = false;
        }
      }
      context.data.ownedAbilities[ability.data.category].push(tmp);
    }
    // log(false, categories);

    // if (!isObjectEmpty(itemData.data.progress)) {
    //   context.choices = {};
    //   if (itemData.data.progress.abilities.length > 0) {
    //     context.choices.selectableAbilities = [];
    //     let idx = 0;
    //     for (const progress of itemData.data.progress.abilities) {
    //       context.choices.selectableAbilities[idx++] = context.data.abilities.filter(
    //         a => a.category == progress.category
    //       );
    //     }
    //   }
    // if (this.actor._isMagus()) {
    //   if (itemData.data.progress.arts.length > 0) {
    //     context.diary.selectedArts = itemData.data.progress.arts;
    //   }
    //   if (itemData.data.progress.spells.length > 0) {
    //     context.diary.selectedSpells = itemData.data.progress.spells;
    //   }
    // }
    // }

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
    html.find(".progress-category").change(this._setCategory.bind(this));
    html.find(".progress-ability").change(this._setAbility.bind(this));
  }

  async _onProgressControl(event) {
    event.preventDefault();
    const button = event.currentTarget;

    let currentData = Object.values(this.item.data.data.progress[button.dataset.type]) ?? [];
    let updateData = {};
    switch (button.dataset.action) {
      case "add":
        // get first ability of the tree
        const newAb = this.actor.items.get(button.dataset.default);
        const data = {
          id: newAb.id,
          // category: newAb.data.data.category,
          // name: newAb.name,
          // key: newAb.data.data.key,
          // option: newAb.data.data.option,
          xp: 0
        };
        currentData.push(data);
        updateData[`data.progress.abilities`] = currentData;
        // return this.submit({ preventClose: true, updateData: updateData }).then(() =>
        //   this.render()
        // );
        await this.item.update(updateData, {});
        break;
      case "delete":
        const idx = Number(button.dataset.idx);
        currentData.splice(idx, 1);
        button.closest(".diary-progress").remove();
        updateData[`data.progress.abilities`] = currentData;
        // return this.submit({ preventClose: true, updateData: updateData }).then(() =>
        //   this.render()
        // );
        await this.item.update(updateData, {});
        break;
      default:
    }
  }

  async _setCategory(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = Object.values(this.item.data.data.progress[target.dataset.type]) ?? [];
    log(false, `Current data: ${currentData}`);
    currentData[idx] = this.item.data.data.ownedAbilities[value][0];
    currentData[idx].xp = 0;
    updateData[`data.progress.abilities`] = currentData;
    // return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
    // let updateData = { data: { progress: { abilities: currentData } } };

    await this.item.update(updateData, {});
  }

  async _setAbility(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = Object.values(this.item.data.data.progress[target.dataset.type]) ?? [];
    const selectedAbility = this.actor.items.get(value);
    const data = {
      id: selectedAbility.id,
      category: selectedAbility.data.data.category,
      name: selectedAbility.name,
      key: selectedAbility.data.data.key,
      option: selectedAbility.data.data.option,
      xp: 0
    };
    currentData[idx] = data;
    updateData[`data.progress.abilities`] = currentData;
    // return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
    // let updateData = { data: { progress: { abilities: currentData } } };
    await this.item.update(updateData, {});
  }

  // async _addAbility() {
  //   const idx = this.document.data.changes.length;
  //   return this.submit({
  //     preventClose: true,
  //     updateData: {
  //       [`changes.${idx}`]: { key: "", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "" },
  //       flags: updateFlags
  //     }
  //   });
  // }
}
