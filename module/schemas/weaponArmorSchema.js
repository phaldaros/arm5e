import { ARM5E } from "../config.js";
import { convertToNumber, log } from "../tools.js";
import { boolOption, itemBase, XpField } from "./commonSchemas.js";
import { EchantmentExtension, ItemState } from "./enchantmentSchema.js";
const fields = foundry.data.fields;
export const possibleCosts = Object.keys(ARM5E.item.costs);
export class ArmorSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      cost: new fields.SchemaField(
        {
          value: new fields.StringField({
            required: false,
            blank: false,
            initial: "n-a",
            choices: possibleCosts
          })
        },
        { required: false, blank: false, initial: { value: "n-a" } }
      ),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      load: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      }),
      prot: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      full: boolOption(false, true),
      equipped: boolOption(false, true),
      state: ItemState(),
      enchantments: new fields.EmbeddedDataField(EchantmentExtension, {
        nullable: true,
        initial: null
      })
    };
  }

  hasQuantity() {
    return { name: "quantity", qty: this.quantity };
  }

  static migrateData(data) {
    if (data.weight != undefined) {
      if (data.weight > 0 && data.load == 0) {
        data.load = data.weight;
      }
      delete data.weight;
    }

    return data;
  }

  static migrate(data) {
    let update = {};

    update["system.-=weight"] = null;
    update["system.load"] = data.system.load;
    return update;
  }
}

export class WeaponSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      cost: new fields.SchemaField(
        {
          value: new fields.StringField({
            required: false,
            blank: false,
            initial: "n-a",
            choices: possibleCosts
          })
        },
        { required: false, blank: false, initial: { value: "n-a" } }
      ),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      load: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      }),
      init: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      atk: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      dfn: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      dam: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      str: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 0,
        step: 1
      }),
      range: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      weaponExpert: boolOption(false, true),
      equipped: boolOption(false, true),
      horse: boolOption(false, true),
      ability: new fields.StringField({ required: false, blank: true, initial: "brawl" }),
      state: ItemState(),
      enchantments: new fields.EmbeddedDataField(EchantmentExtension, {
        nullable: true,
        initial: null
      })
    };
  }

  static migrateData(data) {
    // if (typeof data.cost != "string") {
    //   log(false, `Weapon cost: ${JSON.stringify(data.cost)}`);
    //   data.cost = data.cost.value;
    // }
    return data;
  }

  hasQuantity() {
    return { name: "quantity", qty: this.quantity };
  }
  static migrate(data) {
    let update = {};

    if (typeof data.system.init != "number") {
      update["system.init"] = convertToNumber(data.system.init, 0);
    }
    if (typeof data.system.atk != "number") {
      update["system.atk"] = convertToNumber(data.system.atk, 0);
    }
    if (typeof data.system.dfn != "number") {
      update["system.dfn"] = convertToNumber(data.system.dfn, 0);
    }
    if (typeof data.system.dam != "number") {
      update["system.dam"] = convertToNumber(data.system.dam, 0);
    }
    if (typeof data.system.str != "number") {
      update["system.str"] = convertToNumber(data.system.str, 0);
    }
    if (typeof data.system.range != "number") {
      update["system.range"] = convertToNumber(data.system.range, 0);
    }
    if (typeof data.system.load != "number") {
      update["system.load"] = convertToNumber(data.system.load, 0);
    }
    return update;
  }
}
