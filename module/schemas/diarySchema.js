import { ARM5E } from "../config.js";
import { ACTIVITIES_DEFAULT_ICONS } from "../constants/ui.js";
import { log } from "../tools.js";
import { nextDate } from "../tools/time.js";
import {
  characteristicField,
  convertToNumber,
  hermeticForm,
  NullableDocumentIdField,
  SeasonField,
  XpField
} from "./commonSchemas.js";
import { SpellSchema, baseLevel } from "./magicSchemas.js";
const fields = foundry.data.fields;

export class DiaryEntrySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      description: new fields.StringField({ required: false, blank: true, initial: "" }),
      dates: new fields.ArrayField(
        new fields.SchemaField({
          season: SeasonField(),
          year: new fields.NumberField({
            required: true,
            nullable: false,
            integer: true,
            initial: 1220,
            step: 1
          }),
          date: new fields.StringField({
            required: false,
            blank: true,
            initial: ""
          }),
          applied: new fields.BooleanField({ required: false, initial: false })
        }),
        { required: false, initial: [] }
      ),
      duration: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        positive: true,
        initial: 1
      }),
      done: new fields.BooleanField({
        required: false,
        nullable: true,
        initial: null
      }),
      sourceQuality: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      activity: new fields.StringField({
        required: false,
        blank: false,
        initial: "none",
        choices: Object.keys(ARM5E.activities.generic)
      }),
      optionKey: new fields.StringField({
        required: false,
        blank: false,
        initial: "standard"
      }),
      teacher: new fields.SchemaField(
        {
          id: new fields.StringField({
            required: false,
            nullable: true,
            initial: null
          }),
          name: new fields.StringField({ required: false, blank: true, initial: "Teacher's name" }),
          com: characteristicField(),
          teaching: new fields.NumberField({
            required: false,
            nullable: false,
            integer: true,
            initial: 1,
            step: 1
          }),
          applySpec: new fields.BooleanField({ required: false, initial: false }),
          score: new fields.NumberField({
            required: false,
            nullable: false,
            integer: true,
            min: 0,
            initial: 2,
            step: 1
          })
        },
        {
          required: false,
          blank: false,
          initial: {
            id: null,
            name: "",
            com: 0,
            teaching: 0,
            speciality: "",
            applySpec: false,
            score: 0
          }
        }
      ),
      externalIds: new fields.ArrayField(
        new fields.SchemaField({
          actorId: new NullableDocumentIdField(),
          itemId: new NullableDocumentIdField(),
          flags: new fields.NumberField({
            required: false,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            step: 1
          }),
          data: new fields.ObjectField({ required: false, nullable: true, initial: null })
        }),
        { required: false, initial: [] }
      ),
      progress: new fields.SchemaField(
        {
          abilities: new fields.ArrayField(
            new fields.SchemaField({
              id: new fields.StringField({
                required: true,
                blank: false,
                nullable: true,
                initial: null
              }),
              category: new fields.StringField({ required: true, blank: false }),
              teacherScore: new fields.NumberField({
                required: false,
                nullable: false,
                integer: true,
                min: 0,
                initial: 2,
                step: 1
              }),
              maxLevel: new fields.NumberField({
                required: false,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                step: 1
              }),
              xp: XpField()
            }),
            { required: false, initial: [] }
          ),
          arts: new fields.ArrayField(
            new fields.SchemaField({
              key: new fields.StringField({ required: true, blank: false, initial: "cr" }),
              teacherScore: new fields.NumberField({
                required: false,
                nullable: false,
                integer: true,
                min: 0,
                initial: 5,
                step: 1
              }),
              maxLevel: new fields.NumberField({
                required: false,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                step: 1
              }),
              xp: XpField()
            }),
            { required: false, initial: [] }
          ),
          spells: new fields.ArrayField(
            new fields.SchemaField({
              id: new fields.StringField({
                required: true,
                blank: false,
                nullable: true,
                initial: null
              }),
              form: hermeticForm(),
              teacherScore: new fields.NumberField({
                required: false,
                nullable: false,
                integer: true,
                min: 0,
                initial: 2,
                step: 1
              }),
              maxLevel: new fields.NumberField({
                required: false,
                nullable: false,
                integer: true,
                min: 0,
                initial: 0,
                step: 1
              }),
              xp: XpField()
            }),
            { required: false, initial: [] }
          ),
          newSpells: new fields.ArrayField(
            new fields.SchemaField({
              name: new fields.StringField({ required: true, blank: false }),
              label: new fields.StringField({ required: true, blank: false }),
              id: new fields.StringField({
                required: false,
                blank: true,
                nullable: true,
                initial: null
              }),
              img: new fields.StringField({
                required: false,
                blank: true,
                initial: ""
              }),
              level: baseLevel(),
              spellData: new fields.EmbeddedDataField(SpellSchema)
            }),
            { required: false, initial: [] }
          )
        },
        {
          required: false,
          blank: false,
          initial: { abilities: [], spells: [], arts: [], newSpells: [] }
        }
      )
    };
  }

  static buildSchedule(duration, year, season, date = "") {
    let tmpDate = { season: season, year: year, date: date, applied: false };
    let schedule = [tmpDate];
    for (let ii = 1; ii < duration; ii++) {
      tmpDate = nextDate(tmpDate.season, tmpDate.year);
      schedule.push({
        season: tmpDate.season,
        date: "",
        year: tmpDate.year,
        applied: false
      });
    }
    return schedule;
  }

  static getDefault(itemData) {
    let res = itemData;
    let currentDate = game.settings.get("arm5e", "currentDate");

    if (itemData.system) {
      if (itemData.system.year) {
        currentDate.year = itemData.system.year;
      }
      if (itemData.system.season) {
        currentDate.season = itemData.system.season;
      }
      if (itemData.system.dates == undefined) {
        res.system.dates = [
          { year: currentDate.year, season: currentDate.season, date: "", applied: false }
        ];
      }
      if (itemData.system.done == null) {
        itemData.system.done = false;
      }
    } else {
      res.system = {
        dates: [{ year: currentDate.year, season: currentDate.season, date: "", applied: false }],
        done: false
      };
    }
    return res;
  }

  static migrate(itemData) {
    const updateData = {};

    if (itemData.system.description === null || itemData.system.description === undefined) {
      updateData["system.description"] = "";
    }
    if (itemData.system.sourceQuality == undefined || Number.isNaN(itemData.system.sourceQuality)) {
      updateData["system.sourceQuality"] = 0;
    }
    if (itemData.system.activity === "") {
      updateData["system.activity"] = "none";
    }

    if (itemData.system.externalIds === undefined) {
      updateData["system.externalIds"] = [];
    }

    if (itemData.system.optionKey == undefined) {
      updateData["system.optionKey"] = "standard";
    }
    if (itemData.system.teacher === undefined) {
      updateData["system.teacher"] = {
        id: null,
        name: "",
        com: 0,
        teaching: 0,
        speciality: "",
        applySpec: false,
        score: 0
      };
    } else if (itemData.system.teacher.score == null) {
      updateData["system.teacher.score"] = 0;
    }

    let currentDate = game.settings.get("arm5e", "currentDate");
    if (itemData.system.year !== undefined && itemData.system.season !== undefined) {
      let theYear;
      if (itemData.system.year === "" || itemData.system.year === null) {
        theYear = Number(currentDate.year);
      } else if (typeof itemData.system.year === "string") {
        if (Number.isNaN(itemData.system.year)) {
          theYear = Number(currentDate.year);
        } else {
          theYear = Number(itemData.system.year);
        }
      } else {
        theYear = itemData.system.year;
      }

      let theSeason;
      if (itemData.system.season === "" || itemData.system.season === null) {
        theSeason = currentDate.season;
      } else if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
        if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
          theSeason = itemData.system.season.toLowerCase();
        } else {
          theSeason = "spring";
        }
      } else {
        theSeason = itemData.system.season;
      }
      if (itemData.system.duration === undefined) {
        updateData["system.duration"] = 1;
        if (itemData.system.applied) {
          updateData["system.done"] = true;
        } else {
          updateData["system.done"] = false;
        }
      } else if (itemData.system.done === null || typeof itemData.system.done == "number") {
        updateData["system.done"] =
          itemData.system.dates.filter((d) => d.applied == true).length == itemData.system.duration;
      }

      updateData["system.-=applied"] = null;
      updateData["system.-=year"] = null;
      updateData["system.-=date"] = null;
      updateData["system.-=season"] = null;
      updateData["system.dates"] = [
        {
          year: theYear,
          season: theSeason,
          date: itemData.system.date,
          applied: itemData.system.applied
        }
      ];
    } else if (itemData.system.date != undefined) {
      for (let d of itemData.system.dates) {
        d.date = itemData.system.date;
      }
      updateData["system.-=date"] = null;
      updateData["system.dates"] = itemData.system.dates;
    } else if (itemData.system.dates instanceof Array && itemData.system.dates.length == 0) {
      updateData["system.dates"] = [
        {
          year: Number(currentDate.year),
          season: currentDate.season,
          date: itemData.system.date ?? "",
          applied: itemData.system.applied ?? false
        }
      ];
    } else {
      let update = false;
      for (let d of itemData.system.dates) {
        if (d.date === undefined) {
          d.date = "";
          update = true;
        }
      }
      if (update) {
        updateData["system.dates"] = itemData.system.dates;
      }
    }

    if (
      (typeof itemData.system.done == "number" || itemData.system.done === null) &&
      itemData.system.dates
    ) {
      updateData["system.done"] =
        itemData.system.dates.filter((d) => d.applied == true).length == itemData.system.duration;
    }
    // if (itemData.system.applied !== undefined) {
    //   // if applied exists, the array should be of length 1
    //   updateData["system.dates"] = [
    //     {
    //       year: itemData.system.dates[0].year,
    //       season: itemData.system.dates[0].season,
    //       applied: itemData.system.applied
    //     }
    //   ];

    //   updateData["system.-=applied"] = null;
    // }

    // Fixing Array problems
    if (itemData.system.progress == undefined || isEmpty(itemData.system.progress)) {
      updateData["system.progress"] = { abilities: [], spells: [], arts: [], newSpells: [] };
    } else {
      const prog = duplicate(itemData.system.progress);
      let updateNeeded = false;
      if (!(prog.abilities instanceof Array)) {
        prog.abilities = Object.values(prog.abilities);
        updateNeeded = true;
      }
      for (let a of prog.abilities) {
        if (!a.id) {
          a.id = "dummyid";
          updateNeeded = true;
        }
        if (!a.category) {
          a.category = "general";
          updateNeeded = true;
        }
        if (typeof a.teacherScore != "number") {
          a.teacherScore = convertToNumber(a.teacherScore, 2);
          updateNeeded = true;
        }
      }
      if (updateNeeded === true) {
        updateData["system.progress.abilities"] = prog.abilities;
        updateNeeded = false;
      }
      if (!(prog.arts instanceof Array)) {
        prog.arts = Object.values(prog.arts);
        updateNeeded = true;
      }
      for (let a of prog.arts) {
        if (a.key === "" || a.key === undefined) {
          a.key = "cr";
          updateNeeded = true;
        }
        if (typeof a.teacherScore != "number") {
          a.teacherScore = convertToNumber(a.teacherScore, 5);
          updateNeeded = true;
        }
      }
      if (updateNeeded === true) {
        updateData["system.progress.arts"] = prog.arts;
        updateNeeded = false;
      }

      if (!(prog.spells instanceof Array)) {
        prog.spells = Object.values(prog.spells);
        updateNeeded = true;
      }

      if (updateNeeded === true) {
        updateData["system.progress.spells"] = prog.spells;
        updateNeeded = false;
      }
      // else {
      //   for (let spell of prog.spells) {
      //     if (!spell.form) {

      //     }
      //   }
      // }
      if (prog.newSpells === undefined) {
        prog.newSpells = [];
        updateNeeded = true;
      } else if (!(prog.newSpells instanceof Array)) {
        prog.newSpells = Object.values(prog.newSpells);
        updateNeeded = true;
      }

      if (updateNeeded === true) {
        updateData["system.progress.newSpells"] = prog.newSpells;
        updateNeeded = false;
      }
    }
    log(false, "Diary migration: " + updateData);
    return updateData;
  }
  static getIcon(item, newValue = null) {
    if (newValue == null) {
      return (
        CONFIG.ACTIVITIES_DEFAULT_ICONS[item.system.activity] ??
        CONFIG.ACTIVITIES_DEFAULT_ICONS.none
      );
    } else {
      return CONFIG.ACTIVITIES_DEFAULT_ICONS[newValue] ?? CONFIG.ACTIVITIES_DEFAULT_ICONS.none;
    }
  }
  // input: list of activities of a season
  static hasConflict(activities) {
    if (activities.length <= 1) {
      return false;
    }
    if (
      activities.filter((a) => {
        return !ARM5E.activities.conflictExclusion.includes(a.type);
      }).length > 1
    ) {
      return true;
    }
    let exposureCount = 0;
    for (let a of activities) {
      if (["none", "adventuring"].includes(a.type)) {
        continue;
      }
      if (a.type === "exposure") {
        exposureCount++;
        if (exposureCount > 1) return true;
      }
    }
    return false;
  }

  hasScheduleConflict(actor) {
    if (this.activity === "none") {
      return false;
    }
    let conflicting = !ARM5E.activities.conflictExclusion.includes(this.activity);
    let duplicateAllowed = ARM5E.activities.duplicateAllowed.includes(this.activity);
    // For each diary entry of the actor
    for (let entry of Object.values(actor.system.diaryEntries)) {
      // the entry is not the current entry
      if (entry._id != this.parent._id) {
        // if the type is the same and doesn't allow duplicates, check if dates overlap
        if (this.activity === entry.system.activity && !duplicateAllowed) {
          for (let date of entry.system.dates) {
            if (this.dates.some((e) => e.year == date.year && e.season === date.season)) {
              return true;
            }
          }
        }

        if (conflicting && !ARM5E.activities.conflictExclusion.includes(entry.system.activity)) {
          for (let date of entry.system.dates) {
            if (this.dates.some((e) => e.year == date.year && e.season === date.season)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }
}
