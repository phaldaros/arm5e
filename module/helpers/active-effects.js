import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import { log } from "../tools.js";
/**
 * Extend the base ActiveEffect class to implement system-specific logic.
 * @extends {ActiveEffect}
 */
export default class ArM5eActiveEffect extends ActiveEffect {
  /**
   * Duration
   * @type {}
   */
  //  hermeticDuration = 0;

  prepareData() {
    super.prepareData();
  }

  prepareDerivedData() {
    // if the effect is from an Item (virtue, etc) and is owned, prevent edition
    this.data.noEdit =
      (this.parent.documentName === "Item" && this.parent.isOwned == true) ||
      (this.parent.documentName === "Actor" && this.data.origin?.includes("Item")) ||
      this.getFlag("arm5e", "noEdit");
  }

  /** @inheritdoc */
  apply(actor, change) {
    //  Here check that every effect is properly configured before applying
    // TODO: check that every change of a generic ability has an option field set

    // if (check) return null;

    return super.apply(actor, change);
  }

  /**
   * Manage Active Effect instances through the Actor Sheet via effect control buttons.
   * @param {MouseEvent} event      The left-click event on the effect control
   * @param {Actor|Item} owner      The owning entity which manages this effect
   * @returns {Promise|null}        Promise that resolves when the changes are complete.
   */

  static async onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest("li");
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch (a.dataset.action) {
      case "create":
        return await owner.createEmbeddedDocuments("ActiveEffect", [
          {
            label: "New Effect",
            icon: "icons/svg/aura.svg",
            origin: owner.uuid,
            "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
            disabled: li.dataset.effectType === "inactive",
            tint: "#000000",
            changes: [],
            flags: {
              arm5e: {
                type: [],
                subtype: [],
                option: []
              }
            }
          }
        ]);
      case "edit":
        return effect.sheet.render(true);
      case "delete":
        return await effect.delete();
      case "toggle":
        return await effect.update({ disabled: !effect.data.disabled });
    }
  }

  /**
   * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
   * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
   * @return {object}                   Data for rendering
   */
  static prepareActiveEffectCategories(effects) {
    // Define effect header categories
    const categories = {
      temporary: {
        type: "temporary",
        label: "Temporary Effects",
        effects: []
      },
      passive: {
        type: "passive",
        label: "Passive Effects",
        effects: []
      },
      inactive: {
        type: "inactive",
        label: "Inactive Effects",
        effects: []
      }
    };

    // Iterate over active effects, classifying them into categories
    for (let e of effects) {
      e._getSourceName(); // Trigger a lookup for the source name

      e.data.descr = e.buildActiveEffectDescription();
      // let effectTypes = e.getFlag("arm5e", "type");
      // let effectSubtypes = e.getFlag("arm5e", "subtype");
      // let effectOption = e.getFlag("arm5e", "option");
      // log(true, `DBG:Effect types: [${effectTypes}]`);
      // log(true, `DBG:Effect subtypes: [${effectSubtypes}]`);
      // log(true, `DBG:Effect options: [${effectOption}]`);
      if (e.data.disabled) categories.inactive.effects.push(e);
      else if (e.isTemporary) categories.temporary.effects.push(e);
      else categories.passive.effects.push(e);
    }
    return categories;
  }

  static findAllActiveEffectsWithType(effects, type) {
    const activeEffects = [];
    for (let e of effects) {
      e._getSourceName(); // Trigger a lookup for the source name
      if (!e.data.disabled && e?.getFlag("arm5e", "type")?.includes(type)) {
        activeEffects.push(e);
      }
    }
    return activeEffects;
  }

  static findAllActiveEffectsWithSubtype(effects, subtype) {
    let res = [];
    for (let e of effects) {
      e._getSourceName(); // Trigger a lookup for the source name
      if (!e.data.disabled && e?.getFlag("arm5e", "subtype")?.includes(subtype)) {
        res.push(e);
      }
    }
    return res;
  }

  //********************************* */
  // ACTIVE EFFECT NON STATIC METHODS
  //********************************* */

  // TODO review before use
  buildActiveEffectDescription() {
    let descr = "";

    try {
      let idx = 0;
      let effectTypes = this.getFlag("arm5e", "type");
      let effectSubtypes = this.getFlag("arm5e", "subtype");
      let effectOption = this.getFlag("arm5e", "option");
      for (let c of Object.values(this.data.changes)) {
        descr += game.i18n.localize(ACTIVE_EFFECTS_TYPES[effectTypes[idx]].label) + ": ";
        let subtype = game.i18n.localize(
          ACTIVE_EFFECTS_TYPES[effectTypes[idx]].subtypes[effectSubtypes[idx]].label
        );
        switch (c.mode) {
          case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
            if (effectOption[idx]) {
              subtype = game.i18n.format(subtype, { option: effectOption[idx] });
            }
            descr +=
              game.i18n.format("arm5e.sheet.activeEffect.multiply", {
                type: subtype
              }) +
              (c.value < 0 ? "" : "+") +
              c.value;
            break;
          case CONST.ACTIVE_EFFECT_MODES.ADD:
            if (effectOption[idx]) {
              subtype = game.i18n.format(subtype, { option: effectOption[idx] });
            }
            descr +=
              game.i18n.localize("arm5e.sheet.activeEffect.add") +
              (c.value < 0 ? "" : "+") +
              c.value +
              " to " +
              subtype;
            break;
          default:
            descr += "Unsupported effect mode";
        }
        descr += "&#13;";
        idx++;
      }

      return descr;
    } catch (error) {
      console.error(error);
      console.log(`Build effect description failed : ${JSON.stringify(this.data)}`);
      return "Error: see console";
    }
  }
}
