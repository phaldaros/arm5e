import { debug, log } from "../tools.js";
import { GroupSchedule } from "./group-schedule.js";

export class Astrolab extends FormApplication {
  constructor(data, options) {
    super(data, options);
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "astrolab-sheet"],
      title: "Astrolab",
      template: "systems/arm5e/templates/generic/astrolab.html",
      width: "600",
      height: "auto"
    });
  }
  async getData(options = {}) {
    const data = await super.getData().object;
    let currentDate = game.settings.get("arm5e", "currentDate");
    data.curYear = currentDate.year;
    data.curSeason = currentDate.season;

    data.date = "1220-03-21";
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".set-date").click(this.setDate.bind(this));
    html.find(".update-actors").click(this.updateActors.bind(this));
    html.find(".change-season").change(this._changeSeason.bind(this));
    html.find(".change-year").change(this._changeYear.bind(this));
    html.find(".group-schedule").click(this.displaySchedule.bind(this));
  }
  async displaySchedule(event) {
    event.preventDefault();
    const schedule = new GroupSchedule();
    const res = await schedule.render(true);
  }
  async _changeSeason(event) {
    await this.submit({
      preventClose: true,
      updateData: { season: event.currentTarget.value }
    });
  }

  async _changeYear(event) {
    await this.submit({
      preventClose: true,
      updateData: { year: event.currentTarget.value }
    });
  }

  async setDate(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    ui.notifications.info(
      game.i18n.format("arm5e.notification.setDate", {
        year: dataset.year,
        season: game.i18n.localize(CONFIG.ARM5E.seasons[dataset.season].label)
      })
    );
    await game.settings.set("arm5e", "currentDate", {
      year: dataset.year,
      season: dataset.season
    });
    this.render();
  }

  async updateActors(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const updateData = {
      system: { datetime: { season: dataset.season, year: dataset.year } }
    };
    await game.actors.updateAll(updateData, (e) => {
      return e.type === "player" || e.type === "npc" || e.type === "covenant";
    });
    ui.notifications.info(
      game.i18n.format("arm5e.notification.synchActors", {
        year: dataset.year,
        season: game.i18n.localize(CONFIG.ARM5E.seasons[dataset.season].label)
      })
    );
  }

  async _updateObject(event, formData) {
    if (formData.season) {
      this.object.season = formData.season;
    }
    if (formData.year) {
      this.object.year = formData.year;
    }

    this.render();

    return;
  }
}
