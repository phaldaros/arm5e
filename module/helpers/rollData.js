import { data } from "../../external/common/module.mjs";

export class ArM5eRollData {
  constructor(actor) {
    this.reset();
  }

  init(dataset, actor) {
    const actorSystemData = actor.data.data;
    this.type = dataset.roll;
    this.label = dataset.name;
    if (dataset.divide) {
      this.magic.divide = dataset.divide;
    }
    if (dataset.usefatigue) {
      this.useFatigue = dataset.usefatigue;
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
        break;
      case "spell":
      case "magic":
      case "spont":
        if (dataset.id) {
          let spell = actor.items.get(dataset.id);
          this.label += " (" + spell.data.data.level + ")";
          this.img = spell.img;
          let techData = spell._getTechniqueData(actor.data);
          this.magic.technique = dataset.technique;
          this.magic.techniqueLabel = techData[0];
          this.magic.techniqueScore = techData[1];
          let formData = spell._getFormData(actorata);
          this.magic.formLabel = formData[0];
          this.magic.formScore = formData[1];
          this.magic.form = dataset.form;
          this.magic.focus = spell.data.data.applyFocus;
          this.magic.ritual = spell.data.data.ritual;
          this.magic.level = spell.data.data.level;
          this.penetration.masteryScore = this.magic.spell.data.data.mastery;
        } else {
          if (dataset.technique) {
            this.magic.technique = dataset.technique;
          }
          this.magic.techniqueLabel = ARM5E.magic.techniques[dataset.technique].label;
          this.magic.techniqueScore = parseInt(
            actorSystemData.arts.techniques[dataset.technique].finalScore
          );
          if (dataset.form) {
            this.magic.form = dataset.form;
          }
          this.magic.formLabel = ARM5E.magic.forms[dataset.form].label;
          this.magic.formScore = parseInt(actorSystemData.arts.forms[dataset.form].finalScore);
        }
        break;
      case "aging":
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
        this.setGenericField(game.i18n.localize("arm5e.sheet.modifiersLife"), livingMod, 2);

        this.setGenericField(
          game.i18n.localize("arm5e.sheet.longevityModifier"),
          actorSystemData.laboratory.longevityRitual.modifier +
            actorSystemData.bonuses.traits.aging,
          3
        );
        if (actorSystemData.familiar && actorSystemData.familiar.cordFam.bronze > 0) {
          this.setGenericField(
            game.i18n.localize("arm5e.aging.roll.bronze"),
            actorSystemData.familiar.cordFam.bronze,
            4
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
    }

    if (dataset.bonusActiveEffects) {
      this.activeEffects = this.getSpellcastingModifiers(actor, bonusActiveEffects);
    }
  }

  setGenericField(name, value, idx) {
    this.generic.txtOption[idx - 1] = name;
    this.generic.option[idx - 1] = value;
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

  reset() {
    this.magic = {
      technique: "",
      techniqueScore: 0,
      techniqueLabel: "",
      form: "",
      formScore: 0,
      formLabel: "",
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

    this.ability = { name: "", score: "", speciality: "", specApply: false };

    this.combat = { exertion: false, advantage: 0 };

    this.generic = {
      option: [0, 0, 0, 0, 0],
      txtOption: ["", "", "", "", ""]
    };

    this.environment = { aura: 0, year: "", season: "", hasAuraBonus: false };
    this.activeEffects = {};

    this.bonusActiveEffects = 0;

    this.type = "";
    this.label = "";
    // roll formula
    this.formula = "";
    // added to chat message as an icon for the roll
    this.img = "";
    // roll window title
    this.name = "";
    // arbitrary bonus
    this.modifier = 0;
    this.useFatigue = false;
    this.secondaryScore = 0;
  }

  getSpellcastingModifiers(actor, bonusActiveEffects) {
    this.bonusActiveEffects = Number(bonusActiveEffects);
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
