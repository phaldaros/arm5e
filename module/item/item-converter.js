import {
    log
} from "../tools.js"

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
    if (spellData.type != "spell" && spellData.type != "magicalEffect" && spellData.type != "enchantment") {
        return null;
    }
    log(false, "effectToLabText");
    log(false, spellData.name)
    spellData.img = CONFIG.ARM5E_DEFAULT_ICONS['laboratoryText'];
    let itemData = {};
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

/* -------------------------------------------- */