import { ARM5E, ARM5E_DEFAULT_ICONS } from "../config.js";
import {
  compareBaseEffects,
  compareSpells,
  compareSpellsData,
  compareMagicalEffects,
  compareMagicalEffectsData,
  compareLabTextsData,
  log,
  error
} from "../tools.js";

import { migrateActorData } from "../migration.js";

import ArM5eActiveEffect from "../helpers/active-effects.js";

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5ePCActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data.
   **/

  prepareData() {
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    super.prepareBaseData();

    if (!this.data.flags.arm5e) {
      this.data.flags.arm5e = { filters: {} };
    }
    // add properties used for active effects:

    if (this.data.type == "laboratory") {
      this.data.data.size.bonus = 0;
      this.data.data.generalQuality.bonus = 0;
      this.data.data.safety.bonus = 0;
      this.data.data.health.bonus = 0;
      this.data.data.refinement.bonus = 0;
      this.data.data.upkeep.bonus = 0;
      this.data.data.warping.bonus = 0;
      this.data.data.aesthetics.bonus = 0;
      return;
    }

    if (this.data.type != "player" && this.data.type != "npc" && this.data.type != "beast") {
      return;
    }

    this.data.data.bonuses = {};
    if (this.data.data.realmAlignment == undefined) {
      this.data.data.realmAlignment = 0;
    }
    if (this._isMagus()) {
      // hack, if the active effect for magus is not setup
      if (this.data.data.realmAlignment == 0) {
        this.data.data.realmAlignment = 1;
      }
      for (let key of Object.keys(this.data.data.arts.techniques)) {
        this.data.data.arts.techniques[key].bonus = 0;
        this.data.data.arts.techniques[key].xpCoeff = 1.0;
      }

      for (let key of Object.keys(this.data.data.arts.forms)) {
        this.data.data.arts.forms[key].bonus = 0;
        this.data.data.arts.forms[key].xpCoeff = 1.0;
      }

      this.data.data.bonuses.arts = {
        voice: 0,
        gestures: 0,
        spellcasting: 0,
        laboratory: 0,
        penetration: 0
      };
    }

    this.data.data.bonuses.skills = {};
    for (const [key, item] of this.items.entries()) {
      if (item.type == "ability") {
        let abilityKey = item.data.data?.key || "";
        if (abilityKey != "") {
          // log(false, `Ability key: ${abilityKey}`);
          if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
            abilityKey += "_" + item.data.data.option;
          }
          this.data.data.bonuses.skills[abilityKey] = {};
          this.data.data.bonuses.skills[abilityKey].bonus = 0;
          this.data.data.bonuses.skills[abilityKey].xpCoeff = 1.0;
        }
      }
    }

    this.data.data.bonuses.traits = { soak: 0, aging: 0 };
  }

  /** @override */
  prepareEmbeddedDocuments() {
    if (this.data.type == "laboratory") {
      this._prepareLaboratoryEmbeddedDocuments(this.data);
    }

    super.prepareEmbeddedDocuments();
  }

  _prepareLaboratoryEmbeddedDocuments(labData) {
    var baseSafetyEffect = labData.effects.find((e) => e.getFlag("arm5e", "baseSafetyEffect"));
    if (!baseSafetyEffect) {
      this.createEmbeddedDocuments("ActiveEffect", [
        {
          label: game.i18n.localize("arm5e.sheet.baseSafety"),
          icon: "icons/svg/aura.svg",
          origin: labData.uuid,
          tint: "#000000",
          changes: [
            {
              label: "arm5e.sheet.safety",
              key: "data.safety.bonus",
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
        }
      ]);
    }
  }

  /** @override */
  prepareDerivedData() {
    if (this.data.type == "magicCodex") {
      return this._prepareMagicCodexData(this.data);
    } else if (this.data.type == "covenant") {
      return this._prepareCovenantData(this.data);
    } else if (this.data.type == "laboratory") {
      return this._prepareLabData(this.data);
    } else if (this.data.type == "crucible") {
      return this._prepareCrucibleData(this.data);
    } else {
      return this._prepareCharacterData(this.data);
    }
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    log(false, `Preparing Actor ${actorData.name} data`);
    let overload = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 9999];
    // Initialize containers.
    let weapons = [];
    let armor = [];
    let spells = [];
    let magicalEffects = [];
    let vis = [];
    let items = [];
    let magicItems = [];
    let books = [];
    let virtues = [];
    let flaws = [];
    let abilities = [];
    let abilitiesSelect = {};
    let diaryEntries = [];
    let abilitiesFamiliar = [];
    let powersFamiliar = [];

    let soak = actorData.data.characteristics.sta.value + actorData.data.bonuses.traits.soak;

    let powers = [];

    let reputations = [];

    let totalXPAbilities = 0;
    let totalXPArts = 0;
    let totalVirtues = 0;
    let totalFlaws = 0;
    let totalXPSpells = 0;

    let combat = {
      weight: 0,
      overload: -1,
      init: 0,
      atk: 0,
      dfn: 0,
      dam: 0,
      prot: 0,
      ability: 0
    };

    const data = actorData.data;

    // fatigue management
    if (data.fatigue) {
      data.fatigueTotal = 0;
      let lvl = 0;
      for (let [key, item] of Object.entries(data.fatigue)) {
        let fatigueArray = [];

        for (let ii = 0; ii < item.amount; ii++) {
          if (lvl < data.fatigueCurrent) {
            fatigueArray.push(true);
            data.fatigueTotal = item.number > 0 ? 0 : item.number;
          } else {
            fatigueArray.push(false);
          }
          lvl++;
        }
        item.levels = fatigueArray;
      }
      data.fatigueMaxLevel = lvl;
    }

    if (data.wounds) {
      data.woundsTotal = 0;
      for (let [key, item] of Object.entries(data.wounds)) {
        data.woundsTotal = data.woundsTotal + item.number.value * item.penalty.value;
      }
    }

    //abilities
    const temp = {
      _id: "",
      name: "N/A",
      value: 0
    };
    abilitiesSelect["a0"] = temp;
    for (const [key, item] of actorData.items.entries()) {
      // Since 0.8, Item#data is now a class named ItemData
      // ItemData#data now contains the data
      let i = item.data;
      if (i.type === "ability") {
        let computedKey = i.data.key;
        if (i.data.option != "") {
          computedKey += "_" + i.data.option;
        }
        i.data.xpCoeff = this._getAbilityXpCoeff(i.data.key, i.data.option);
        i.data.derivedScore = this._getAbilityScoreFromXp(Math.round(i.data.xp * i.data.xpCoeff));
        i.data.xpNextLevel = Math.round(5 * i.data.derivedScore + 5 / i.data.xpCoeff);
        i.data.remainingXp =
          i.data.xp - Math.round(this._getAbilityXp(i.data.derivedScore) / i.data.xpCoeff);

        // for DEBUG purposes
        // if (i.data.xpCoeff != 1.0) {
        //   let coeff = i.data.xpCoeff;
        //   log(false, `xpCoeff: ${coeff}`);
        //   let newxp = i.data.xp * coeff;
        //   log(false, `Xp: ${i.data.xp} and after afinity: ${newxp}`);
        //   let score = this._getAbilityScoreFromXp(i.data.xp);
        //   let affinityscore = this._getAbilityScoreFromXp(Math.round(i.data.xp * coeff));
        //   log(false, `score : ${score} and after afinity: ${affinityscore}`);
        //   let nextLvl = this._getAbilityXp(affinityscore + 1) - i.data.xp;
        //   let afterAffinity = nextLvl / coeff;
        //   log(false, `xpNextLvl: ${nextLvl} and after afinity: ${afterAffinity}`);
        // }

        if (
          data.bonuses.skills[computedKey] != undefined &&
          data.bonuses.skills[computedKey].bonus != 0
        ) {
          i.data.finalScore =
            i.data.derivedScore + parseInt(data.bonuses.skills[computedKey].bonus);
        } else {
          i.data.finalScore = i.data.derivedScore;
        }

        abilities.push(i);

        const temp = {
          id: i._id,
          name: i.name,
          value: i.data.finalScore
        };
        //abilitiesSelect.push(temp);
        abilitiesSelect["a" + key] = temp;

        totalXPAbilities = parseInt(totalXPAbilities) + i.data.xp;

        if (
          this._isMagus() &&
          actorData.data.laboratory &&
          actorData.data.laboratory.abilitiesSelected
        ) {
          if (i.data.key != "") {
            if (i.data.key == "finesse") {
              actorData.data.laboratory.abilitiesSelected.finesse.value = i.data.finalScore;
            } else if (i.data.key == "awareness") {
              actorData.data.laboratory.abilitiesSelected.awareness.value = i.data.finalScore;
            } else if (i.data.key == "concentration") {
              actorData.data.laboratory.abilitiesSelected.concentration.value = i.data.finalScore;
            } else if (i.data.key == "artesLib") {
              actorData.data.laboratory.abilitiesSelected.artesLib.value = i.data.finalScore;
            } else if (i.data.key == "magicTheory") {
              actorData.data.laboratory.abilitiesSelected.magicTheory.value = i.data.finalScore;
            } else if (i.data.key == "parma") {
              actorData.data.laboratory.abilitiesSelected.parma.value = i.data.finalScore;
            } else if (i.data.key == "philosophy") {
              actorData.data.laboratory.abilitiesSelected.philosophy.value = i.data.finalScore;
            } else if (i.data.key == "penetration") {
              actorData.data.laboratory.abilitiesSelected.penetration.value = i.data.finalScore;
            }
          } else {
            // legacy code, to be removed in the future
            if (i._id == actorData.data.laboratory.abilitiesSelected.finesse.abilityID) {
              actorData.data.laboratory.abilitiesSelected.finesse.value = i.data.finalScore;
            } else if (i._id == actorData.data.laboratory.abilitiesSelected.awareness.abilityID) {
              actorData.data.laboratory.abilitiesSelected.awareness.value = i.data.finalScore;
            } else if (
              i._id == actorData.data.laboratory.abilitiesSelected.concentration.abilityID
            ) {
              actorData.data.laboratory.abilitiesSelected.concentration.value = i.data.finalScore;
            } else if (i._id == actorData.data.laboratory.abilitiesSelected.artesLib.abilityID) {
              actorData.data.laboratory.abilitiesSelected.artesLib.value = i.data.finalScore;
            } else if (i._id == actorData.data.laboratory.abilitiesSelected.philosophy.abilityID) {
              actorData.data.laboratory.abilitiesSelected.philosophy.value = i.data.finalScore;
            } else if (i._id == actorData.data.laboratory.abilitiesSelected.parma.abilityID) {
              actorData.data.laboratory.abilitiesSelected.parma.value = i.data.finalScore;
            } else if (i._id == actorData.data.laboratory.abilitiesSelected.magicTheory.abilityID) {
              actorData.data.laboratory.abilitiesSelected.magicTheory.value = i.data.finalScore;
            } else if (
              i._id == actorData.data.laboratory.abilitiesSelected?.penetration?.abilityID
            ) {
              actorData.data.laboratory.abilitiesSelected.penetration.value = i.data.finalScore;
            }
          }
        }
      }
    }

    for (let [key, item] of actorData.items.entries()) {
      const i = item.data;
      i.img = i.img || DEFAULT_TOKEN;
      i._index = key;

      if (i.type === "weapon" || i.type === "enchantedWeapon") {
        if (i.data.equiped == true) {
          combat.weight = parseInt(combat.weight) + parseInt(i.data.weight);
          combat.init = parseInt(combat.init) + parseInt(i.data.init);
          combat.atk = parseInt(combat.atk) + parseInt(i.data.atk);
          combat.dfn = parseInt(combat.dfn) + parseInt(i.data.dfn);
          combat.dam = parseInt(combat.dam) + parseInt(i.data.dam);
          combat.img = i.img;
          combat.name = i.name;

          if (i.data.ability == "") {
            if (i.data.weaponExpert) {
              combat.ability = parseInt(combat.ability) + 1;
            }
          } else {
            for (var a = 0; a < abilities.length; a++) {
              if (abilities[a]._id == i.data.ability) {
                let hab = abilities[a].data.finalScore;
                if (i.data.weaponExpert) {
                  hab = parseInt(hab) + 1;
                }
                if (i.data.horse) {
                  if (hab > 3) {
                    hab = 3;
                  }
                }
                combat.ability = parseInt(combat.ability) + parseInt(hab);
              }
            }
          }
        }

        i.data.abilities = abilitiesSelect;
        weapons.push(i);
      } else if (i.type === "armor" || i.type === "enchantedArmor") {
        if (i.data.equiped == true) {
          combat.weight = parseInt(combat.weight) + parseInt(i.data.weight);
          combat.prot = parseInt(combat.prot) + parseInt(i.data.prot);
        }
        armor.push(i);
      } else if (i.type === "spell") {
        spells.push(i);
        totalXPSpells = parseInt(totalXPSpells) + parseInt(i.data.level);
      } else if (i.type === "magicalEffect") {
        magicalEffects.push(i);
      } else if (i.type === "vis") {
        vis.push(i);
      } else if (i.type === "item" || i.type == "enchantedItem") {
        items.push(i);
      } else if (i.type === "book") {
        books.push(i);
      } else if (i.type === "virtue") {
        virtues.push(i);
        if (ARM5E.impacts[i.data.impact.value]) {
          totalVirtues = parseInt(totalVirtues) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
        }
      } else if (i.type === "flaw") {
        flaws.push(i);
        if (ARM5E.impacts[i.data.impact.value]) {
          totalFlaws = parseInt(totalFlaws) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
        }
      }

      // ugly fix, but I don't know how to do better since prepare data is called before migration
      // to be removed when we break backward compatibility with 0.7
      else if (i.type === "diaryEntry" || i.type === "dairyEntry") {
        diaryEntries.push(i);
      } else if (i.type === "abilityFamiliar") {
        abilitiesFamiliar.push(i);
      } else if (i.type === "mightFamiliar" || i.type === "powerFamiliar") {
        powersFamiliar.push(i);
      } else if (i.type === "might" || i.type === "power") {
        powers.push(i);
      } else if (i.type === "magicItem") {
        magicItems.push(i);
      } else if (i.type === "personality") {
        personalities.push(i);
      } else if (i.type === "reputation") {
        reputations.push(i);
      }
    }

    // combat
    for (var a = 0; a < overload.length; a++) {
      if (combat.overload == -1) {
        if (overload[a] > combat.weight) {
          combat.overload = parseInt(a) - 1;
        }
      }
    }

    if (combat.prot) {
      soak += combat.prot;
    }

    if (combat.overload < 0) {
      combat.overload = 0;
    }
    if (actorData.data.characteristics) {
      if (actorData.data.characteristics.str.value > 0) {
        combat.overload =
          parseInt(combat.overload) - parseInt(actorData.data.characteristics.str.value);
      }
      if (combat.overload < 0) {
        combat.overload = 0;
      }
    }
    combat.overload = parseInt(combat.overload) * -1;

    if (this._isGrog()) {
      actorData.data.con.score = 0;
      actorData.data.con.points = 0;
    }
    //warping & decrepitude
    if (
      (this.data.type == "npc" && this.data.data.charType.value != "entity") ||
      this.data.type == "player"
    ) {
      actorData.data.warping.experienceNextLevel =
        (parseInt(actorData.data.warping?.score || 0) + 1) * 5;
      if (actorData.data.decrepitude == undefined) {
        actorData.data.decrepitude = {};
      }
      actorData.data.decrepitude.finalScore = this._getAbilityScoreFromXp(
        actorData.data.decrepitude.points
      );
      actorData.data.decrepitude.experienceNextLevel =
        ((parseInt(actorData.data.decrepitude.finalScore) + 1) *
          (parseInt(actorData.data.decrepitude.finalScore) + 2) *
          5) /
          2 -
        actorData.data.decrepitude.points;
    }

    if (this._isMagus()) {
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
      this.data.data.bonuses.arts.spellcasting +=
        parseInt(this.data.data.bonuses.arts.voice) +
        parseInt(this.data.data.bonuses.arts.gestures);

      if (actorData.data.laboratory === undefined) {
        actorData.data.laboratory = {};
      }
      // calculate laboratory totals
      actorData.data.laboratory.fastCastingSpeed.value =
        actorData.data.characteristics.qik.value +
        actorData.data.laboratory.abilitiesSelected.finesse.value;
      actorData.data.laboratory.determiningEffect.value =
        actorData.data.characteristics.per.value +
        actorData.data.laboratory.abilitiesSelected.awareness.value;
      actorData.data.laboratory.targeting.value =
        actorData.data.characteristics.per.value +
        actorData.data.laboratory.abilitiesSelected.finesse.value;
      actorData.data.laboratory.concentration.value =
        actorData.data.characteristics.sta.value +
        actorData.data.laboratory.abilitiesSelected.concentration.value;
      actorData.data.laboratory.magicResistance.value =
        actorData.data.laboratory.abilitiesSelected.parma.value * 5;
      actorData.data.laboratory.multipleCasting.value =
        actorData.data.characteristics.int.value +
        actorData.data.laboratory.abilitiesSelected.finesse.value;
      actorData.data.laboratory.basicLabTotal.value =
        actorData.data.characteristics.int.value +
        actorData.data.laboratory.abilitiesSelected.magicTheory.value; // aura pending

      if (actorData.data.apprentice) {
        if (actorData.data.apprentice.magicTheory > 0) {
          actorData.data.laboratory.basicLabTotal.value +=
            actorData.data.apprentice.magicTheory + actorData.data.apprentice.int;
        }
      }
      actorData.data.laboratory.visLimit.value =
        actorData.data.laboratory.abilitiesSelected.magicTheory.value * 2;
      if (actorData.data.laboratory.totalPenetration) {
        actorData.data.laboratory.totalPenetration.value =
          actorData.data.laboratory.abilitiesSelected?.penetration?.value || 0;
      }

      for (let [key, technique] of Object.entries(data.arts.techniques)) {
        // TODO remove once confirmed there is no bug
        // if (technique.xpCoeff != 1.0) {
        //   log(false, `xpCoeff: ${technique.xpCoeff}`);
        //   let newxp = technique.xp * technique.xpCoeff;
        //   log(false, `Xp: ${technique.xp} and after afinity: ${newxp}`);
        //   let score = this._getArtScore(technique.xp);
        //   let affinityscore = this._getArtScore(Math.round(technique.xp * technique.xpCoeff));
        //   log(false, `score : ${score} and after afinity: ${affinityscore}`);
        //   let nextLvl = this._getArtXp(affinityscore + 1) / technique.xpCoeff - technique.xp;
        //   let afterAffinity = nextLvl / technique.xpCoeff;
        //   log(false, `xpNextLvl: ${nextLvl} and after afinity: ${afterAffinity}`);
        // }
        // end TODO

        technique.derivedScore = this._getArtScore(Math.round(technique.xp * technique.xpCoeff));
        technique.finalScore = technique.derivedScore + technique.bonus;
        // start from scratch to avoid rounding errors
        technique.xpNextLevel =
          Math.round(this._getArtXp(technique.derivedScore + 1) / technique.xpCoeff) - technique.xp;

        // TODO remove once confirmed there is no bug
        // if (technique.score != technique.derivedScore && technique.xp != 0) {
        //   error(
        //     false,
        //     "Wrong computation of score: Original: " +
        //       technique.score +
        //       " vs Computed: " +
        //       technique.derivedScore +
        //       " XPs:" +
        //       technique.xp
        //   );
        //   this._getArtScore(technique.xp);
        // }
        // Calculate the next level experience needed
        totalXPArts = parseInt(totalXPArts) + technique.xp;
      }

      for (let [key, form] of Object.entries(data.arts.forms)) {
        // TODO remove once confirmed there is no bug
        // if (form.xpCoeff != 1.0) {
        //   log(false, `xpCoeff: ${form.xpCoeff}`);
        //   let newxp = form.xp * form.xpCoeff;
        //   log(false, `Xp: ${form.xp} and after afinity: ${newxp}`);
        //   let score = this._getArtScore(form.xp);
        //   let affinityscore = this._getArtScore(Math.round(form.xp * form.xpCoeff));
        //   log(false, `score : ${score} and after afinity: ${affinityscore}`);
        //   let nextLvl = this._getArtXp(affinityscore + 1) / form.xpCoeff - form.xp;
        //   let afterAffinity = nextLvl / form.xpCoeff;
        //   log(false, `xpNextLvl: ${nextLvl} and after afinity: ${afterAffinity}`);
        // }
        // // end TODO

        form.derivedScore = this._getArtScore(Math.round(form.xp * form.xpCoeff));
        form.finalScore = form.derivedScore + form.bonus;

        form.xpNextLevel =
          Math.round(this._getArtXp(form.derivedScore + 1) / form.xpCoeff) - form.xp;
        // TODO remove once confirmed there is no bug
        // if (form.score != form.derivedScore && form.xp != 0) {
        //   error(
        //     false,
        //     "Wrong computation of score: Original: " +
        //       form.score +
        //       " vs Computed: " +
        //       form.derivedScore +
        //       " XPs:" +
        //       form.xp
        //   );
        //   this._getArtScore(form.xp);
        // }
        if (
          actorData.type == "player" &&
          actorData.data.laboratory &&
          actorData.data.laboratory.abilitiesSelected
        ) {
          form.magicResistance =
            actorData.data.laboratory.abilitiesSelected.parma.value * 5 + form.finalScore;
        }
        totalXPArts = parseInt(totalXPArts) + form.xp;
      }
    }

    // Assign and return
    actorData.data.totalXPAbilities = totalXPAbilities;
    actorData.data.totalXPArts = totalXPArts;
    actorData.data.totalVirtues = totalVirtues;
    actorData.data.totalFlaws = totalFlaws;
    actorData.data.totalXPSpells = totalXPSpells;

    if (actorData.data.weapons) {
      actorData.data.weapons = weapons;
      actorData.data.combat = combat;
    }
    if (actorData.data.armor) {
      actorData.data.armor = armor;
    }
    if (actorData.data.spells) {
      actorData.data.spells = spells;
    }
    if (actorData.data.magicalEffects) {
      actorData.data.magicalEffects = magicalEffects;
    }

    if (actorData.data.vitals.soa) {
      actorData.data.vitals.soa.value = soak;
    }

    if (actorData.data.vis) {
      actorData.data.vis = vis;
    }
    if (actorData.data.items) {
      actorData.data.items = items;
    }
    if (actorData.data.books) {
      actorData.data.books = books;
    }
    if (actorData.data.virtues) {
      actorData.data.virtues = virtues;
    }
    if (actorData.data.flaws) {
      actorData.data.flaws = flaws;
    }
    if (actorData.data.abilities) {
      let flag = this.getFlag("arm5e", "sorting", "abilities");
      if (flag && flag["abilities"] == true) {
        actorData.data.abilities = abilities.sort(function (e1, e2) {
          return e1.name.localeCompare(e2.name);
        });
      } else {
        actorData.data.abilities = abilities;
      }
    }
    if (actorData.data.diaryEntries) {
      actorData.data.diaryEntries = diaryEntries;
    }
    if (actorData.data.familiar) {
      actorData.data.familiar.abilitiesFam = abilitiesFamiliar;
      actorData.data.familiar.powersFam = powersFamiliar;
    }

    if (actorData.data.powers) {
      actorData.data.powers = powers;
    }

    if (actorData.data.reputations) {
      actorData.data.reputations = reputations;
    }

    log(false, "pc end of prepare actorData");
    log(false, actorData);
  }

  _prepareMagicCodexData(codexData) {
    codexData.img = CONFIG.ARM5E_DEFAULT_ICONS["magicCodex"];
    const data = codexData.data;
    let baseEffects = [];
    let magicEffects = [];
    let spells = [];
    let enchantments = [];
    for (let [key, item] of codexData.items.entries()) {
      if (item.data.type == "baseEffect") {
        baseEffects.push(item);
      }
      if (item.data.type == "magicalEffect") {
        magicEffects.push(item);
      }
      if (item.data.type == "spell") {
        spells.push(item);
      }
      if (item.data.type == "enchantment") {
        enchantments.push(item);
      }
    }
    if (data.formFilter != "") {
      baseEffects = baseEffects.filter((e) => e.data.data.form.value === data.formFilter);
      magicEffects = magicEffects.filter((e) => e.data.data.form.value === data.formFilter);
      spells = spells.filter((e) => e.data.data.form.value === data.formFilter);
      enchantments = enchantments.filter((e) => e.data.data.form.value === data.formFilter);
    }
    if (data.techniqueFilter != "") {
      baseEffects = baseEffects.filter((e) => e.data.data.technique.value === data.techniqueFilter);
      magicEffects = magicEffects.filter(
        (e) => e.data.data.technique.value === data.techniqueFilter
      );
      spells = spells.filter((e) => e.data.data.technique.value === data.techniqueFilter);
      enchantments = enchantments.filter(
        (e) => e.data.data.technique.value === data.techniqueFilter
      );
    }
    if (data.levelFilter != 0 && data.levelFilter != null) {
      if (data.levelOperator == 0) {
        magicEffects = magicEffects.filter((e) => e.data.data.level === data.levelFilter);
        spells = spells.filter((e) => e.data.data.level === data.levelFilter);
        enchantments = enchantments.filter((e) => e.data.data.level === data.levelFilter);
      } else if (data.levelOperator == -1) {
        magicEffects = magicEffects.filter((e) => e.data.data.level <= data.levelFilter);
        spells = spells.filter((e) => e.data.data.level <= data.levelFilter);
        enchantments = enchantments.filter((e) => e.data.data.level <= data.levelFilter);
      } else {
        magicEffects = magicEffects.filter((e) => e.data.data.level >= data.levelFilter);
        spells = spells.filter((e) => e.data.data.level >= data.levelFilter);
        enchantments = enchantments.filter((e) => e.data.data.level >= data.levelFilter);
      }
    }
    data.baseEffects = baseEffects.sort(compareBaseEffects);
    data.baseEffectCount = baseEffects.length;
    data.magicEffects = magicEffects.sort(compareMagicalEffects);
    data.magicEffectsCount = magicEffects.length;
    data.enchantments = enchantments.sort(compareMagicalEffects);
    data.enchantmentsCount = enchantments.length;
    data.spells = spells.sort(compareSpells);
    data.spellsCount = spells.length;
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

  _prepareLabData(labData) {
    log(false, "_prepareLabData");
    let virtues = [];
    let flaws = [];
    let specialities = [];
    let distinctive = [];
    let rooms = [];
    let magicItems = [];
    let personalities = [];
    let vis = [];
    let items = [];
    let books = [];
    let diaryEntries = [];
    let totalVirtues = 0;
    let totalFlaws = 0;

    for (let [key, item] of labData.items.entries()) {
      const i = item.data;
      if (i.type === "speciality") {
        specialities.push(i);
      } else if (i.type === "distinctive") {
        distinctive.push(i);
      } else if (i.type === "sanctumRoom") {
        rooms.push(i);
      } else if (i.type === "magicItem") {
        magicItems.push(i);
      } else if (i.type === "personality") {
        personalities.push(i);
      } else if (i.type === "book") {
        books.push(i);
      } else if (i.type === "vis") {
        vis.push(i);
      } else if (i.type === "item") {
        items.push(i);
      } else if (i.type === "virtue") {
        virtues.push(i);
        if (ARM5E.impacts[i.data.impact.value]) {
          totalVirtues = parseInt(totalVirtues) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
        }
      } else if (i.type === "flaw") {
        flaws.push(i);
        if (ARM5E.impacts[i.data.impact.value]) {
          totalFlaws = parseInt(totalFlaws) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
        }
      } else if (i.type === "diaryEntry" || i.type === "dairyEntry") {
        diaryEntries.push(i);
      }
    }

    if (labData.data.specialities) {
      labData.data.specialities = specialities;
    }
    if (labData.data.distinctive) {
      labData.data.distinctive = distinctive;
    }
    if (labData.data.rooms) {
      labData.data.rooms = rooms;
    }

    if (labData.data.personalities) {
      labData.data.personalities = personalities;
    }

    if (labData.data.items) {
      labData.data.items = items;
    }
    if (labData.data.books) {
      labData.data.books = books;
    }

    if (labData.data.rawVis) {
      labData.data.rawVis = vis;
    }

    if (labData.data.magicItems) {
      labData.data.magicItems = magicItems;
    }

    if (labData.data.virtues) {
      labData.data.virtues = virtues;
    }
    if (labData.data.flaws) {
      labData.data.flaws = flaws;
    }
    if (labData.data.diaryEntries) {
      labData.data.diaryEntries = diaryEntries;
    }

    labData.data.size.total = labData.data.size.value + labData.data.size.bonus;
    labData.data.generalQuality.total =
      labData.data.generalQuality.value + labData.data.generalQuality.bonus;
    labData.data.safety.total = labData.data.safety.value + labData.data.safety.bonus;
    labData.data.health.total = labData.data.health.value + labData.data.health.bonus;
    labData.data.refinement.total = labData.data.refinement.value + labData.data.refinement.bonus;
    labData.data.upkeep.total = labData.data.upkeep.value + labData.data.upkeep.bonus;
    labData.data.warping.total = labData.data.warping.value + labData.data.warping.bonus;
    labData.data.aesthetics.total = labData.data.aesthetics.value + labData.data.aesthetics.bonus;

    let freeVirtues = labData.data.size.total + labData.data.refinement.total;
    let occupiedSize = Math.max(totalVirtues - totalFlaws, 0) - labData.data.refinement.total;
    let baseSafety = labData.data.refinement.total - Math.max(occupiedSize, 0);

    labData.data.baseSafety = baseSafety;
    labData.data.occupiedSize = occupiedSize;
    labData.data.freeVirtues = freeVirtues;

    labData.data.totalVirtues = totalVirtues;
    labData.data.totalFlaws = totalFlaws;

    var baseSafetyEffect = labData.effects.find((e) => e.getFlag("arm5e", "baseSafetyEffect"));
    if (baseSafetyEffect != null && baseSafetyEffect.data.changes[0].value != String(baseSafety)) {
      let changes = duplicate(baseSafetyEffect.data.changes);
      changes[0].value = String(baseSafety);
      baseSafetyEffect.update({ changes });
    }
  }

  _prepareCovenantData(actorData) {
    log(false, "_prepareCovenantData");
    let reputations = [];
    let magi = [];
    let companion = [];
    let specialists = [];
    let habitants = [];
    let horses = [];
    let livestock = [];
    let possessions = [];
    let visSources = [];
    let visStock = [];
    let calendar = [];
    let incomingSources = [];
    let laboratoryTexts = [];
    let books = [];
    let mundaneBooks = [];
    let magicItems = [];
    let items = [];
    let boons = [];
    let hooks = [];
    let labs = [];
    let diaryEntries = [];
    let totalVirtues = 0;
    let totalFlaws = 0;

    for (let [key, item] of actorData.items.entries()) {
      const i = item.data;
      i.img = i.img || DEFAULT_TOKEN;
      i._index = key;
      if (i.type === "virtue") {
        boons.push(i);
        if (ARM5E.impacts[i.data.impact.value]) {
          totalVirtues = parseInt(totalVirtues) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
        }
      } else if (i.type === "flaw") {
        hooks.push(i);
        if (ARM5E.impacts[i.data.impact.value]) {
          totalFlaws = parseInt(totalFlaws) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
        }
      } else if (i.type === "diaryEntry" || i.type === "dairyEntry") {
        diaryEntries.push(i);
      } else if (i.type === "reputation") {
        reputations.push(i);
      } else if (i.type === "habitantMagi") {
        magi.push(i);
      } else if (i.type === "habitantCompanion") {
        companion.push(i);
      } else if (i.type === "habitantSpecialists") {
        specialists.push(i);
      } else if (i.type === "habitantHabitants") {
        habitants.push(i);
      } else if (i.type === "habitantHorses") {
        horses.push(i);
      } else if (i.type === "habitantLivestock") {
        livestock.push(i);
      } else if (i.type === "possessionsCovenant") {
        possessions.push(i);
      } else if (i.type === "visSourcesCovenant") {
        visSources.push(i);
      } else if (i.type === "visStockCovenant") {
        visStock.push(i);
      } else if (i.type === "calendarCovenant") {
        calendar.push(i);
      } else if (i.type === "incomingSource") {
        incomingSources.push(i);
      } else if (i.type === "laboratoryText") {
        laboratoryTexts.push(i);
      } else if (i.type === "mundaneBook") {
        mundaneBooks.push(i);
      } else if (i.type === "book") {
        books.push(i);
      } else if (i.type === "magicItem") {
        magicItems.push(i);
      } else if (i.type === "reputation") {
        reputations.push(i);
      } else if (i.type === "item") {
        items.push(i);
      } else if (i.type === "labCovenant") labs.push(i);
    }
    if (actorData.data.reputations) {
      actorData.data.reputations = reputations;
    }
    if (actorData.data.habitants) {
      actorData.data.habitants.magi = magi;
      actorData.data.habitants.companion = companion;
      actorData.data.habitants.specialists = specialists;
      actorData.data.habitants.habitants = habitants;
      actorData.data.habitants.horses = horses;
      actorData.data.habitants.livestock = livestock;
    }
    if (actorData.data.possessions) {
      actorData.data.possessions = possessions;
    }
    if (actorData.data.visSources) {
      actorData.data.visSources = visSources;
    }
    if (actorData.data.visStock) {
      actorData.data.visStock = visStock;
    }
    if (actorData.data.calendar) {
      actorData.data.calendar = calendar;
    }
    if (actorData.data.incomingSources) {
      actorData.data.incomingSources = incomingSources;
    }
    if (actorData.data.magicBooks) {
      actorData.data.magicBooks = books;
    }

    if (actorData.data.mundaneBooks) {
      actorData.data.mundaneBooks = mundaneBooks;
    }
    if (actorData.data.magicItems) {
      actorData.data.magicItems = magicItems;
    }
    if (actorData.data.diaryEntries) {
      actorData.data.diaryEntries = diaryEntries;
    }

    if (actorData.data.virtues) {
      actorData.data.virtues = boons;
    }
    if (actorData.data.flaws) {
      actorData.data.flaws = hooks;
    }

    if (actorData.data.items) {
      actorData.data.items = items;
    }

    if (actorData.data.laboratoryTexts) {
      let flag = this.getFlag("arm5e", "sorting", "laboratoryTexts");
      if (flag && flag["laboratoryTexts"] == true) {
        actorData.data.laboratoryTexts = laboratoryTexts.sort(compareLabTextsData);
      } else {
        actorData.data.laboratoryTexts = laboratoryTexts;
      }
    }

    if (actorData.data.labs) {
      actorData.data.labs = labs;
    }
  }

  _prepareCrucibleData(actorData) {
    log(false, "_prepareCrucibleData");

    for (let [key, item] of actorData.items.entries()) {
      if (item.type == "magicItem") {
        actorData.data.receptacle = item;
      } else if (item.type == "enchantment") {
        actorData.data.enchantments.push(item);
      }
    }
  }

  // Utility functions

  // get the XP coefficient of a given ability if any

  _getAbilityXpCoeff(abilityKey = "", option = "") {
    if (abilityKey === "" || CONFIG.ARM5E.ALL_ABILITIES[abilityKey] == undefined) {
      return 1.0;
    }
    if (CONFIG.ARM5E.ALL_ABILITIES[abilityKey].option || false) {
      abilityKey += "_" + option;
    }
    if (this.data.data.bonuses.skills[abilityKey] == undefined) {
      // ability not yet added to bonuses
      return 1.0;
    }

    return this.data.data.bonuses.skills[abilityKey].xpCoeff || 1.0;
  }
  // get the Xps needed for an ability/decrepitude/warping score
  _getAbilityXp(score) {
    return this._getArtXp(score) * 5;
  }

  // get the score given an amount of xp
  _getAbilityScoreFromXp(xp) {
    return this._getArtScore(Math.floor(xp / 5));
  }

  // get the Xps needed for an art score
  _getArtXp(score) {
    return (score * (score + 1)) / 2;
  }

  // get the score given an amount of xp
  _getArtScore(xp) {
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
      (this.data.type == "npc" && this.data.data.charType.value == "magusNPC") ||
      (this.data.type == "player" && this.data.data.charType.value == "magus")
    );
  }

  static isMagus(type, charType) {
    return (type == "npc" && charType == "magusNPC") || (type == "player" && charType == "magus");
  }

  _hasMight() {
    return this.data.type == "npc" && this.data.data.charType.value == "entity";
  }

  _isCompanion() {
    return this.data.type == "player" && this.data.data.charType.value == "companion";
  }

  _isGrog() {
    return this.data.type == "player" && this.data.data.charType.value == "grog";
  }

  _isCharacter() {
    return this.data.type == "player" || this.data.type == "npc" || this.data.type == "beast";
  }

  getAbilityScore(abilityKey, abilityOption = "") {
    if (!this._isCharacter()) {
      return null;
    }
    let ability = this.data.data.abilities.filter(
      (val) => val.data.key == abilityKey && val.data.option == abilityOption
    );

    if (ability.length) {
      return ability[0].data.derivedScore;
    }
    return 0;
  }

  // Vitals management

  loseFatigueLevel(num) {
    this._changeFatigueLevel(num);
  }

  async _changeFatigueLevel(num) {
    if (!this._isCharacter() || (num < 0 && this.data.data.fatigueCurrent == 0)) {
      return;
    }
    let updateData = {};
    let tmp = this.data.data.fatigueCurrent + num;
    let overflow = 0;
    if (tmp < 0) {
      res = 0;
      updateData["data.fatigueCurrent"] = 0;
    } else if (tmp > this.data.data.fatigueMaxLevel) {
      updateData["data.fatigueCurrent"] = this.data.data.fatigueMaxLevel;
      overflow = tmp - this.data.data.fatigueMaxLevel;
    } else {
      updateData["data.fatigueCurrent"] = tmp;
    }

    // fatigue overflow
    switch (overflow) {
      case 0:
        break;
      case 1:
        updateData["data.wound.light.number.value"] = data.wound.light.number.value + 1;
        break;
      case 2:
        updateData["data.wound.medium.number.value"] = data.wound.medium.number.value + 1;
        break;
      case 3:
        updateData["data.wound.heavy.number.value"] = data.wound.heavy.number.value + 1;
        break;
      case 4:
        updateData["data.wound.incap.number.value"] = data.wound.incap.number.value + 1;
        break;
      default:
        updateData["data.wound.dead.number.value"] = data.wound.dead.number.value + 1;
        break;
    }

    await this.update(updateData, {});
  }

  async useConfidencePoint() {
    if (!this._isCharacter()) {
      return false;
    }

    if (this.data.data.con.points == 0) {
      ui.notifications.info(
        game.i18n.format("arm5e.notification.noConfidencePointsLeft", { name: this.data.name }),
        {
          permanent: false
        }
      );
      return false;
    }
    log(false, "Used confidence point");
    await this.update({ data: { con: { points: this.data.data.con.points - 1 } } });
    return true;
  }

  async rest() {
    if (!this._isCharacter()) {
      return;
    }
    let updateData = {};
    updateData["data.fatigueCurrent"] = 0;
    await this.update(updateData, {});
  }

  async loseMightPoints(num) {
    if (!this._isCharacter()) {
      return;
    }
    if (num > this.data.data.might.points) {
      ui.notifications.warn("Spending more might points than available");
      return;
    }
    let updateData = {};
    updateData["data.might.points"] = Number(this.data.data.might.points) - num;
    await this.update(updateData, {});
  }

  // set the proper default icon just before creation
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);
    if (data.img === undefined) {
      if (data.type in CONFIG.ARM5E_DEFAULT_ICONS) {
        const img = CONFIG.ARM5E_DEFAULT_ICONS[data.type];
        if (img)
          await this.data.update({
            img
          });
      }
    }
  }

  async addAgingPoints(amount, char1, char2) {
    if (!this._isCharacter()) {
      return;
    }
    let updateData = {};
    let result = { crisis: false, apparent: 1, charac: {} };
    updateData["data.age.value"] = this.data.data.age.value + 1;
    switch (amount) {
      case 0:
        updateData["data.apparent.value"] = this.data.data.apparent.value + 1;
        break;
      case undefined:
        result.apparent = 0;
        break;
      case 1:
        updateData["data.apparent.value"] = this.data.data.apparent.value + 1;
        updateData["data.decrepitude.points"] = this.data.data.decrepitude.points + 1;
        result.decrepitude = 1;
        result.charac[char1] = { aging: 1 };

        if (
          Math.abs(this.data.data.characteristics[char1].value) <
          this.data.data.characteristics[char1].aging + 1
        ) {
          updateData[`data.characteristics.${char1}.value`] =
            this.data.data.characteristics[char1].value - 1;
          updateData[`data.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`data.characteristics.${char1}.aging`] =
            this.data.data.characteristics[char1].aging + 1;
        }
        if (this.data.data.decrepitude.experienceNextLevel == 1) result.crisis = true;
        break;
      case 2:
        updateData["data.apparent.value"] = this.data.data.apparent.value + 1;
        updateData["data.decrepitude.points"] = this.data.data.decrepitude.points + 2;
        result.decrepitude = 2;
        result.charac[char1] = { aging: 1 };
        result.charac[char2] = { aging: 1 };
        if (
          Math.abs(this.data.data.characteristics[char1].value) <
          this.data.data.characteristics[char1].aging + 1
        ) {
          updateData[`data.characteristics.${char1}.value`] =
            this.data.data.characteristics[char1].value - 1;
          updateData[`data.characteristics.${char1}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`data.characteristics.${char1}.aging`] =
            this.data.data.characteristics[char1].aging + 1;
        }
        if (
          Math.abs(this.data.data.characteristics[char2].value) <
          this.data.data.characteristics[char2].aging + 1
        ) {
          updateData[`data.characteristics.${char2}.value`] =
            this.data.data.characteristics[char2].value - 1;
          updateData[`data.characteristics.${char2}.aging`] = 0;
          result.charac[char1].score = -1;
        } else {
          updateData[`data.characteristics.${char2}.aging`] =
            this.data.data.characteristics[char2].aging + 1;
        }

        if (this.data.data.decrepitude.experienceNextLevel <= 2) result.crisis = true;

        break;
      default: //crisis
        result.crisis = true;
        updateData["data.apparent.value"] = this.data.data.apparent.value + 1;
        updateData["data.decrepitude.points"] =
          this.data.data.decrepitude.points + this.data.data.decrepitude.experienceNextLevel;

        if (
          this.data.data.decrepitude.experienceNextLevel >
          Math.abs(this.data.data.characteristics[char1].value)
        ) {
          updateData[`data.characteristics.${char1}.value`] =
            this.data.data.characteristics[char1].value - 1;
          updateData[`data.characteristics.${char1}.aging`] = 0;
          result.charac[char1] = {
            aging: Math.abs(this.data.data.characteristics[char1].value) + 1,
            score: -1
          };
        } else {
          updateData[`data.characteristics.${char1}.aging`] =
            this.data.data.characteristics[char1].aging +
            this.data.data.decrepitude.experienceNextLevel;
          result.charac[char1] = {
            aging:
              Math.abs(this.data.data.characteristics[char1].value) +
              this.data.data.decrepitude.experienceNextLevel
          };
        }

        result.decrepitude = this.data.data.decrepitude.experienceNextLevel;
    }
    log(false, "Aging effect");
    log(false, updateData);
    if (result.crisis) {
      updateData["data.pendingCrisis"] = true;
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
      const updateData = migrateActorData(this.data);

      if (!isObjectEmpty(updateData)) {
        console.log(`Migrating Actor entity ${this.name}`);
        await this.update(updateData, {
          enforceTypes: false
        });
      }
    } catch (err) {
      err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // TODO improve: what should happen if more that one effect is returned?
  getActiveEffectValue(type, subtype) {
    const ae = ArM5eActiveEffect.findAllActiveEffectsWithSubtype(this.data.effects, subtype);
    if (ae.length) {
      log(false, ae);
      return ae[0].data.changes[0].value;
    }
    return 0;
  }

  hasSkill(key) {
    if (key == "") return false;

    return (
      this.data.data.abilities.find((e) => e.data.key == key && e.data.option == "") != undefined
    );
  }

  getAbilityStats(key, option = "") {
    const ability = this.data.data.abilities.find(
      (e) => e.data.key == key && e.data.option == option
    );
    if (ability) {
      return { score: ability.data.derivedScore, speciality: ability.data.speciality };
    }
    return { score: 0, speciality: "" };
  }
}
