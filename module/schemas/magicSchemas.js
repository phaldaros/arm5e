import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  authorship,
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

// number field for spell level
export const baseLevel = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    positive: true,
    min: 1,
    initial: 1,
    step: 1
  });

const migrateMagicalItem = (itemData) => {
  const updateData = {};

  if (typeof itemData.system.baseLevel != "number") {
    updateData["system.baseLevel"] = convertToNumber(itemData.system.baseLevel, 1);
  } else if (itemData.system.baseLevel < 1) {
    updateData["system.baseLevel"] = 1;
    ChatMessage.create({
      content:
        "<b>Migration notice</b><br/>" +
        `The Item of type: ${itemData.type} named ${itemData.name}` +
        ` had a non-positive baseLevel of ${itemData.system.baseLevel}, ` +
        `please review its new level (original: ${itemData.system.level}) and ` +
        ` use rather the levelOffset or complexity field for thats<br/>`
    });
  }

  if (itemData.system.baseEffectDescription == null) {
    updateData["system.baseEffectDescription"] = "";
  }

  if (itemData.type != "baseEffect") {
    if (itemData.type == "laboratoryText") {
      // fixing season key
      if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
        if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
          updateData["system.season"] = itemData.system.season.toLowerCase();
        } else {
          updateData["system.season"] = "spring";
        }
      }
    }
    if (itemData.type !== "magicalEffect") {
      if (itemData.system.ritual == undefined) {
        updateData["system.ritual"] = false;
      } else if (typeof itemData.system.ritual != "boolean") {
        if (itemData.system.ritual === "true") {
          updateData["system.ritual"] = true;
        } else {
          updateData["system.ritual"] = false;
        }
      }
    }
    if (itemData.system.duration.value === undefined) {
      updateData["system.duration.value"] = _guessDuration(itemData.name, itemData.system.duration);
    } else if (CONFIG.ARM5E.magic.durations[itemData.system.duration.value] === undefined) {
      // console.log(`Guessing duration: ${itemData.system.duration}`);
      updateData["system.duration.value"] = _guessDuration(
        itemData.name,
        itemData.system.duration.value
      );
    }

    if (itemData.system.range.value === undefined) {
      updateData["system.range.value"] = _guessRange(itemData.name, itemData.system.range);
    } else if (CONFIG.ARM5E.magic.ranges[itemData.system.range.value] === undefined) {
      // console.log(`Guessing range: ${itemData.system.range}`);
      updateData["system.range.value"] = _guessRange(itemData.name, itemData.system.range.value);
    }

    if (itemData.system.target.value === undefined) {
      updateData["system.target.value"] = _guessTarget(itemData.name, itemData.system.target);
    } else if (CONFIG.ARM5E.magic.targets[itemData.system.target.value] === undefined) {
      // console.log(`Guessing target: ${itemData.system.target}`);
      updateData["system.target.value"] = _guessTarget(itemData.name, itemData.system.target.value);
    }

    if (itemData.system.levelOffset === null) {
      updateData["system.levelOffset"] = 0;
    }
  }

  if (itemData.system.technique.value === "") {
    updateData["system.technique.value"] = "cr";
  }
  if (itemData.system.form.value === "") {
    updateData["system.form.value"] = "an";
  }
  // remove redundant data
  if (itemData.system.techniques != undefined) {
    updateData["system.-=techniques"] = null;
  }
  if (itemData.system.forms != undefined) {
    updateData["system.-=forms"] = null;
  }
  if (itemData.system["technique-requisites"] != undefined) {
    updateData["system.-=technique-requisites"] = null;
  }
  if (itemData.system["form-requisites"] != undefined) {
    updateData["system.-=form-requisites"] = null;
  }
  if (itemData.system["technique-requisite"] != undefined) {
    if (
      itemData.system["technique-requisite"].value != "n-a" &&
      itemData.system["technique-requisite"].value != ""
    ) {
      updateData["system.technique-req." + itemData.system["technique-requisite"].value] = true;
    }
    updateData["system.-=technique-requisite"] = null;
  }

  if (itemData.system["form-requisite"] != undefined) {
    if (
      itemData.system["form-requisite"].value != "n-a" &&
      itemData.system["form-requisite"].value != ""
    ) {
      updateData["system.form-req." + itemData.system["form-requisite"].value] = true;
    }
    updateData["system.-=form-requisite"] = null;
  }

  for (let [req, val] of Object.entries(itemData.system["form-req"])) {
    if (typeof val != "boolean") {
      if (val === "true") {
        updateData[`system.form-req.${req}`] = true;
      } else if (val === "false") {
        updateData[`system.form-req.${req}`] = false;
      }
    }
  }
  for (let [req, val] of Object.entries(itemData.system["technique-req"])) {
    if (typeof val != "boolean") {
      if (val === "true") {
        updateData[`system.technique-req.${req}`] = true;
      } else if (val === "false") {
        updateData[`system.technique-req.${req}`] = false;
      }
    }
  }

  // temporary : removal of authorship in spell, it will only be present in lab texts
  if (itemData.type == "spell") {
    if (itemData.system.author) {
      updateData["system.-=author"] = null;
    }
    if (itemData.system.year) {
      updateData["system.-=year"] = null;
    }
    if (itemData.system.season) {
      updateData["system.-=season"] = null;
    }
    if (itemData.system.language) {
      updateData["system.-=language"] = null;
    }
    if (itemData.system.exp) {
      let exp = ((itemData.system.mastery * (itemData.system.mastery + 1)) / 2) * 5;
      if (itemData.system.exp >= exp) {
        updateData["system.xp"] = itemData.system.exp;
      } else if (itemData.system.exp >= (itemData.system.mastery + 1) * 5) {
        // if the experience is bigger than the neeeded for next level, ignore it
        updateData["system.xp"] = exp;
      } else {
        // compute normally
        updateData["system.xp"] = exp + itemData.system.exp;
      }

      updateData["system.-=mastery"] = null;
      updateData["system.-=exp"] = null;
    }
  }
  if (itemData.system.description == null) {
    updateData["system.description"] = "";
  }

  if (typeof itemData.system.targetSize != "number") {
    updateData["system.targetSize"] = convertToNumber(itemData.system.targetSize, 0);
  }

  if (typeof itemData.system.complexity != "number") {
    updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
  }

  if (typeof itemData.system.enhancingRequisite != "number") {
    updateData["system.enhancingRequisite"] = convertToNumber(
      itemData.system.enhancingRequisite,
      0
    );
  } else if (itemData.system.enhancingRequisite < 0) {
    updateData["system.enhancingRequisite"] = 0;
    ChatMessage.create({
      content:
        "<b>Migration notice</b><br/>" +
        `The Item of type: ${itemData.type} named ${itemData.name}` +
        ` had a negative enhancingRequisite of ${itemData.system.enhancingRequisite}, ` +
        `please review its new level (original: ${itemData.system.level}) and ` +
        ` use rather the levelOffset field for general spells<br/>`
    });
  }

  return updateData;
};

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

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = migrateMagicalItem(itemData);

    if (typeof itemData.system.page != "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
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

  static migrate(itemData) {
    const updateData = migrateMagicalItem(itemData);

    if (typeof itemData.system.page != "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }
    if (typeof itemData.system.complexity != "number") {
      updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
    }

    return updateData;
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

  // static getDefault(itemData) {
  //   let res = itemData;

  //   return res;
  // }

  static getIcon(item, newValue = null) {
    if (newValue != null) {
      return `systems/arm5e/assets/magic/${newValue}.png`;
    } else {
      let init = "an";
      if (item.system?.form?.value !== undefined) {
        init = item.system.form.value;
      }
      return `systems/arm5e/assets/magic/${init}.png`;
    }
  }

  async _increaseScore() {
    let xpMod = this.parent.parent.system.bonuses.arts.masteryXpMod;
    let oldXp = this.xp;
    let newXp = Math.round(
      (((this.derivedScore + 1) * (this.derivedScore + 2) * 5) / 2 - xpMod) / this.xpCoeff
    );

    await this.parent.update(
      {
        system: {
          xp: newXp
        }
      },
      {}
    );
    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }
  async _decreaseScore(item) {
    let xpMod = this.parent.parent.system.bonuses.arts.masteryXpMod;
    let futureXp = Math.round(
      ((this.derivedScore - 1) * this.derivedScore * 5) / (2 * this.xpCoeff)
    );
    let newXp = 0;
    if (futureXp >= Math.round(xpMod * this.xpCoeff)) {
      newXp = Math.round(
        (((this.derivedScore - 1) * this.derivedScore * 5) / 2 - xpMod) / this.xpCoeff
      );
    }
    if (newXp != this.xp) {
      await this.parent.update(
        {
          system: {
            xp: newXp
          }
        },
        {}
      );
      let delta = newXp - this.xp;
      console.log(`Removed ${delta} xps from ${this.xp} to ${newXp} total`);
    }
  }

  static migrateData(data) {
    return data;
  }

  static migrate(itemData) {
    const updateData = migrateMagicalItem(itemData);
    if (typeof itemData.system.page != "number") {
      updateData["system.page"] = convertToNumber(itemData.system.page, 0);
    }

    if (typeof itemData.system.xp != "number") {
      updateData["system.xp"] = convertToNumber(itemData.system.xp, 0);
    }

    if (typeof itemData.system.complexity != "number") {
      updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
    }
    // else if (itemData.system.complexity < 0) {
    //   updateData["system.complexity"] = 0;
    //   ChatMessage.create({
    //     content:
    //       "<b>Migration notice</b><br/>" +
    //       `The Item of type: ${itemData.type} named ${itemData.name}` +
    //       ` had a negative complexity of ${itemData.system.complexity}, ` +
    //       `please review its new level (original: ${itemData.system.level}) and ` +
    //       ` use rather the levelOffset field for general spells<br/>`
    //   });
    // }

    if (typeof itemData.system.bonus != "number") {
      updateData["system.bonus"] = convertToNumber(itemData.system.bonus, 0);
    }

    return updateData;
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
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "spell",
        choices: Object.keys(ARM5E.lab.labTextType)
      }),
      ...TechniquesForms(),
      ...SpellAttributes(),
      ...EnchantmentAttributes(),
      baseLevel: baseLevel(),
      level: baseLevel(),
      baseEffectDescription: baseDescription(),
      ritual: boolOption(),
      img: new fields.StringField({
        required: false,
        blank: true,
        initial: ""
      })
    };
  }

  static migrate(itemData) {
    // console.log(`Migrate book: ${JSON.stringify(itemData)}`);
    const updateData = migrateMagicalItem(itemData);

    if (itemData.system.year == null) {
      updateData["system.year"] = 1220;
    }
    if (typeof itemData.system.complexity != "number") {
      updateData["system.complexity"] = convertToNumber(itemData.system.complexity, 0);
    }
    return updateData;
  }
}

// Unfortunately, since the duration was a free input field, it has to be guessed
function _guessDuration(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase().trim()) {
      case "moment":
      case "momentary":
      case "mom":
      case game.i18n.localize("arm5e.spell.durations.moment"):
        return "moment";
      case "diameter":
      case "dia":
      case "diam":
        return "diam";
      case "concentration":
      case game.i18n.localize("arm5e.spell.durations.conc"):
        return "conc";
      case "sun":
      case game.i18n.localize("arm5e.spell.durations.sun"):
        return "sun";
      case "ring":
      case game.i18n.localize("arm5e.spell.durations.ring"):
        return "ring";
      case "moon":
      case game.i18n.localize("arm5e.spell.durations.moon"):
        return "moon";
      case "fire":
      case game.i18n.localize("arm5e.spell.durations.fire"):
        return "fire";
      case "bargain":
      case "barg":
      case game.i18n.localize("arm5e.spell.durations.barg"):
        return "bargain";
      case "year":
      case game.i18n.localize("arm5e.spell.durations.year"):
        return "year";
      case "condition":
      case "cond":
      case game.i18n.localize("arm5e.spell.durations.condition"):
        return "condition";
      case "year+1":
      case game.i18n.localize("arm5e.spell.durations.year+1"):
        return "year+1";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess duration \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.durations.moment")}</b>`
  });
  console.warn(`Duration \"${value}\" of spell ${name} could not be guessed`);
  return "moment";
}

// Unfortunately, since the range was a free input field, it has to be guessed
function _guessRange(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase()) {
      case "personnal":
      case "pers":
      case "per":
      case game.i18n.localize("arm5e.spell.ranges.personal"):
        return "personal";
      case "touch":
      case game.i18n.localize("arm5e.spell.ranges.touch"):
        return "touch";
      case "eye":
      case game.i18n.localize("arm5e.spell.ranges.eye"):
        return "eye";
      case "voice":
      case game.i18n.localize("arm5e.spell.ranges.voice"):
        return "voice";
      case "road":
      case game.i18n.localize("arm5e.spell.ranges.road"):
        return "road";
      case "sight":
      case game.i18n.localize("arm5e.spell.ranges.sight"):
        return "sight";
      case "arc":
      case "arcane connection":
      case game.i18n.localize("arm5e.spell.ranges.arc"):
        return "arc";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess range \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.ranges.personal")}</b>`
  });
  console.warn(`Range \"${value}\" of spell ${name} could not be guessed`);
  return "personal";
}

// Unfortunately, since the target was a free input field, it has to be guessed
function _guessTarget(name, value) {
  if (value && value !== "") {
    switch (value.toLowerCase().trim()) {
      case "individual":
      case "ind":
      case "indiv":
      case game.i18n.localize("arm5e.spell.targets.ind"):
        return "ind";
      case "circle":
      case "cir":
      case game.i18n.localize("arm5e.spell.targets.circle"):
        return "circle";
      case "part":
      case "par":
      case game.i18n.localize("arm5e.spell.targets.part"):
        return "part";
      case "group":
      case "gro":
      case "grp":
      case game.i18n.localize("arm5e.spell.targets.group"):
        return "group";
      case "room":
      case game.i18n.localize("arm5e.spell.targets.room"):
        return "room";
      case "struct":
      case "str":
      case game.i18n.localize("arm5e.spell.targets.struct"):
        return "struct";
      case "boundary":
      case "bound":
      case "bou":
      case game.i18n.localize("arm5e.spell.targets.bound"):
        return "bound";
      case "taste":
      case "tas":
      case game.i18n.localize("arm5e.spell.targets.taste"):
        return "taste";
      case "hearing":
      case "hea":
      case game.i18n.localize("arm5e.spell.targets.hearing"):
        return "hearing";
      case "touch":
      case "tou":
      case game.i18n.localize("arm5e.spell.targets.touch"):
        return "touch";
      case "smell":
      case "sme":
      case game.i18n.localize("arm5e.spell.targets.smell"):
        return "smell";
      case "sight":
      case "sig":
      case game.i18n.localize("arm5e.spell.targets.sight"):
        return "sight";
      case "special":
      case "spe":
      case "spec":
      case game.i18n.localize("arm5e.spell.special"):
        return "special";
      default:
        break;
    }
  }
  ChatMessage.create({
    content:
      "<b>MIGRATION NOTIFICATION</b><br/>" +
      `Warning: Unable to guess target \"${value}\" of ${name}, you will have to set it back manually. ` +
      `It has been reset to ${game.i18n.localize("arm5e.spell.targets.ind")}</b>`
  });
  console.warn(`Target \"${value}\" of spell ${name} could not be guessed`);
  return "ind";
}
