// import DataModel from "common/abstract/data.mjs";
import { ARM5E } from "../config.js";
import { authorship, itemBase, SeasonField, XpField } from "./commonSchemas.js";
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
}

export class HermeticArtBookSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      ...authorship(),
      art: new fields.StringField({ required: false, blank: false, initial: "cr" }),
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
        nullable: false,
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
    };
  }
}

export class MundaneBookSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      ...authorship(),
      ability: new fields.StringField({ required: false, blank: false, initial: "My ability" }),
      key: new fields.StringField({ required: false, blank: true, initial: "" }),
      option: new fields.StringField({ required: false, blank: true, initial: "" }),
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
        nullable: false,
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
    };
  }
}

export class VirtueFlawSchema extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      ...itemBase(),
      type: new fields.StringField({
        required: false,
        blank: false,
        initial: "general"
        // choices: Object.keys(ARM5E.virtueFlawTypes.character)
        //   .concat(ARM5E.virtueFlawTypes.laboratory)
        //   .concat(ARM5E.virtueFlawTypes.covenant)
        //   .concat("other")
      }),
      impact: new fields.StringField({
        required: false,
        blank: false,
        initial: "free"
        // choices: Object.keys(ARM5E.impacts)
      })
    };
  }
}

export class DiaryEntrySchema extends foundry.abstract.DataModel {
  static defineSchema() {
    const progressItemField = () => {
      return n;
    };

    return {
      ...itemBase(),
      ...SeasonField(),
      year: new fields.NumberField({
        required: false,
        nullable: false,
        integer: true,
        initial: 1200,
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
        name: new fields.StringField({ required: true, blank: false })
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
