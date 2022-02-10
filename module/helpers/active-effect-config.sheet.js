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
    context.selectedType = context.data.flags.type || "spellcasting";
    context.selectedCategory = ACTIVE_EFFECTS_TYPES[context.selectedType].category;
    context.types = ACTIVE_EFFECTS_TYPES;
    // TODO: manage categories
    // let test= Object.entries(ACTIVE_EFFECTS_TYPES);
    // context.types = Object.fromEntries(
    //   test.filter((e) => {
    //     return e[1].category == context.selectedCategory;
    //   })
    // );
    // context.categories = Object.entries(ACTIVE_EFFECTS_TYPES).map(({ category }) => ({ [category] }));

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
    html.find(".effect-type").change((ev) => this._setType($(ev.target).val()));
  }

  async _setType(value) {
    await this.object.setFlag("arm5e", "type", value);
  }
}
