export class StressDie extends Die {
  constructor(termData = {}) {
    super(termData);
    if (typeof this.faces !== "number") {
      throw new Error("A StressDie term must have a numeric number of faces.");
    }
    this.faces = 10;
  }

  /** @inheritdoc */
  static DENOMINATION = "sd";

  /** @inheritdoc */
  static MODIFIERS = {};

  /** @inheritdoc */
  static REGEXP = new RegExp(
    `^([0-9]+)?sd([A-z]|[0-9]+)${DiceTerm.MODIFIERS_REGEXP_STRING}?${DiceTerm.FLAVOR_REGEXP_STRING}?$`
  );

  /** @inheritdoc */
  get total() {
    return super.total();
  }

  roll({ minimize = false, maximize = false } = {}) {
    const roll = { result: 1, active: true };
    let res = 0;
    if (minimize) res = 1;
    else if (maximize) res = this.faces;
    else res = Math.ceil(CONFIG.Dice.randomUniform() * this.faces);

    if (res == 0) {
      roll.result = 0;
    } else {
      while (res === 1) {
        roll.result *= 2;
        res = Math.ceil(CONFIG.Dice.randomUniform() * this.faces);
      }
      roll.result *= res;
    }

    return roll;
  }
}
