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
      width: 560,
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
    context.selectedTypes = this.object.getFlag("arm5e", "type");
    if (context.data.changes.length > 0 && context.selectedTypes == null) {
      context.selectedTypes = ["none"];
    }

    context.types = ACTIVE_EFFECTS_TYPES;
    context.selectedSubtypes = this.object.getFlag("arm5e", "subtype");
    if (context.data.changes.length > 0 && context.selectedSubtypes == null) {
      context.selectedSubtypes = ["none"];
    }

    context.subtypes = [];
    for (let idx = 0; idx < context.selectedTypes.length; idx++) {
      // let tmp = context.types[context.selectedTypes[idx]];
      context.subtypes.push(context.types[context.selectedTypes[idx]].subtypes);
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
    let updateFlags = {
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes
        }
      },
      [`changes.${index}`]: {
        mode: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].mode,
        key: ACTIVE_EFFECTS_TYPES[value].subtypes[arraySubtypes[index]].key,
        value: ""
      }
    };
    this.submit({ preventClose: true, updateData: updateFlags }).then(() => this.render());
    // await this.object.setFlag("arm5e", "type", arrayTypes);
  }
  async _setSubtype(value, index) {
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    arraySubtypes[index] = value;

    let update = {
      flags: {
        arm5e: {
          type: arrayTypes,
          subtype: arraySubtypes
        }
      },
      [`changes.${index}`]: {
        mode: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[value].mode,
        key: ACTIVE_EFFECTS_TYPES[arrayTypes[index]].subtypes[value].key,
        value: ""
      }
    };

    this.submit({ preventClose: true, updateData: update }).then(() => this.render());
  }

  _onEffectControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    let arrayTypes = this.object.getFlag("arm5e", "type");
    let arraySubtypes = this.object.getFlag("arm5e", "subtype");
    switch (button.dataset.action) {
      case "add":
        arrayTypes.push("none");
        arraySubtypes.push("none");
        let flags = {
          arm5e: {
            type: arrayTypes,
            subtype: arraySubtypes
          }
        };
        return this._addEffectChange(flags).then(() => this.render());
      case "delete":
        button.closest(".effect-change").remove();
        // remove type and subtype of the erased change
        arrayTypes.splice(button.dataset.idx, 1);
        arraySubtypes.splice(button.dataset.idx, 1);
        let updateFlags = {
          flags: {
            arm5e: {
              type: arrayTypes,
              subtype: arraySubtypes
            }
          }
        };
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
