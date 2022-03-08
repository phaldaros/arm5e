import { ARM5E } from "../metadata.js";

import { log, error } from "../tools.js";

import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";

/**
 * Extend the base ActiveEffectConfig sheet by limiting what can be edited
 * @extends {ActiveEffectConfig}
 */
export class ArM5eActiveEffectConfig extends ActiveEffectConfig {
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "active-effect-sheet"],
      width: 640,
      height: "auto",
      submitOnChange: true,
      closeOnSubmit: false,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]
    });
  }

  get template() {
    return "systems/arm5e/templates/generic/active-effect-config.html";
  }

  /** @override */
  getData() {
    const context = super.getData();
    context.types = ACTIVE_EFFECTS_TYPES;

    // first effect created, add null effect type and subtype (still needed?)
    context.selectedTypes = this.object.getFlag("arm5e", "type");
    if (context.data.changes.length > 0 && context.selectedTypes == null) {
      context.selectedTypes = ["none"];
    }
    context.selectedSubtypes = this.object.getFlag("arm5e", "subtype");
    if (context.data.changes.length > 0 && context.selectedSubtypes == null) {
      context.selectedSubtypes = ["none"];
    }

    // get the data for all subtypes of the selected types
    // replace #OPTION# in key if it applies
    context.subtypes = [];
    context.options = this.object.getFlag("arm5e", "option");
    for (let idx = 0; idx < context.selectedTypes.length; idx++) {
      let tmpSubTypes = context.types[context.selectedTypes[idx]].subtypes;
      log(false, tmpSubTypes);
      let tmp = tmpSubTypes[context.selectedSubtypes[idx]].key;
      if (context.options[idx] != null) {
        log(false, `subtype: ${tmpSubTypes[context.selectedSubtypes[idx]].key}`);
        tmp = tmp.replace("#OPTION#", context.options[idx]);
        log(false, `computedKey: ${tmp}`);
      }
      tmpSubTypes[context.selectedSubtypes[idx]].computedKey = tmp;

      context.subtypes.push(tmpSubTypes);
    }

    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(CONFIG.ARM5E.MODULE_ID);
    log(false, "Effect config sheet data");
    log(false, context);
    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // // Active Effect management
    html.find(".effect-type").change((ev) => {
      const index = parseInt(ev.currentTarget.dataset.index);
      this._setType($(ev.currentTarget).val(), index);
    });

    html.find(".effect-subtype").change((ev) => {
      const index = parseInt(ev.currentTarget.dataset.index);
      this._setSubtype(ev.currentTarget.selectedOptions[0].dataset.subtype, index);
    });
  }

  async _setType(value, index) {
    let arrayTypes = this.object.getFlag("arm5e", "type");
    arrayTypes[index] = value;
    // also update subtype
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    arraySubtypes[index] = Object.keys(ACTIVE_EFFECTS_TYPES[value].subtypes)[0];
    let arrayOptions = this.object.getFlag("arm5e", "option");
    arrayOptions[index] = ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].option || null;
    let updateFlags = {
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes,
          option: arrayOptions
        }
      },
      [`changes.${index}`]: {
        mode: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].mode,
        key: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].key,
        value: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].default
      }
    };
    this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
    // await this.object.setFlag("arm5e", "type", arrayTypes);
  }
  async _setSubtype(value, index) {
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    let arrayOptions = this.object.getFlag("arm5e", "option");
    arraySubtypes[index] = value;
    arrayOptions[index] = ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[arraySubtypes[index]].option || null;
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

  _onEffectControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    let arrayOptions = this.object.getFlag("arm5e", "option");
    switch (button.dataset.action) {
      case "add":
        arrayTypes.push("none");
        arraySubtypes.push("none");
        arrayOptions.push(null);
        let flags = {
          arm5e: {
            type: arrayTypes,
            subtype: arraySubtypes,
            option: arrayOptions
          }
        };
        return this._addEffectChange(flags).then(() => this.render());

      // case "option":
      //   arrayOptions.push(null);
      //   let flags = {
      //     arm5e: {
      //       type: arrayTypes,
      //       subtype: arraySubtypes,
      //       option: arrayOptions
      //     }
      //   };
      //   return this._addEffectChange(flags).then(() => this.render());
      case "delete":
        // remove type and subtype of the erased change
        arrayTypes.splice(button.dataset.idx, 1);
        arraySubtypes.splice(button.dataset.idx, 1);
        arrayOptions.splice(button.dataset.idx, 1);
        let updateFlags = {
          flags: {
            arm5e: {
              type: arrayTypes,
              subtype: arraySubtypes,
              option: arrayOptions
            }
          }
        };
        button.closest(".effect-change").remove();
        return this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
    }
  }

  async _addEffectChange(updateFlags) {
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
