import { ARM5E } from "../config.js";

import { SeasonField } from "./commonSchemas.js";

const fields = foundry.data.fields;

export const actorBase = () => {
  return {
    description: new fields.StringField({ required: false, blank: true, initial: "" }),
    source: new fields.StringField({ required: false, initial: "custom" }),
    page: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      initial: 0,
      min: 0,
      step: 1
    })
  };
};

export class CodexSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {};
  }

  // static migrateData(data) {
  //   return data;
  // }

  static migrate(data) {
    return {};
  }
}
