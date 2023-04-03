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
        choices: Object.keys(ARM5E.virtueFlawTypes.character)
          .concat(Object.keys(ARM5E.virtueFlawTypes.laboratory))
          .concat(Object.keys(ARM5E.virtueFlawTypes.covenant))
          .concat("Special")
          .concat("other")
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
        { required: true }
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

export class VisSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      art: new fields.StringField({
        required: false,
        blank: false,
        initial: "cr",
        choices: Object.keys(ARM5E.magic.arts)
      }),
      pawns: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      })
    };
  }

  static migrateData(data) {
    // if (data.art == "") {
    //   data.art = "cr";
    // } else
    if (data.art?.value) {
      data.art = data.art.value;
    }

    return data;
  }

  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.art.value !== undefined) {
      updateData["system.art"] = itemData.system.art.value;
    } else if (itemData.system.art == "") {
      updateData["system.art"] = "cr";
    }
    // get ride of form of vis field
    if (
      itemData.system.form != undefined &&
      itemData.system.form !== "Physical form of the raw vis." &&
      itemData.system.form !== ""
    ) {
      updateData["system.description"] = itemData.system.description + itemData.system.form;
      updateData["system.-=form"] = null;
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
      xp: XpField(),
      negative: boolOption(false, false)
    };
  }

  static migrate(data) {
    return {};
  }

  static migrateData(data) {
    console.log(`MigrateData Personality trait: ${JSON.stringify(data)}`);
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
