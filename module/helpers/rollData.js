import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "./active-effects.js";
import { ArM5ePCActor } from "../actor/actor-pc.js";
import { log } from "../tools.js";

export class ArM5eRollData {
  constructor(actor) {
    this.reset();
  }

  init(dataset, actor) {
    this.reset();
    const actorSystemData = actor.data.data;
    this.type = dataset.roll;
    this.label = dataset.name;
    if (dataset.divide) {
      this.magic.divide = dataset.divide;
    }
    if (dataset.usefatigue) {
      this.useFatigue = dataset.usefatigue;
    }

    if (dataset.physicalcondition) {
      this.physicalCondition = dataset.physicalcondition;
    }

    switch (this.type) {
      case "combat":
        this.img = actorSystemData.combat.img;
        this.name = actorSystemData.combat.name;
        break;
      case "char":
        this.characteristic = dataset.characteristic;
        break;
      case "ability":
        if (dataset.defaultCharacteristic) {
          this.characteristic = dataset.defaultCharacteristic;
        }

        const ab = actor.items.get(dataset.ability);
        this.img = ab.img;
        this.name = ab.name;
        this.label = this.name;
        this.ability.name = ab.name;
        this.ability.speciality = ab.data.data.speciality;
        this.ability.score = ab.data.data.finalScore;
        break;

      case "power":
        this.label += ` (${ARM5E.magic.arts[dataset.form].short})`;
        this.img = dataset.img;
        this.power.cost = Number(dataset.cost);
        this.power.penetrationPenalty = this.power.cost * 5;
        this.power.form = dataset.form;
        this.initPenetrationVariables(actor);
        break;

      case "magic":
      case "spont":
        this.magic.divide = 2;
      case "spell":
        this.initPenetrationVariables(actor);
        if (dataset.id) {
          let spell = actor.items.get(dataset.id);
          this.label += " (" + spell.data.data.level + ")";
          this.img = spell.img;
          let techData = spell._getTechniqueData(actor.data);
          this.magic.technique = dataset.technique;
          this.magic.techniqueLabel = techData[0];
          this.magic.techniqueScore = techData[1];
          let formData = spell._getFormData(actor.data);
          this.magic.formLabel = formData[0];
          this.magic.formScore = formData[1];
          this.magic.form = dataset.form;
          this.magic.bonus = spell.data.data.bonus;
          this.magic.bonusDesc = spell.data.data.bonusDesc;
          this.magic.focus = spell.data.data.applyFocus;
          this.magic.ritual = spell.data.data.ritual;
          this.magic.level = spell.data.data.level;
          this.penetration.masteryScore = spell.data.data.mastery;
          this.bonuses = this.magic.bonus;
        } else {
          if (dataset.technique) {
            this.magic.technique = dataset.technique;
            this.magic.techniqueLabel = ARM5E.magic.techniques[dataset.technique].label;
            this.magic.techniqueScore = parseInt(
              actorSystemData.arts.techniques[dataset.technique].finalScore
            );
          }

          if (dataset.form) {
            this.magic.form = dataset.form;
            this.magic.formLabel = ARM5E.magic.forms[dataset.form].label;
            this.magic.formScore = parseInt(actorSystemData.arts.forms[dataset.form].finalScore);
          }
        }

        break;
      case "aging":
        this.physicalCondition = false;
        this.environment.year = parseInt(dataset.year);
        this.environment.season = ARM5E.seasons.winter.label;
        this.label =
          game.i18n.localize("arm5e.aging.roll.label") +
          " " +
          this.environment.season +
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
          if (ArM5ePCActor.isMagus(actor.data.type, actorSystemData.charType.value)) {
            livingMod = cov.data.data.modifiersLife.magi ?? 0;
          } else {
            livingMod = cov.data.data.modifiersLife.mundane ?? 0;
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
        this.physicalCondition = false;
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
    }

    if (dataset.bonusActiveEffects) {
      this.activeEffects = this.getSpellcastingModifiers(actor, dataset.bonusActiveEffects);
    }
    this.prepareRollFields(dataset);
    this.cleanBooleans();
  }

  initPenetrationVariables(actor) {
    this.penetration = actor.getAbilityStats("penetration");
    this.penetration.multiplier = 1;
    this.penetration.specApply = false;
    this.penetration.penetrationMastery = false;
    this.penetration.masteryScore = 0;
    this.penetration.multiplierBonusArcanic = 0;
    this.penetration.multiplierBonusSympathic = 0;
    this.penetration.config = ARM5E.magic.penetration;
    this.penetration.total = 0;
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
    return Number(this.generic.option[idx - 1]);
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
    log(false, "Reset roll data");
    this.magic = {
      technique: "",
      techniqueScore: 0,
      techniqueLabel: "",
      form: "",
      formScore: 0,
      formLabel: "",
      bonus: 0,
      bonusDesc: "",
      ritual: false,
      focus: false,
      mastery: 0,
      divide: 1,
      level: 0
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
      masteryScore: 0,
      multiplierBonusArcanic: 0,
      multiplierBonusSympathic: 0,
      total: 0
    };

    this.characteristic = "";

    // the 999 is a trick to force the system to take the "None" option for abilities in case of charac roll
    this.ability = { name: "", score: 999, speciality: "", specApply: false };

    this.combat = { exertion: false, advantage: 0 };

    this.generic = {
      option: [0, 0, 0, 0, 0],
      txtOption: ["", "", "", "", ""],
      operatorOpt: ["+", "+", "+", "+", "+"]
    };

    this.environment = { aura: 0, year: "", season: "", hasAuraBonus: false };
    this.activeEffects = {};

    this.bonuses = 0;

    this.type = "";
    this.label = "";
    this.details = "";
    // roll formula
    this.formula = "";
    // added to chat message as an icon for the roll
    this.img = "";
    // roll window title
    this.name = "";
    // arbitrary bonus
    this.modifier = 0;
    this.useFatigue = false;
    // whether physical condition impact the roll
    this.physicalCondition = true;
    this.secondaryScore = 0;
  }

  getSpellcastingModifiers(actor, bonusActiveEffects) {
    this.bonuses += Number(bonusActiveEffects);
    const activeEffects = actor.effects;
    const activeEffectsByType = ArM5eActiveEffect.findAllActiveEffectsWithType(
      activeEffects,
      "spellcasting"
    );
    return activeEffectsByType.map(activeEffect => {
      const label = activeEffect.data.label;
      let value = 0;
      if (activeEffect.getFlag("arm5e", "value")?.includes("AURA")) {
        this.environment.hasAuraBonus = true;
      }
      activeEffect.data.changes
        .filter((c, idx) => {
          return (
            c.mode == CONST.ACTIVE_EFFECT_MODES.ADD &&
            activeEffect.getFlag("arm5e", "type")[idx] == "spellcasting"
          );
        })
        .forEach(item => {
          value += Number(item.value);
        });
      return {
        label,
        value
      };
    });
  }
}
