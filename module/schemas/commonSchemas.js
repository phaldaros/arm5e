import { ARM5E } from "../config.js";

const fields = foundry.data.fields;
export const itemBase = () => {
  return {
    description: new fields.StringField({ required: false, blank: true, initial: "" }),
    source: new fields.StringField({ required: false, initial: "custom" }),
    page: new fields.NumberField({
      required: true,
      nullable: false,
      integer: true,
      initial: 0,
      min: 0,
      step: 1
    })
  };
};

// Choices:

export const SeasonField = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "spring",
    choices: Object.keys(ARM5E.seasons)
  });

export const XpField = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    min: 0,
    initial: 0,
    step: 1
  });

export const characteristicField = () => {
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    min: -10,
    max: 10,
    initial: 0,
    step: 1
  });
};

export const hermeticArtField = () => {
  new fields.NumberField({
    required: true,
    nullable: true,
    integer: true,
    min: -10,
    max: 10,
    initial: 0,
    step: 1
  });
};

export const authorship = () => {
  return {
    author: new fields.StringField({ required: false, blank: true, initial: "Unknown" }),
    year: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      // positive: true, // for testing
      initial: 1200,
      step: 1
    }),
    season: SeasonField(),
    language: new fields.StringField({ required: false, blank: false, initial: "Latin" })
  };
};

export const magicalEffectAttributes = {
  technique: new fields.StringField({ required: false, blank: false, initial: "cr" }),
  form: new fields.StringField({ required: false, blank: false, initial: "an" }),
  range: new fields.StringField({ required: false, blank: false, initial: "personal" })
};
