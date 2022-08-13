import { getLabUpkeepCost, log } from "../tools.js";
import { ArM5ePCActor } from "../actor/actor-pc.js";
/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ArM5eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    let itemData = this.data;
    if (this.isOwned && this.actor.data == undefined) {
      // this is a call from constructor, it will be called again with actor data initialied
      // log(false, `Owned Item : ${this.id} : ${this.name}, actor.data= ${this.actor.data}`);
      return;
    }
    let actorData = this.actor ? this.actor.data : {};
    let data = itemData.data;
    if (this.isOwned) {
      if (this.data.type == "weapon" && this.actor != null) {
        let abilitiesSelect = {};

        const temp = {
          id: "",
          name: "N/A"
        };
        abilitiesSelect["a0"] = temp;

        // find the actor abilities and create the select
        for (let [key, i] of Object.entries(actorData.items)) {
          if (i.type === "ability") {
            const temp = {
              id: i.id,
              name: i.name
            };
            //abilitiesSelect.push(temp);
            abilitiesSelect["a" + key] = temp;
          }
        }

        itemData.data.abilities = abilitiesSelect;
      }

      // compute mastery score
      if (this.data.type == "spell") {
        this.data.data.mastery = ArM5ePCActor.getAbilityScoreFromXp(this.data.data.xp);
        this.data.data.experienceNextLevel =
          ((parseInt(this.data.data.mastery) + 1) * (parseInt(this.data.data.mastery) + 2) * 5) /
            2 -
          this.data.data.xp;
      }
    }

    if (this._needLevelComputation()) {
      if (this._isNotMigrated()) {
        return;
      }
      // if base level is 0, the "magicRulesEnforcement" has just been enabled, try to compute the base level
      let recomputeSpellLevel = true;
      if (data.baseLevel == 0 && data.general === false) {
        let newBaseLevel = this.data.data.level;
        let shouldBeRitual = false;
        if (data.range.value) {
          newBaseLevel = this._addSpellMagnitude(
            newBaseLevel,
            -CONFIG.ARM5E.magic.ranges[data.range.value].impact
          );
        }
        if (data.duration.value) {
          newBaseLevel = this._addSpellMagnitude(
            newBaseLevel,
            -CONFIG.ARM5E.magic.durations[data.duration.value].impact
          );
        }
        if (data.target.value) {
          newBaseLevel = this._addSpellMagnitude(
            newBaseLevel,
            -CONFIG.ARM5E.magic.targets[data.target.value].impact
          );
        }
        if (data.complexity) {
          newBaseLevel = this._addSpellMagnitude(newBaseLevel, -data.complexity);
        }
        if (data.enhancingRequisite) {
          newBaseLevel = this._addSpellMagnitude(newBaseLevel, -data.enhancingRequisite);
        }
        if (data.targetSize) {
          newBaseLevel = this._addSpellMagnitude(newBaseLevel, -data.targetSize);
        }
        if (newBaseLevel < 1) {
          // ui.notifications.warn(`Spell named \"${this.name}\" is not strictly following magic theory, its level will be recomputed using a base effect of level 1`, {
          //     permanent: true
          // });
          newBaseLevel = 1;
          this.data.data.baseLevel = 1;
        } else {
          this.data.data.baseLevel = newBaseLevel;

          recomputeSpellLevel = false;
        }
        if (this.data._id != undefined) {
          this.update(
            {
              "data.baseLevel": newBaseLevel
            },
            {}
          );
        }
      }
      if (recomputeSpellLevel) {
        let effectLevel = this.data.data.baseLevel;

        if (data.range.value) {
          effectLevel = this._addSpellMagnitude(
            effectLevel,
            CONFIG.ARM5E.magic.ranges[data.range.value].impact
          );
        }
        if (data.duration.value) {
          effectLevel = this._addSpellMagnitude(
            effectLevel,
            CONFIG.ARM5E.magic.durations[data.duration.value].impact
          );
        }
        if (data.target.value) {
          effectLevel = this._addSpellMagnitude(
            effectLevel,
            CONFIG.ARM5E.magic.targets[data.target.value].impact
          );
        }
        if (data.complexity) {
          effectLevel = this._addSpellMagnitude(effectLevel, data.complexity);
        }
        if (data.targetSize) {
          effectLevel = this._addSpellMagnitude(effectLevel, data.targetSize);
        }
        if (data.enhancingRequisite) {
          effectLevel = this._addSpellMagnitude(effectLevel, data.enhancingRequisite);
        }

        if (
          this.type == "enchantment" ||
          (this.type == "laboratoryText" && this.data.data.type == "enchantment")
        ) {
          effectLevel += parseInt(data.effectfrequency);
          if (data.penetration % 2 == 1) {
            this.data.data.penetration += 1;
          }
          effectLevel += this.data.data.penetration / 2;

          if (data.maintainConc) {
            effectLevel += 5;
          }

          if (data.environmentalTrigger) {
            effectLevel += 3;
          }

          if (data.restrictedUse) {
            effectLevel += 3;
          }

          if (data.linkedTrigger) {
            effectLevel += 3;
          }
        } else {
          let shouldBeRitual = data.ritual;
          // Duration above moon are rituals and rituals are minimum level 20
          if (
            CONFIG.ARM5E.magic.durations[data.duration.value].impact > 3 ||
            data.target.value == "bound" ||
            effectLevel > 50
          ) {
            shouldBeRitual = true;
          }

          if (shouldBeRitual && effectLevel < 20) {
            effectLevel = 20;
          }
          this.data.data.ritual = shouldBeRitual;
        }
        this.data.data.level = effectLevel;
      }

      // compute casting total
      if (this.isOwned) {
        itemData.data.castingTotal = this._computeCastingTotal(actorData, itemData);
      } else {
        itemData.data.castingTotal = 0;
      }
    }
    if (this.type == "labCovenant") {
      let pts = getLabUpkeepCost(data.upkeep);
      this.data.data.points = pts * CONFIG.ARM5E.lab.usage[data.usage].coeff;
    } else if (this.type == "magicItem") {
      this.data.data.maxLevel = 10 * this.data.data.materialBase * this.data.data.sizeMultiplier;
    }
    // log(false,"prepare-item");
    // log(false,itemData);
  }

  prepareDerivedData() {
    // add category to ability

    if (this.isOwned && this.actor.data == undefined) {
      // this is a call from constructor, it will be called again with actor data initialied
      // log(false, `Owned Item : ${this.id} : ${this.name}, actor.data= ${this.actor.data}`);
      return;
    }
    if (this.data.type == "ability") {
      this.data.data.category =
        CONFIG.ARM5E.ALL_ABILITIES[this.data.data.key]?.category ?? "general";
    } else if (this.data.type == "diaryEntry") {
      const systemData = this.data.data;
      if (systemData.optionKey == undefined) {
        systemData.optionKey = "standard";
      }
      if (this.actor !== null && this.actor._isCharacter()) {
        const activityConfig = CONFIG.ARM5E.activities.generic[systemData.activity];

        if (systemData.applied) {
          // keep the existing quality at the time of applying
          // log(false, `Use source quality (${systemData.sourceQuality}) as base for ${this.name}`);
          systemData.baseQuality = systemData.sourceQuality;
        } else {
          // only recompute source quality if the entry is not applied yet
          switch (systemData.activity) {
            case "training": {
              if (systemData.teacher.id === null) {
                systemData.baseQuality = Number(systemData.teacher.score) + 3;
              } else {
                systemData.baseQuality = 0;
                if (
                  Object.values(systemData.progress.abilities).length +
                    Object.values(systemData.progress.spells).length ===
                  1
                ) {
                  if (Object.values(systemData.progress.abilities).length > 0) {
                    systemData.baseQuality =
                      Number(systemData.progress.abilities[0].teacherScore) + 3;
                  } else {
                    systemData.baseQuality = Number(systemData.progress.spells[0].teacherScore) + 3;
                  }
                }
              }
              break;
            }
            case "teaching": {
              systemData.baseQuality = systemData.teacher.teaching + systemData.teacher.com + 6;
              if (systemData.teacher.applySpec) {
                systemData.baseQuality++;
              }
              break;
            }
            case "practice":
            case "exposure": {
              systemData.baseQuality = activityConfig.source.default;
              break;
            }
            case "adventuring":
              {
                systemData.baseQuality = systemData.sourceQuality;
              }
              break;
            default:
              break;
          }
          // if (activityConfig.bonusOptions != null) {
          //   systemData.sourceQuality += activityConfig.bonusOptions[systemData.optionKey].modifier;
          // }
          // if (this.actor.data.data.bonuses.activities[systemData.activity] !== undefined) {
          //   systemData.aeBonus = this.actor.data.data.bonuses.activities[systemData.activity];
          //   systemData.sourceQuality += Number(systemData.aeBonus);
          // }
        }
      }
    }
  }

  _needLevelComputation() {
    let enforceEnchantmentLevel =
      this.type == "laboratoryText" &&
      (this.data.data.type == "spell" || this.data.data.type == "enchantment");
    return (
      this.type == "magicalEffect" ||
      this.type == "enchantment" ||
      this.type == "spell" ||
      enforceEnchantmentLevel
    );
  }

  _isMagicalEffect() {
    return this.type == "magicalEffect" || this.type == "enchantment" || this.type == "spell";
  }

  // to tell whether a spell needs to be migrated
  _isNotMigrated() {
    if (
      this.data.data.range.value === undefined ||
      this.data.data.duration.value === undefined ||
      this.data.data.target.value === undefined
    ) {
      console.warn(
        `The spell ${this.name} has not been migrated, please trigger a manual migration!`
      );
      return true;
    }
    if (
      CONFIG.ARM5E.magic.ranges[this.data.data.range.value] === undefined ||
      CONFIG.ARM5E.magic.durations[this.data.data.duration.value] === undefined ||
      CONFIG.ARM5E.magic.targets[this.data.data.target.value] === undefined
    ) {
      // if those values are not defined, this spell hasn't been migrated, no need to attempt to compute anything

      console.warn(
        `The spell ${this.name} has not been migrated, please trigger a manual migration!`
      );
      return true;
    }
    return false;
  }

  // return a localize string of a magic effect attributes
  _getEffectAttributesLabel() {
    if (!this._isMagicalEffect()) return "";
    let label =
      "( " +
      this._getTechLabel() +
      " " +
      this._getFormLabel() +
      " " +
      this.data.data.level +
      " ) - " +
      game.i18n.localize("arm5e.spell.range.short") +
      ": " +
      game.i18n.localize(CONFIG.ARM5E.magic.ranges[this.data.data.range.value].label) +
      " " +
      game.i18n.localize("arm5e.spell.duration.short") +
      ": " +
      game.i18n.localize(CONFIG.ARM5E.magic.durations[this.data.data.duration.value].label) +
      " " +
      game.i18n.localize("arm5e.spell.target.short") +
      ": " +
      game.i18n.localize(CONFIG.ARM5E.magic.targets[this.data.data.target.value].label);
    return label;
  }

  _getTechLabel() {
    let label = CONFIG.ARM5E.magic.arts[this.data.data.technique.value].short;
    let techReq = Object.entries(this.data.data["technique-req"]).filter(r => r[1] === true);
    if (techReq.length > 0) {
      label += " (";
      techReq.forEach(key => {
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last whitespace
      label = label.substring(0, label.length - 1);
      label += ")";
    }
    return label;
  }

  _getFormLabel() {
    let label = CONFIG.ARM5E.magic.arts[this.data.data.form.value].short;
    let formReq = Object.entries(this.data.data["form-req"]).filter(r => r[1] === true);
    if (formReq.length > 0) {
      label += " (";
      formReq.forEach(key => {
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last whitespace
      label = label.substring(0, label.length - 1);
      label += ")";
    }

    return label;
  }

  _getTechniqueData(actorData) {
    if (!this._isMagicalEffect()) return ["", 0];

    let label = CONFIG.ARM5E.magic.techniques[this.data.data.technique.value].label;
    let tech = 1000;
    let techReq = Object.entries(this.data.data["technique-req"]).filter(r => r[1] === true);
    if (techReq.length > 0) {
      label += " (";
      techReq.forEach(key => {
        tech = Math.min(tech, actorData.data.arts.techniques[key[0]].finalScore);
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last whitespace
      label = label.substring(0, label.length - 1);
      label += ")";
      tech = Math.min(
        actorData.data.arts.techniques[this.data.data.technique.value].finalScore,
        tech
      );
    } else {
      tech = actorData.data.arts.techniques[this.data.data.technique.value].finalScore;
    }

    return [label, tech];
  }
  _getFormData(actorData) {
    if (!this._isMagicalEffect()) return ["", 0];

    let label = CONFIG.ARM5E.magic.forms[this.data.data.form.value].label;
    let form = 1000;
    let formReq = Object.entries(this.data.data["form-req"]).filter(r => r[1] === true);
    if (formReq.length > 0) {
      label += " (";
      formReq.forEach(key => {
        form = Math.min(form, actorData.data.arts.forms[key[0]].finalScore);
        label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
      });
      // remove last comma
      label = label.substring(0, label.length - 1);
      label += ")";
      form = Math.min(actorData.data.arts.forms[this.data.data.form.value].finalScore, form);
    } else {
      form = actorData.data.arts.forms[this.data.data.form.value].finalScore;
    }

    return [label, form];
  }

  _addSpellMagnitude(base, num) {
    if (num == 0) {
      return base;
    }
    // in case base is a string
    base = parseInt(base);
    if (num > 0) {
      // log(false, `Adding ${num} magnitudes from ${base}`);
      if (base + num <= 5) {
        return base + num;
      }
      let loop = num;
      let res = base;
      while (loop > 0) {
        if (res < 5) {
          res++;
        } else {
          res = res + 5;
        }
        loop--;
      }
      return res;
    } else {
      log(false, `Adding ${num} magnitudes from ${base}`);
      if (base + num <= 1) {
        return base + num;
      }
      let loop = num;
      let res = base;
      while (loop < 0) {
        if (res <= 5) {
          res--;
        } else {
          res = res - 5;
        }
        loop++;
      }
      log(false, `returns ${res}`);
      return res;
    }
  }

  _computeCastingTotal(actorData, itemData) {
    if (actorData.type != "player" && actorData.type != "npc") {
      return 0;
    }
    let res = actorData.data.characteristics.sta.value;
    let tech = 1000;
    let form = 1000;
    let focusBonus = 0;

    let techReq = Object.entries(itemData.data["technique-req"]).filter(r => r[1] === true);
    let formReq = Object.entries(itemData.data["form-req"]).filter(r => r[1] === true);

    if (techReq.length > 0) {
      techReq.forEach(key => {
        tech = Math.min(tech, actorData.data.arts.techniques[key[0]].finalScore);
      });

      tech = Math.min(
        actorData.data.arts.techniques[itemData.data.technique.value].finalScore,
        tech
      );
    } else {
      tech = actorData.data.arts.techniques[itemData.data.technique.value].finalScore;
    }
    if (formReq.length > 0) {
      formReq.forEach(key => {
        form = Math.min(tech, actorData.data.arts.forms[key[0]].finalScore);
      });
      form = Math.min(actorData.data.arts.forms[itemData.data.form.value].finalScore, form);
    } else {
      form = actorData.data.arts.forms[itemData.data.form.value].finalScore;
    }
    if (itemData.data.applyFocus) {
      res += tech + form + Math.min(tech, form);
    } else {
      res += tech + form;
    }
    if (itemData.data.mastery) {
      res += itemData.data.mastery;
    }

    // log(false, `Casting total: ${res}`)
    return res;
  }

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

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    let roll = new Roll("d20+@abilities.str.mod", actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({
        actor: this.actor
      }),
      flavor: label
    });
  }
}
