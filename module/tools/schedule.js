import { ARM5E } from "../config.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { debug, getDataset, log } from "../tools.js";

export class Schedule extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.displayYear = null;
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "calendar-sheet"],
      title: "Calendar",
      template: "systems/arm5e/templates/generic/character-schedule.html",
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

    data.title = data.actor.name;

    if (data.displayYear == null) {
      this.object.displayYear = data.curYear;
    }

    data.selectedDates = [];
    const YEARS_BACK = 15;
    const YEARS_FORWARD = 2;
    const MIN_YEAR = data.displayYear - YEARS_BACK;
    const MAX_YEAR = data.displayYear + YEARS_FORWARD;
    const actorSchedule = data.actor.getSchedule(MIN_YEAR, MAX_YEAR, [], []);
    const born = Number(data.actor.system.description.born.value);
    const agingStart = 35 + data.actor.system.bonuses.traits.agingStart;
    data.message = "";
    for (let y = MAX_YEAR; y >= MIN_YEAR; y--) {
      let year = {
        year: y,
        seasons: {
          [CONFIG.SEASON_ORDER_INV[0]]: { selected: false, busy: false, others: [] },
          [CONFIG.SEASON_ORDER_INV[1]]: { selected: false, busy: false, others: [] },
          [CONFIG.SEASON_ORDER_INV[2]]: { selected: false, busy: false, others: [] },
          [CONFIG.SEASON_ORDER_INV[3]]: { selected: false, busy: false, others: [] }
        }
      };
      let thisYearSchedule = actorSchedule.filter((e) => {
        return e.year == y;
      });
      for (let s of Object.keys(ARM5E.seasons)) {
        if (thisYearSchedule.length > 0) {
          if (thisYearSchedule[0].seasons[s].length > 0) {
            year.seasons[s].busy = DiaryEntrySchema.hasConflict(thisYearSchedule[0].seasons[s]);
            for (let busy of thisYearSchedule[0].seasons[s]) {
              year.seasons[s].others.push({ id: busy.id, name: busy.name, img: busy.img });
            }
          }
        }
        // check if aging roll is needed this season.
        if (
          agingStart + born <= y &&
          s === "winter" &&
          (thisYearSchedule.length == 0 ||
            thisYearSchedule[0]?.seasons[s].filter((s) => s.type === "aging").length == 0)
        ) {
          if (year.seasons[s].others.length == 0) {
            year.seasons[s].others.push({
              id: 0,
              name: "Aging roll needed",
              img: "systems/arm5e/assets/icons/Icon_Aging_and_Decrepitude.png"
            });
          }
          year.seasons[s].agingNeeded = true;
        }
      }
      data.selectedDates.push(year);
    }
    // styling
    for (let y of data.selectedDates) {
      for (let event of Object.values(y.seasons)) {
        event.edition = false;
        if (event.others.length > 0) {
          if (!event.busy) {
            if (event.agingNeeded) {
              let color1 = "rgb(106 106 106 / 52%)";
              let color2 = "rgb(190 165 91 / 49%)";
              event.style = `style="height: auto; background: repeating-linear-gradient(45deg,${color1},${color1} 5px,${color2} 5px,${color2} 10px);"`;
            } else {
              event.style = 'style="background-color:rgb(0 0 200 / 50%)"';
            }
          } else {
            if (event.agingNeeded) {
              let color1 = "rgb(106 106 106 / 52%)";
              let color2 = "rgb(190 165 91 / 49%)";
              event.style = `style="height: auto; background: repeating-linear-gradient(45deg,${color1},${color1} 5px,${color2} 5px,${color2} 10px);"`;
            }
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
      const item = this.object.actor.items.get(event.currentTarget.dataset.id);
      if (item) item.sheet.render(true, { focus: true });
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
