import { stressDie } from "../dice.js";
import { debug, getDataset, log, sleep } from "../tools.js";
import { GroupSchedule } from "./group-schedule.js";
import { nextDate } from "./time.js";

export class Sanatorium extends FormApplication {
  constructor(patient, data, options) {
    super(data, options);

    this.patient = patient;
    // this.object.daysLeft = CONFIG.ARM5E.recovery.daysInSeason;
    this.object.seasons = CONFIG.ARM5E.seasons;
    this.object.curYear = this.patient.system.datetime.year;
    this.object.curSeason = this.patient.system.datetime.season;
    this.object.modifiers = {
      mundaneHelp: 0,
      magicalHelp: 0,
      activeEffect: 0,
      labHealth: 0
    };
    this.object.log = "";
    this.object.wounds = {};
    this.object.woundPenalty = patient.system.penalties.wounds.total;
    this.object.health = "good"; // ["good"."wounded","incap"]
    this.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason;
    this.object.hasWounds = false;
    this.object.nextRecoveryPeriod = 0;
    this.prepareWounds();
  }

  static async createDialog(actor) {
    // const dialogData = { patient: actor };
    const sanatorium = new Sanatorium(actor, {}, {}); // data, options
    actor.apps[sanatorium.appId] = sanatorium;
    const res = await sanatorium.render(true);
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "sanatorium-sheet"],
      title: "Sanatorium",
      template: "systems/arm5e/templates/generic/sanatorium.html",
      scrollY: [".editor"],
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (app.patient) {
      delete patient.apps[app.appId];
    }
  }
  async getData(options = {}) {
    const context = await super.getData().object;
    const patient = this.patient;
    context.patient = patient;
    context.canRoll = "";
    context.diary = "disabled";
    context.modifiers.activeEffect = patient.system.bonuses.traits.recovery;
    context.config = CONFIG;
    if (patient.system.sanctum.linked) {
      const lab = game.actors.get(patient.system.sanctum.actorId);
      if (lab) {
        context.modifiers.labHealth = lab.system.health.total;
      }
    }
    context.daysLeft = context.availableDays - context.nextRecoveryPeriod;
    context.daysLeftLabel = game.i18n.format("arm5e.sanatorium.daysLeft", {
      days: context.daysLeft
    });
    if (this.object.wounds["dead"] && this.object.wounds["dead"].length > 0) {
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDead")}</b></p>`,
        { async: true }
      );
      context.canRoll = "disabled";
      context.diary = "disabled";
    } else if (context.daysLeft == 0) {
      context.canRoll = "disabled";
    } else if (
      Object.entries(context.wounds).filter(
        (e) => CONFIG.ARM5E.recovery.wounds[e[0]].rank > 0 && e[1] != []
      ).length == 0
    ) {
      context.canRoll = "disabled";
      context.diary = "disabled";
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientHealthy")}</b></p>`,
        { async: true }
      );
    }
    if (!context.hasWounds) {
      if (context.daysLeft == 0) {
        // season finished
        context.diary = "";
      } else if (context.daysLeft == context.availableDays) {
        // season started
        context.log += await TextEditor.enrichHTML(
          `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</b></p>`,
          { async: true }
        );
      }
      context.canRoll = "disabled";
    }
    // log(false, `Sanatorium: ${JSON.stringify(context.wounds)}`);
    // log(false, `Sanatorium: ${context.daysLeft}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".recovery-roll").click(this._recoveryRoll.bind(this));

    html.find(".diary-entry").click(this._createDiaryEntry.bind(this));

    html.find(".change-year").change(async (ev) => {
      this.object.curYear = Number(ev.currentTarget.value);
      this.object.log = "";
      this.prepareWounds();
      await this.submit({
        preventClose: true,
        updateData: { datechange: "", curYear: ev.currentTarget.value }
      });
    });

    html.find(".change-season").change(async (ev) => {
      this.object.curSeason = ev.currentTarget.value;
      this.object.log = "";
      this.prepareWounds();
      await this.submit({
        preventClose: true,
        updateData: { datechange: "", curSeason: ev.currentTarget.value }
      });
    });
  }

  async _createDiaryEntry(event) {
    event.preventDefault();

    let updatePatientWounds = [];

    // Update the patient wounds
    for (let [type, wounds] of Object.entries(this.object.wounds)) {
      for (let wound of wounds) {
        let data = {};
        data.system = wound;
        data.system.gravity = type;
        data.name = wound.name;
        data.img = wound.img;
        data._id = wound._id;
        updatePatientWounds.push(data);
      }
    }
    let updatedWounds = await this.patient.updateEmbeddedDocuments("Item", updatePatientWounds);

    const entryData = {
      name: game.i18n.localize("arm5e.activity.title.recovery"),
      type: "diaryEntry",
      system: {
        cappedGain: false,
        dates: [
          { season: this.object.curSeason, year: Number(this.object.curYear), applied: false }
        ],
        sourceQuality: 0,
        activity: "recovery",
        done: true,
        progress: {
          abilities: [],
          arts: [],
          spells: [],
          newSpells: []
        },
        duration: 1,
        description: this.object.log
      }
    };

    let entry = await this.patient.createEmbeddedDocuments("Item", [entryData], {});
    entry[0].sheet.render(true);
    delete this.patient.apps[this.appId];
    await sleep(100);
    // let newDate = nextDate(this.object.curSeason, this.object.curYear);
    // await this.submit({
    //   preventClose: false,
    //   updateData: {
    //     dateChange: "",
    //     curSeason: newDate.season,
    //     curYear: newDate.year
    //   }
    // });
    await this.close();
  }

  async _recoveryRoll(event) {
    event.preventDefault();
    const patient = this.patient;
    let recoverylog = this.object.log;
    // it is no longer possible to change date or days available
    let dateChange = "disabled";

    let newWounds = {
      healthy: [],
      light: [],
      medium: [],
      heavy: [],
      incap: [],
      dead: []
    };
    let dataset = {
      roll: "char",
      name: "Recovery",
      characteristic: "sta",
      txtoption1: game.i18n.localize("arm5e.sanatorium.recoveryBonus"),
      option1: this.object.modifiers.activeEffect,
      txtoption2: game.i18n.localize("arm5e.sanatorium.mundaneHelp"),
      option2: this.object.modifiers.mundaneHelp,
      txtoption3: game.i18n.localize("arm5e.sanatorium.magicalHelp"),
      option3: this.object.modifiers.magicalHelp,
      txtoption4: game.i18n.localize("arm5e.sanatorium.labHealth"),
      option4: this.object.modifiers.labHealth,
      txtoption5: game.i18n.localize("arm5e.messages.die.bonus"),
      option5: 0,
      physicalcondition: false
    };
    let tmpPeriod = 1000;
    let incapacited = false;
    let logDayAdded = false;
    this.object.hasWounds = false;
    // Incapacitating wound special treatment
    if (this.object.wounds["incap"] && this.object.wounds["incap"].length > 0) {
      for (let incap of this.object.wounds["incap"]) {
        if (incap.nextRoll > this.object.nextRecoveryPeriod || incap.locked) {
          log(false, `Next roll ${incap.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
          if (!incap.locked) {
            tmpPeriod = tmpPeriod < incap.nextRoll ? tmpPeriod : incap.nextRoll;
          }
          newWounds["incap"].push(incap);
          continue;
        }
        let woundPeriodDescription = "";
        let newWound = foundry.utils.deepClone(incap);
        dataset.option5 = incap.bonus;
        let newType = "incap";
        if (incap.trend == -1) {
          newType = "heavy";
        } else {
          incapacited = true;
        }

        patient.rollData.init(dataset, patient);

        let roll = await stressDie(
          patient,
          dataset.roll,
          CONFIG.ARM5E.recovery.rollMode,
          undefined,
          1 // one botch
        );
        if (!logDayAdded) {
          woundPeriodDescription += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
            day: this.object.nextRecoveryPeriod + 1
          })}</h4><ul>`;
          logDayAdded = true;
        }
        woundPeriodDescription +=
          `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
            type: game.i18n.localize("arm5e.sheet." + newType)
          })}` +
          `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
            total: roll.total,
            mod: roll.offset
          })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;

        if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].improvement) {
          woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
            days: 0.5
          })}<br/>`;
          log(false, "Wound improvement");
          newWound.bonus = 0;
          newWound.style = "improved";
          newWound.trend = -1;
        } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].stability) {
          log(false, "Wound stable");
          woundPeriodDescription += `${game.i18n.localize(
            "arm5e.sanatorium.msg.logWoundStable"
          )}<br/>`;
          newWound.bonus = incap.bonus - 1;
          newWound.trend = 0;
        } else {
          newWound.trend = +1;
          log(false, "Wound worsened");
          woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
            days: CONFIG.ARM5E.recovery.wounds[newType].interval
          })}`;
          newWound.trend = 1;
          newWound.bonus = 0;
          newWound.style = "worsened";

          // newType =
          //   CONFIG.ARM5E.recovery.rankMapping[CONFIG.ARM5E.recovery.wounds[newType].rank + 1];
        }
        woundPeriodDescription += "<br/></li>";
        newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;
        newWound.name = game.i18n.localize(CONFIG.ARM5E.recovery.wounds[newType].label);
        newWound.description += woundPeriodDescription + "</ul>";
        recoverylog += woundPeriodDescription;
        newWound.nextRoll = incap.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
        newWound.recoveryTime += CONFIG.ARM5E.recovery.wounds[newType].interval;
        log(false, `Next roll: ${newWound.nextRoll}`);
        if (newWound.nextRoll > this.object.availableDays) {
          log(false, `Locked for this season`);
          newWound.nextRoll -= this.object.availableDays;
          newWound.locked = true;
        } else {
          this.object.hasWounds = true;
          tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
          log(false, `New Period: ${tmpPeriod}`);
        }
        newWounds[newType].push(newWound);
      }
    }
    for (let type of Object.keys(CONFIG.ARM5E.recovery.wounds)) {
      if (type == "incap") {
        // taken care above
        continue;
      } else if (type == "healthy") {
        for (let wound of this.object.wounds[type] ?? []) {
          newWounds[type].push(wound);
        }
      } else {
        for (let wound of this.object.wounds[type] ?? []) {
          if (wound.nextRoll > this.object.nextRecoveryPeriod || wound.locked) {
            log(false, `Next roll ${wound.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`);
            if (!wound.locked) {
              tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
            }
            newWounds[type].push(wound);
            continue;
          } else if (incapacited) {
            wound.nextRoll += 0.5;
            wound.recoveryTime += 0.5;
            tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
            newWounds[type].push(wound);
          } else {
            let woundPeriodDescription = "";
            let newType =
              CONFIG.ARM5E.recovery.rankMapping[
                CONFIG.ARM5E.recovery.wounds[type].rank + wound.trend
              ];

            let newWound = foundry.utils.deepClone(wound);
            if (!logDayAdded) {
              woundPeriodDescription += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
                day: this.object.nextRecoveryPeriod + 1
              })}</h4><ul>`;
              logDayAdded = true;
            }
            if (newType == "healthy") {
              newWound.locked = true;

              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logHealed", {
                days: newWound.recoveryTime
              })}<br/>`;
              newWound.description += woundPeriodDescription;
              recoverylog += woundPeriodDescription;
              newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;
              newWound.name = game.i18n.localize(CONFIG.ARM5E.recovery.wounds[newType].label);
              wound.nextRoll = 0;
              newWounds[newType].push(newWound);
              continue;
            }

            dataset.option5 = wound.bonus;
            patient.rollData.init(dataset, patient);
            let roll = await stressDie(
              patient,
              dataset.roll,
              CONFIG.ARM5E.recovery.rollMode,
              undefined,
              1
            );
            woundPeriodDescription +=
              `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
                type: game.i18n.localize("arm5e.sheet." + newType)
              })}` +
              `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
                total: roll.total,
                mod: roll.offset
              })} vs ${CONFIG.ARM5E.recovery.wounds[newType].improvement}<br/>`;
            if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].improvement) {
              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
                days: CONFIG.ARM5E.recovery.wounds[newType].interval
              })}`;
              log(false, "Wound improvement");
              newWound.bonus = 0;
              newWound.trend = -1;
              newWound.style = "improved";
              // if (newWound.nextRoll >)
            } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[newType].stability) {
              log(false, "Wound stable");
              woundPeriodDescription += `${game.i18n.localize(
                "arm5e.sanatorium.msg.logWoundStable"
              )}`;
              newWound.bonus = wound.bonus + 3;
              newWound.trend = 0;
            } else {
              log(false, "Wound worsened");
              woundPeriodDescription += `${game.i18n.format("arm5e.sanatorium.msg.logWoundWorse", {
                days: CONFIG.ARM5E.recovery.wounds[newType].interval
              })}`;
              newWound.trend = 1;
              newWound.bonus = 0;
              newWound.style = "worsened";
            }
            woundPeriodDescription += "<br/></li>";
            newWound.img = CONFIG.ARM5E.recovery.wounds[newType].icon;
            newWound.name = game.i18n.localize(CONFIG.ARM5E.recovery.wounds[newType].label);
            newWound.description += woundPeriodDescription + "</ul>";
            recoverylog += woundPeriodDescription;
            newWound.nextRoll = wound.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
            newWound.recoveryTime += CONFIG.ARM5E.recovery.wounds[newType].interval;
            log(false, `Next roll: ${newWound.nextRoll}`);
            if (newWound.nextRoll > this.object.availableDays) {
              log(false, `Locked for this season`);
              newWound.nextRoll -= this.object.availableDays;
              newWound.locked = true;
            } else {
              this.object.hasWounds = true;
              tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
              log(false, `New Period: ${tmpPeriod}`);
            }
            newWounds[newType].push(newWound);
          }
        }
      }
    }
    recoverylog += "</u>";
    if (tmpPeriod == 1000) {
      tmpPeriod = this.object.availableDays;
      recoverylog += `<p>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</p>`;
    }
    recoverylog = await TextEditor.enrichHTML(recoverylog, { async: true });
    await this.submit({
      preventClose: true,
      updateData: {
        wounds: newWounds,
        log: recoverylog,
        nextRecoveryPeriod: tmpPeriod,
        dateChange: dateChange
      }
    });
  }

  prepareWounds() {
    let minNextRoll = 1000;
    for (let [type, wounds] of Object.entries(this.patient.system.wounds)) {
      if (type == "healthy") continue;
      if (wounds.length > 0) {
        this.object.wounds[type] = [];
        for (let wound of wounds) {
          let w = wound.system.toObject();
          w._id = wound._id;
          w.name = wound.name;
          w.img = wound.img;
          // if the wound has already been treated this season, lock it
          if (!wound.system.canBeTreatedThisSeason(this.object.curSeason, this.object.curYear)) {
            w.locked = true;
          } else {
            w.locked = false;
            if (wound.system.nextRoll < minNextRoll) {
              minNextRoll = wound.system.nextRoll;
            }
            this.object.hasWounds = true;
          }
          this.object.wounds[type].push(w);
        }
      }
    }
    if (minNextRoll != 1000) {
      this.object.nextRecoveryPeriod = minNextRoll;
    }
  }

  async _updateObject(event, formData) {
    for (let [key, value] of Object.entries(formData)) {
      log(false, `Updated ${key} : ${value}`);
      this.object[key] = value;
    }
    this.object = foundry.utils.expandObject(this.object);
    this.render();

    return;
  }
}
