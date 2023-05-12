// import DataModel from "common/abstract/data.mjs";
import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  boolOption,
  convertToInteger,
  convertToNumber,
  itemBase,
  XpField
} from "./commonSchemas.js";
const fields = foundry.data.fields;

export const possibleReputationTypes = Object.keys(ARM5E.reputations);

const virtueFlawTypes = Object.keys(ARM5E.virtueFlawTypes.character)
  .concat(Object.keys(ARM5E.virtueFlawTypes.laboratory))
  .concat(Object.keys(ARM5E.virtueFlawTypes.covenant))
  .concat("Special")
  .concat("other");
export class VirtueFlawSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "general",
        choices: virtueFlawTypes
      }),
      impact: new fields.SchemaField(
        {
          value: new fields.StringField({
            required: false,
            blank: false,
            initial: "free",
            choices: Object.keys(ARM5E.impacts).concat("Special")
          })
        },
        { required: false, blank: false, initial: { value: "free" } }
      )
    };
  }

  static migrateData(data) {
    // if (data.description == null) {
    //   data.description = "";
    // }
    if (data.type?.value) {
      data.type = data.type.value;
    }
    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    if (typeof itemData.system.page !== "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }
    if (itemData.system.type === "") {
      updateData["system.type"] = "general";
    } else if (itemData.system.type.value !== undefined) {
      updateData["system.type"] = itemData.system.type.value;
    }
    if (itemData.system.description == null) {
      updateData["system.description"] = "";
    }

    // special cases
    if (itemData.system.type === "Social Status") {
      updateData["system.type"] = "social";
    } else if (!virtueFlawTypes.includes(itemData.system.type)) {
      updateData["system.type"] = "general";
    }

    return updateData;
  }
}

export class ItemSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      weight: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      }),
      carried: boolOption(false, true)
    };
  }

  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.quantity === null || !Number.isInteger(itemData.system.quantity)) {
      updateData["system.quantity"] = convertToInteger(itemData.system.quantity, 1);
    }
    if (itemData.system.weight === null) {
      updateData["system.weight"] = 0;
    }

    return updateData;
  }
}

export class ReputationSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      xp: XpField(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "local",
        choices: possibleReputationTypes
      })
    };
  }

  async _increaseScore() {
    let oldXp = this.xp;
    let newXp = Math.round(((this.score + 1) * (this.score + 2) * 5) / 2);

    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }

  async _decreaseScore() {
    if (this.score != 0) {
      let oldXp = this.xp;
      let newXp = Math.round(((this.score - 1) * this.score * 5) / 2);
      await this.parent.update(
        {
          system: {
            xp: newXp
          }
        },
        {}
      );
      let delta = newXp - oldXp;
      console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
    }
  }

  static migrateData(data) {
    // console.log(`MigrateData Reputation: ${JSON.stringify(data)}`);
    if (data.points != undefined) {
      data.xp = (5 * (data.points * (data.points + 1))) / 2;
      delete data.points;
    }
    return data;
  }

  static migrate(data) {
    // console.log(`Migrate Reputation: ${JSON.stringify(data)}`);
    let update = {};
    update["system.-=points"] = null;
    update["system.-=notes"] = null;
    update["system.xp"] = data.system.xp;
    return update;
  }
}

export class PersonalityTraitSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      xp: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      })
    };
  }

  async _increaseScore() {
    let oldXp = this.xp;
    let newXp = 5;
    if (this.score > 0) {
      newXp = Math.round(((this.score + 1) * (this.score + 2) * 5) / 2);
    } else if (this.score < 0) {
      newXp = -Math.round(((this.score + 1) * this.score * 5) / 2);
    }
    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }

  async _decreaseScore() {
    let oldXp = this.xp;
    let newXp = -5;
    if (this.score > 0) {
      newXp = Math.round(((this.score - 1) * this.score * 5) / 2);
    } else if (this.score < 0) {
      newXp = -Math.round(((this.score - 2) * (this.score - 1) * 5) / 2);
    }
    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
  }

  static getScore(xp) {
    let res = 0;
    let xps;
    if (xp >= 0) {
      xps = Math.floor(xp / 5);
      while (xps > res) {
        res++;
        xps = xps - res;
      }
      return res;
    } else {
      return -this.getScore(-xp);
    }
  }

  static migrate(data) {
    let update = {};
    update["system.-=points"] = null;
    update["system.-=notes"] = null;
    update["system.xp"] = data.system.xp;
    return {};
  }

  static migrateData(data) {
    if (data.points != undefined) {
      if (data.points < 0) {
        data.xp = -(5 * (data.points * (data.points + 1))) / 2;
      } else {
        data.xp = (5 * (data.points * (data.points + 1))) / 2;
      }
      delete data.points;
    }
    return data;
  }
}

export class MySchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return { ...itemBase() };
  }

  static migrateData(data) {
    return data;
  }

  static migrate(data) {
    return {};
  }
}
