import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  baseDescription,
  boolOption,
  convertToNumber,
  EnchantmentAttributes,
  itemBase,
  ModifierField,
  SpellAttributes,
  TechniquesForms,
  XpField
} from "./commonSchemas.js";
const fields = foundry.data.fields;

export class EnchantmentSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDesc(),
      applyFocus: boolOption(false, true),
      ritual: boolOption(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      xp: XpField(),
      masteryAbilities: baseDescription()
    };
  }
}

export const EnchantmentAttributes = () => {
  return {
    effectfrequency: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
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
    linkedTrigger: baseDescription()
  };
};

export const MagicItemAttributes = () => {
  return {
    sizeMultiplier: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 1,
      initial: 1,
      step: 1,
      choices: Object.keys(ARM5E.lab.enchantment.sizeMultiplier)
    }),
    materialBase: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 1,
      initial: 1,
      step: 1,
      choices: Object.keys(ARM5E.lab.enchantment.materialBase)
    }),
    opened: boolOption(),
    status: boolOption(),
    charges: new fields.NumberField({
      required: false,
      nullable: true,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    material: baseDescription(),
    materialBonus: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    shape: baseDescription(),
    shapeBonus: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    expiry: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1,
      choices: Object.keys(ARM5E.lab.enchantment.expiry)
    })
  };
};
