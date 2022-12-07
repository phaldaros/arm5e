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

export class magicalEffectSchema extends foundry.abstract.DataModel {
  // TODO remove in V11
  static _enableV10Validation = true;

  boolOption = () => new fields.BooleanField({ required: true, initial: false });
  static defineSchema() {
    return {
      ...itemBase(),
      technique: new fields.SchemaField({ value: hermeticTechnique() }, { required: true }),
      "technique-req": fields.SchemaField({
        cr: boolOption(),
        in: boolOption(),
        mu: boolOption(),
        pe: boolOption(),
        re: boolOption()
      }),

      form: new fields.SchemaField({ value: hermeticForm() }, { required: true }),
      "form-req": fields.SchemaField({
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
      })
    };
  }
}
