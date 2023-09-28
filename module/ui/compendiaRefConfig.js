import { log } from "../tools.js";

export class CompendiaRefConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "sourcebooks-filters-config",
      template: "systems/arm5e/templates/generic/compendia-ref-config.html",
      height: "auto",
      classes: ["arm5e-config"],
      closeOnSubmit: false,
      height: "auto",
      submitOnChange: false,
      submitOnClose: false,
      title: game.i18n.localize(`Compendia reference`),
      width: 400,
      resizable: true
    });
  }

  async getData() {
    const context = super.getData();
    context.arsModules = game.modules.contents
      .filter((e) => {
        return (
          e.active &&
          Array.from(e.relationships.systems).some((e) => e.id == CONFIG.ARM5E.SYSTEM_ID)
        );
      })
      .map((e) => {
        return { name: e.title, id: e.id, enabled: false };
      });
    if (context.arsModules.length == 0) {
      await ame.settings.set(CONFIG.ARM5E.SYSTEM_ID, "compendiaRef", "");
    }

    log(false, context);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("button[name='reset']").click(this._onResetDefaults.bind(this));
  }

  async _onResetDefaults(event) {
    event.preventDefault();
    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter", {});
    ui.notifications.info("Reset filters", { localize: true });
    return this.render();
  }

  async _updateObject(ev, formData) {
    const filters = foundry.utils.expandObject(formData);

    for (let [k, v] of Object.entries(filters)) {
      filters[k] = {
        value: v
      };
    }

    // Homebrew and Corebook always true
    filters["custom"] = { value: true };
    filters["ArM5"] = { value: true };

    await game.settings.set(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter", filters);
    ui.notifications.info("Settings.updated", { localize: true });
  }
}
