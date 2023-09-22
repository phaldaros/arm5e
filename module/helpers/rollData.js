import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "./active-effects.js";
import { ArM5ePCActor } from "../actor/actor.js";
import { log } from "../tools.js";
import { getRollTypeProperties, ROLL_MODIFIERS } from "./rollWindow.js";
import Aura from "./aura.js";

export class ArM5eRollData {
  constructor(actor) {
    this._actor = actor;
    this.reset();
  }

  init(dataset) {
    this.reset();
    const actorSystemData = this._actor.system;
    this.type = dataset.roll;

    if (dataset.name) {
      this.label = dataset.name;
    }
    this.additionalData = dataset.moredata ?? {};

    if (dataset.img) {
      this.img = dataset.img;
    }

    let rollProperties = getRollTypeProperties(this.type);

    if (rollProperties.MODE & ROLL_MODIFIERS.PHYSICAL) {
      this.physicalCondition = true;
    } else {
      this.physicalCondition = false;
    }
    // possible to override physicalCondition with dataset
    if (dataset.physicalcondition != undefined) {
      this.physicalCondition = dataset.physicalcondition;
    }

    this.prepareRollFields(dataset);
    if (rollProperties.MODIFIERS & ROLL_MODIFIERS.ENCUMBRANCE) {
      this.setGenericField(
        game.i18n.localize("arm5e.sheet.encumbrance"),
        actorSystemData.combat.overload,
        3,
        "-"
      );
    }

    switch (this.type) {
      case "init":
        break;
      case "combat":
        if (this.img === "") this.img = actorSystemData.combat.img;
        this.itemId = actorSystemData.combat.itemId;
        this.name = actorSystemData.combat.name;

        break;
      case "char":
        this.characteristic = dataset.characteristic;
        break;
      case "ability":
        if (dataset.defaultcharacteristic) {
          this.characteristic = dataset.defaultcharacteristic;
        }

        const ab = this._actor.items.get(dataset.ability);
        if (this.img === "") this.img = ab.img;
        this.itemId = ab.id;
        this.name = ab.name;
        this.label = this.name;
        this.ability.id = dataset.ability;
        this.ability.name = ab.name;
        this.ability.key = ab.system.key;
        this.ability.option = ab.system.option;
        this.ability.speciality = ab.system.speciality;
        this.ability.score = ab.system.finalScore;
        this.ability.realm = ab.system.realm;
        this.ability.category = ab.system.category;
        break;

      case "power":
        if (dataset.id) {
          let power = this._actor.items.get(dataset.id);
          this.label += ` (${ARM5E.magic.arts[power.system.form].short})`;
          if (this.img === "") this.img = power.img;
          this.itemId = power.id;
          this.power.cost = Number(power.system.cost);
          this.power.penetrationPenalty = this.power.cost * 5;
          this.power.form = power.system.form;
        }
        this.initPenetrationVariables();
        break;

      case "magic":
      case "spont":
        this.useFatigue = true;

        this.magic.divide = this._actor.system.bonuses.arts.spontDivider;
      case "spell":
        this.initPenetrationVariables();
        this.characteristic = "sta";
        if (dataset.id) {
          let spell = this._actor.items.get(dataset.id);
          if (this.label === "") {
            this.label = spell.name;
          }
          this.label += " (" + spell.system.level + ")";
          if (this.img === "") this.img = spell.img;
          this.itemId = spell.id;
          let techData = spell._getTechniqueData(this._actor.system);
          this.magic.technique = spell.system.technique.value;
          this.magic.techniqueLabel = techData[0];
          this.magic.techniqueScore = techData[1];
          this.magic.techDeficiency = techData[2];
          let formData = spell._getFormData(this._actor.system);
          this.magic.formLabel = formData[0];
          this.magic.formScore = formData[1];
          this.magic.formDeficiency = formData[2];
          this.magic.form = spell.system.form.value;
          this.magic.bonus = spell.system.bonus ?? 0;
          this.magic.bonusDesc = spell.system.bonusDesc ?? "";
          if (dataset.applyfocus != undefined) {
            this.magic.focus = dataset.applyfocus;
          } else {
            this.magic.focus = spell.system.applyFocus;
          }
          this.magic.ritual = spell.system.ritual ?? false;
          this.magic.level = spell.system.level;
          this.magic.masteryScore = spell.system.finalScore ?? 0;
          this.bonuses = this.magic.bonus;
        } else {
          if (dataset.technique) {
            this.magic.technique = dataset.technique;
            this.magic.techniqueLabel = ARM5E.magic.techniques[dataset.technique].label;
            this.magic.techniqueScore = parseInt(
              actorSystemData.arts.techniques[dataset.technique].finalScore
            );
            this.magic.techDeficiency =
              actorSystemData.arts.techniques[dataset.technique].deficient;
          }

          if (dataset.form) {
            this.magic.form = dataset.form;
            this.magic.formLabel = ARM5E.magic.forms[dataset.form].label;
            this.magic.formScore = parseInt(actorSystemData.arts.forms[dataset.form].finalScore);
            this.magic.formDeficiency = actorSystemData.arts.forms[dataset.form].deficient;
          }
          this.magic.masteryScore = 0;
        }

        break;
      case "aging":
        this.environment.year = parseInt(dataset.year);
        this.environment.season = ARM5E.seasons[dataset.season].label;
        this.label =
          game.i18n.localize("arm5e.aging.roll.label") +
          " " +
          game.i18n.localize(ARM5E.seasons[dataset.season].label) +
          " " +
          this.environment.year;
        this.setGenericField(
          game.i18n.localize("arm5e.sheet.ageModifier"),
          Math.round(parseInt(actorSystemData.age.value) / 10),
          1
        );
        let livingMod = 0;
        if (actorSystemData.covenant.linked) {
          let cov = game.actors.get(actorSystemData.covenant.actorId);
          if (ArM5ePCActor.isMagus(this._actor.type, actorSystemData.charType.value)) {
            livingMod = cov.system.modifiersLife.magi ?? 0;
          } else {
            livingMod = cov.system.modifiersLife.mundane ?? 0;
          }
        }
        this.setGenericField(game.i18n.localize("arm5e.sheet.modifiersLife"), livingMod, 2, "-");

        this.setGenericField(
          game.i18n.localize("arm5e.sheet.longevityModifier"),
          actorSystemData.laboratory.longevityRitual.modifier +
            actorSystemData.bonuses.traits.aging,
          3,
          "-"
        );
        if (actorSystemData.familiar && actorSystemData.familiar.cordFam.bronze > 0) {
          this.setGenericField(
            game.i18n.localize("arm5e.aging.roll.bronze"),
            actorSystemData.familiar.cordFam.bronze,
            4,
            "-"
          );
        }
        break;
      case "crisis":
        this.environment.year = parseInt(dataset.year);
        this.environment.season = ARM5E.seasons.winter.label;
        this.label =
          game.i18n.localize("arm5e.aging.roll.label") +
          " " +
          this.environment.season +
          " " +
          this.environment.year;

        this.setGenericField(
          game.i18n.localize("arm5e.sheet.decrepitude"),
          actorSystemData.decrepitude.finalScore,
          1
        );
        this.setGenericField(
          game.i18n.localize("arm5e.sheet.ageModifier"),
          Math.round(parseInt(actorSystemData.age.value) / 10),
          2
        );
        break;
      //case "option":
      default:
        break;
    }

    if (dataset.divide != undefined) {
      this.magic.divide = dataset.divide;
    }
    if (dataset.usefatigue != undefined) {
      this.useFatigue = dataset.usefatigue;
    }
    this.activeEffects = [];
    if (["magic", "power", "spont", "spell"].includes(this.type)) {
      this.getSpellcastingModifiers();
    }
    this.bonusesExtended = this.bonuses;
    this.getAuraModifier();

    this.cleanBooleans();
  }

  initPenetrationVariables() {
    this.penetration = this._actor.getAbilityStats("penetration");
    this.penetration.multiplier = 1;
    this.penetration.specApply = false;
    this.penetration.penetrationMastery = false;
    this.penetration.multiplierBonusArcanic = 0;
    this.penetration.multiplierBonusSympathic = 0;
    this.penetration.config = ARM5E.magic.penetration;
    this.penetration.total = 0;
  }

  get isMagic() {
    return ["magic", "spont", "spell"].includes(this.type);
  }

  setGenericField(name, value, idx, op = "+") {
    this.generic.txtOption[idx - 1] = name;
    this.generic.option[idx - 1] = value;
    this.generic.operatorOpt[idx - 1] = op;
  }

  hasGenericField(idx) {
    return this.generic.txtOption[idx - 1] != "";
  }

  getGenericFieldLabel(idx) {
    return this.generic.txtOption[idx - 1];
  }

  getGenericFieldValue(idx) {
    if (this.generic.operatorOpt[idx - 1] === "+") return Number(this.generic.option[idx - 1]);
    else {
      return -Number(this.generic.option[idx - 1]);
    }
  }

  prepareRollFields(dataset) {
    if (dataset.modifier) {
      this.modifier = parseInt(this.modifier) + parseInt(dataset.modifier);
    }
    if (dataset.txtoption1) {
      this.setGenericField(dataset.txtoption1, dataset.option1, 1);
    }
    if (dataset.txtoption2) {
      this.setGenericField(dataset.txtoption2, dataset.option2, 2);
    }
    if (dataset.txtoption3) {
      this.setGenericField(dataset.txtoption3, dataset.option3, 3);
    }
    if (dataset.txtoption4) {
      this.setGenericField(dataset.txtoption4, dataset.option4, 4);
    }
    if (dataset.txtoption5) {
      this.setGenericField(dataset.txtoption5, dataset.option5, 5);
    }
  }

  cleanBooleans() {
    // clean booleans
    if (this.useFatigue === "false") {
      this.useFatigue = false;
    } else if (this.useFatigue === "true") {
      this.useFatigue = true;
    }

    if (this.physicalCondition === "false") {
      this.physicalCondition = false;
    } else if (this.physicalCondition === "true") {
      this.physicalCondition = true;
    }
  }

  reset() {
    this.magic = {
      technique: "",
      techniqueScore: 0,
      techniqueLabel: "",
      form: "",
      formScore: 0,
      formLabel: "",
      bonus: 0,
      bonusDesc: "",
      masteryScore: 0,
      ritual: false,
      focus: false,
      masteryScore: 0,
      divide: 1,
      level: 0,
      techDeficiency: false,
      formDeficiency: false
    };

    this.power = {
      cost: 0,
      penetrationPenalty: 0,
      form: ""
    };

    this.spell = null;

    this.penetration = {
      multiplier: 1,
      score: 0,
      speciality: "",
      specApply: false,
      penetrationMastery: false,
      multiplierBonusArcanic: 0,
      multiplierBonusSympathic: 0,
      total: 0
    };

    this.characteristic = "";

    this.ability = { id: "None", name: "", score: 0, speciality: "", specApply: false };

    this.combat = { exertion: false, advantage: 0 };

    this.generic = {
      option: [0, 0, 0, 0, 0],
      txtOption: ["", "", "", "", ""],
      operatorOpt: ["+", "+", "+", "+", "+"]
    };

    this.environment = { aura: 0, year: "", season: "" };
    this.activeEffects = [];

    this.bonuses = 0;
    this.bonusesExtended = 0;
    this.type = "";
    this.label = "";
    this.details = "";
    // roll formula
    this.formula = "";
    // added to chat message as an icon for the roll
    this.img = "";
    this.itemId = "";
    // roll window title
    this.name = "";
    // arbitrary bonus
    this.modifier = 0;
    this.useFatigue = false;
    // whether physical condition impact the roll
    this.physicalCondition = true;
    this.secondaryScore = 0;
    // optional data used in the callback
    this.additionalData = {};
  }

  getAuraModifier() {
    const superNatAbility =
      this.type == "ability" &&
      this.ability.category == "supernaturalCat" &&
      this.ability.realm != "mundane";
    const auraApply = superNatAbility || ["spell", "magic", "spont", "power"].includes(this.type);
    if (auraApply) {
      this.environment.aura = Aura.fromActor(this._actor);
      if (superNatAbility) {
        this.environment.aura.computeAuraModifierFor(
          CONFIG.ARM5E.realmsExt[this.ability.realm].value
        );
      } else {
        this.environment.aura.computeMaxAuraModifier(this._actor.system.realms);
      }
    }
  }

  getSpellcastingModifiers() {
    this.bonuses += this._actor.system.bonuses.arts.spellcasting;
    // log(false, `Bonus spellcasting: ${this._actor.system.bonuses.arts.spellcasting}`);
    const activeEffects = this._actor.appliedEffects;
    let activeEffectsByType = ArM5eActiveEffect.findAllActiveEffectsWithType(
      activeEffects,
      "spellcasting"
    );
    this.activeEffects.concat(
      activeEffectsByType.map((activeEffect) => {
        const label = CONFIG.ISV10 ? activeEffect.label : activeEffect.name;
        let value = 0;

        activeEffect.changes
          .filter((c, idx) => {
            return (
              c.mode == CONST.ACTIVE_EFFECT_MODES.ADD &&
              activeEffect.getFlag("arm5e", "type")[idx] == "spellcasting"
            );
          })
          .forEach((item) => {
            value += Number(item.value);
          });
        return {
          label,
          value
        };
      })
    );

    // add label + value for stances
    if (this._actor._isMagus()) {
      this.activeEffects.push({
        label: game.i18n.localize(
          ARM5E.magic.mod.voice[this._actor.system.stances.voiceStance].mnemonic
        ),
        value: this._actor.system.stances.voice[this._actor.system.stances.voiceStance]
      });
      this.activeEffects.push({
        label: game.i18n.localize(
          ARM5E.magic.mod.gestures[this._actor.system.stances.gesturesStance].mnemonic
        ),
        value: this._actor.system.stances.gestures[this._actor.system.stances.gesturesStance]
      });
    }
  }
}
