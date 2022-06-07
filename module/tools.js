import { ARM5E } from "./config.js";

import { DEFAULT_WOUND, SIZES_AND_WOUNDS } from "./constants/wounds.js";

export function log(force, ...args) {
  try {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.MODULE_ID);

    if (force || isDebugging) {
      console.log(ARM5E.MODULE_ID, "|", ...args);
    }
  } catch (e) {
    console.log(e);
  }
}

export function error(force, ...args) {
  try {
    const isDebugging = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.MODULE_ID);

    if (force || isDebugging) {
      console.error(ARM5E.MODULE_ID, "|", ...args);
    }
  } catch (e) {
    console.error(e);
  }
}

export async function getDocumentFromCompendium(pack, id) {
  let compendium = game.packs.get(pack);
  // const documents = await compendium.getDocuments();
  let doc = compendium.getDocument(id);
  return doc;
}

export function compareBaseEffects(e1, e2) {
  if (e1.data.data.form.value < e2.data.data.form.value) {
    return -1;
  } else if (e1.data.data.form.value > e2.data.data.form.value) {
    return 1;
  } else {
    if (e1.data.data.technique.value < e2.data.data.technique.value) {
      return -1;
    } else if (e1.data.data.technique.value > e2.data.data.technique.value) {
      return 1;
    } else {
      if (e1.data.data.baseLevel < e2.data.data.baseLevel) {
        return -1;
      } else if (e1.data.data.baseLevel > e2.data.data.baseLevel) {
        return 1;
      } else {
        return e1.data.name.localeCompare(e2.data.name);
      }
    }
  }
}

export function compareMagicalEffects(e1, e2) {
  return compareMagicalEffectsData(e1.data, e2.data);
}

export function compareMagicalEffectsData(e1, e2) {
  if (e1.data.form.value < e2.data.form.value) {
    return -1;
  } else if (e1.data.form.value > e2.data.form.value) {
    return 1;
  } else {
    if (e1.data.technique.value < e2.data.technique.value) {
      return -1;
    } else if (e1.data.technique.value > e2.data.technique.value) {
      return 1;
    } else {
      if (e1.data.level < e2.data.level) {
        return -1;
      } else if (e1.data.level > e2.data.level) {
        return 1;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

export function compareSpells(e1, e2) {
  return compareSpellsData(e1.data, e2.data);
}
export function compareSpellsData(e1, e2) {
  if (e1.data.form.value < e2.data.form.value) {
    return -1;
  } else if (e1.data.form.value > e2.data.form.value) {
    return 1;
  } else {
    if (e1.data.technique.value < e2.data.technique.value) {
      return -1;
    } else if (e1.data.technique.value > e2.data.technique.value) {
      return 1;
    } else {
      if (e1.data.level < e2.data.level) {
        return -1;
      } else if (e1.data.level > e2.data.level) {
        return 1;
      } else {
        return e1.name.localeCompare(e2.name);
      }
    }
  }
}

export function compareLabTexts(e1, e2) {
  return compareLabTextsData(e1.data, e2.data);
}

export function hermeticFilter(filters, inputArray) {
  if (filters.formFilter != "") {
    inputArray = inputArray.filter((e) => e.data.form.value === filters.formFilter);
  }
  if (filters.techniqueFilter != "") {
    inputArray = inputArray.filter((e) => e.data.technique.value === filters.techniqueFilter);
  }
  if (
    filters.levelFilter != 0 &&
    filters.levelFilter != null &&
    filters.levelFilter != "" &&
    filters.levelFilter != "0"
  ) {
    if (filters.levelOperator == 0) {
      inputArray = inputArray.filter((e) => e.data.level === parseInt(filters.levelFilter));
    } else if (filters.levelOperator == -1) {
      inputArray = inputArray.filter((e) => e.data.level <= parseInt(filters.levelFilter));
    } else {
      inputArray = inputArray.filter((e) => e.data.level >= parseInt(filters.levelFilter));
    }
  }
  return inputArray;
}

export function compareLabTextsData(e1, e2) {
  if (e1.data.type < e2.data.type) {
    return -1;
  } else if (e1.data.type > e2.data.type) {
    return 1;
  } else {
    return compareMagicalEffectsData(e1, e2);
  }
}

export function getLabUpkeepCost(upkeep) {
  if (upkeep < -5) return 0;
  switch (upkeep) {
    case -5:
      return 1;
    case -4:
      return 2;
    case -3:
      return 3;
    case -2:
      return 5;
    case -1:
      return 7;
    case 0:
      return 10;
    case 1:
      return 15;
    default:
      return upkeep * (upkeep + 1) * 5;
  }
}

export function getLastMessageByHeader(game, key) {
  const searchString = game.i18n.localize(key).toLowerCase() + "</h2>";
  const messages = game.messages.filter((msg) => {
    const flavor = (msg?.data?.flavor || "").toLowerCase();
    return flavor.indexOf(searchString) > -1;
  });
  if (messages.length) return messages.pop();
  return false;
}

export function calculateWound(damage, size) {
  if (damage <= 0) {
    return "";
  }
  const typeOfWoundsBySize = getWoundType(size);
  //SIZES_AND_WOUNDS[size.toString()];
  if (typeOfWoundsBySize === undefined) return false;
  const wounds = Object.keys(typeOfWoundsBySize);

  let typeOfWound = DEFAULT_WOUND;
  wounds.forEach((wound) => {
    if (Number(wound) <= damage) {
      typeOfWound = typeOfWoundsBySize[wound];
    }
  });
  return typeOfWound;
}

export function getDataset(obj) {
  if (obj.preventDefault) {
    obj.preventDefault();
    const element = obj.currentTarget;
    return element.dataset;
  }
  return obj;
}

// No limitation to size
function getWoundType(size) {
  if (size <= -4) {
    return {
      1: "light",
      2: "medium",
      3: "heavy",
      4: "incap",
      5: "dead"
    };
  }
  let increment = size + 5;
  const result = { 1: "light" };

  result[1 + increment] = "medium";
  result[1 + 2 * increment] = "heavy";
  result[1 + 3 * increment] = "incap";
  result[1 + 4 * increment] = "dead";

  //console.log(result);
  return result;
}

// Internal function to generate Active Effects types from the ability list
export function generateActiveEffectFromAbilities() {
  let activeEffects = {
    bonusGeneralAbility: {
      category: "abilities",
      type: "bonusGeneralAbility",
      label: "bonusGeneralAbility",
      subtypes: {}
    },
    bonusArcaneAbility: {
      category: "abilities",
      type: "bonusArcaneAbility",
      label: "arm5e.sheet.activeEffect.types.arcaneAbilitiesBonus",
      subtypes: {}
    },
    bonusAcademicAbility: {
      category: "abilities",
      type: "bonusAcademicAbility",
      label: "arm5e.sheet.activeEffect.types.academicAbilitiesBonus",
      subtypes: {}
    },
    bonusMartialAbility: {
      category: "abilities",
      type: "bonusMartialAbility",
      label: "arm5e.sheet.activeEffect.types.martialAbilitiesBonus",
      subtypes: {}
    },
    bonusMysteryAbility: {
      category: "abilities",
      type: "bonusMysteryAbility",
      label: "arm5e.sheet.activeEffect.types.mysteryAbilitiesBonus",
      subtypes: {}
    },
    bonusSupernaturalAbility: {
      category: "abilities",
      type: "bonusSupernaturalAbility",
      label: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesBonus",
      subtypes: {}
    },
    affinityGeneralAbility: {
      category: "abilities",
      type: "affinityGeneralAbility",
      label: "arm5e.sheet.activeEffect.types.generalAbilitiesAffinity",
      subtypes: {}
    },
    affinityArcaneAbility: {
      category: "abilities",
      type: "affinityArcaneAbility",
      label: "arm5e.sheet.activeEffect.types.arcaneAbilitiesAffinity",
      subtypes: {}
    },
    affinityAcademicAbility: {
      category: "abilities",
      type: "affinityAcademicAbility",
      label: "arm5e.sheet.activeEffect.types.academicAbilitiesAffinity",
      subtypes: {}
    },
    affinityMartialAbility: {
      category: "abilities",
      type: "affinityMartialAbility",
      label: "arm5e.sheet.activeEffect.types.martialAbilitiesAffinity",
      subtypes: {}
    },
    affinityMysteryAbility: {
      category: "abilities",
      type: "affinityMysteryAbility",
      label: "arm5e.sheet.activeEffect.types.mysteryAbilitiesAffinity",
      subtypes: {}
    },
    affinitySupernaturalAbility: {
      category: "abilities",
      type: "affinitySupernaturalAbility",
      label: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesAffinity",
      subtypes: {}
    }
  };
  let tmp = Object.entries(CONFIG.ARM5E.ALL_ABILITIES);
  // debugger;
  for (const [aKey, ability] of Object.entries(CONFIG.ARM5E.ALL_ABILITIES)) {
    // console.log(ability);
    let computedKey;
    let afinityComputedKey;
    if (ability.option) {
      computedKey = `data.bonuses.skills.${aKey}_#OPTION#.bonus`;
      afinityComputedKey = `data.bonuses.skills.${aKey}_#OPTION#.xpCoeff`;
    } else {
      computedKey = `data.bonuses.skills.${aKey}.bonus`;
      afinityComputedKey = `data.bonuses.skills.${aKey}.xpCoeff`;
    }
    switch (ability.category) {
      case "general": {
        activeEffects.bonusGeneralAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityGeneralAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "academic": {
        activeEffects.bonusAcademicAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityAcademicAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "arcane": {
        activeEffects.bonusArcaneAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityArcaneAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "martial": {
        activeEffects.bonusMartialAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityMartialAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "mystery": {
        activeEffects.bonusMysteryAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinityMysteryAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
      case "supernatural": {
        activeEffects.bonusSupernaturalAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: computedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          default: 2
        };
        activeEffects.affinitySupernaturalAbility.subtypes[aKey] = {
          label: ability.mnemonic,
          key: afinityComputedKey,
          mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
          default: 1.5
        };
        break;
      }
    }
  }
  console.log(activeEffects);
  debugger;
}

export function getSystemCompendium(compendiumName) {
  let pack = game.packs.filter(
    (p) => p.metadata.package === "arm5e" && p.metadata.name === compendiumName
  );
  if (pack.length) return pack[0];
  return undefined;
}
