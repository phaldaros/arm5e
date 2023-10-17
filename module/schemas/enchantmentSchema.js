import { ARM5E } from "../config.js";
import { SHAPES } from "../constants/shapes-materials.js";
import { log } from "../tools.js";
import {
  baseDescription,
  boolOption,
  convertToNumber,
  itemBase,
  ModifierField,
  NullableSchemaField,
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
      talisman: boolOption(),
      shapes: new fields.SetField(new fields.SchemaField(ShapeAttribute())),
      materials: new fields.SetField(new fields.SchemaField(MaterialAttribute())),
      capacities: new fields.SetField(new fields.SchemaField(HermeticAttributes()), {
        initial: [{ sizeMultiplier: "tiny", materialBase: "base1", desc: "" }]
      }),
      capacityMode: new fields.StringField({
        required: false,
        blank: false,
        initial: "sum",
        choices: ["sum", "max"]
      }),
      effects: new fields.SetField(EnchantmentEffect())
    };
  }
}

export const EnchantmentEffect = () => {
  return new fields.SchemaField({
    ...itemBase(),
    ...TechniquesForms(),
    ...SpellAttributes(),
    baseLevel: baseLevel(),
    baseEffectDescription: baseDescription(),
    bonus: ModifierField(),
    bonusDesc: baseDescription(),
    ...EnchantmentAttributes(),
    hidden: boolOption()
  });
};

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

export const MaterialAttribute = () => {
  return {
    material: baseDescription(),
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

export const ShapeAttribute = () => {
  return {
    shape: baseDescription(),
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
