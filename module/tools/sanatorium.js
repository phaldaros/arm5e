import { debug, log } from "../tools.js";
import { GroupSchedule } from "./group-schedule.js";

export class Sanatorium extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.daysLeft = 92; // TODO configurable?
    this.object.seasons = CONFIG.ARM5E.seasons;
  }

  static async createDialog(actor) {
    const dialogData = { patient: actor };
    const sanatorium = new Sanatorium(dialogData, {}); // data, options
    const res = await sanatorium.render(true);
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "sanatorium-sheet"],
      title: "Sanatorium",
      template: "systems/arm5e/templates/generic/sanatorium.html",
      width: "600",
      height: "600"
    });
  }
  async getData(options = {}) {
    const context = await super.getData().object;
    context.curYear = context.patient.system.datetime.year;
    context.curSeason = context.patient.system.datetime.season;

    const patient = context.patient;
    if (context.modifiers == undefined) {
      context.modifiers = {
        magicalHelp: 0,
        mundaneHelp: 0,
        activeEffect: patient.system.bonuses.traits.recovery,
        labHealth: 0
      };
    }

    if (patient.system.sanctum.linked) {
      const lab = game.actors.get(patient.system.sanctum.actorId);
      if (lab) {
        context.modifiers.labHealth = lab.system.health.total;
      }
    }
    context.wounds = {};
    for (let [type, attr] of Object.entries(patient.system.wounds)) {
      if (attr.number.value > 0) {
        context.wounds[type] = [];
        for (let ii = 0; ii < attr.number.value; ii++) {
          context.wounds[type].push({ icon: CONFIG.ARM5E.recovery.wounds[type].icon });
        }
      }
    }
    log(false, `Sanatorium: ${JSON.stringify(context.wounds)}`);
    log(false, `Sanatorium: ${context.wounds}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".set-date").click(this.setDate.bind(this));
    html.find(".update-actors").click(this.updateActors.bind(this));
    html.find(".rest-all").click(this.restEveryone.bind(this));
    html.find(".change-season").change(this._changeSeason.bind(this));
    html.find(".change-year").change(this._changeYear.bind(this));
    html.find(".group-schedule").click(this.displaySchedule.bind(this));
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });
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
    Hooks.callAll("arm5e-date-change", { year: dataset.year, season: dataset.season });
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

  async restEveryone(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const updateData = {
      "system.fatigueCurrent": 0
    };
    await game.actors.updateAll(updateData, (e) => {
      return e.type === "player" || e.type === "npc" || e.type === "beast";
    });
    // ui.notifications.info(
    //   game.i18n.format("arm5e.notification.synchActors", {
    //     year: dataset.year,
    //     season: game.i18n.localize(CONFIG.ARM5E.seasons[dataset.season].label)
    //   })
    // );
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
