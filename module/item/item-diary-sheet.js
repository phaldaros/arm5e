import { debug, getDataset, log } from "../tools.js";
import { ArM5eItemSheet } from "./item-sheet.js";
import {
  agingRoll,
  genericValidationOfActivity,
  getNewTitleForActivity
} from "../helpers/long-term-activities.js";
import { ArM5eItem } from "./item.js";
import { ActivitySchedule } from "../tools/activity-schedule.js";
import { UI, getConfirmation } from "../constants/ui.js";
import { DiaryEntrySchema } from "../schemas/diarySchema.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemDiarySheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800,
      dragDrop: [
        { dragSelector: null, dropSelector: ".progress-teacher" },
        { dragSelector: null, dropSelector: ".progress-abilities" },
        { dragSelector: null, dropSelector: ".progress-newspell" }
      ],
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        },
        {
          navSelector: ".diary-tabs",
          contentSelector: ".diary-body",
          initial: "abilities"
        }
      ]
    });
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    if (data.type == "Actor" && event.currentTarget.dataset.tab === "teacher") {
      if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
        if (data.id == this.actor.id) {
          ui.notifications.info(game.i18n.localize("arm5e.activity.msg.selfTeaching"));
          return;
        }
        const actor = await Actor.implementation.fromDropData(data);
        if (actor._isCharacter()) await this._setTeacher(actor);
      }
    } else if (data.type == "Item") {
      if (event.currentTarget.dataset.tab === "abilities") {
        const item = await Item.implementation.fromDropData(data);
        if (item.type === "ability") {
          if (this.item.system.activity === "teaching" || this.item.system.activity === "training")
            return;

          log(false, `Ability ${item.name} added`);
          this._addAbility(item);
        }
      } else {
        if (event.currentTarget.dataset.drop === "newspell") {
          const item = await Item.implementation.fromDropData(data);
          if (item.type === "laboratoryText") {
            if (item.system.type !== "spell") return;
          } else if (item.type !== "spell") {
            return;
          }
          await this._addNewSpell(item);
        }
      }
    }
  }
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();
    const actType = context.system.activity;
    context.firstSeason = context.system.dates[0];
    context.lastSeason = context.system.dates[context.system.dates.length - 1];
    if (context.system.duration > 1) {
      context.ui.editDate = "disabled";
    }
    if (this.actor == null || this.actor.type == "covenant" || this.actor.type == "laboratory") {
      context.ui.showTab = false;
      context.system.disabled = "disabled";
      return context;
    }

    // if (context.system.year == "") {
    //   // supposedly the first time a diary entry is created
    //   context.system.year = this.actor.system.datetime.year;
    //   context.system.season = this.actor.system.datetime.season;
    // }

    const activityConfig = CONFIG.ARM5E.activities.generic[actType];

    // legacy diary or just a simple recounting of events
    if (actType == "none" || actType == "recovery") {
      context.ui.showTab = false;
      return context;
    }
    context.rollNeeded = false;
    if (activityConfig.roll && !context.system.done) {
      context.rollNeeded = true;
      context.rollLabel = activityConfig.roll.label;
    }

    // configuration
    context.enforceSchedule = game.settings.get("arm5e", "enforceSchedule");
    let hasTeacher = actType == "training" || actType == "teaching";
    context.system.sourceBonus = 0;
    context.ui.showTab = activityConfig.display.tab;
    context.ui.showProgress = activityConfig.display.progress;
    context.ui.showAbilities = activityConfig.display.abilities && !context.rollNeeded;
    context.ui.showArts = activityConfig.display.arts && !context.rollNeeded;
    context.ui.showMasteries = activityConfig.display.masteries && !context.rollNeeded;
    context.ui.showNewSpells = activityConfig.display.spells && !context.rollNeeded;

    context.ui.showTeacher = hasTeacher;
    context.ui.showBaseQuality = hasTeacher;
    context.ui.editSource = true;
    context.ui.bonusOptions = false;

    context.system.applyPossible = true;
    context.system.applyError = "";
    context.system.applyInfo = "";
    context.system.errorParam = "";
    context.system.infoParam = "";

    if (this.actor.system.pendingCrisis) {
      context.system.applyError = "arm5e.notification.pendingCrisis";
      context.system.disabled = "disabled";
      return context;
    }

    genericValidationOfActivity(context, this.actor, this.item);

    let hasScheduleConflict =
      this.item.isOwned && this.item.system.hasScheduleConflict(this.item.actor);

    if (hasScheduleConflict && context.enforceSchedule) {
      context.system.applyError = "arm5e.activity.msg.scheduleConflict";
      context.astrolabIconStyle = 'style="text-shadow: 0 0 10px red"';
      context.system.applyPossible = false;
    }

    if (context.system.done) {
      context.system.applyPossible = false;
    }

    if (activityConfig.source.readonly && !context.system.done) {
      context.system.sourceQuality = context.system.baseQuality;
      context.ui.editSource = false;
      context.system.sourceDefault = activityConfig.source.default;
    }

    if (activityConfig.bonusOptions != null && !context.system.done) {
      context.ui.bonusOptions = true;
      context.bonusOptions = activityConfig.bonusOptions;
      context.system.sourceBonus = activityConfig.bonusOptions[context.system.optionKey].modifier;
      context.system.sourceQuality += context.system.sourceBonus;
    }
    context.system.aeBonus = 0;
    if (this.actor.system.bonuses.activities[actType] !== undefined && !context.system.done) {
      context.system.aeBonus = this.actor.system.bonuses.activities[actType];
    }

    if (this.actor._isMagus()) {
      context.ui.showMagicProgress = true;
    }

    if (!context.system.progress) {
      context.system.progress = {};
    }

    // create the actor abilities tree
    context.system.ownedAbilities = {};
    context.system.defaultAbility = "";
    context.system.teacherScore = 0;
    context.system.ownedSpells = {};
    context.system.defaultArt = "";
    context.system.ownedArts = [];
    context.system.defaultSpellMastery = "";

    context.system.canEdit = "";
    context.system.disabled = "";

    context.system.canEditTeacher = "";
    context.system.disabledTeacher = "";
    // context.system.canEditBook = "";
    // context.system.disabledBook = "";

    if (context.system.done) {
      context.system.canEdit = "readonly";
      context.system.canEditTeacher = "readonly";
      context.system.disabledTeacher = "disabled";
      // context.system.canEditBook = "readonly";
      // context.system.disabledBook = "disabled";
      context.system.disabled = "disabled";
      context.ui.editDate = "disabled";
    }
    if (actType === "reading") {
      context.system.disabled = "disabled";
      context.system.canEdit = "readonly";
      context.ui.showBaseQuality = true;
    }

    if (!context.system.cappedGain) {
      context.system.cappedGain = false;
    }
    if (
      context.system.theoriticalSource !== undefined &&
      context.system.theoriticalSource !== context.system.sourceQuality
    ) {
      context.system.cappedGain = true;
      context.system.applyError = "arm5e.activity.msg.gainCapped";
    }

    context.system.teacherLinked = this.item.system.teacher.id !== null;
    let teacher;

    if (hasTeacher) {
      // do some checks on the teacher/trainer
      if (context.system.teacherLinked) {
        context.system.canEditTeacher = "readonly";
        context.system.disabledTeacher = "disabled";
        // check trainer/teacher exists
        teacher = game.actors.get(this.item.system.teacher.id);
        if (teacher === undefined) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = false;
          if (actType === "training") {
            context.system.applyError = "arm5e.activity.msg.noTrainer";
          } else {
            context.system.applyError = "arm5e.activity.msg.noTeacher";
          }
          context.system.errorParam = "";
          return context;
        }
        // if teacher is not a Magus, he/she cannot teach spell masteries and arts
        if (teacher !== undefined && !teacher._isMagus()) {
          context.ui.showMagicProgress = false;
        }
      } else {
        if (context.system.teacher.score < 2) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = false;
          context.system.applyError = "arm5e.activity.msg.uselessTeacher";
          context.system.errorParam =
            context.system.teacher.name === ""
              ? game.i18n.localize("arm5e.activity.teacher.label")
              : context.system.teacher.name;
          return context;
        }
      }
    }
    context.system.canProgress = { abilities: true, arts: true, spells: true };
    if (context.ui.showAbilities) {
      this.retrieveAbilities(context, teacher);
      if (foundry.utils.isEmpty(context.system.ownedAbilities)) {
        context.system.canProgress.abilities = false;
      }
    }
    if (context.ui.showMagicProgress) {
      if (context.ui.showArts) {
        this.retrieveArts(context, teacher);
        if (foundry.utils.isEmpty(context.system.ownedArts)) {
          context.system.canProgress.arts = false;
        }
      }
      if (context.ui.showMasteries) {
        this.retrieveSpellMasteries(context, teacher);
        if (foundry.utils.isEmpty(context.system.ownedSpells)) {
          context.system.canProgress.spells = false;
        }
      }
    }

    if (hasTeacher) {
      if (
        foundry.utils.isEmpty(context.system.ownedAbilities) &&
        foundry.utils.isEmpty(context.system.ownedArts) &&
        foundry.utils.isEmpty(context.system.ownedSpells)
      ) {
        context.system.applyError = "arm5e.activity.msg.uselessTeacher";
        context.system.errorParam =
          context.system.teacher.name === ""
            ? game.i18n.localize("arm5e.activity.teacher.label")
            : context.system.teacher.name;
        context.system.applyPossible = false;
      }
    }

    // let totalProgressItems =
    //   context.system.progress.abilities.length +
    //   context.system.progress.arts.length +
    //   context.system.progress.spells.length;

    if (!context.system.done && !context.system.cappedGain) {
      context.system.sourceQuality += Number(context.system.aeBonus);
    }
    //
    if (!context.system.done && this.actor.system.penalties.activityDivider != 1) {
      context.system.sourceQuality /= this.actor.system.penalties.activityDivider;
      context.system.applyError = "arm5e.activity.msg.sourceQualityHalved";
      context.system.errorParam = "";
    }
    if (activityConfig.validation != null) {
      activityConfig.validation(context, this.actor, this.item);
    }

    log(false, "ITEM-DIARY-sheet get data");
    log(false, context);
    return context;
  }

  retrieveAbilities(context, teacher) {
    let availableAbilities = this.actor.system.abilities;
    const actType = context.system.activity;
    const hasTeacher = context.ui.showTeacher;
    // additionnal filtering based on the teacher skills
    if (hasTeacher) {
      if (context.system.teacherLinked) {
        context.system.aeBonus += teacher.system.bonuses.activities.teacher;
        context.teacherAbilities = teacher.system.abilities.filter((e) => {
          return e.system.finalScore >= 2;
        });
        availableAbilities = this.actor.system.abilities.filter((e) => {
          return context.teacherAbilities.some((filter) => {
            if (context.system.done)
              // for rollback, the item must still be there
              return filter.system.key === e.system.key && filter.system.option === e.system.option;
            else
              return (
                filter.system.key === e.system.key &&
                filter.system.option === e.system.option &&
                filter.system.finalScore > e.system.finalScore
              );
          });
        });
      } else {
        availableAbilities = this.actor.system.abilities.filter((e) => {
          return e.system.finalScore < context.system.teacher.score;
        });
      }
    }

    let firstAb = true;
    // for each progressed ability, list the category and abilities available
    for (const ability of availableAbilities) {
      let teacherScore = 0;
      if (hasTeacher) {
        if (context.system.teacher.id === null) {
          teacherScore = context.system.teacher.score ?? 0;
        } else {
          let teacherAbility = context.teacherAbilities.find((e) => {
            return e.system.key === ability.system.key && e.system.option === ability.system.option;
          });
          teacherScore = teacherAbility.system.finalScore;
        }
      }
      // add category if it was not created yet
      if (context.system.ownedAbilities[ability.system.category] == undefined)
        context.system.ownedAbilities[ability.system.category] = [];
      let tmp = {
        id: ability._id,
        category: ability.system.category,
        name: ability.name,
        key: ability.system.key,
        currentXp: ability.system.xp,
        score: ability.system.finalScore,
        option: ability.system.option,
        teacherScore: teacherScore
      };
      if (firstAb) {
        let filteredList = Object.values(context.system.progress.abilities).filter((e) => {
          return e.id === ability._id;
        });
        if (
          // if ability doesn't exist in current items, set it as next default
          filteredList.length === 0
        ) {
          context.system.defaultAbility = ability._id;
          context.system.teacherScore = teacherScore;
          firstAb = false;
        }
      }
      context.system.ownedAbilities[ability.system.category].push(tmp);
    }

    // Fill missing abilities and update teacher score
    for (let a of context.system.progress.abilities) {
      if (context.system.teacher.id === null) {
        a.teacherScore = context.system.teacher.score ?? 0;
      } else {
        let teacherAbility = context.teacherAbilities.find((e) => {
          return e.system.key === a.key && e.system.option === a.option;
        });
        a.teacherScore = teacherAbility.system.finalScore;
      }
      if (context.system.ownedAbilities[a.category] == undefined) {
        context.system.ownedAbilities[a.category] = [];
        context.system.ownedAbilities[a.category].push({
          id: a.id,
          category: a.category,
          name: CONFIG.ARM5E.LOCALIZED_ABILITIES[a.key].label,
          key: a.key,
          currentXp: a.xp,
          option: a.option,
          teacherScore: a.teacherScore
        });
      } else {
        let oa = context.system.ownedAbilities[a.category].find((e) => {
          return e.id == a.id;
        });
        if (oa === undefined) {
          context.system.ownedAbilities[a.category].push({
            id: a.id,
            category: a.category,
            name: CONFIG.ARM5E.LOCALIZED_ABILITIES[a.key].label,
            key: a.key,
            currentXp: a.xp,
            option: a.option,
            teacherScore: a.teacherScore
          });
        }
      }
    }
  }

  retrieveArts(context, teacher) {
    const hasTeacher = context.ui.showTeacher;
    if (context.ui.showArts) {
      // Arts
      let availableArts = [];
      if (hasTeacher) {
        // get the arts the teacher is skilled enough in to teach
        if (context.system.teacherLinked) {
          let teacherTechniques = Object.entries(teacher.system.arts.techniques)
            .filter((e) => {
              if (context.system.done) {
                return e[1].finalScore >= 5;
              } else {
                return (
                  e[1].finalScore >= 5 &&
                  e[1].finalScore > this.actor.system.arts.techniques[e[0]].finalScore
                );
              }
            })
            .map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.techniques[e[0]].finalScore,
                teacherScore: e[1].finalScore
              };
            });

          let teacherForms = Object.entries(teacher.system.arts.forms)
            .filter((e) => {
              if (context.system.done) {
                return e[1].finalScore >= 5;
              } else {
                return (
                  e[1].finalScore >= 5 &&
                  e[1].finalScore > this.actor.system.arts.forms[e[0]].finalScore
                );
              }
            })
            .map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.forms[e[0]].finalScore,
                teacherScore: e[1].finalScore
              };
            });

          availableArts = teacherTechniques.concat(teacherForms);
        } else {
          let teacherScore = 0;
          if (hasTeacher && context.system.teacher.id === null) {
            teacherScore = context.system.teacher.score ?? 0;
          }
          if (teacherScore < 5) {
            // must have a score of 5 to teach an Art
            availableArts = [];
          } else {
            let actorTechniques = Object.entries(this.actor.system.arts.techniques).map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.techniques[e[0]].finalScore,
                teacherScore: teacherScore
              };
            });

            let actorForms = Object.entries(this.actor.system.arts.forms).map((e) => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.forms[e[0]].finalScore,
                teacherScore: teacherScore
              };
            });

            availableArts = actorTechniques.concat(actorForms);
            availableArts = availableArts.filter((e) => {
              return e.score < context.system.teacher.score;
            });
          }
        }
      } else {
        availableArts = [
          ...Object.entries(this.actor.system.arts.techniques).map((e) => {
            return {
              key: e[0],
              score: e[1].finalScore,
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              teacherScore: 0
            };
          }),
          ...Object.entries(this.actor.system.arts.forms).map((e) => {
            return {
              key: e[0],
              score: e[1].finalScore,
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              teacherScore: 0
            };
          })
        ];
      }

      let firstArt = true;
      for (const art of Object.values(availableArts)) {
        if (firstArt) {
          let filteredList = Object.values(context.system.progress.arts).filter((e) => {
            return e.key === art.key;
          });
          if (
            // if art doesn't exist in current items, set it as next default
            filteredList.length === 0
          ) {
            context.system.defaultArt = art.key;
            context.system.teacherScore = art.teacherScore;
            firstArt = false;
          }
        }
        context.system.ownedArts.push(art);
      }

      // Fill missing arts and update teacher score
      for (let a of context.system.progress.arts) {
        if (context.system.teacher.id === null) {
          a.teacherScore = context.system.teacher.score ?? 0;
        } else {
          let teacherArt = teacher.getArtStats(a.key).finalScore;
          a.teacherScore = teacherArt;
        }
      }
    }
  }

  retrieveSpellMasteries(context, teacher) {
    const hasTeacher = context.ui.showTeacher;
    let availableSpells = this.actor.system.spells;
    if (hasTeacher) {
      if (context.system.teacherLinked) {
        context.teacherMasteries = teacher.system.spells.filter((e) => {
          return e.system.mastery >= 2;
        });
        availableSpells = this.actor.system.spells.filter((e) => {
          return context.teacherMasteries.some((filter) => {
            if (context.system.done) {
              return (
                // for rollback, the item must still be there
                filter.name === e.name &&
                filter.system.technique.value === e.system.technique.value &&
                filter.system.form.value === e.system.form.value
              );
            } else {
              return (
                filter.name === e.name &&
                filter.system.technique.value === e.system.technique.value &&
                filter.system.form.value === e.system.form.value &&
                filter.system.mastery > e.system.mastery
              );
            }
          });
        });
      } else {
        // if unlinked teacher any available spell with a mastery below the teacher score is valid.
        availableSpells = this.actor.system.spells.filter((e) => {
          return e.system.mastery < context.system.teacher.score;
        });
      }
    }
    let firstSpell = true;
    for (const spell of availableSpells) {
      let teacherScore = 0;
      if (hasTeacher) {
        if (context.system.teacher.id === null) {
          teacherScore = context.system.teacher.score ?? 0;
        } else {
          let teacherSpell = context.teacherMasteries.find((e) => {
            return (
              e.system.technique.value === spell.system.technique.value &&
              e.system.form.value === spell.system.form.value &&
              e.name === spell.name
            );
          });
          teacherScore = teacherSpell.system.mastery;
        }
      }
      if (context.system.ownedSpells[spell.system.form.value] == undefined)
        context.system.ownedSpells[spell.system.form.value] = [];
      let tmp = {
        id: spell._id,
        form: spell.system.form.value,
        name: spell.name,
        currentXp: spell.system.xp,
        score: spell.system.mastery,
        teacherScore: teacherScore
      };
      if (firstSpell) {
        let filteredList = Object.values(context.system.progress.spells).filter((e) => {
          return e.id === spell._id;
        });
        if (
          // if spell doesn't exist in current items, set it as next default
          filteredList.length === 0
        ) {
          context.system.defaultSpellMastery = spell._id;
          context.system.teacherScore = teacherScore;
          firstSpell = false;
        }
      }
      context.system.ownedSpells[spell.system.form.value].push(tmp);
    }
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 500;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    html.find(".progress-control").click(this._onProgressControl.bind(this));
    html.find(".progress-category").change(this._setCategory.bind(this));
    html.find(".progress-ability").change(this._setAbility.bind(this));
    html.find(".progress-art").change(this._setArt.bind(this));
    html.find(".progress-apply").click(this._onProgressApply.bind(this));
    html.find(".progress-rollback").click(this._onProgressRollback.bind(this));
    html.find(".progress-activity").change(this._setActivity.bind(this));
    html.find(".progress-refresh").click(this._refresh.bind(this));

    html.find(".progress-xp").change(this._setXp.bind(this));
    html.find(".break-link").click(this._resetTeacher.bind(this));
    html.find(".score-teacher").change(this._changeTeacherScore.bind(this));
    html.find(".show-details").click(async (event) => this._showSpell(this.item, event));
    html.find(".select-dates").click(this.displayCalendar.bind(this));
    html.find(".roll-activity").click(async (event) => await this.rollActivity());
    // html.find(".select-year").click(this._selectYear.bind(this));
  }

  async _refresh(event) {
    event.preventDefault();
    this.render(true);
  }
  async rollActivity() {
    const activityConfig = CONFIG.ARM5E.activities.generic[this.item.system.activity];
    if (activityConfig.roll) {
      await activityConfig.roll.action(this.item);
    }
  }

  async _resetTeacher(event) {
    const target = event.currentTarget;
    if (this.item.system.done) {
      return;
    }
    let updateData = {};
    updateData["system.teacher.id"] = null;
    updateData[`system.progress.abilities`] = [];
    updateData[`system.progress.arts`] = [];
    updateData[`system.progress.spells`] = [];
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _changeTeacherScore(event) {
    if (this.item.system.done) {
      return;
    }
    const target = event.currentTarget;
    const newScore = Number($(target).val());
    let updateData = {};
    updateData["system.teacher.score"] = newScore;

    for (let a of this.item.system.progress.abilities) {
      a.teacherScore = newScore;
    }
    for (let a of this.item.system.progress.arts) {
      a.teacherScore = newScore;
    }
    for (let a of this.item.system.progress.spells) {
      a.teacherScore = newScore;
    }

    updateData[`system.progress.abilities`] = this.item.system.progress.abilities;
    updateData[`system.progress.arts`] = this.item.system.progress.arts;
    updateData[`system.progress.spells`] = this.item.system.progress.spells;
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setXp(event) {
    event.preventDefault();
    const target = event.currentTarget;
  }

  async _setActivity(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const actType = $(target).val();
    // just reset some fields so the new default can be set
    let updateData = {};
    updateData["system.sourceQuality"] = 0;
    if (CONFIG.ARM5E.activities.generic[actType].display.abilities === false) {
      updateData["system.progress.abilities"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.arts === false) {
      updateData["system.progress.arts"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.masteries === false) {
      updateData["system.progress.spells"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.spells === false) {
      updateData["system.progress.newSpells"] = [];
    }

    updateData["system.sourceQuality"] = CONFIG.ARM5E.activities.generic[actType].source.default;
    if (CONFIG.ARM5E.activities.generic[actType].duration) {
      updateData["system.duration"] = CONFIG.ARM5E.activities.generic[actType].duration;
      updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
        CONFIG.ARM5E.activities.generic[actType].duration,
        this.item.system.dates[0].year,
        this.item.system.dates[0].season
      );
    } else {
      updateData["system.duration"] = 1;
      updateData["system.dates"] = DiaryEntrySchema.buildSchedule(
        1,
        this.item.system.dates[0].year,
        this.item.system.dates[0].season
      );
    }
    updateData["img"] =
      CONFIG.ACTIVITIES_DEFAULT_ICONS[actType] ?? CONFIG.ARM5E_DEFAULT_ICONS[diaryEntry];
    switch (actType) {
      case "none":
        this._tabs[0].activate("description");
        break;
      default:
        this._tabs[0].activate("advanced");
        break;
    }
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _onProgressApply(event) {
    event?.preventDefault();
    let description = this.item.system.description + "<h4>Technical part:<h4><ol>";
    let updateData = [];
    let sourceQuality = 0;

    if (this.item.system.done) {
      // no idea how it got there:
      log(false, "WARNING: something weird is happening");
      return;
    }

    // First double check if the situation has changed
    let context = await this.getData();
    if (!context.system.applyPossible) {
      ui.notifications.warn(game.i18n.localize("arm5e.notification.situationHasChanged"));
      this.render(true);
      return;
    }

    switch (this.item.system.activity) {
      case "learnSpell":
      case "inventSpell":
      case "visExtraction":
      case "visStudy":
        for (let dependency of this.item.system.externalIds) {
          if (game.actors.has(dependency.actorId)) {
            let actor = game.actors.get(dependency.actorId);
            if (actor.items.has(dependency.itemId)) {
              if (dependency.flags == 1) {
                // resource update
                let item = actor.items.get(dependency.itemId);
                let label = `system.${dependency.data.amountLabel}`;
                await item.update(
                  { [label]: item.system[dependency.data.amountLabel] - dependency.data.amount },
                  { parent: actor }
                );
              }
            }
          }
        }

      case "adventuring":
      case "exposure":
      case "practice":
      case "training":
      case "teaching":
      case "reading":
      case "hermeticApp":
      case "childhood":
      case "laterLife":
      case "laterLifeMagi":
        for (const ab of Object.values(this.item.system.progress.abilities)) {
          // ignore 0 xp gain
          if (ab.xp == 0) {
            continue;
          }
          // check that ability still exists
          let ability = this.actor.items.get(ab.id);
          if (ability == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
              permanent: false
            });
            return;
          }
          let data = {
            _id: ab.id,
            system: {
              xp: ability.system.xp + ab.xp
            }
          };
          description += `<li>${game.i18n.format("arm5e.activity.descItem", {
            item: ability.name,
            xp: ab.xp
          })}</li>`;
          log(false, `Added ${ab.xp} to ${ability.name}`);
          sourceQuality += ab.xp;
          updateData.push(data);
        }
        for (const s of Object.values(this.item.system.progress.spells)) {
          // ignore 0 xp gain
          if (s.xp == 0) {
            continue;
          }
          // check that spell still exists
          let spell = this.actor.items.get(s.id);
          if (spell == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
              permanent: false
            });
            return;
          }
          let data = {
            _id: s.id,
            system: {
              xp: spell.system.xp + s.xp
            }
          };
          description += `<li>${game.i18n.format("arm5e.activity.descItem", {
            item: spell.name,
            xp: s.xp
          })}</li>`;
          log(false, `Added ${s.xp} to ${spell.name}`);
          sourceQuality += s.xp;
          updateData.push(data);
        }

        let actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
        for (const a of Object.values(this.item.system.progress.arts)) {
          // ignore 0 xp gain
          if (a.xp == 0) {
            continue;
          }
          let artType = "techniques";
          if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
            artType = "forms";
          }
          actorUpdate.system.arts[artType][a.key] = {};
          actorUpdate.system.arts[artType][a.key].xp =
            this.actor.system.arts[artType][a.key].xp + a.xp;
          description += `<li>${game.i18n.format("arm5e.activity.descItem", {
            item: game.i18n.localize(CONFIG.ARM5E.magic.arts[a.key].label),
            xp: a.xp
          })}</li>`;
          log(false, `Added ${a.xp} to ${a.key}`);
          sourceQuality += a.xp;
        }
        let newSpells = [];
        for (const a of Object.values(this.item.system.progress.newSpells)) {
          let spell = {
            name: a.name,
            type: "spell",
            img: a.img,
            system: a.spellData
          };
          spell.type = "spell";
          spell.system.applyFocus = false;
          spell.system.bonus = 0;
          spell.system.bonusDesc = "";
          spell.system.xp = 0;
          spell.system.masteries = "";
          description += `<li>${game.i18n.localize("arm5e.activity.newSpell")} : ${
            spell.name
          }</li>`;

          newSpells.push(spell);
          // TODO check why level is there instead of system
          sourceQuality += a.level;
        }
        const newlyCreated = await this.actor.createEmbeddedDocuments("Item", newSpells, {
          render: false
        });
        if (newlyCreated.length > 0) {
          let spellsToBeLearned = this.item.system.progress.newSpells;
          let ii = 0;
          for (const s of newlyCreated) {
            spellsToBeLearned[ii].id = s._id;
            ii++;
          }
        }

        description += "</ol>";
        // }
        let newTitle = getNewTitleForActivity(this.actor, this.item);

        await this.item.update(
          {
            name: newTitle,

            system: {
              done: true,
              description: description,
              sourceQuality: sourceQuality,
              progress: this.item.system.progress
            }
          },
          { render: true }
        );

        await this.actor.updateEmbeddedDocuments("Item", updateData, { render: true });
        await this.actor.update(actorUpdate, { render: true });
    }
  }

  async _onProgressRollback(event) {
    event.preventDefault();
    // this.render();
    if (!this.item.system.done) {
      // no idea how it got there:
      log(false, "WARNING: something weird is happening");
      return;
    }

    const question = game.i18n.localize("arm5e.dialog.rollback-question");
    let itemId = this.item._id;
    let confirm = await getConfirmation(
      this.item.name,
      question,
      ArM5eActorSheet.getFlavor(this.item.actor?.type)
    );
    if (!confirm) {
      return;
    }

    const actor = this.actor;
    let updateData = [];
    switch (this.item.system.activity) {
      case "recovery":
        // delete the diary entry
        await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
        return;

      case "learnSpell":
      case "inventSpell":
      case "visExtraction":
      case "visStudy":
        for (let dependency of this.item.system.externalIds) {
          if (game.actors.has(dependency.actorId)) {
            let actor = game.actors.get(dependency.actorId);
            if (actor.items.has(dependency.itemId)) {
              if (dependency.flags == 0)
                // delete
                await actor.deleteEmbeddedDocuments("Item", [dependency.itemId], {});
              else if (dependency.flags == 1) {
                // resource update
                let item = actor.items.get(dependency.itemId);
                let label = `system.${dependency.data.amountLabel}`;
                await item.update(
                  { [label]: item.system[dependency.data.amountLabel] + dependency.data.amount },
                  { parent: actor }
                );
              }
            }
          }
        }

      case "adventuring":
      case "exposure":
      case "practice":
      case "training":
      case "teaching":
      case "reading":
      case "hermeticApp":
      case "childhood":
      case "laterLife":
      case "laterLifeMagi": {
        for (const ab of Object.values(this.item.system.progress.abilities)) {
          // check that ability still exists
          let ability = this.actor.items.get(ab.id);
          if (ability == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
              permanent: false
            });
            continue;
          }
          let xps = ability.system.xp - ab.xp;
          let data = {
            _id: ab.id,
            system: {
              xp: xps < 0 ? 0 : xps
            }
          };
          log(false, `Removed ${ab.xp} from ${ability.name}`);
          updateData.push(data);
        }
        for (const s of Object.values(this.item.system.progress.spells)) {
          let spell = this.actor.items.get(s.id);
          if (spell == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
              permanent: false
            });
            continue;
          }
          let xps = spell.system.xp - s.xp;
          let data = {
            _id: s.id,
            system: {
              xp: xps < 0 ? 0 : xps
            }
          };
          log(false, `Removed ${s.xp} from ${spell.name}`);
          updateData.push(data);
        }
        let actorUpdate = { system: { arts: { forms: {}, techniques: {} } } };
        for (const a of Object.values(this.item.system.progress.arts)) {
          let artType = "techniques";
          if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
            artType = "forms";
          }

          let xps = actor.system.arts[artType][a.key].xp - a.xp;
          log(false, `Removed ${a.xp} from ${a.key}`);
          actorUpdate.system.arts[artType][a.key] = {};
          actorUpdate.system.arts[artType][a.key].xp = xps < 0 ? 0 : xps;
        }

        await this.actor.deleteEmbeddedDocuments(
          "Item",
          this.item.system.progress.newSpells.map((e) => e.id)
        );

        await this.actor.update(actorUpdate, { render: true });
        await this.actor.updateEmbeddedDocuments("Item", updateData, { render: true });

        if (["visExtraction", "visStudy"].includes(this.item.system.activity)) {
          // delete the diary entry
          await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
          return;
        }
        break;
      }
      case "aging": {
        let confirmed = await getConfirmation(
          game.i18n.localize("arm5e.aging.rollback.title"),
          game.i18n.localize("arm5e.aging.rollback.confirm"),
          ArM5eActorSheet.getFlavor(this.item.actor?.type)
        );
        if (!confirmed) return;
        let actorUpdate = {
          system: { age: { value: actor.system.age.value - 1 }, pendingCrisis: false }
        };

        let effects = this.item.getFlag("arm5e", "effect");
        if (effects.apparent) {
          actorUpdate.system.apparent = { value: actor.system.apparent.value - 1 };
        }
        if (effects.charac) {
          actorUpdate.system.characteristics = {};
        }
        for (let [char, stats] of Object.entries(effects.charac)) {
          let newAgingPts = actor.system.characteristics[char].aging - stats.aging;
          let currentCharValue = actor.system.characteristics[char].value;
          if (stats.score) {
            // characteristic was reduced
            actorUpdate.system.characteristics[char] = {
              value: currentCharValue + 1,
              aging: Math.max(0, Math.abs(currentCharValue + 1) - stats.aging)
            };
          } else {
            actorUpdate.system.characteristics[char] = {
              value: currentCharValue,
              aging: newAgingPts < 0 ? 0 : newAgingPts
            };
          }
        }
        let newDecrepitude = actor.system.decrepitude.points - effects.decrepitude;
        actorUpdate.system.decrepitude = { points: newDecrepitude < 0 ? 0 : newDecrepitude };
        if (this.item.system.dates[0].season == "winter") {
          let newWarping =
            actor.system.warping.points - CONFIG.ARM5E.activities.aging.warping.impact;
          actorUpdate.system.warping = { points: newWarping < 0 ? 0 : newWarping };
        }
        await this.actor.update(actorUpdate, {});
        await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
        return;
        break;
      }
    }
    let description = this.item.system.description + "<h4>Rollbacked<h4>";
    await this.item.update({
      system: { done: false, description: description }
    });
  }

  async _addNewSpell(spell) {
    let newSpells = this.item.system.progress.newSpells;

    newSpells.push({
      label: `${spell.name} : ${ArM5eItem.getTechLabel(spell.system)} ${ArM5eItem.getFormLabel(
        spell.system
      )} ${spell.system.level}`,
      name: spell.name,
      img: spell.img,
      level: spell.system.level,
      spellData: spell.system,
      id: spell._id
    });
    let updateData = {};
    updateData["system.progress.newSpells"] = newSpells;
    await this.item.update(updateData);
  }

  async _addAbility(ability) {
    let currentData = this.item.system.progress["abilities"];
    let updateData = {};

    if (ability.isOwned && ability.actor._id == this.item.actor._id) {
      // check if it is owned by the character
      log(false, "Owned by the character");
    } else {
      // check if the character already has that skill and use it instead
      let actorAbility = this.item.actor.system.abilities.find(
        (e) => e.system.key == ability.system.key && e.system.option == ability.system.option
      );
      if (actorAbility) {
        ability = actorAbility;
      } else {
        // remove any original actor related stuff
        ability.updateSource({ system: { xp: 0, speciality: "" } });

        // we have to create it first.
        const itemData = [
          {
            name: ability.name,
            type: "ability",
            system: duplicate(ability.system)
          }
        ];
        ability = await this.actor.createEmbeddedDocuments("Item", itemData, {});
        ability = ability[0];
      }
    }

    const data = {
      id: ability._id,
      category: CONFIG.ARM5E.LOCALIZED_ABILITIES[ability.system.key]?.category ?? "general",
      name: ability.name,
      currentXp: ability.system.xp,
      xpNextLevel: ability.system.xpNextLevel,
      teacherScore: this.item.system.teacherScore,
      xp: 0
    };
    currentData.push(data);
    updateData[`system.progress.abilities`] = currentData;
    await this.item.update(updateData, {});
  }

  async _onProgressControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    // no edit possible if applied
    if (this.item.system.done || this.item.system.activity === "reading") {
      return;
    }
    // let currentData = Object.values(this.item.system.progress[button.dataset.type]) ?? [];
    let currentData = this.item.system.progress[button.dataset.type];
    let updateData = {};
    // debug("ADD progress item");
    switch (button.dataset.type) {
      case "abilities": {
        switch (button.dataset.action) {
          case "add":
            // get first ability of the tree
            const newAb = this.actor.items.get(button.dataset.default);
            const data = {
              id: newAb.id,
              key: newAb.system.key,
              category: newAb.system.category,
              name: newAb.name,
              currentXp: newAb.system.xp,
              xpNextLevel: newAb.system.xpNextLevel,
              teacherScore: Number(button.dataset.teacherscore),
              xp: 0
            };

            currentData.push(data);
            updateData[`system.progress.abilities`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.abilities`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "arts": {
        switch (button.dataset.action) {
          case "add":
            const data = {
              key: button.dataset.default,
              teacherScore: button.dataset.teacherscore,
              xp: 0
            };
            currentData.push(data);
            updateData[`system.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "spells": {
        switch (button.dataset.action) {
          case "add":
            // get first spell of the tree
            const newSpell = this.actor.items.get(button.dataset.default);
            const data = {
              id: newSpell.id,
              form: newSpell.system.form.value,
              name: newSpell.name,
              currentXp: newSpell.system.xp,
              xpNextLevel: newSpell.system.experienceNextLevel,
              xp: 0
            };
            currentData.push(data);
            updateData[`system.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
      case "newSpells": {
        switch (button.dataset.action) {
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`system.progress.newSpells`] = currentData;
            await this.item.update(updateData, {});
            break;
          default:
        }
        break;
      }
    }
  }

  async _setTeacher(actor) {
    log(false, "Dropped actor as teacher: " + actor);
    let teaching = actor.getAbilityStats("teaching");
    let updateData = {};
    updateData["system.teacher"] = {
      id: actor.id,
      name: actor.name,
      com: actor.system.characteristics.com.value,
      teaching: teaching.score,
      speciality: teaching.speciality,
      score: 0
    };
    updateData[`system.progress.abilities`] = [];
    updateData[`system.progress.arts`] = [];
    updateData[`system.progress.spells`] = [];
    updateData[`system.progress.newSpells`] = [];
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setCategory(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    const progressType = target.dataset.type;
    let currentData = this.item.system.progress[progressType];
    switch (progressType) {
      case "abilities":
        currentData[idx] = this.item.system.ownedAbilities[value][0];
        currentData[idx].xp = 0;
        updateData[`system.progress.abilities`] = currentData;
        break;
      case "spells":
        currentData[idx] = this.item.system.ownedSpells[value][0];
        currentData[idx].xp = 0;
        updateData[`system.progress.spells`] = currentData;
        break;
    }

    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setAbility(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = this.item.system.progress[target.dataset.type];
    const selectedAbility = this.actor.items.get(value);
    let teacherScore = Object.values(
      this.item.system.ownedAbilities[selectedAbility.system.category]
    ).find((e) => {
      return e.key === selectedAbility.system.key && e.option === selectedAbility.system.option;
    }).teacherScore;
    const data = {
      id: selectedAbility.id,
      name: selectedAbility.name,
      category: selectedAbility.system.category,
      currentXp: selectedAbility.system.xp,
      xpNextLevel: selectedAbility.system.experienceNextLevel,
      xp: 0,
      teacherScore: teacherScore
    };
    currentData[idx] = data;
    updateData[`system.progress.abilities`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setArt(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = this.item.system.progress[target.dataset.type];
    const data = {
      key: value,
      xp: 0,
      teacherScore: this.item.system.ownedArts.find((e) => {
        return e.key === value;
      }).teacherScore
    };
    currentData[idx] = data;
    updateData[`system.progress.arts`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _showSpell(item, event) {
    let index = Number(event.currentTarget.dataset.index);
    const spell = this.item.system.progress.newSpells[index];
    const tmp = await Item.create(
      {
        name: spell.name,
        type: "spell",
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
        system: spell.spellData
      },
      { temporary: true, editable: false }
    );
    tmp.sheet.render(true);
  }

  async displayCalendar() {
    if (this.item.isOwned) {
      const calendar = new ActivitySchedule({
        actor: this.item.actor,
        activity: {
          id: this.item.id,
          name: this.item.name,
          img: this.item.img,
          system: foundry.utils.deepClone(this.item.system)
        }
      });
      const res = await calendar.render(true);
    }
  }

  async _updateObject(event, formData) {
    const expanded = expandObject(formData);
    const source = this.object.toObject();
    const abilities = expanded?.system?.progress?.abilities;
    if (abilities) {
      expanded.system.progress.abilities = mergeObject(source.system.progress.abilities, abilities);
    }

    const spells = expanded?.system?.progress?.spells;
    if (spells) {
      expanded.system.progress.spells = mergeObject(source.system.progress.spells, spells);
    }

    const arts = expanded?.system?.progress?.arts;
    if (arts) {
      expanded.system.progress.arts = mergeObject(source.system.progress.arts, arts);
    }

    const newSpells = expanded?.system?.progress?.newSpells;
    if (newSpells) {
      expanded.system.progress.newSpells = mergeObject(source.system.progress.newSpells, newSpells);
    }

    const dates = expanded?.system?.dates;
    if (dates) {
      expanded.system.dates = mergeObject(source.system.dates, dates);
    }

    // log(false, `Update object: ${JSON.stringify(expanded)}`);
    await this.object.update(expanded);
  }
}
