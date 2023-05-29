import { ARM5E } from "../config.js";
import { debug, getDataset, log } from "../tools.js";
import { compareEvents } from "./time.js";

export class Calendar extends FormApplication {
  constructor(data, options) {
    super(data, options);
    this.object.displayYear = null;
    this.object.dates = this.object.activity.system.dates;
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "calendar-sheet"],
      title: "Calendar",
      template: "systems/arm5e/templates/generic/calendar.html",
      width: "600",
      height: "790",
      submitOnChange: false,
      closeOnSubmit: false
    });
  }
  async getData(options = {}) {
    const data = await super.getData().object;
    let currentDate = game.settings.get("arm5e", "currentDate");
    let enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    data.curYear = Number(currentDate.year);
    data.curSeason = currentDate.season;
    let dates = data.dates;
    data.duration = data.activity.system.duration;
    data.activityName = `${data.actor.name} : ${data.activity.name}`;
    data.title = game.i18n.localize("arm5e.lab.planning.label");
    if (dates.length == 0) {
      // all season unselected, use current date
      data.firstYear = data.curYear;
      data.firstSeason = data.curSeason;
    } else {
      data.firstYear = Number(dates[0].year);
      data.firstSeason = dates[0].season;
    }

    data.updatePossible = "";
    if (data.displayYear == null) {
      this.object.displayYear = data.firstYear;
    }

    data.selectedDates = [];
    const YEARS_BACK = 2;
    const YEARS_FORWARD = 5;
    const MIN_YEAR = Math.min(data.displayYear - YEARS_BACK, data.firstYear);
    const MAX_YEAR = Math.max(
      data.displayYear + YEARS_FORWARD,
      dates.length ? dates[dates.length - 1].year : 0
    );
    let exclusion = ARM5E.activities.conflictExclusion;
    if (data.activity.system.activity === "exposure") {
      exclusion = ["aging", "adventuring", "none"];
    } else if (data.activity.system.activity === "aging") {
      exclusion = ["adventuring", "exposure", "none"];
    }
    const actorSchedule = data.actor.getSchedule(MIN_YEAR, MAX_YEAR, exclusion, [data.activity.id]);

    let dateIndex = 0;
    data.selectedCnt = 0;
    let noConflict = true;
    data.message = "";
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
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
        if (dateIndex < dates.length) {
          if (y == dates[dateIndex].year && s == dates[dateIndex].season) {
            dateIndex++;
            year.seasons[s].selected = true;
            data.selectedCnt++;
          }
        }
        if (thisYearSchedule.length > 0) {
          if (thisYearSchedule[0].seasons[s].length > 0) {
            year.seasons[s].busy = true;
            if (
              year.seasons[s].selected &&
              !ARM5E.activities.conflictExclusion.includes(data.activity.system.activity)
            ) {
              noConflict = false;
              data.message = game.i18n.localize("arm5e.activity.msg.scheduleConflict");
            }
            for (let busy of thisYearSchedule[0].seasons[s]) {
              year.seasons[s].others.push({ id: busy.id, name: busy.name, img: busy.img });
            }
          }
        }
      }
      data.selectedDates.push(year);
    }
    // styling
    for (let y of data.selectedDates) {
      for (let event of Object.values(y.seasons)) {
        if (event.selected) {
          event.edition = true;
          if (event.busy) {
            event.style = 'style="background-color:rgb(200 0 0 / 50%)"';
          } else {
            event.style = 'style="background-color:rgb(0 200 0 / 50%)"';
          }
        } else {
          if (event.others.length > 0) {
            if (enforceSchedule) {
              event.edition = false;
            } else {
              event.edition = true;
            }
            if (event.others.length == 1) {
              event.style = 'style="background-color:rgb(0 0 200 / 50%)"';
            } else {
              event.style = 'style="background-color:rgb(100 0 200 / 50%)"';
            }
          } else {
            event.edition = true;
          }
          if (data.selectedCnt == data.activity.system.duration) {
            event.edition = false;
          }
        }
      }
    }

    // log(false, `selectedDates: ${JSON.stringify(data.selectedDates)}`);
    if (data.activity.system.duration != data.selectedCnt || (!noConflict && enforceSchedule)) {
      data.updatePossible = "disabled";
    }

    log(false, data);
    data.config = CONFIG.ARM5E;
    return data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".change-year").change(this._setYear.bind(this));
    html.find(".selectedSeason").change(this._selectSeason.bind(this));
    html.find(".next-step").click(async (event) => this._changeYear(event, 1));
    html.find(".previous-step").click(async (event) => this._changeYear(event, -1));
    html.find(".vignette").click(async (event) => {
      const item = this.object.actor.items.get(event.currentTarget.dataset.id);
      if (item) item.sheet.render(true, { focus: true });
    });
    html.find(".calendar-update").click(async (event) => this._submitChanges(event));
  }
  async _submitChanges(event) {
    for (let dependency of this.object.activity.system.externalIds) {
      if (game.actors.has(dependency.actorId)) {
        let actor = game.actors.get(dependency.actorId);
        if (actor.items.has(dependency.itemId)) {
          if (dependency.flags == 2) {
            // update schedule of dependency
            await actor.updateEmbeddedDocuments(
              "Item",
              [{ _id: dependency.itemId, system: { dates: this.object.dates } }],
              {}
            );
          }
        }
      }
    }
    await this.object.actor.updateEmbeddedDocuments("Item", [
      { _id: this.object.activity.id, system: { dates: this.object.dates } }
    ]);

    this.close();
  }
  async _selectSeason(event) {
    event.preventDefault();
    let dataset = getDataset(event);
    // log(false, `Select season ${dataset.season} ${dataset.year} ${event.target.value}`);
    let newDates = this.object.dates;
    let wasChecked = dataset.selected === "true" ? true : false;
    if (wasChecked) {
      // it was checked
      newDates = newDates.filter((e) => {
        return !(e.year == Number(dataset.year) && e.season === dataset.season);
      });
    } else {
      newDates.push({
        year: Number(dataset.year),
        season: dataset.season,
        date: "",
        applied: false
      });
      newDates = newDates.sort(compareEvents);
    }
    await this.submit({
      preventClose: true,
      updateData: { dates: newDates }
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
    if (formData.dates) {
      this.object.dates = formData.dates;
    }

    this.render();

    return;
  }
}
