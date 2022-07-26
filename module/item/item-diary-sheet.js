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
      context.ui.showXp = false;
      context.ui.showProgress = true;
    } else {
      context.showTab = false;
      context.ui.showXp = false;
      context.ui.showProgress = false;
    }
    if (!itemData.data.progress) {
      context.data.progress = {};
    }

    // create the actor abilities tree
    context.data.ownedAbilities = {};
    context.data.defaultAbility = "";
    context.data.defaultArt = "";
    context.data.ownedSpells = {};
    context.data.defaultSpell = "";

    context.data.applyPossible = "";
    context.data.applyError = "";

    context.data.canEdit = "";
    context.data.disabled = "";
    if (context.data.applied) {
      context.data.canEdit = "readonly";
      context.data.disabled = "disabled";
    }

    context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };
    let abilitiesArr = Object.values(itemData.data.progress.abilities);
    // look for duplicates
    let abiltiesIds = abilitiesArr.map(e => {
      return e.id;
    });
    if (
      abiltiesIds.some(e => {
        return abiltiesIds.indexOf(e) !== abiltiesIds.lastIndexOf(e);
      })
    ) {
      context.data.applyPossible = "disabled";
      context.data.errorParam = "abilities";
      context.data.applyError = "arm5e.activity.msg.duplicates";
    }
    for (const ab of abilitiesArr) {
      if (ab.xp < 0 || ab.xp > 5) {
        context.data.applyPossible = "disabled";
        context.data.applyError = "arm5e.activity.msg.wrongSingleItemXp";
        break;
      }
      context.data.totalXp.abilities += ab.xp;
    }

    // look for duplicates arts
    let artsArr = Object.values(itemData.data.progress.arts);
    let artsKeys = artsArr.map(e => {
      return e.key;
    });
    if (
      artsKeys.some(e => {
        return artsKeys.indexOf(e) !== artsKeys.lastIndexOf(e);
      })
    ) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activity.msg.duplicates";
      context.data.errorParam = "arts";
    }
    for (const a of artsArr) {
      if (a.xp < 0 || a.xp > 5) {
        context.data.applyPossible = "disabled";
        context.data.applyError = "arm5e.activitymsg.wrongSingleItemXp";
        break;
      }
      context.data.totalXp.arts += a.xp;
    }

    // look for duplicates spells
    let spellsArr = Object.values(itemData.data.progress.spells);
    let spellsIds = spellsArr.map(e => {
      return e.id;
    });
    if (
      spellsIds.some(e => {
        return spellsIds.indexOf(e) !== spellsIds.lastIndexOf(e);
      })
    ) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activity.msg.duplicates";
      context.data.errorParam = "spells";
    }
    for (const s of spellsArr) {
      if (s.xp < 0 || s.xp > 5) {
        context.data.applyPossible = "disabled";
        context.data.applyError = "arm5e.activity.msg.wrongSingleItemXp";
        break;
      }
      context.data.totalXp.spells += s.xp;
    }

    if (
      context.data.totalXp.abilities + context.data.totalXp.arts + context.data.totalXp.spells !=
      context.data.sourceQuality
    ) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activity.msg.wrongTotalXp";
    }
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
        currentXp: ability.data.xp,
        option: ability.data.option
      };
      if (firstAb) {
        let filteredList = Object.values(context.data.progress.abilities).filter(e => {
          return e.id === ability._id;
        });
        if (
          // if ability doesn't exist in rows, set it as next default
          filteredList.length === 0
        ) {
          context.data.defaultAbility = ability._id;
          firstAb = false;
        }
      }
      context.data.ownedAbilities[ability.data.category].push(tmp);
    }

    if (context.ui.showMagicProgress) {
      // Arts
      let firstArt = true;
      for (const key of Object.keys(CONFIG.ARM5E.magic.arts)) {
        if (firstArt) {
          let filteredList = Object.values(context.data.progress.arts).filter(e => {
            return e.key === key;
          });
          if (
            // if art doesn't exist in rows, set it as next default
            filteredList.length === 0
          ) {
            context.data.defaultArt = key;
            firstArt = false;
          }
        }
      }
      //spells
      let firstSpell = true;
      for (const spell of this.actor.data.data.spells) {
        if (context.data.ownedSpells[spell.data.form.value] == undefined)
          context.data.ownedSpells[spell.data.form.value] = [];
        let tmp = {
          id: spell._id,
          form: spell.data.form.value,
          name: spell.name,
          currentXp: spell.data.xp
        };
        if (firstSpell) {
          let filteredList = Object.values(context.data.progress.spells).filter(e => {
            return e.id === spell._id;
          });
          if (
            // if spell doesn't exist in rows, set it as next default
            filteredList.length === 0
          ) {
            context.data.defaultSpell = spell._id;
            firstSpell = false;
          }
        }
        context.data.ownedSpells[spell.data.form.value].push(tmp);
      }
    }

    log(false, "item-diary-sheet get data");
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

    html.find(".progress-control").click(this._onProgressControl.bind(this));
    html.find(".progress-category").change(this._setCategory.bind(this));
    html.find(".progress-ability").change(this._setAbility.bind(this));
    html.find(".progress-art").change(this._setArt.bind(this));
    html.find(".progress-apply").click(this._onProgressApply.bind(this));
    html.find(".progress-rollback").click(this._onProgressRollback.bind(this));
  }

  async _onProgressApply(event) {
    event.preventDefault();
    let description = this.item.data.data.description + "<h4>Technical part:<h4><ol>";
    let updateData = [];
    for (const ab of Object.values(this.item.data.data.progress.abilities)) {
      // check that ability still exists
      let ability = this.actor.items.get(ab.id);
      if (ability == undefined) {
        ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
          permanent: false
        });
        return;
      }
      let data = {
        _id: ab.id,
        data: {
          xp: ability.data.data.xp + ab.xp
        }
      };
      description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: ability.name,
        xp: ab.xp
      })}</li>`;
      updateData.push(data);
    }
    for (const s of Object.values(this.item.data.data.progress.spells)) {
      // check that spell still exists
      let spell = this.actor.items.get(s.id);
      if (spell == undefined) {
        ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
          permanent: false
        });
        return;
      }
      let data = {
        _id: s.id,
        data: {
          xp: spell.data.data.xp + s.xp
        }
      };
      description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: spell.name,
        xp: s.xp
      })}</li>`;
      updateData.push(data);
    }

    let actorUpdate = { data: { arts: { forms: {}, techniques: {} } } };
    for (const a of Object.values(this.item.data.data.progress.arts)) {
      let artType = "techniques";
      if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
        artType = "forms";
      }
      actorUpdate.data.arts[artType][a.key] = {};
      actorUpdate.data.arts[artType][a.key].xp =
        this.actor.data.data.arts[artType][a.key].xp + a.xp;
      description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: CONFIG.ARM5E.magic.arts[a.key].label,
        xp: a.xp
      })}</li>`;
    }
    description += "</ol>";

    await this.actor.updateEmbeddedDocuments("Item", updateData, {});
    await this.actor.update(actorUpdate, {});
    await this.item.update({ data: { applied: true, description: description } });
  }

  async _onProgressRollback(event) {
    event.preventDefault();

    let updateData = [];
    for (const ab of Object.values(this.item.data.data.progress.abilities)) {
      // check that ability still exists
      let ability = this.actor.items.get(ab.id);
      if (ability == undefined) {
        ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
          permanent: false
        });
        continue;
      }
      let xps = ability.data.data.xp - ab.xp;
      let data = {
        _id: ab.id,
        data: {
          xp: xps < 0 ? 0 : xps
        }
      };
      updateData.push(data);
    }
    for (const s of Object.values(this.item.data.data.progress.spells)) {
      let spell = this.actor.items.get(s.id);
      if (spell == undefined) {
        ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
          permanent: false
        });
        continue;
      }
      let xps = spell.data.data.xp - s.xp;
      let data = {
        _id: s.id,
        data: {
          xp: xps < 0 ? 0 : xps
        }
      };
      updateData.push(data);
    }

    let actorUpdate = { data: { arts: { forms: {}, techniques: {} } } };
    for (const a of Object.values(this.item.data.data.progress.arts)) {
      let artType = "techniques";
      if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
        artType = "forms";
      }

      let xps = this.actor.data.data.arts[artType][a.key].xp - a.xp;
      actorUpdate.data.arts[artType][a.key] = {};
      actorUpdate.data.arts[artType][a.key].xp = xps < 0 ? 0 : xps;
    }

    await this.actor.updateEmbeddedDocuments("Item", updateData, {});
    await this.actor.update(actorUpdate, {});
    await this.item.update({ data: { applied: false } });
  }

  async _onProgressControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    // no edit possible if applied
    if (button.dataset.applied == "true") {
      return;
    }
    let currentData = Object.values(this.item.data.data.progress[button.dataset.type]) ?? [];
    let updateData = {};
    switch (button.dataset.type) {
      case "abilities": {
        switch (button.dataset.action) {
          case "add":
            // get first ability of the tree
            const newAb = this.actor.items.get(button.dataset.default);
            const data = {
              id: newAb.id,
              category: newAb.data.data.category,
              name: newAb.name,
              currentXp: newAb.data.data.xp,
              xpNextLevel: newAb.data.data.xpNextLevel,
              xp: 0
            };
            currentData.push(data);
            updateData[`data.progress.abilities`] = currentData;
            // );
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`data.progress.abilities`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "arts": {
        switch (button.dataset.action) {
          case "add":
            const data = {
              key: button.dataset.default,
              xp: 0
            };
            currentData.push(data);
            updateData[`data.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`data.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "spells": {
        switch (button.dataset.action) {
          case "add":
            // get first spell of the tree
            const newSpell = this.actor.items.get(button.dataset.default);
            const data = {
              id: newSpell.id,
              form: newSpell.data.data.form.value,
              name: newSpell.name,
              currentXp: newSpell.data.data.xp,
              xpNextLevel: newSpell.data.data.experienceNextLevel,
              xp: 0
            };
            currentData.push(data);
            updateData[`data.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`data.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
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
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
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
      name: selectedAbility.name,
      category: selectedAbility.data.data.category,
      currentXp: selectedAbility.data.data.xp,
      xpNextLevel: selectedAbility.data.data.experienceNextLevel,
      xp: 0
    };
    currentData[idx] = data;
    updateData[`data.progress.abilities`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setArt(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = Object.values(this.item.data.data.progress[target.dataset.type]) ?? [];
    const data = {
      key: value,
      xp: 0
    };
    currentData[idx] = data;
    updateData[`data.progress.arts`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }
}
