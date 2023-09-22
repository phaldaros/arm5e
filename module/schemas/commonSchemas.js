import { ARM5E } from "../config.js";

const fields = foundry.data.fields;

const validators = foundry.data.validators;

export class NullableEmbeddedDataField extends fields.EmbeddedDataField {
  /**
   * @param {typeof DataModel} model          The class of DataModel which should be embedded in this field
   * @param {DataFieldOptions} options        Options which configure the behavior of the field
   */
  constructor(model, options) {
    super(model, options);
  }

  toObject(value) {
    if (value != null) {
      return super.toObject(value);
    }
    return null;
  }
}

export class NullableSchemaField extends fields.SchemaField {
  /**
   * @param {typeof DataModel} model          The class of DataModel which should be embedded in this field
   * @param {DataFieldOptions} options        Options which configure the behavior of the field
   */
  constructor(fields, options = {}) {
    super(fields, options);
  }

  /** @inheritdoc */
  static get _defaults() {
    return mergeObject(super._defaults, {
      required: false,
      nullable: true,
      initial: null
    });
  }

  toObject(value) {
    if (value != null) {
      return super.toObject(value);
    }
    return null;
  }
}

export class NullableDocumentIdField extends fields.DocumentIdField {
  /** @inheritdoc */
  static get _defaults() {
    return mergeObject(super._defaults, {
      required: false,
      blank: false,
      nullable: true,
      initial: null,
      readonly: false,
      validationError: "is not a valid Document ID string"
    });
  }

  /** @override */
  _cast(value) {
    if (value instanceof foundry.abstract.Document) return value._id;
    else return String(value);
  }

  /** @override */
  _validateType(value) {
    if (!validators.isValidId(value) && value !== null)
      throw new Error("must be a valid 16-character alphanumeric ID or null");
  }
}

// convert a field value into a number
export const convertToNumber = function (value, fallback = 0) {
  if (value === undefined || value === "" || value === null) {
    return fallback;
  } else if (typeof value === "string") {
    if (Number.isNumeric(value)) {
      return Number(value);
    } else {
      return fallback;
    }
  } else {
    if (Number.isInteger(value)) {
      return value;
    } else {
      return fallback;
    }
  }
};

export const convertToInteger = function (value, fallback = 0) {
  return Math.round(convertToNumber(value, fallback));
};

export const itemBase = () => {
  return {
    description: new fields.StringField({ required: false, blank: true, initial: "" }),
    source: new fields.StringField({ required: false, initial: "custom" }),
    page: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      initial: 0,
      min: 0,
      step: 1
    }),
    url: new fields.StringField({ required: false, blank: true, initial: "" })
  };
};

export const basicTextField = () =>
  new fields.StringField({ required: false, blank: true, initial: "" });

export const possibleRanges = Object.keys(ARM5E.magic.ranges).filter((r) => !r.disabled);
export const possibleTargets = Object.keys(ARM5E.magic.targets).filter((r) => !r.disabled);
export const possibleDurations = Object.keys(ARM5E.magic.durations).filter((r) => !r.disabled);
export const boolOption = (val = false, nullable = false) =>
  new fields.BooleanField({ required: false, initial: val, nullable: nullable });
export const baseDescription = () =>
  new fields.StringField({ required: false, blank: true, initial: "" });
export const TechniquesForms = () => {
  return {
    technique: new fields.SchemaField(
      { value: hermeticTechnique() },
      { required: false, blank: false, initial: { value: "cr" } }
    ),
    "technique-req": new fields.SchemaField(
      {
        cr: boolOption(),
        in: boolOption(),
        mu: boolOption(),
        pe: boolOption(),
        re: boolOption()
      },
      {
        required: false,
        blank: false,
        initial: {
          cr: false,
          in: false,
          mu: false,
          pe: false,
          re: false
        }
      }
    ),

    form: new fields.SchemaField(
      { value: hermeticForm() },
      { required: false, blank: false, initial: { value: "an" } }
    ),
    "form-req": new fields.SchemaField(
      {
        an: boolOption(),
        aq: boolOption(),
        au: boolOption(),
        co: boolOption(),
        he: boolOption(),
        ig: boolOption(),
        im: boolOption(),
        me: boolOption(),
        te: boolOption(),
        vi: boolOption()
      },
      {
        required: false,
        blank: false,
        initial: {
          an: false,
          aq: false,
          au: false,
          co: false,
          he: false,
          ig: false,
          im: false,
          me: false,
          te: false,
          vi: false
        }
      }
    )
  };
};

export const RealmField = (initial = "mundane") => {
  return new fields.StringField({
    required: false,
    blank: false,
    initial: initial,
    choices: Object.keys(ARM5E.realmsExt)
  });
};

export const SpellAttributes = () => {
  return {
    range: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "personal",
          choices: possibleRanges
        })
      },
      { required: false, blank: false, initial: { value: "personal" } }
    ),
    duration: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "moment",
          choices: possibleDurations
        })
      },
      { required: false, blank: false, initial: { value: "moment" } }
    ),
    target: new fields.SchemaField(
      {
        value: new fields.StringField({
          required: true,
          blank: false,
          initial: "ind",
          choices: possibleTargets
        })
      },
      { required: false, blank: false, initial: { value: "ind" } }
    ),
    targetSize: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    complexity: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      initial: 0,
      step: 1
    }),
    enhancingRequisite: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      min: 0,
      initial: 0,
      step: 1
    }),
    general: boolOption(),
    levelOffset: ModifierField()
  };
};

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
// Choices:

export const ModifierField = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    initial: 0,
    step: 1
  });

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

export const characteristicField = () =>
  new fields.NumberField({
    required: false,
    nullable: false,
    integer: true,
    min: -10,
    max: 10,
    initial: 0,
    step: 1
  });

export const hermeticArtScore = () =>
  new fields.NumberField({
    required: true,
    nullable: true,
    integer: true,
    min: 0,
    max: 40,
    initial: 0,
    step: 1
  });

export const hermeticForm = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "an",
    choices: Object.keys(ARM5E.magic.forms)
  });

export const hermeticTechnique = () =>
  new fields.StringField({
    required: false,
    blank: false,
    initial: "cr",
    choices: Object.keys(ARM5E.magic.techniques)
  });

export const authorship = () => {
  return {
    author: new fields.StringField({ required: false, blank: true, initial: "Unknown" }),
    year: new fields.NumberField({
      required: false,
      nullable: false,
      integer: true,
      // positive: true, // for testing
      initial: 1220,
      step: 1
    }),
    season: SeasonField(),
    language: new fields.StringField({ required: false, blank: true, initial: "Latin" })
  };
};
