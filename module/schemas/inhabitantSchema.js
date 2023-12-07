import { ARM5E } from "../config.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
import { convertToNumber, log } from "../tools.js";
import { Scriptorium } from "../tools/scriptorium.js";
import { itemBase } from "./commonSchemas.js";
const fields = foundry.data.fields;
export class InhabitantSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  //   "habitantMagi",
  //   "habitantCompanion",
  //   "habitantSpecialists",
  //   "habitantHabitants",
  //   "habitantHorses",
  //   "habitantLivestock",

  static defineSchema() {
    return {
      ...itemBase(),
      category: new fields.StringField({
        required: false,
        blank: false,
        initial: "grogs",
        choices: Object.keys(ARM5E.covenant.inhabitants)
      }),
      actorId: new fields.StringField({
        nullable: true,
        required: false,
        blank: true,
        initial: null
      }),
      loyalty: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      job: new fields.StringField({ required: false, blank: true, initial: "" }),
      score: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        min: 0,
        step: 1
      }),
      yearBorn: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        // positive: true, // for testing
        initial: 1200,
        step: 1
      }),
      extradata: new fields.ObjectField({ required: false, nullable: true, initial: {} })
    };
  }

  static getDefault(itemData) {
    let res = itemData;
    if (res.system === undefined) {
      res.system = {
        category: "grogs"
      };
    }
    return res;
  }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return CONFIG.INHABITANTS_DEFAULT_ICONS[newValue];
    } else {
      return CONFIG.INHABITANTS_DEFAULT_ICONS[item.system.category];
    }
  }
  static migrate(data) {
    const updateData = {};

    if (data.name != "" && (data.system.actorId == null || data.system.actorId === "")) {
      let inhabitant = game.actors.filter(
        (a) => ["player", "npc", "beast"].includes(a.type) && a.name == data.name
      );
      if (inhabitant.length > 0) {
        updateData["system.actorId"] = inhabitant[0]._id;
      }
    }

    if (typeof data.system.loyalty != "number") {
      updateData["system.loyalty"] = convertToNumber(data.system.loyalty, 0);
    }
    if (typeof data.system.score != "number") {
      updateData["system.score"] = convertToNumber(data.system.score, 0);
    }
    if (typeof data.system.quantity != "number") {
      updateData["system.quantity"] = convertToNumber(data.system.quantity, 0);
    }
    if (typeof data.system.yearBorn != "number") {
      updateData["system.yearBorn"] = convertToNumber(data.system.yearBorn, 1200);
    }

    return updateData;
  }
}
