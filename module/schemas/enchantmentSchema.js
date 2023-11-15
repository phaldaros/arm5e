import { ARM5E } from "../config.js";
import { ASPECTS } from "../constants/enchant-aspects.js";
import { ArM5eItem } from "../item/item.js";
import { log } from "../tools.js";
import {
  baseDescription,
  boolOption,
  convertToNumber,
  DateField,
  itemBase,
  ModifierField,
  NullableSchemaField,
  SeasonField,
  SpellAttributes,
  TechniquesForms,
  XpField
} from "./commonSchemas.js";
import { baseLevel } from "./magicSchemas.js";
const fields = foundry.data.fields;

// Schema field added to enchanted devices

export class EchantmentExtension extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;
  constructor(fields, options = { nullable: true }) {
    super(fields, options);
  }

  static defineSchema() {
    return {
      author: new fields.StringField({ required: false, blank: true, initial: "Unknown" }),
      year: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        // positive: true, // for testing
        initial: 1220,
        step: 1
      }),
      season: SeasonField(),
      talisman: boolOption(),
      preparedBy: new fields.StringField({
        required: false,
        blank: true,
        nullable: true,
        initial: null
      }),
      locked: boolOption(),
      charged: boolOption(),
      prepared: boolOption(),
      bonuses: new fields.ArrayField(
        new fields.SchemaField({
          value: ModifierField(),
          name: new fields.StringField({
            required: false,
            blank: true,
            initial: "Generic"
          }),
          type: new fields.StringField({
            required: false,
            blank: false,
            initial: "labTotal",
            choices: ["labTotal"]
          })
        }),
        { required: false, initial: [] }
      ),
      aspects: new fields.ArrayField(new fields.SchemaField(AspectAttribute())),
      capacities: new fields.ArrayField(new fields.SchemaField(HermeticAttributes()), {
        initial: [{ sizeMultiplier: "tiny", materialBase: "base1", desc: "" }]
      }),
      capacityMode: new fields.StringField({
        required: false,
        blank: false,
        initial: "sum",
        choices: ["sum", "max"]
      }),
      effects: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({
            required: false,
            blank: true
          }),
          img: new fields.FilePathField({
            categories: ["IMAGE"],
            initial: (data) => CONFIG.ARM5E_DEFAULT_ICONS["enchantment"]
          }),
          system: new fields.EmbeddedDataField(EnchantmentSchema, {})
        }),
        {
          required: false,
          initial: []
        }
      ),
      charges: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        min: 0,
        initial: 1,
        step: 1
      }),
      originalCharges: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        min: 1,
        initial: 1,
        step: 1
      })
    };
  }
  static getDefaultArtwork(itemData) {
    return { img: UI };
  }

  static migrate(itemData) {
    return {};
  }
}

export class EnchantmentSchema extends foundry.abstract.DataModel {
  static _enableV10Validation = true;
  constructor(fields, options = { nullable: true }) {
    super(fields, options);
  }
  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      ...EnchantmentAttributes(),
      hidden: boolOption()
    };
  }
  static migrate(itemData) {
    return {};
  }
}

export const EnchantmentAttributes = () => {
  return {
    effectfrequency: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "0",
      choices: Object.keys(ARM5E.lab.enchantment.effectUses)
    }),
    penetration: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    maintainConc: boolOption(),
    environmentalTrigger: baseDescription(),
    restrictedUse: baseDescription(),
    linkedTrigger: baseDescription(),
    charges: new fields.NumberField({
      required: false,
      nullable: true,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    expiryStartDate: DateField(),
    expiry: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "0",
      choices: Object.keys(ARM5E.lab.enchantment.expiry)
    })
  };
};

export const ItemState = () => {
  return new fields.StringField({
    required: false,
    nullable: false,
    initial: "inert",
    choices: Object.keys(ARM5E.lab.enchantment.state)
  });
};

export const HermeticAttributes = () => {
  return {
    sizeMultiplier: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "tiny",
      choices: Object.keys(ARM5E.lab.enchantment.sizeMultiplier)
    }),
    materialBase: new fields.StringField({
      required: false,
      nullable: false,
      blank: false,
      initial: "base1",
      choices: Object.keys(ARM5E.lab.enchantment.materialBase)
    }),
    desc: baseDescription()
  };
};

export const AspectAttribute = () => {
  return {
    aspect: baseDescription(Object.keys(ASPECTS)[0]),
    effect: baseDescription(),
    bonus: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    attuned: boolOption()
  };
};
