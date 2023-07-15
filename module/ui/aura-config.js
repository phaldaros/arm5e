import Aura from "../helpers/aura.js";

export class AuraConfig extends FormApplication {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "aura-config"],
      title: "Aura Config",
      template: "systems/arm5e/templates/generic/aura-config.html",
      width: "300",
      height: "auto"
    });
  }

  async getData() {
    const data = await super.getData();

    // Some scenes may have null or empty objects for their aura, so merge with the default aura data structure
    data.aura = mergeObject((this.object.getFlag("arm5e", "aura") || {}), Aura.defaultAura, {overwrite : false});
    return data;
  }

  async _updateObject(event, formData) {
    this.object.setFlag("arm5e", "aura", {
        values : {
            magic : formData.magic,
            faeric : formData.faeric,
            divine : formData.divine,
            infernal : formData.infernal,
        },
        visible : formData.visible,
        nightModifier : {
            divine : formData.divineNightModifier,
            infernal : formData.infernalNightModifier,
        }

    })
  }

  activateListeners(html)
  {
    html.find("input").on("focusin", (ev) => ev.target.select());
  }
}
