import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  authorship,
  baseDescription,
  boolOption,
  characteristicField,
  EnchantmentAttributes,
  hermeticForm,
  hermeticTechnique,
  itemBase,
  ModifierField,
  possibleDurations,
  possibleRanges,
  possibleTargets,
  SeasonField,
  SpellAttributes,
  TechniquesForms,
  XpField
} from "./commonSchemas.js";
const fields = foundry.data.fields;

const baseLevel = () =>
  new fields.NumberField({
    required: true,
    nullable: false,
    integer: true,
    positive: true,
    min: 1,
    initial: 1,
    step: 1
  });

export class BaseEffectSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription()
    };
  }

  static migrateData(data) {}

  static migrate(itemData) {
    const updateData = {};
    if (itemData.system.baseLevel == null) {
      updateData["system.baseLevel"] = 1;
    }
    if (itemData.system.baseEffectDescription == null) {
      updateData["system.baseEffectDescription"] = "";
    }
    if (itemData.system.page == null) {
      updateData["system.page"] = 0;
    }
    return updateData;
  }
}

export class MagicalEffectSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true)
    };
  }
}

export class SpellSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...TechniquesForms(),
      ...SpellAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true),
      ritual: boolOption(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      xp: XpField(),
      masteryAbilities: baseDescription(),
      general: boolOption(),
      levelOffset: ModifierField()
    };
  }
}

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

export class LabTextSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  static defineSchema() {
    return {
      ...itemBase(),
      ...authorship(),
      type: fields.StringField({
        required: true,
        blank: false,
        initial: "spell",
        choices: Object.keys(ARM5E.lab.labTextType)
      }),
      ...TechniquesForms(),
      ...SpellAttributes(),
      ...EnchantmentAttributes(),
      baseLevel: baseLevel(),
      baseEffectDescription: baseDescription(),
      applyFocus: boolOption(false, true),
      ritual: boolOption(),
      bonus: ModifierField(),
      bonusDesc: baseDescription(),
      xp: XpField(),
      masteryAbilities: baseDescription()
    };
  }
}
