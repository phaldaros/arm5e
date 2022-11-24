// import DataModel from "common/abstract/data.mjs";
import { ARM5E } from "../config.js";
import { log } from "../tools.js";
import {
  authorship,
  characteristicField,
  hermeticForm,
  hermeticTechnique,
  itemBase,
  SeasonField,
  XpField
} from "./commonSchemas.js";
const fields = foundry.data.fields;
export class AbilitySchema extends foundry.abstract.DataModel {
  static defineSchema() {
    const base = itemBase();
    return {
      ...itemBase(),
      defaultChaAb: new fields.StringField({ required: false, blank: false, initial: "int" }),
      speciality: new fields.StringField({ required: false, blank: true, initial: "" }),
      xp: XpField(),
      key: new fields.StringField({ required: false, blank: true, initial: "" }),
      option: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  static migrate(itemData) {
    log(false, "Migrate ability " + itemData.name);
    const updateData = {};
    if (itemData.system.experienceNextLevel != undefined) {
      // if the experience is equal or bigger than the xp for this score, use it as total xp
      let exp = ((itemData.system.score * (itemData.system.score + 1)) / 2) * 5;
      if (itemData.system.experience >= exp) {
        updateData["system.xp"] = itemData.system.experience;
      } else if (itemData.system.experience >= (itemData.system.score + 1) * 5) {
        // if the experience is bigger than the neeeded for next level, ignore it
        updateData["system.xp"] = exp;
      } else {
        // compute normally
        updateData["system.xp"] = exp + itemData.system.experience;
      }
      // TODO: to be uncommentedm when we are sure the new system works
      // updateData["system.-=experience"] = null;
      // updateData["system.-=score"] = null;
      updateData["system.-=experienceNextLevel"] = null;
    }
    // clean-up TODO: remove
    updateData["system.-=puissant"] = null;
    updateData["system.-=affinity"] = null;

    // no key assigned to the ability, try to find one
    if (CONFIG.ARM5E.ALL_ABILITIES[itemData.system.key] == undefined || itemData.system.key == "") {
      log(true, `Trying to find key for ability ${itemData.name}`);
      let name = itemData.name.toLowerCase();
      // handle those pesky '*' at the end of restricted abilities
      if (name.endsWith("*")) {
        name = name.substring(0, name.length - 1);
      }

      // Special common cases
      if (game.i18n.localize("arm5e.skill.commonCases.native").toLowerCase() == name) {
        updateData["system.key"] = "livingLanguage";
        updateData["system.option"] = "nativeTongue";
        log(false, `Found key livingLanguage for ability  ${itemData.name}`);
      } else if (game.i18n.localize("arm5e.skill.commonCases.areaLore").toLowerCase() == name) {
        updateData["system.key"] = "areaLore";
        log(false, `Found key areaLore for ability  ${itemData.name}`);
      } else if (game.i18n.localize("arm5e.skill.commonCases.latin").toLowerCase() == name) {
        updateData["system.key"] = "deadLanguage";
        updateData["system.option"] = "Latin";
        log(false, `Found key latin for ability  ${itemData.name}`);
      } else if (game.i18n.localize("arm5e.skill.commonCases.hermesLore").toLowerCase() == name) {
        updateData["system.key"] = "organizationLore";
        updateData["system.option"] = "OrderOfHermes";
        log(false, `Found key hermesLore for ability  ${itemData.name}`);
      } else {
        for (const [key, value] of Object.entries(CONFIG.ARM5E.ALL_ABILITIES)) {
          if (game.i18n.localize(value.mnemonic).toLowerCase() == name) {
            updateData["system.key"] = key;
            log(false, `Found key ${key} for ability  ${itemData.name}`);
            break;
          }
        }
      }
      if (updateData["system.key"] == undefined) {
        log(true, `Unable to find a key for ability  ${itemData.name}`);
      }
    }
    if (itemData.system.option != undefined) {
      // keep only alphanum chars
      updateData["system.option"] = itemData.system.option.replace(/[^a-zA-Z0-9]/gi, "");
    }
  }
}

export class BookSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      ...authorship(),
      topics: new fields.ArrayField(
        new fields.SchemaField({
          category: new fields.StringField({
            required: true,
            nullable: false,
            initial: "art",
            choices: ["art", "ability", "labText", "mastery"]
          }),
          art: new fields.StringField({ required: false, nullable: true, initial: "cr" }),
          key: new fields.StringField({ required: false, nullable: true, initial: null }),
          option: new fields.StringField({ required: false, nullable: true, initial: null }),
          spellName: new fields.StringField({ required: false, nullable: true, initial: null }),
          spellTech: hermeticTechnique(),
          spellForm: hermeticForm(),
          quality: new fields.NumberField({
            required: false,
            nullable: false,
            integer: true,
            min: 0,
            initial: 0,
            step: 1
          }),
          level: new fields.NumberField({
            required: false,
            nullable: true,
            integer: true,
            min: 0,
            initial: 0,
            step: 1
          }),
          type: new fields.StringField({
            required: false,
            blank: false,
            initial: "Summa",
            choices: ARM5E.books.types
          })
        }),
        { required: true, initial: [] }
      )
    };
  }

  static migrateData(data) {
    log(false, "MigrateData book");
    if (data.topic && !data.topics) {
      log(false, "really MigrateData book");
      data.topics = [];
      let topic = data.topic;
      topic.quality = data.quality;
      topic.level = data.level;
      topic.type = data.type;
      data.topics.push(topic);
    }
    return super.migrateData(data);
  }

  static migrate(itemData) {
    log(false, "Migrate book " + itemData.name);
    const updateData = {};
    // legacy cleanup
    if (
      itemData.system.topic === undefined &&
      Array.isArray(itemData.system.topics) &&
      itemData.system.topics.length == 0
    ) {
      let topics = [];
      let topic = {};
      if (itemData.system.art.value) {
        topic.art = itemData.system.art.value;
        topic.key = null;
        topic.option = null;
        topic.spellName = null;
        topic.category = "art";
        topic.quality = itemData.system.quality;
        topic.level = itemData.system.level;
        topic.mastery = false;
      } else {
        // missing data, reset to default
        topic.art = "cr";
        topic.key = null;
        topic.option = null;
        topic.spellName = null;
        topic.category = "art";
        topic.quality = 1;
        topic.level = 1;
        topic.mastery = false;
      }
      if (itemData.system.type.value !== undefined) {
        if (itemData.system.type.value == "summa") {
          topic.type = "Summa";
        } else if (itemData.system.type.value == "tract") {
          topic.type = "Tractatus";
        }
      } else {
        if (itemData.system.type == "summa") {
          topic.type = "Summa";
        } else if (itemData.system.type == "tract") {
          topic.type = "Tractatus";
        }
      }

      topics.push(topic);
      updateData["system.topics"] = topics;
      updateData["system.-=quality"] = null;
      updateData["system.-=level"] = null;
      updateData["system.-=type"] = null;
    }

    for (let topic of itemData.system.topics) {
      if (topic.type == "summa") {
        topic.type = "Summa";
      } else if (topic.type == "tract") {
        topic.type = "Tractatus";
      }
    }
    updateData["system.topics"] = itemData.system.topics;
    // V10 datamodel cleanup (2.0.0)
    if (!Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season)) {
      if (Object.keys(CONFIG.ARM5E.seasons).includes(itemData.system.season.toLowerCase())) {
        updateData["system.season"] = itemData.system.season.toLowerCase();
      } else {
        updateData["system.season"] = "spring";
      }
    }
    updateData["system.-=types"] = null;

    // single to multi-topics
    if (itemData.system.topic && itemData.system.topics == undefined) {
      let topics = [];
      let topic = foundry.utils.deepClone(itemData.system.topic);
      topic.type = itemData.system.type;
      topic.quality = itemData.system.quality;
      topic.level = itemData.system.level;
      topics.push(topic);
      updateData["system.topics"] = topics;
      updateData["system.-=topic"] = null;
      updateData["system.-=quality"] = null;
      updateData["system.-=level"] = null;
    }
    return updateData;
  }
}

export class VirtueFlawSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "general",
        choices: Object.keys(ARM5E.virtueFlawTypes.character)
          .concat(ARM5E.virtueFlawTypes.laboratory)
          .concat(ARM5E.virtueFlawTypes.covenant)
          .concat("other")
      }),
      impact: new fields.StringField({
        required: false,
        blank: false,
        initial: "free",
        choices: Object.keys(ARM5E.impacts)
      })
    };
  }
}

export class DiaryEntrySchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      season: SeasonField(),
      year: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 1200,
        step: 1
      }),
      duration: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        positive: true,
        initial: 1
      }),
      endSeason: new fields.StringField({
        required: false,
        nullable: true,
        initial: null,
        choices: Object.keys(ARM5E.seasons)
      }),
      endYear: new fields.NumberField({
        required: false,
        nullable: true,
        integer: true,
        initial: null,
        step: 1
      }),
      sourceQuality: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0,
        initial: 0,
        step: 1
      }),
      activity: new fields.StringField({
        required: false,
        blank: false,
        initial: "none",
        choices: Object.keys(ARM5E.activities.generic)
      }),
      teacher: new fields.SchemaField({
        id: new fields.ForeignDocumentField({
          nullable: true,
          initial: null
        }),
        name: new fields.StringField({ required: true, blank: false }),
        com: characteristicField(),
        teaching: new fields.NumberField({
          required: false,
          nullable: false,
          integer: true,
          positive: true,
          initial: 1,
          step: 1
        }),
        applySpec: new fields.BooleanField({ required: false, initial: false }),
        score: new fields.NumberField({
          required: false,
          nullable: false,
          integer: true,
          min: 0,
          initial: 2,
          step: 1
        })
      }),
      progress: new fields.SchemaField({
        abilities: new fields.ArrayField(
          new SchemaField({
            id: new fields.DocumentIdField(),
            category: new fields.StringField({ required: true, blank: false }),
            xp: XpField()
          })
        ),
        arts: new fields.ArrayField(
          new SchemaField({
            key: new fields.StringField({ required: true, blank: false }),
            xp: XpField()
          })
        ),
        spells: new fields.ArrayField(
          new SchemaField({
            id: new fields.DocumentIdField(),
            form: new fields.StringField({ required: true, blank: false }),
            xp: XpField()
          })
        )
      })
    };
  }
}

export class ItemSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      quantity: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      }),
      weight: new fields.NumberField({
        required: false,
        nullable: false,
        min: 0,
        initial: 0
      })
    };
  }
}

export class VisSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      art: new fields.StringField({
        required: false,
        blank: false,
        initial: "cr",
        choices: Object.keys(ARM5E.magic.arts)
      }),
      pawns: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        min: 0, // allow quantity of 0 to keep an eye on what is missing
        initial: 1,
        step: 1
      })
    };
  }
}

export class MySchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return { ...itemBase() };
  }
}
