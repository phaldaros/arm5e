import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import { seasonOrder, seasonsDelta } from "../tools/time.js";
import { baseDescription, itemBase, NullableSchemaField, SeasonField } from "./commonSchemas.js";
const fields = foundry.data.fields;

export class WoundSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      inflictedDate: new fields.SchemaField({
        season: SeasonField(),
        year: new fields.NumberField({
          required: true,
          nullable: false,
          integer: true,
          initial: 1220,
          step: 1
        })
      }),
      healedDate: new NullableSchemaField(
        {
          season: SeasonField(),
          year: new fields.NumberField({
            required: true,
            nullable: true,
            integer: true,
            initial: null,
            step: 1
          })
        },
        { required: false, nullable: true, initial: {} }
      ),
      originalGravity: new fields.StringField({
        required: true,
        blank: false,
        initial: "light",
        choices: Object.keys(ARM5E.recovery.wounds)
      }),
      gravity: new fields.StringField({
        required: true,
        blank: false,
        initial: "light",
        choices: Object.keys(ARM5E.recovery.wounds)
      }),
      trend: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1,
        min: -1,
        max: 1
      }),
      bonus: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      nextRoll: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        step: 0.5
      }),
      recoveryTime: new fields.NumberField({
        required: true,
        nullable: false,
        integer: true,
        initial: 0,
        step: 0.5
      }),
      location: baseDescription()
    };
  }

  static migrateData(data) {
    return data;
  }

  static migrate(data) {
    return {};
  }

  static getDefault(itemData) {
    let res = itemData;
    if (itemData.system) {
      if (itemData.system.gravity == undefined) {
        res.system.gravity = "light";
      }
    } else {
      res = { system: { gravity: "light" } };
    }
    return res;
  }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return ARM5E.recovery.wounds[newValue].icon;
    } else {
      return ARM5E.recovery.wounds[item.system.gravity].icon;
    }
  }

  canBeTreatedThisSeason(season, year) {
    if (this.recoveryTime == 0) {
      return true;
    }

    if (year < this.inflictedDate.year) return false;

    // if recovery time is not 0, wound has already been treated
    if (season == this.inflictedDate.season && year == this.inflictedDate.year) {
      return false;
    }

    const delta = seasonsDelta(
      { season: this.inflictedDate.season, year: this.inflictedDate.year },
      { season: season, year: year }
    );
    if (delta < 0) return; // trying to heal in the past
    log(
      false,
      `Delta ${delta} +1 x days : ${(delta + 1) * CONFIG.ARM5E.recovery.daysInSeason} versus ${
        this.recoveryTime
      }`
    );
    if (
      delta * CONFIG.ARM5E.recovery.daysInSeason < this.recoveryTime &&
      (delta + 1) * CONFIG.ARM5E.recovery.daysInSeason > this.recoveryTime
    ) {
      return true;
    }
    return false;
  }
}
