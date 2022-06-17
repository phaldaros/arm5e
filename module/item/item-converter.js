import { log } from "../tools.js";

/*
 *   functions to convert a type to another
 */

// _moveField(fieldName, source, target) {
//     target[fieldName] = source[fieldName];
//     delete source[fieldName];
//     return target;
// }

/*
 * Convert effect into a lab text
 * @param {object} data   The data object to be converted
 * @return {Promise<Object|null>}
 */
export function effectToLabText(spellData) {
  if (
    spellData.type != "spell" &&
    spellData.type != "magicalEffect" &&
    spellData.type != "enchantment"
  ) {
    return null;
  }
  log(false, "effectToLabText");
  log(false, spellData.name);
  spellData.img = CONFIG.ARM5E_DEFAULT_ICONS["laboratoryText"];
  if (spellData.type == "spell") {
    spellData.data.type = "spell";
    delete spellData.data.mastery;
    delete spellData.data.exp;
    delete spellData.data.bonus;
    delete spellData.data.applyFocus;
  } else if (spellData.type == "magicalEffect") {
    spellData.data.type = "spell";
  } else if (spellData.type == "enchantment") {
    spellData.data.type = "enchantment";
  }
  spellData.type = "laboratoryText";
  return spellData;
}

/*
 * Convert effect into a lab text
 * @param {object} data   The data object to be converted
 * @return {Promise<Object|null>}
 */
export function labTextToEffect(labTextData) {
  if (labTextData.type != "laboratoryText") {
    return null;
  }
  log(false, "labTextToEffect");
  log(false, labTextData.name);
  if (labTextData.data.type === "spell") {
    labTextData.img = CONFIG.ARM5E_DEFAULT_ICONS["spell"];
    labTextData.type = "spell";
    delete labTextData.data.type;
    delete labTextData.data.effectfrequency;
    delete labTextData.data.penetration;
    delete labTextData.data.maintainConc;
    delete labTextData.data.environmentalTrigger;
    delete labTextData.data.restrictedUse;
    delete labTextData.data.linkedTrigger;
    delete labTextData.data.author;
    delete labTextData.data.year;
    delete labTextData.data.season;
    delete labTextData.data.language;
  } else if (labTextData.data.type === "enchantment") {
    labTextData.img = CONFIG.ARM5E_DEFAULT_ICONS["enchantment"];
    labTextData.type = "enchantment";
    delete labTextData.data.type;
    delete labTextData.data.author;
    delete labTextData.data.year;
    delete labTextData.data.season;
    delete labTextData.data.language;
  } else {
    // unknown labText type
    return null;
  }
  return labTextData;
}

export function resetOwnerFields(itemData) {
  switch (itemData.type) {
    case "spell":
      delete itemData.data.mastery;
      delete itemData.data.masteryAbilities;
      delete itemData.data.exp;
      delete itemData.data.bonus;
      delete itemData.data.xp;
    case "magicalEffect":
      delete itemData.data.applyFocus;
      return itemData;
    case "ability":
      delete itemData.data.xp;
      delete itemData.data.experience;
      delete itemData.data.experienceNextLevel;
      delete itemData.data.score;
      return itemData;
    default:
      return itemData;
  }
}

/* -------------------------------------------- */
