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
      height: 850,
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
    const actType = context.data.activity;
    if (this.actor == null) {
      context.ui.showTab = false;
      return context;
    }

    if (itemData.data.year == "") {
      itemData.data.year = this.actor.data.data.year.value;
    }

    const activityConfig = CONFIG.ARM5E.activities.generic[actType];

    // legacy diary or just a simple recounting of events
    if (actType == "none") {
      context.ui.showLegacyXp = true;
      context.ui.showTab = false;
      return context;
    }

    // configuration
    context.ui.showTab = true;
    context.ui.showLegacyXp = activityConfig.display.legacyXp;
    context.ui.showProgress = activityConfig.display.progress;
    context.ui.showAbilities = activityConfig.display.abilities;
    context.ui.showArts = activityConfig.display.arts;
    context.ui.showSpells = activityConfig.display.spells;
    context.ui.editSource = true;

    if (itemData.data.sourceQuality == 0)
      itemData.data.sourceQuality = activityConfig.source.default;

    if (activityConfig.source.readonly) context.ui.editSource = false;

    if (this.actor._isMagus()) {
      context.ui.showMagicProgress = true;
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
    if (itemData.data.applied) {
      context.data.canEdit = "readonly";
      context.data.disabled = "disabled";
    }

    if (activityConfig.validation != null) {
      activityConfig.validation(context, this.actor, this.item);
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
          // if ability doesn't exist in current items, set it as next default
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
            // if art doesn't exist in current items, set it as next default
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
            // if spell doesn't exist in current items, set it as next default
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
    html.find(".progress-activity").change(this._setActivity.bind(this));
  }

  async _setActivity(event) {
    event.preventDefault();

    // just reset some fields so the new default can be set
    this.submit({ preventClose: true, updateData: { data: { sourceQuality: 0 } } }).then(() =>
      this.render()
    );
    // await this.item.update({ data: { sourceQuality: 0 } });
  }

  async _onProgressApply(event) {
    event.preventDefault();
    let description = this.item.data.data.description + "<h4>Technical part:<h4><ol>";
    let updateData = [];
    for (const ab of Object.values(this.item.data.data.progress.abilities)) {
      // ignore 0 xp gain
      if (ab.xp == 0) {
        continue;
      }
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
      // ignore 0 xp gain
      if (s.xp == 0) {
        continue;
      }
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
      // ignore 0 xp gain
      if (a.xp == 0) {
        continue;
      }
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
    const actorData = this.actor.data;
    let updateData = [];
    switch (this.item.data.data.activity) {
      case "adventuring":
      case "exposure": {
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

          let xps = actorData.data.arts[artType][a.key].xp - a.xp;
          actorUpdate.data.arts[artType][a.key] = {};
          actorUpdate.data.arts[artType][a.key].xp = xps < 0 ? 0 : xps;
        }

        await this.actor.updateEmbeddedDocuments("Item", updateData, {});
        await this.actor.update(actorUpdate, {});
        break;
      }
      case "aging": {
        let confirmed = await new Promise(
          resolve => {
            Dialog.confirm({
              title: game.i18n.localize("arm5e.aging.rollback.title"),
              content: `<p>${game.i18n.localize("arm5e.aging.rollback.confirm")}</p>`,
              yes: () => {
                resolve(true);
              },
              no: () => {
                resolve(false);
              }
            });
          },
          {
            rejectClose: true
          }
        );
        if (!confirmed) return;
        let actorUpdate = {
          data: { age: { value: actorData.data.age.value - 1 }, pendingCrisis: false }
        };

        let effects = this.item.getFlag("arm5e", "effect");
        if (effects.apparent) {
          actorUpdate.data.apparent = { value: actorData.data.apparent.value - 1 };
        }
        if (effects.charac) {
          actorUpdate.data.characteristics = {};
        }
        for (let [char, stats] of Object.entries(effects.charac)) {
          let newAgingPts = actorData.data.characteristics[char].aging - stats.aging;
          let currentCharValue = actorData.data.characteristics[char].value;
          if (stats.score) {
            // characteristic was reduced
            actorUpdate.data.characteristics[char] = {
              value: currentCharValue + 1,
              aging: Math.max(0, Math.abs(currentCharValue + 1) - stats.aging)
            };
          } else {
            actorUpdate.data.characteristics[char] = {
              value: currentCharValue + 1,
              aging: newAgingPts < 0 ? 0 : newAgingPts
            };
          }
        }
        let newDecrepitude = actorData.data.decrepitude.points - effects.decrepitude;
        actorUpdate.data.decrepitude = { points: newDecrepitude < 0 ? 0 : newDecrepitude };
        await this.actor.update(actorUpdate, {});
        await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
        return;
        break;
      }
    }
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
