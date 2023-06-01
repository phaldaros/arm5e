import { ARM5E } from "../config.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools.js";

export class GroupSchedule extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.displayYear = null;
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "calendar-sheet"],
      title: "Calendar",
      template: "systems/arm5e/templates/generic/group-schedule.html",
      width: "600",
      height: "790",
      submitOnChange: false,
      closeOnSubmit: false
    });
  }
  async getData(options = {}) {
    const data = await super.getData().object;
    let currentDate = game.settings.get("arm5e", "currentDate");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;
    data.selectedActors = [];
    data.title = game.i18n.localize("arm5e.time.troupSchedule");

    if (data.displayYear == null) {
      this.object.displayYear = data.curYear;
    }
    const actors = game.actors.filter((e) => e.type === "player" || e.type === "npc");
    for (let actor of actors) {
      const actorSchedule = actor.getSchedule(data.displayYear, data.displayYear, [], []);

      data.message = "";
      let actorYear = {
        id: actor._id,
        actorName: actor.name,
        seasons: {
          [CONFIG.SEASON_ORDER_INV[0]]: { selected: false, busy: false, activities: [] },
          [CONFIG.SEASON_ORDER_INV[1]]: { selected: false, busy: false, activities: [] },
          [CONFIG.SEASON_ORDER_INV[2]]: { selected: false, busy: false, activities: [] },
          [CONFIG.SEASON_ORDER_INV[3]]: { selected: false, busy: false, activities: [] }
        }
      };

      for (let s of Object.keys(ARM5E.seasons)) {
        if (actorSchedule.length > 0) {
          if (actorSchedule[0].seasons[s].length > 0) {
            actorYear.seasons[s].busy = DiaryEntrySchema.hasConflict(actorSchedule[0].seasons[s]);
            for (let busy of actorSchedule[0].seasons[s]) {
              actorYear.seasons[s].activities.push({ id: busy.id, name: busy.name, img: busy.img });
            }
          }
        }
      }
      data.selectedActors.push(actorYear);
    }

    // styling
    for (let a of data.selectedActors) {
      for (let event of Object.values(a.seasons)) {
        event.edition = false;
        if (event.activities.length > 0) {
          if (!event.busy) {
            event.style = 'style="background-color:rgb(0 0 200 / 50%)"';
          } else {
            event.style = 'style="background-color:rgb(100 0 200 / 50%)"';
          }
        }
      }
    }
    log(false, data);
    data.config = CONFIG.ARM5E;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change-year").change(this._setYear.bind(this));
    html.find(".next-step").click(async (event) => this._changeYear(event, 1));
    html.find(".previous-step").click(async (event) => this._changeYear(event, -1));
    html.find(".vignette").click(async (event) => {
      const actor = game.actors.get(event.currentTarget.dataset.actorid);
      if (actor) {
        const item = actor.items.get(event.currentTarget.dataset.id);
        if (item) item.sheet.render(true, { focus: true });
      }
    });
  }

  async _changeYear(event, offset) {
    event.preventDefault();
    const newYear = Number(getDataset(event).year) + offset;
    if (newYear < 0) {
      // no effect
      return;
    }
    await this.submit({
      preventClose: true,
      updateData: { displayYear: newYear }
    });
  }
  async _setYear(event) {
    event.preventDefault();
    let newYear = Number(event.currentTarget.value);
    let dates = await this.submit({
      preventClose: true,
      updateData: { displayYear: newYear }
    });
  }

  async _updateObject(event, formData) {
    if (formData.displayYear) {
      this.object.displayYear = formData.displayYear;
    }

    this.render();

    return;
  }
}
