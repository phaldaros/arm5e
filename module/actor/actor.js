import { ARM5E } from "../config.js";
import {
  compareBaseEffects,
  compareSpells,
  compareMagicalEffects,
  compareLabTexts,
  log,
  error,
  compareTopics,
  integerToRomanNumeral
} from "../tools.js";

import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";

import { migrateActorData } from "../migration.js";

import ArM5eActiveEffect from "../helpers/active-effects.js";
import { ArM5eRollData } from "../helpers/rollData.js";
import { compareDiaryEntries, isInThePast } from "../tools/time.js";
import Aura from "../helpers/aura.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5ePCActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic system.
   **/

  constructor(data, context) {
    super(data, context);
    this.rollData = new ArM5eRollData(this);
    Hooks.on("arm5e-date-change", async (date) => {
      if (this._hasDate()) {
        this.sheet.render();
      }
    });
  }

  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    if (!this.flags.arm5e) {
      this.flags.arm5e = { filters: {} };
    }
    // add properties used for active effects:

    if (this.type == "laboratory") {
      this.system.size.bonus = 0;
      this.system.generalQuality.bonus = 0;
      this.system.safety.bonus = 0;
      this.system.health.bonus = 0;
      this.system.refinement.bonus = 0;
      this.system.upkeep.bonus = 0;
      this.system.warping.bonus = 0;
      this.system.aesthetics.bonus = 0;
      this.system.aesthetics.max = 999;

      // create data keys for lab specialty
      this.system.specialty = {};
      for (let key of Object.keys(CONFIG.ARM5E.magic.arts)) {
        this.system.specialty[key] = { bonus: 0 };
      }

      this.system.specialty["experimentation"] = { bonus: 0 };
      this.system.specialty["familiar"] = { bonus: 0 };
      this.system.specialty["items"] = { bonus: 0 };
      this.system.specialty["longevityRituals"] = { bonus: 0 };
      this.system.specialty["spells"] = { bonus: 0 };
      this.system.specialty["texts"] = { bonus: 0 };
      this.system.specialty["visExtraction"] = { bonus: 0 };

      // Hopefully this can be reworked to use ID instead of name
      this.system.covenant.document = game.actors.getName(this.system.covenant.value);
      this.system.aura = new Aura(this.system.covenant.document?.system?.scene?.document);

      return;
    }
    if (this.type == "laboratory") {
      this.system.aura = {
        value: 0,
        realm: ARM5E.REALM_TYPES.MUNDANE
      };
    }

    // NOT LAB or COVENANT from here

    if (this.type != "player" && this.type != "npc" && this.type != "beast") {
      return;
    }
    const datetime = (context.datetime = game.settings.get("arm5e", "currentDate"));
    this.system.age.value = this.system.description?.born?.value
      ? Number(datetime.year) - this.system.description.born.value
      : 20;

    this.system.wounds = {
      healthy: [],
      light: [],
      medium: [],
      heavy: [],
      incap: [],
      dead: []
    };

    this.system.combat = {
      load: 0,
      overload: 0,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0
    };

    this.system.bonuses = {};

    if (this._isMagus()) {
      // hack, if the active effect for magus is not setup
      this.system.realms.magic.aligned = true;

      for (let key of Object.keys(this.system.arts.techniques)) {
        this.system.arts.techniques[key].bonus = 0;
        this.system.arts.techniques[key].xpCoeff = 1.0;
        this.system.arts.techniques[key].deficient = false;
      }

      for (let key of Object.keys(this.system.arts.forms)) {
        this.system.arts.forms[key].bonus = 0;
        this.system.arts.forms[key].xpCoeff = 1.0;
        this.system.arts.forms[key].deficient = false;
      }

      this.system.stances.gestures = foundry.utils.deepClone(CONFIG.ARM5E.magic.stances.gestures);
      this.system.stances.voice = foundry.utils.deepClone(CONFIG.ARM5E.magic.stances.voice);
    }

    this.system.bonuses.labActivities = {
      learnSpell: 0,
      inventSpell: 0
    };

    this.system.bonuses.arts = {
      spellcasting: 0,
      laboratory: 0,
      magicResistance: null,
      spontDivider: 2,
      spontDividerNoFatigue: 5,
      masteryXpCoeff: 1.0,
      masteryXpMod: 0
    };

    this.system.bonuses.skills = {};
    for (const [key, item] of this.items.entries()) {
      if (item.type == "ability") {
        let abilityKey = item.system?.key || "";
        if (abilityKey != "") {
          // log(false, `Ability key: ${abilityKey}`);
          if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey]?.option || false) {
            abilityKey += "_" + item.system.option;
          }
          this.system.bonuses.skills[abilityKey] = {};
          this.system.bonuses.skills[abilityKey].bonus = 0;
          this.system.bonuses.skills[abilityKey].xpMod = 0;
          this.system.bonuses.skills[abilityKey].xpCoeff = 1.0;
        }
      }
    }
    this.system.penalties = {
      activityDivider: 1,
      activityBlocker: false,
      wounds: {
        light: CONFIG.ARM5E.recovery.wounds.light.penalty,
        medium: CONFIG.ARM5E.recovery.wounds.medium.penalty,
        heavy: CONFIG.ARM5E.recovery.wounds.heavy.penalty,
        incap: CONFIG.ARM5E.recovery.wounds.incap.penalty,
        dead: 0
      }
    };

    this.system.bonuses.traits = {
      soak: 0,
      aging: 0,
      wounds: 0,
      fatigue: 0,
      agingStart: 0,
      recovery: 0
    };

    this.system.bonuses.activities = {
      practice: 0,
      training: 0,
      teaching: 0,
      teacher: 0,
      reading: 0,
      writing: 0,
      adventuring: 0,
      visStudy: 0
    };
    this.system.bonuses.resistance = {
      an: 0,
      aq: 0,
      au: 0,
      co: 0,
      he: 0,
      ig: 0,
      im: 0,
      me: 0,
      te: 0,
      vi: 0
    };
  }

  /** @override */
  prepareDerivedData() {
    if (this.type == "magicCodex") {
      return this._prepareMagicCodexData();
    } else if (this.type == "covenant") {
      return this._prepareCovenantData();
    } else if (this.type == "laboratory") {
      return this._prepareLabData();
    } else if (this.type == "crucible") {
      return this._prepareCrucibleData();
    } else if (this.type == "base") {
      return {};
    } else {
      return this._prepareCharacterData();
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData() {
    const system = this.system;
    log(false, `Preparing Actor ${this.name} data`);
    // Initialize containers.
    let weapons = [];
    let armor = [];
    let spells = [];
    let magicalEffects = [];
    let vis = [];
    let items = [];
    let magicItems = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let laboratoryTexts = [];
    let virtues = [];
    let flaws = [];
    let abilities = [];
    let abilitiesSelect = {};
    let diaryEntries = [];
    let abilitiesFamiliar = [];
    let powersFamiliar = [];
    let pendingXps = 0;

    let soak = system.characteristics.sta.value + system.bonuses.traits.soak;

    let powers = [];

    let reputations = [];
    system.personalities = [];

    let totalXPAbilities = 0;
    let totalXPArts = 0;
    let totalVirtues = 0;
    let totalFlaws = 0;
    let totalXPSpells = 0;

    let combat = {
      load: 0,
      overload: 0,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0
    };

    system.characTotal = 0;
    for (let c of Object.values(system.characteristics)) {
      if (c.value > 0) {
        system.characTotal += (c.value * (c.value + 1)) / 2;
      } else {
        system.characTotal -= (Math.abs(c.value) * (Math.abs(c.value) + 1)) / 2;
      }
    }

    // fatigue management
    if (system.fatigue) {
      system.fatigueTotal = 0;
      let lvl = 0;
      for (let [key, item] of Object.entries(system.fatigue)) {
        let fatigueArray = [];

        for (let ii = 0; ii < item.amount; ii++) {
          if (lvl < system.fatigueCurrent) {
            fatigueArray.push(true);
            system.fatigueTotal = item.number > 0 ? 0 : item.number;
          } else {
            fatigueArray.push(false);
          }
          lvl++;
        }
        item.levels = fatigueArray;
      }
      system.fatigueTotal =
        system.fatigueTotal + system.bonuses.traits.fatigue > 0
          ? 0
          : system.fatigueTotal + system.bonuses.traits.fatigue;
      system.fatigueMaxLevel = lvl;
    }

    // Resources
    system.resource = {};
    // Fatigue as resource (test)

    system.resource.fatigue = {
      value: system.fatigueMaxLevel - system.fatigueCurrent,
      max: system.fatigueMaxLevel
    };

    // Might as ressource
    if (this._hasMight()) {
      system.resource.might = {
        value: system.might.points,
        max: system.might.value
      };
    }

    //abilities
    const temp = {
      _id: "",
      name: "N/A",
      value: 0
    };
    abilitiesSelect["a0"] = temp;
    for (const [key, item] of this.items.entries()) {
      if (item.type === "ability") {
        let computedKey = item.system.key;
        if (item.system.option != "") {
          computedKey += "_" + item.system.option;
        }
        item.system.xpCoeff = this._getAbilityXpCoeff(item.system.key, item.system.option);
        item.system.xpBonus = this._getAbilityXpBonus(item.system.key, item.system.option);
        item.system.derivedScore = ArM5ePCActor.getAbilityScoreFromXp(
          Math.round((item.system.xp + item.system.xpBonus) * item.system.xpCoeff)
        );
        item.system.xpNextLevel = Math.round(
          5 * item.system.derivedScore + 5 / item.system.xpCoeff
        );
        item.system.remainingXp =
          item.system.xp -
          Math.round(
            ArM5ePCActor.getAbilityXp(item.system.derivedScore / item.system.xpCoeff) -
              item.system.xpBonus
          );

        if (
          system.bonuses.skills[computedKey] != undefined &&
          system.bonuses.skills[computedKey].bonus != 0
        ) {
          item.system.finalScore =
            item.system.derivedScore + parseInt(system.bonuses.skills[computedKey].bonus);
        } else {
          item.system.finalScore = item.system.derivedScore;
        }

        abilities.push(item);

        const temp = {
          id: item._id,
          name: item.name,
          value: item.system.finalScore
        };
        //abilitiesSelect.push(temp);
        abilitiesSelect["a" + key] = temp;

        totalXPAbilities = parseInt(totalXPAbilities) + item.system.xp;

        if (this._isMagus() && system.laboratory && system.laboratory.abilitiesSelected) {
          if (item.system.key != "") {
            if (item.system.key == "finesse") {
              system.laboratory.abilitiesSelected.finesse.value = item.system.finalScore;
            } else if (item.system.key == "awareness") {
              system.laboratory.abilitiesSelected.awareness.value = item.system.finalScore;
            } else if (item.system.key == "concentration") {
              system.laboratory.abilitiesSelected.concentration.value = item.system.finalScore;
            } else if (item.system.key == "artesLib") {
              system.laboratory.abilitiesSelected.artesLib.value = item.system.finalScore;
            } else if (item.system.key == "magicTheory") {
              system.laboratory.abilitiesSelected.magicTheory.value = item.system.finalScore;
            } else if (item.system.key == "parma") {
              system.laboratory.abilitiesSelected.parma.value = item.system.finalScore;
            } else if (item.system.key == "philosophy") {
              system.laboratory.abilitiesSelected.philosophy.value = item.system.finalScore;
            } else if (item.system.key == "penetration") {
              system.laboratory.abilitiesSelected.penetration.value = item.system.finalScore;
            }
          } else {
            // legacy code, to be removed in the future
            if (item._id == system.laboratory.abilitiesSelected.finesse.abilityID) {
              system.laboratory.abilitiesSelected.finesse.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.awareness.abilityID) {
              system.laboratory.abilitiesSelected.awareness.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.concentration.abilityID) {
              system.laboratory.abilitiesSelected.concentration.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.artesLib.abilityID) {
              system.laboratory.abilitiesSelected.artesLib.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.philosophy.abilityID) {
              system.laboratory.abilitiesSelected.philosophy.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.parma.abilityID) {
              system.laboratory.abilitiesSelected.parma.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected.magicTheory.abilityID) {
              system.laboratory.abilitiesSelected.magicTheory.value = item.system.finalScore;
            } else if (item._id == system.laboratory.abilitiesSelected?.penetration?.abilityID) {
              system.laboratory.abilitiesSelected.penetration.value = item.system.finalScore;
            }
          }
        }
      } else if (item.type == "spell") {
        item.system.xpCoeff = this.system.bonuses.arts.masteryXpCoeff;
        item.system.xpBonus = this.system.bonuses.arts.masteryXpMod;
        item.system.derivedScore = ArM5ePCActor.getAbilityScoreFromXp(
          Math.round((item.system.xp + item.system.xpBonus) * item.system.xpCoeff)
        );
        item.system.xpNextLevel = Math.round(
          5 * item.system.derivedScore + 5 / item.system.xpCoeff
        );
        item.system.remainingXp =
          item.system.xp -
          Math.round(
            ArM5ePCActor.getAbilityXp(item.system.derivedScore / item.system.xpCoeff) -
              item.system.xpBonus
          );

        item.system.finalScore = item.system.derivedScore;
      }
    }

    if (system.abilities) {
      system.abilities = abilities.sort(function (e1, e2) {
        return e1.name.localeCompare(e2.name);
      });
    }

    if (this._isMagus()) {
      soak += this.system?.familiar?.cordFam?.bronze ?? 0;

      /*
            "fastCastingSpeed":{"value": 0, "calc": "Qik + Finesse + stress die" },
            "determiningEffect":{"value": 0, "calc": "Per + Awareness + die VS 15-magnitude" },
            "targeting":{"value": 0, "calc": "Per + Finesse + die" },
            "concentration":{"value": 0, "calc": "Sta + Concentration + die" },
            "magicResistance":{"value": 0, "calc": "Parma * 5 + Form" },
            "multipleCasting":{"value": 0, "calc": "Int + Finesse + stress die - no of spells VS 9" },
            "basicLabTotal":{"value": 0, "calc": "Int + Magic theory + Aura (+ Technique + Form)" },
            "visLimit":{"value": 0, "calc": "Magic theory * 2" }
            */

      // compute the spellcasting bonus:
      this.system.bonuses.arts.spellcasting +=
        (this.system.stances.voice[system.stances.voiceStance] || 0) +
        (this.system.stances.gestures[system.stances.gesturesStance] || 0);
      // log(false, `Bonus spellcasting: ${this.system.bonuses.arts.spellcasting}`);
      if (system.laboratory === undefined) {
        system.laboratory = {};
      }
      // calculate magic totals
      system.laboratory.fastCastingSpeed.value =
        system.characteristics.qik.value + system.laboratory.abilitiesSelected.finesse.value;
      system.laboratory.determiningEffect.value =
        system.characteristics.per.value + system.laboratory.abilitiesSelected.awareness.value;
      system.laboratory.targeting.value =
        system.characteristics.per.value + system.laboratory.abilitiesSelected.finesse.value;
      system.laboratory.concentration.value =
        system.characteristics.sta.value + system.laboratory.abilitiesSelected.concentration.value;
      system.laboratory.magicResistance.value = system.laboratory.abilitiesSelected.parma.value * 5;
      system.laboratory.multipleCasting.value =
        system.characteristics.int.value + system.laboratory.abilitiesSelected.finesse.value;
      system.laboratory.basicLabTotal.value =
        system.characteristics.int.value + system.laboratory.abilitiesSelected.magicTheory.value; // aura pending

      if (system.apprentice) {
        if (system.apprentice.magicTheory > 0) {
          system.laboratory.basicLabTotal.value +=
            system.apprentice.magicTheory + system.apprentice.int;
        }
      }
      system.laboratory.visLimit.value = system.laboratory.abilitiesSelected.magicTheory.value * 2;
      if (system.laboratory.totalPenetration) {
        system.laboratory.totalPenetration.value =
          system.laboratory.abilitiesSelected?.penetration?.value || 0;
      }

      for (let [key, technique] of Object.entries(system.arts.techniques)) {
        technique.derivedScore = ArM5ePCActor.getArtScore(
          Math.round(technique.xp * technique.xpCoeff)
        );
        technique.finalScore = technique.derivedScore + technique.bonus;
        // start from scratch to avoid rounding errors
        technique.xpNextLevel = Math.round(
          ArM5ePCActor.getArtXp(technique.derivedScore + 1) / technique.xpCoeff
        );

        // Calculate the next level experience needed
        totalXPArts = parseInt(totalXPArts) + technique.xp;
      }

      const parmaStats = this.getAbilityStats("parma");
      for (let [key, form] of Object.entries(system.arts.forms)) {
        form.derivedScore = ArM5ePCActor.getArtScore(Math.round(form.xp * form.xpCoeff));
        form.finalScore = form.derivedScore + form.bonus;

        form.xpNextLevel = Math.round(ArM5ePCActor.getArtXp(form.derivedScore + 1) / form.xpCoeff);

        form.magicResistance = parmaStats.score * 5 + form.finalScore;
        if (parmaStats.speciality.toUpperCase() === form.label.toUpperCase()) {
          form.magicResistance += 5;
        }

        totalXPArts = parseInt(totalXPArts) + form.xp;
      }
    }

    for (let [key, item] of this.items.entries()) {
      item.img = item.img || DEFAULT_TOKEN;
      item._index = key;

      if (item.type === "weapon" || item.type === "enchantedWeapon") {
        if (item.system.equipped == true) {
          combat.load = parseInt(combat.load) + parseInt(item.system.load);
          combat.init = parseInt(combat.init) + parseInt(item.system.init);
          combat.atk = parseInt(combat.atk) + parseInt(item.system.atk);
          combat.dfn = parseInt(combat.dfn) + parseInt(item.system.dfn);
          combat.dam = parseInt(combat.dam) + parseInt(item.system.dam);
          combat.img = item.img;
          combat.name = item.name;
          combat.itemId = item.id;

          if (item.system.ability == "") {
            if (item.system.weaponExpert) {
              combat.ability = parseInt(combat.ability) + 1;
            }
          } else {
            for (var a = 0; a < abilities.length; a++) {
              if (abilities[a]._id == item.system.ability) {
                let hab = abilities[a].system.finalScore;
                if (item.system.weaponExpert) {
                  hab = parseInt(hab) + 1;
                }
                if (item.system.horse) {
                  if (hab > 3) {
                    hab = 3;
                  }
                }
                combat.ability = parseInt(combat.ability) + parseInt(hab);
              }
            }
          }
        }

        item.system.abilities = abilitiesSelect;
        weapons.push(item);
      } else if (item.type === "armor" || item.type === "enchantedArmor") {
        if (item.system.equipped == true) {
          combat.load = parseInt(combat.load) + parseInt(item.system.load);
          combat.prot = parseInt(combat.prot) + parseInt(item.system.prot);
        }
        armor.push(item);
      } else if (item.type === "spell") {
        item.system.castingTotal = item._computeCastingTotal(this, { char: "sta" });
        spells.push(item);
        totalXPSpells = parseInt(totalXPSpells) + parseInt(item.system.level);
      } else if (item.type === "magicalEffect") {
        item.system.castingTotal = item._computeCastingTotal(this, { char: "sta" });
        magicalEffects.push(item);
      } else if (item.type === "vis") {
        vis.push(item);
      } else if (item.type === "item" || item.type == "enchantedItem") {
        items.push(item);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.id = item.id;
          topic.img = item.img;
          topic.index = idx++;
          topic.book = `${item.name} (${integerToRomanNumeral(idx)})`;
          switch (topic.category) {
            case "ability":
              mundaneTopics.push(topic);
              break;
            case "art":
              artsTopics.push(topic);
              break;
            case "mastery":
              masteryTopics.push(topic);
              break;
            case "labText":
              topic.system = topic.labtext;
              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, "Unknown topic category" + topic.category);
          }
        }
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };

        laboratoryTexts.push(topic);
      } else if (item.type === "virtue") {
        virtues.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalVirtues =
            parseInt(totalVirtues) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "flaw") {
        flaws.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalFlaws =
            parseInt(totalFlaws) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "diaryEntry") {
        if (!item.system.done) {
          pendingXps +=
            item.system.sourceQuality +
            item.system.progress.abilities.reduce((previous, current, i) => {
              return previous + current.xp;
            }, 0) +
            item.system.progress.arts.reduce((previous, current, i) => {
              return previous + current.xp;
            }, 0);
          item.system.progress.spells.reduce((previous, current, i) => {
            return previous + current.xp;
          }, 0);
          item.system.progress.newSpells.reduce((previous, current, i) => {
            return previous + current.xp;
          }, 0);
        }
        diaryEntries.push(item);
      } else if (item.type === "abilityFamiliar") {
        abilitiesFamiliar.push(item);
      } else if (item.type === "mightFamiliar" || item.type === "powerFamiliar") {
        powersFamiliar.push(item);
      } else if (item.type === "might" || item.type === "power") {
        powers.push(item);
      } else if (item.type === "magicItem") {
        magicItems.push(item);
      } else if (item.type === "personalityTrait") {
        system.personalities.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "wound") {
        system.wounds[item.system.gravity].push(item);
      }
    }

    items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    weapons.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    armor.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    magicItems.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    powers.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.personalities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    reputations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    vis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    // combat

    combat.overload = ArM5ePCActor.getArtScore(combat.load);

    if (combat.prot) {
      soak += combat.prot;
    }

    if (system.characteristics) {
      if (system.characteristics.str.value > 0) {
        combat.overload = parseInt(combat.overload) - parseInt(system.characteristics.str.value);
      }
      if (combat.overload < 0) {
        combat.overload = 0;
      }
    }

    if (this._isGrog()) {
      system.con.score = 0;
      system.con.points = 0;
    }
    //warping & decrepitude
    if ((this.type == "npc" && this.system.charType.value != "entity") || this.type == "player") {
      system.warping.finalScore = ArM5ePCActor.getAbilityScoreFromXp(system.warping.points);
      system.warping.experienceNextLevel =
        ((parseInt(system.warping.finalScore) + 1) *
          (parseInt(system.warping.finalScore) + 2) *
          5) /
          2 -
        system.warping.points;

      if (system.decrepitude == undefined) {
        system.decrepitude = { points: 0 };
      }
      system.decrepitude.finalScore = ArM5ePCActor.getAbilityScoreFromXp(system.decrepitude.points);
      system.decrepitude.experienceNextLevel =
        ((parseInt(system.decrepitude.finalScore) + 1) *
          (parseInt(system.decrepitude.finalScore) + 2) *
          5) /
          2 -
        system.decrepitude.points;
    }
    system.penalties.wounds.total = this.getWoundPenalty();
    // Assign and return
    system.totalXPAbilities = totalXPAbilities;
    system.totalXPArts = totalXPArts;
    system.totalVirtues = totalVirtues;
    system.totalFlaws = totalFlaws;
    system.totalXPSpells = totalXPSpells;
    system.pendingXps = pendingXps;

    if (system.weapons) {
      system.weapons = weapons;
      // TODO: check why putting in there?
      system.combat = combat;
    }
    if (system.armor) {
      system.armor = armor;
    }
    if (system.spells) {
      // system.spells = spells;
      system.spells = spells.sort(compareSpells);
    }
    if (system.magicalEffects) {
      system.magicalEffects = magicalEffects.sort(compareMagicalEffects);
    }

    if (system.vitals.soa) {
      system.vitals.soa.value = soak;
    }

    if (system.vis) {
      system.vis = vis;
    }
    if (system.items) {
      system.items = items;
    }
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    system.laboratoryTexts = laboratoryTexts.sort(compareTopics);

    if (system.virtues) {
      system.virtues = virtues;
    }
    if (system.flaws) {
      system.flaws = flaws;
    }

    if (system.diaryEntries) {
      system.diaryEntries = diaryEntries.sort(compareDiaryEntries);
    }
    if (system.familiar) {
      system.familiar.abilitiesFam = abilitiesFamiliar;
      system.familiar.powersFam = powersFamiliar;
    }

    if (system.powers) {
      system.powers = powers;
    }

    system.reputations = reputations;

    system.magicItems = magicItems;

    // links with other actors

    if (this.type === "player" || this.type === "npc") {
      if (system.covenant?.value) {
        let covenants = game.actors
          .filter((a) => a.type == "covenant")
          .map(({ name, id }) => ({
            name,
            id
          }));
        let cov = covenants.filter((c) => c.name == system.covenant.value);
        if (cov.length > 0) {
          system.covenant.linked = true;
          system.covenant.actorId = cov[0].id;
        } else {
          system.covenant.linked = false;
        }
      } else {
        system.covenant.linked = false;
      }
    }

    if (system?.charType?.value == "magusNPC" || system?.charType?.value == "magus") {
      // check whether the character is linked to an existing lab
      if (system.sanctum?.value) {
        let labs = game.actors
          .filter((a) => a.type == "laboratory")
          .map(({ name, id }) => ({
            name,
            id
          }));

        let lab = labs.filter((c) => c.name == system.sanctum.value);
        if (lab.length > 0) {
          system.sanctum.linked = true;
          system.sanctum.actorId = lab[0].id;
        } else {
          system.sanctum.linked = false;
        }
      } else {
        system.sanctum.linked = false;
      }
    }
    log(false, "pc end of prepare actor data");
    log(false, system);
  }

  _prepareMagicCodexData() {
    this.img = CONFIG.ARM5E_DEFAULT_ICONS["magicCodex"];
    const system = this.system;
    let baseEffects = [];
    let magicEffects = [];
    let spells = [];
    let enchantments = [];
    for (let [key, item] of this.items.entries()) {
      if (item.type == "baseEffect") {
        baseEffects.push(item);
      }
      if (item.type == "magicalEffect") {
        magicEffects.push(item);
      }
      if (item.type == "spell") {
        spells.push(item);
      }
      if (item.type == "enchantment") {
        enchantments.push(item);
      }
    }
    system.baseEffects = baseEffects.sort(compareBaseEffects);
    system.magicEffects = magicEffects.sort(compareMagicalEffects);
    system.enchantments = enchantments.sort(compareMagicalEffects);
    system.spells = spells.sort(compareSpells);
  }

  getRollData() {
    let rollData = super.getRollData();
    rollData.config = {
      character: {},
      magic: {}
    };
    rollData.config.character.magicAbilities = CONFIG.ARM5E.character.magicAbilities;
    rollData.config.magic.arts = ARM5E.magic.arts;
    rollData.config.magic.penetration = ARM5E.magic.penetration;
    return rollData;
  }

  _prepareLabData() {
    const system = this.system;
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let laboratoryTexts = [];
    let totalVirtues = 0;
    let totalFlaws = 0;
    // TODO TMP
    system.specialities_old = [];
    system.personalities_old = [];
    system.distinctive = [];
    system.rooms_old = [];
    // TODO END

    system.rawVis = [];
    system.items = [];
    system.virtues = [];
    system.flaws = [];
    system.diaryEntries = [];
    system.magicItems = [];
    system.laboratoryTexts = [];

    for (let [key, item] of this.items.entries()) {
      // TODO TMP
      if (item.type === "speciality") {
        system.specialities_old.push(item);
      } else if (item.type === "distinctive") {
        system.distinctive.push(item);
      } else if (item.type === "sanctumRoom") {
        system.rooms_old.push(item);
      } else if (item.type === "personality") {
        system.personalities_old.push(item);
        // TODO END
      } else if (item.type === "magicItem") {
        system.magicItems.push(item);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.id = item.id;
          topic.img = item.img;
          topic.index = idx++;
          topic.book = item.name;
          switch (topic.category) {
            case "ability":
              mundaneTopics.push(topic);
              break;
            case "art":
              artsTopics.push(topic);
              break;
            case "mastery":
              masteryTopics.push(topic);
              break;
            case "labText":
              topic.system = topic.labtext;
              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, "Unknown topic category" + topic.category);
          }
        }
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };

        laboratoryTexts.push(topic);
      } else if (item.type === "vis") {
        system.rawVis.push(item);
      } else if (item.type === "item") {
        system.items.push(item);
      } else if (item.type === "virtue") {
        system.virtues.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalVirtues = totalVirtues + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "flaw") {
        system.flaws.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalFlaws =
            parseInt(totalFlaws) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "diaryEntry") {
        system.diaryEntries.push(item);
      }
    }
    system.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.rawVis.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    system.laboratoryTexts = laboratoryTexts.sort(compareTopics);

    system.size.total = system.size.value + system.size.bonus;
    system.generalQuality.total = system.generalQuality.value + system.generalQuality.bonus;
    system.safety.total = system.safety.value + system.safety.bonus;
    system.health.total = system.health.value + system.health.bonus;
    system.refinement.total = system.refinement.value + system.refinement.bonus;
    system.upkeep.total = system.upkeep.value + system.upkeep.bonus;
    system.warping.total = system.warping.value + system.warping.bonus;
    system.aesthetics.total = Math.min(
      system.aesthetics.value + system.aesthetics.bonus,
      system.aesthetics.max
    );

    let freeVirtues = system.size.total + system.refinement.total;
    let occupiedSize = Math.max(totalVirtues - totalFlaws, 0) - system.refinement.total;
    let baseSafety = system.refinement.total - Math.max(occupiedSize, 0);

    system.baseSafety = baseSafety;
    system.occupiedSize = occupiedSize;
    system.freeVirtues = freeVirtues;

    system.totalVirtues = totalVirtues;
    system.totalFlaws = totalFlaws;

    var baseSafetyEffect = this.effects.find((e) => e.getFlag("arm5e", "baseSafetyEffect"));
    if (baseSafetyEffect != null && baseSafetyEffect.changes[0].value != String(baseSafety)) {
      let changes = duplicate(baseSafetyEffect.changes);
      changes[0].value = String(baseSafety);
      baseSafetyEffect.update({ changes });
    }

    if (system.covenant?.value) {
      let covenants = game.actors
        .filter((a) => a.type == "covenant")
        .map(({ name, id }) => ({
          name,
          id
        }));

      let cov = covenants.filter((c) => c.name == system.covenant.value);
      if (cov.length > 0) {
        system.covenant.linked = true;
        system.covenant.actorId = cov[0].id;
      } else {
        system.covenant.linked = false;
      }
    } else {
      system.covenant.linked = false;
    }

    // check whether the character is linked to an existing lab
    if (system.owner?.value) {
      let characters = game.actors
        .filter((a) => a.type == "player" || a.type == "npc")
        .map(({ name, id }) => ({
          name,
          id
        }));
      let char = characters.filter((c) => c.name == system.owner.value);
      if (char.length > 0) {
        system.owner.linked = true;
        system.owner.actorId = char[0].id;
      } else {
        system.owner.linked = false;
      }
    } else {
      system.owner.linked = false;
    }
  }

  _prepareCovenantData() {
    const system = this.system;
    let reputations = [];
    let magi = [];
    let companion = [];
    let specialists = [];
    let habitants = [];
    let horses = [];
    let livestock = [];
    let possessions = [];
    let weapons = [];
    let armor = [];
    let visSources = [];
    let vis = [];
    let calendar = [];
    let incomingSources = [];
    let laboratoryTexts = [];
    let artsTopics = [];
    let mundaneTopics = [];
    let masteryTopics = [];
    let magicItems = [];
    let items = [];
    let boons = [];
    let hooks = [];
    let labs = [];
    let diaryEntries = [];
    let totalVirtues = 0;
    let totalFlaws = 0;
    system.scene.document = game.scenes.get(system.scene.id);

    for (let [key, item] of this.items.entries()) {
      item.img = item.img || DEFAULT_TOKEN;
      item._index = key;
      if (item.type === "virtue") {
        boons.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalVirtues =
            parseInt(totalVirtues) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "flaw") {
        hooks.push(item);
        if (ARM5E.impacts[item.system.impact.value]) {
          totalFlaws =
            parseInt(totalFlaws) + parseInt(ARM5E.impacts[item.system.impact.value].cost);
        }
      } else if (item.type === "diaryEntry") {
        diaryEntries.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "inhabitant") {
        switch (item.system.category) {
          case "magi":
            magi.push(item);
            break;
          case "companions":
            companion.push(item);
            break;
          case "specialists":
          case "craftmen":
            specialists.push(item);
            break;
          case "grogs":
          case "servants":
          case "laborers":
          case "teamster":
            habitants.push(item);
            break;
          case "horses":
            horses.push(item);
            break;
          case "livestock":
            livestock.push(item);
            break;
        }
      } else if (item.type === "possessionsCovenant") {
        possessions.push(item);
      } else if (item.type === "visSourcesCovenant") {
        visSources.push(item);
      } else if (item.type === "visStockCovenant" || item.type === "vis") {
        vis.push(item);
      } else if (item.type === "calendarCovenant") {
        calendar.push(item);
      } else if (item.type === "incomingSource") {
        incomingSources.push(item);
      } else if (item.type === "laboratoryText") {
        let topic = {
          id: item.id,
          img: item.img,
          index: 0,
          book: "",
          category: "labText",
          name: item.name,
          system: item.system
        };

        laboratoryTexts.push(topic);
      } else if (item.type === "book") {
        let idx = 0;
        for (let topic of item.system.topics) {
          topic.img = item.img;
          topic.id = item.id;
          topic.index = idx++;
          topic.book = item.name;
          switch (topic.category) {
            case "ability":
              mundaneTopics.push(topic);
              break;
            case "art":
              artsTopics.push(topic);
              break;
            case "mastery":
              masteryTopics.push(topic);
              break;
            case "labText":
              if (topic.labtext == null) {
                topic.system = { type: "" };
              } else {
                topic.system = topic.labtext;
              }

              if (topic.labtext != null) {
                topic.name = `${topic.book}: ${topic.labtextTitle}`;
              }
              laboratoryTexts.push(topic);
              break;
            default:
              error(false, "Unknown topic category" + topic.category);
          }
        }
      } else if (item.type === "magicItem") {
        magicItems.push(item);
      } else if (item.type === "reputation") {
        reputations.push(item);
      } else if (item.type === "weapon" || item.type === "enchantedWeapon") {
        weapons.push(item);
      } else if (item.type === "armor" || item.type === "enchantedArmor") {
        armor.push(item);
      } else if (item.type === "item") {
        items.push(item);
      } else if (item.type === "labCovenant") labs.push(item);
    }
    if (system.reputations) {
      system.reputations = reputations;
    }
    if (system.habitants) {
      system.habitants.magi = magi;
      system.habitants.companion = companion;
      system.habitants.specialists = specialists;
      system.habitants.habitants = habitants;
      system.habitants.horses = horses;
      system.habitants.livestock = livestock;
    }
    if (system.possessions) {
      system.possessions = possessions;
    }
    if (system.visSources) {
      system.visSources = visSources;
    }
    system.vis = vis;

    if (system.calendar) {
      system.calendar = calendar;
    }
    if (system.incomingSources) {
      system.incomingSources = incomingSources;
    }
    system.artsTopics = artsTopics.sort(compareTopics);
    system.mundaneTopics = mundaneTopics.sort(compareTopics);
    system.masteryTopics = masteryTopics.sort(compareTopics);
    // system.laboratoryTexts = laboratoryTexts.sort(compareTopics);
    if (system.magicItems) {
      system.magicItems = magicItems;
    }
    if (system.diaryEntries) {
      system.diaryEntries = diaryEntries;
    }

    if (system.virtues) {
      system.virtues = boons;
    }
    if (system.flaws) {
      system.flaws = hooks;
    }

    if (system.items) {
      system.items = items;
    }

    system.weapons = weapons;
    system.armor = armor;

    if (system.laboratoryTexts) {
      let flag = this.getFlag("arm5e", "sorting", "laboratoryTexts");
      if (flag && flag["laboratoryTexts"] == true) {
        system.laboratoryTexts = laboratoryTexts.sort(compareLabTexts);
      } else {
        system.laboratoryTexts = laboratoryTexts;
      }
    }

    if (system.labs) {
      system.labs = labs;
    }

    system.labs.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.virtues.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.visStock.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.visSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.possessions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.incomingSources.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.reputations.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    system.items.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }

  _prepareCrucibleData() {
    log(false, "_prepareCrucibleData");

    for (let [key, item] of this.items.entries()) {
      if (item.type == "magicItem") {
        this.system.receptacle = item;
      } else if (item.type == "enchantment") {
        this.system.enchantments.push(item);
      }
    }
  }

  // Utility functions

  // get the XP coefficient of a given ability if any

  _getAbilityXpBonus(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].selection === "disabled") {
      return 0; // raise exception instead?
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += "_" + option;
    }
    if (this.system.bonuses.skills[abilityKey] == undefined) {
      // ability not yet added to bonuses
      return 0;
    }

    return this.system.bonuses.skills[abilityKey].xpMod || 0;
  }

  _getAbilityXpCoeff(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 1.0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].selection === "disabled") {
      return 1.0; // raise exception instead?
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += "_" + option;
    }
    if (this.system.bonuses.skills[abilityKey] == undefined) {
      // ability not yet added to bonuses
      return 1.0;
    }

    return this.system.bonuses.skills[abilityKey].xpCoeff || 1.0;
  }

  // get the Xps needed for an ability/decrepitude/warping score
  static getAbilityXp(score) {
    return ArM5ePCActor.getArtXp(score) * 5;
  }

  // get the score given an amount of xp
  static getAbilityScoreFromXp(xp) {
    return ArM5ePCActor.getArtScore(Math.floor(xp / 5));
  }

  // get the Xps needed for an art score
  static getArtXp(score) {
    return (score * (score + 1)) / 2;
  }

  // get the score given an amount of xp
  static getArtScore(xp) {
    let res = 0;
    while (xp > res) {
      res++;
      xp = xp - res;
    }
    return res;
  }

  // To identify the type of character
  _isMagus() {
    return (
      (this.type == "npc" && this.system.charType.value == "magusNPC") ||
      (this.type == "player" && this.system.charType.value == "magus")
    );
  }

  static isMagus(type, charType) {
    return (type == "npc" && charType == "magusNPC") || (type == "player" && charType == "magus");
  }

  _hasMight() {
    return this.type == "npc" && this.system.charType.value == "entity";
  }

  _isCompanion() {
    return this.type == "player" && this.system.charType.value == "companion";
  }

  _isGrog() {
    return this.type == "player" && this.system.charType.value == "grog";
  }

  _isCharacter() {
    return this.type == "player" || this.type == "npc" || this.type == "beast";
  }

  getAbilityScore(abilityKey, abilityOption = "") {
    if (!this._isCharacter()) {
      return null;
    }
    let ability = this.system.abilities.filter(
      (val) => val.system.key == abilityKey && val.system.option == abilityOption
    );

    if (ability.length) {
      return ability[0].system.derivedScore;
    }
    return 0;
  }
  getArtScore(artKey) {
    if (!this._isCharacter()) {
      return null;
    }
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(artKey) == -1) {
      artType = "forms";
    }
    return this.system.arts[artType][artKey];
  }

  // Vitals management

  async loseFatigueLevel(num, wound = true) {
    await this._changeFatigueLevel(num, wound);
  }

  async _changeFatigueLevel(num, wound = true) {
    if (!this._isCharacter() || (num < 0 && this.system.fatigueCurrent == 0)) {
      return;
    }
    let updateData = {};
    let tmp = this.system.fatigueCurrent + num;
    let overflow = 0;
    if (tmp < 0) {
      res = 0;
      updateData["system.fatigueCurrent"] = 0;
    } else if (tmp > this.system.fatigueMaxLevel) {
      updateData["system.fatigueCurrent"] = this.system.fatigueMaxLevel;
      overflow = tmp - this.system.fatigueMaxLevel;
    } else {
      updateData["system.fatigueCurrent"] = tmp;
    }

    if (wound && overflow > 0) {
      // fatigue overflow
      let wType;
      switch (overflow) {
        case 1:
          woundType = light;
          break;
        case 2:
          woundType = medium;
          break;
        case 3:
          woundType = heavy;
          break;
        case 4:
          woundType = incap;
          break;
        default:
          woundType = dead;
          break;
      }
      const datetime = game.settings.get("arm5e", "currentDate");
      let woundData = {
        name: `${game.i18n.localize(`arm5e.sheet.${wtype}`)} ${game.i18n.localize(
          "arm5e.sheet.wound.label"
        )}`,
        type: "wound",
        system: {
          inflictedDate: {
            year: datetime.year,
            season: datetime.year
          },
          healedDate: { year: null, season: "spring" },
          gravity: wtype,
          originalGravity: wtype,
          trend: 0,
          bonus: 0,
          nextRoll: 0,
          description: `Fatigue loss overflow`
        }
      };
      await this.createEmbeddedDocuments("Item", [woundData]);
    }
    await this.update(updateData, {});
  }
  async addActiveEffect(name, type, subtype, value, option = null, icon) {
    if (Object.keys(ACTIVE_EFFECTS_TYPES).includes(type)) {
      if (Object.keys(ACTIVE_EFFECTS_TYPES[type].subtypes).includes(subtype)) {
        const activeEffectData = {
          origin: this.uuid,
          duration: {
            rounds: undefined
          },
          flags: {
            arm5e: {
              noEdit: false,
              type: [type],
              subtype: [subtype],
              option: [null]
            }
          },
          changes: [
            {
              label: ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].label,
              key: ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].key,
              mode: ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].mode,
              value: value ?? ACTIVE_EFFECTS_TYPES[type].subtypes[subtype].default
            }
          ],
          tint: "#000000"
        };
        if (CONFIG.ISV10) {
          activeEffectData.label = name;
          activeEffectData.icon = icon ?? "icons/svg/aura.svg";
        } else {
          activeEffectData.name = name;
          activeEffectData.img = icon ?? "icons/svg/aura.svg";
        }

        return await this.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
      } else {
        log(false, "Unknown subtype");
      }
    } else {
      log(false, "Unknown type");
    }
    return;
  }

  // async removeActiveEffect(type, subtype) {
  //   if (Object.keys(ACTIVE_EFFECTS_TYPES).includes(type)) {
  //     if (Object.keys(ACTIVE_EFFECTS_TYPES[type].subtypes).includes(subtype)) {
  //       const toDelete = Object.values(this.effects).filter(e => )
  //       return await this.deleteEmbeddedDocuments("ActiveEffect", toDelete);
  //     } else {
  //       log(false, "Unknown subtype");
  //     }
  //   } else {
  //     log(false, "Unknown type");
  //   }
  //   return;
  // }

  async changeWound(amount, wtype) {
    if (!this._isCharacter() || (amount < 0 && this.system.wounds[type].length == 0)) {
      return;
    }
    let wounds = [];
    const datetime = game.settings.get("arm5e", "currentDate");
    for (let ii = 0; ii < amount; ii++) {
      let woundData = {
        name: `${game.i18n.localize(`arm5e.sheet.${wtype}`)} ${game.i18n.localize(
          "arm5e.sheet.wound.label"
        )}`,
        type: "wound",
        system: {
          inflictedDate: {
            year: datetime.year,
            season: datetime.season
          },
          healedDate: { year: null, season: "spring" },
          gravity: wtype,
          originalGravity: wtype,
          trend: 0,
          bonus: 0,
          nextRoll: 0,
          description: ``
        }
      };
      wounds.push(woundData);
    }
    await this.createEmbeddedDocuments("Item", wounds);
  }

  // Used by Quick magic dialog
  async selectVoiceAndGestures(stance, value) {
    if (this._isMagus()) {
      if (["voice", "gestures"].includes(stance)) {
        const update = {};
        update[`system.stances.${stance}Stance`] = value;
        await this.update(update);
      }
    }
  }

  async useConfidencePoint() {
    if (!this._isCharacter()) {
      return false;
    }

    if (this.system.con.points == 0) {
      ui.notifications.info(
        game.i18n.format("arm5e.notification.noConfidencePointsLeft", { name: this.name }),
        {
          permanent: false
        }
      );
      return false;
    }
    log(false, "Used confidence point");
    await this.update({ system: { con: { points: this.system.con.points - 1 } } });
    return true;
  }

  _hasDate() {
    return ["player", "beast", "covenant", "npc"].includes(this.type);
  }

  async rest() {
    if (!this._isCharacter()) {
      return;
    }
    let updateData = {};
    updateData["system.fatigueCurrent"] = 0;
    await this.update(updateData, {});
  }

  async loseMightPoints(num) {
    if (!this._isCharacter()) {
      return;
    }
    if (num > this.system.might.points) {
      ui.notifications.warn("Spending more might points than available");
      return;
    }
    let updateData = {};
    updateData["system.might.points"] = Number(this.system.might.points) - num;
    await this.update(updateData, {});
  }

  // set the proper default icon just before creation
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);
    log(false, `_preCreate: _id = ${this._id}`);
    let toUpdate = false;
    if (CONFIG.ARM5E.ActorDataModels[data.type]?.getDefault) {
      data = CONFIG.ARM5E.ActorDataModels[data.type].getDefault(data);
      toUpdate = true;
    }

    if (CONFIG.ARM5E.ActorDataModels[data.type]?.getIcon) {
      data.img = CONFIG.ARM5E.ActorDataModels[data.type].getIcon(data);
      toUpdate = true;
    } else if (data.img === undefined || data.img === "icons/svg/mystery-man.svg") {
      if (data.type in CONFIG.ARM5E_DEFAULT_ICONS) {
        data.img = CONFIG.ARM5E_DEFAULT_ICONS[data.type];
        toUpdate = true;
      }
    }

    if (toUpdate) await this.updateSource(data);

    if (this.type == "laboratory") {
      let effectsData = this.effects.contents;
      var baseSafetyEffect = this.effects.find((e) => e.getFlag("arm5e", "baseSafetyEffect"));
      if (!baseSafetyEffect) {
        // TODO put that data structure elsewhere (during lab activities implementation)
        const effect = {
          origin: this.uuid,
          tint: "#000000",
          changes: [
            {
              label: "arm5e.sheet.safety",
              key: "system.safety.bonus",
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: 0
            }
          ],
          flags: {
            arm5e: {
              baseSafetyEffect: true,
              noEdit: true,
              type: ["laboratory"],
              subtype: ["safety"],
              option: [null]
            }
          }
        };
        if (CONFIG.ISV10) {
          effect.label = game.i18n.localize("arm5e.sheet.baseSafety");
          effect.icon = "icons/svg/aura.svg";
        } else {
          effect.name = game.i18n.localize("arm5e.sheet.baseSafety");
          effect.img = "icons/svg/aura.svg";
        }
        effectsData.push(effect);
        const res = await this.effects.update(effectsData);
        log(false, res);
      }
    }
  }

  async getAgingEffects(agingData) {
    if (!this._isCharacter()) {
      return;
    }
    let amount = agingData.impact;
    let char1 = agingData.char;
    let char2 = agingData.char2;
    let naturalAging = agingData.season == "winter";
    let updateData = {};
    let result = { crisis: false, apparent: 1, charac: {} };
    switch (amount) {
      case 0:
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        break;
      case undefined:
        result.apparent = 0;
        break;
      case 1:
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        updateData["system.decrepitude.points"] = this.system.decrepitude.points + 1;
        result.decrepitude = 1;
        result.charac[char1] = { aging: 1 };
        // number of Aging Points greater than the absolute value of the Characteristic
        if (
          Math.abs(this.system.characteristics[char1].value) <
          this.system.characteristics[char1].aging + 1
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          // aging points still lesser or equal than absolute value of characteristic score.
          updateData[`system.characteristics.${char1}.aging`] =
            this.system.characteristics[char1].aging + 1;
        }
        if (this.system.decrepitude.experienceNextLevel == 1) result.crisis = true;
        break;
      case 2:
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        updateData["system.decrepitude.points"] = this.system.decrepitude.points + 2;
        result.decrepitude = 2;
        result.charac[char1] = { aging: 1 };
        result.charac[char2] = { aging: 1 };
        if (
          Math.abs(this.system.characteristics[char1].value) <
          this.system.characteristics[char1].aging + 1
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`system.characteristics.${char1}.aging`] =
            this.system.characteristics[char1].aging + 1;
        }
        if (
          Math.abs(this.system.characteristics[char2].value) <
          this.system.characteristics[char2].aging + 1
        ) {
          updateData[`system.characteristics.${char2}.value`] =
            this.system.characteristics[char2].value - 1;
          updateData[`system.characteristics.${char2}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`system.characteristics.${char2}.aging`] =
            this.system.characteristics[char2].aging + 1;
        }

        if (this.system.decrepitude.experienceNextLevel <= 2) result.crisis = true;

        break;
      default:
        //crisis
        result.crisis = true;
        updateData["system.apparent.value"] = this.system.apparent.value + 1;
        updateData["system.decrepitude.points"] =
          this.system.decrepitude.points + this.system.decrepitude.experienceNextLevel;

        if (
          this.system.decrepitude.experienceNextLevel >
          Math.abs(this.system.characteristics[char1].value)
        ) {
          updateData[`system.characteristics.${char1}.value`] =
            this.system.characteristics[char1].value - 1;
          updateData[`system.characteristics.${char1}.aging`] = 0;
          result.charac[char1] = {
            aging: Math.abs(this.system.characteristics[char1].value) + 1,
            score: -1
          };
        } else {
          updateData[`system.characteristics.${char1}.aging`] =
            this.system.characteristics[char1].aging + this.system.decrepitude.experienceNextLevel;
          result.charac[char1] = {
            aging:
              Math.abs(this.system.characteristics[char1].value) +
              this.system.decrepitude.experienceNextLevel
          };
        }

        result.decrepitude = this.system.decrepitude.experienceNextLevel;
    }
    log(false, "Aging effect");
    log(false, updateData);
    if (result.crisis) {
      updateData["system.pendingCrisis"] = true;
    }

    if (this.system.laboratory.longevityRitual.modifier && naturalAging) {
      updateData["system.warping.points"] =
        this.system.warping.points + CONFIG.ARM5E.activities.aging.warping.impact;
    }
    await this.update(updateData, {});
    return result;
  }

  // migrate this particular actor and its items
  async migrate() {
    try {
      ui.notifications.info(`Migrating actor ${this.name}.`, {
        permanent: false
      });
      const updateData = await migrateActorData(this, this.items);

      if (!isEmpty(updateData)) {
        console.log(`Migrating Actor entity ${this.name}`);
        await this.update(updateData, {
          enforceTypes: false
        });
      }
    } catch (err) {
      err.message = `Failed system migration for Actor ${this.name}: ${err.message}`;
      console.error(err);
    }
  }

  hasSkill(key) {
    if (key == "") return false;

    return (
      this.system.abilities.find((e) => e.system.key == key && e.system.option == "") != undefined
    );
  }

  getAbilityStats(key, option = "") {
    const ability = this.system.abilities.find(
      (e) => e.system.key == key && e.system.option == option
    );
    if (ability) {
      return { score: ability.system.finalScore, speciality: ability.system.speciality };
    }
    return { score: 0, speciality: "" };
  }

  getSimilarSpell(level, technique, form) {
    return this.system.spells.find(
      (e) =>
        e.system.level == level &&
        e.system.technique.value == technique &&
        e.system.form.value == form
    );
  }

  getSpellMasteryStats(spellId) {
    const spell = this.system.spells.find((e) => e.id == spellId);
    if (spell) {
      return {
        score: spell.system.mastery,
        xp: spell.system.xp,
        xpCoeff: spell.system.xpCoeff,
        xpBonus: spell.system.xpBonus
      };
    }
    return { score: 0, xp: 0, xpCoeff: 1, xpBonus: 0 };
  }

  getArtStats(key) {
    let artType = "forms";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).includes(key)) {
      artType = "techniques";
    }

    return this.system.arts[artType][key];
  }

  hasMagicResistance() {
    return this._isMagus() || this._hasMight() || this.system.bonuses.magicResistance !== null;
  }

  getLabTotalForEffect(spell, options = {}) {
    if (!spell.isAnEffect()) {
      error(false, "The item is not an effect");
      return;
    }

    let res = spell._computeCastingTotal(spell, { char: "int", focus: options.focus });
  }

  async changeHermeticArt(art, amount) {
    if (!this._isMagus()) return;

    let artType = "forms";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).includes(art)) {
      artType = "techniques";
    }
    return await this.update({
      [`system.arts.${artType}.${art}.xp`]: this.system.arts[artType][art].xp + amount
    });
  }

  async changeMight(amount) {
    if (!this._hasMight()) return;

    await this.update({
      system: { might: { points: this.system.might.points + amount } }
    });
  }

  // IDEA: check if the sheet is not null and filter the system activities instead.
  getSchedule(min, max, excludedActivities = [], excludedIds = [], season = undefined) {
    let res = [];
    const activitiesMap = new Map();
    for (let entry of this.system.diaryEntries) {
      if (!excludedIds.includes(entry._id) && !excludedActivities.includes(entry.system.activity)) {
        for (let date of entry.system.dates) {
          if (date.year >= min && date.year <= max) {
            if (min == max) {
              if (!activitiesMap.has(date.year)) {
                activitiesMap.set(date.year, {
                  [CONFIG.SEASON_ORDER_INV[3]]: [],
                  [CONFIG.SEASON_ORDER_INV[2]]: [],
                  [CONFIG.SEASON_ORDER_INV[1]]: [],
                  [CONFIG.SEASON_ORDER_INV[0]]: []
                });
              }
              activitiesMap.get(date.year)[date.season].push({
                id: entry._id,
                img: entry.img,
                name: entry.name,
                applied: entry.system.done || entry.system.activity === "none",
                type: entry.system.activity,
                date: date.date
              });
              if (season && date.season == season) {
                break;
              }
            } else {
              if (!activitiesMap.has(date.year)) {
                activitiesMap.set(date.year, {
                  [CONFIG.SEASON_ORDER_INV[3]]: [],
                  [CONFIG.SEASON_ORDER_INV[2]]: [],
                  [CONFIG.SEASON_ORDER_INV[1]]: [],
                  [CONFIG.SEASON_ORDER_INV[0]]: []
                });
              }
              activitiesMap.get(date.year)[date.season].push({
                id: entry._id,
                img: entry.img,
                name: entry.name,
                applied: entry.system.done || entry.system.activity === "none",
                type: entry.system.activity,
                date: date.date
              });
            }
          }
        }
      }
    }
    // return Object.fromEntries(activitiesMap.entries());
    return Array.from(
      new Map(
        [...activitiesMap.entries()].sort(function (a, b) {
          return b[0] - a[0];
        })
      ),
      ([key, value]) => ({
        year: key,
        seasons: value
      })
    );
  }

  isBusy(year, season, excludedActivities = [], excludedIds = []) {
    for (let entry of this.system.diaryEntries) {
      if (!excludedIds.includes(entry._id) && !excludedActivities.includes(entry.system.activity)) {
        for (let date of entry.system.dates) {
          if (date.year == year && date.season == season) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getWoundPenalty() {
    return this._getWoundPenalty(this.system.wounds);
  }

  // same as above but with temporary wounds

  _getWoundPenalty(wounds) {
    let woundsTotal = 0;
    for (let [key, item] of Object.entries(wounds)) {
      if (key == "healthy") continue;
      if (item.length > 0) {
        woundsTotal = woundsTotal + item.length * this.system.penalties.wounds[key];
      }
    }
    return woundsTotal + this.system.bonuses.traits.wounds > 0
      ? 0
      : woundsTotal + this.system.bonuses.traits.wounds;
  }
}
