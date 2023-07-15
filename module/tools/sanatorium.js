import { stressDie } from "../dice.js";
import { debug, getDataset, log } from "../tools.js";
import { GroupSchedule } from "./group-schedule.js";

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
    this.object.nextRecoveryPeriod = 0;
    this.object.log = "";
    this.object.wounds = {};
    this.object.healthStatus = 0;
    this.object.availableDays = CONFIG.ARM5E.recovery.daysInSeason;
    for (let [type, attr] of Object.entries(patient.system.wounds)) {
      if (attr.number.value > 0) {
        this.object.wounds[type] = [];
        for (let ii = 0; ii < attr.number.value; ii++) {
          this.object.wounds[type].push({
            bonus: 0,
            nextRoll: 0,
            icon: CONFIG.ARM5E.recovery.wounds[type].icon,
            label: CONFIG.ARM5E.recovery.wounds[type].label,
            locked: false,
            trend: 0,
            new: true // TODO use inflicted date
          });
        }
      }
    }
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
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  onClose(app) {
    if (app.object.patient) {
      delete patient.apps[app.appId];
    }
  }
  async getData(options = {}) {
    const context = await super.getData().object;
    const patient = this.patient;
    context.patient = patient;
    context.modifiers.activeEffect = patient.system.bonuses.traits.recovery;
    context.config = CONFIG;
    if (patient.system.sanctum.linked) {
      const lab = game.actors.get(patient.system.sanctum.actorId);
      if (lab) {
        context.modifiers.labHealth = lab.system.health.total;
      }
    }
    context.daysLeft = context.availableDays - context.nextRecoveryPeriod;
    // context.wounds = {};
    // for (let [type, attr] of Object.entries(patient.system.wounds)) {
    //   if (attr.number.value > 0) {
    //     context.wounds[type] = [];
    //     for (let ii = 0; ii < attr.number.value; ii++) {
    //       context.wounds[type].push({ icon: CONFIG.ARM5E.recovery.wounds[type].icon });
    //     }
    //   }
    // }
    if (this.object.wounds["dead"] && this.object.wounds["dead"].length > 0) {
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientDead")}</b></p>`,
        { async: true }
      );
      context.canRoll = "disabled";
    } else if (context.daysLeft == 0) {
      context.log += await TextEditor.enrichHTML(
        `<p>${game.i18n.localize("arm5e.sanatorium.msg.logDone")}</p>`,
        { async: true }
      );
      context.canRoll = "disabled";
    } else if (
      Object.entries(context.wounds).filter(
        (e) => CONFIG.ARM5E.recovery.wounds[e[0]].rank > 0 && e[1] != []
      ).length == 0
    ) {
      context.canRoll = "disabled";
      context.log += await TextEditor.enrichHTML(
        `<br/><p><b>${game.i18n.localize("arm5e.sanatorium.msg.patientHealthy")}</b></p>`,
        { async: true }
      );
    }

    log(false, `Sanatorium: ${JSON.stringify(context.wounds)}`);
    log(false, `Sanatorium: ${context.daysLeft}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".resource-focus").focus((ev) => {
      ev.preventDefault();
      ev.currentTarget.select();
    });

    html.find(".recovery-roll").click(this._recoveryRoll.bind(this));

    html.find(".diary-entry").click(this._newDiaryEntry.bind(this));
  }

  async _newDiaryEntry(event) {
    event.preventDefault();
    this.close();
  }

  async _recoveryRoll(event) {
    event.preventDefault();
    const patient = this.patient;
    let recoverylog = this.object.log;
    recoverylog += `<h4>${game.i18n.format("arm5e.sanatorium.msg.logDay", {
      day: this.object.nextRecoveryPeriod + 1
    })}</h4>`;

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
    recoverylog += `<ul>`;
    let dead = false;
    let tmpPeriod = 1000;
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
        let newWound = {};
        dataset.option5 = incap.bonus;
        patient.rollData.init(dataset, patient);
        let roll = await stressDie(
          patient,
          dataset.roll,
          CONFIG.ARM5E.recovery.rollMode,
          undefined,
          1 // one botch
        );
        recoverylog +=
          `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
            type: game.i18n.localize("arm5e.sheet.incap")
          })}` +
          `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
            total: roll.total,
            mod: roll.offset
          })}<br/>`;
        let newType = "incap";
        if (roll.total >= CONFIG.ARM5E.recovery.wounds["incap"].improvement) {
          recoverylog += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
            days: 0.5
          })}<br/>`;
          log(false, "Wound improvement");
          newType =
            CONFIG.ARM5E.recovery.rankMapping[CONFIG.ARM5E.recovery.wounds["incap"].rank - 1];
          newWound.bonus = 0;
          newWound.style = "improved";
          // if (newWound.nextRoll >)
        } else if (roll.total >= CONFIG.ARM5E.recovery.wounds["incap"].stability) {
          log(false, "Wound stable");
          recoverylog += `${game.i18n.localize("arm5e.sanatorium.msg.logWoundStable")}<br/>`;
          newWound.bonus = incap.bonus - 3;
        } else {
          log(false, "Patient died!");
          recoverylog += `<b>${game.i18n.localize("arm5e.sanatorium.msg.patientDied")}</b></li>`;
          newType =
            CONFIG.ARM5E.recovery.rankMapping[CONFIG.ARM5E.recovery.wounds["incap"].rank + 1];
          newWound.bonus = 0;
          newWound.style = "worsened";
          dead = true;
        }
        newWound.new = false;
        newWound.nextRoll = incap.nextRoll + CONFIG.ARM5E.recovery.wounds[newType].interval;
        log(false, `Next roll: ${newWound.nextRoll}`);
        newWound.icon = CONFIG.ARM5E.recovery.wounds[newType].icon;
        newWound.label = CONFIG.ARM5E.recovery.wounds[newType].label;
        newWounds[newType].push(newWound);
        if (newWound.nextRoll > this.object.availableDays) {
          log(false, `Locked for this season`);
          newWound.nextRoll -= this.object.availableDays;
          newWound.locked = true;
        } else {
          tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
          log(false, `New Period: ${tmpPeriod}`);
        }
      }
    }
    if (!dead) {
      for (let type of Object.keys(CONFIG.ARM5E.recovery.wounds)) {
        if (type == "incap") {
          // taken care above
          continue;
        } else if (type == "healthy") {
          for (let wound of this.object.wounds[type] ?? []) {
            if (wound.nextRoll > this.object.nextRecoveryPeriod || wound.locked) {
              log(
                false,
                `Next roll ${wound.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`
              );
              if (!wound.locked) {
                tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
              }
              newWounds[type].push(wound);
              continue;
            }
            recoverylog += `${game.i18n.localize("arm5e.sanatorium.msg.logHealed")}<br/>`;
          }
        } else {
          for (let wound of this.object.wounds[type] ?? []) {
            if (wound.nextRoll > this.object.nextRecoveryPeriod || wound.locked) {
              log(
                false,
                `Next roll ${wound.nextRoll} > ${this.object.nextRecoveryPeriod} or locked`
              );
              if (!wound.locked) {
                tmpPeriod = tmpPeriod < wound.nextRoll ? tmpPeriod : wound.nextRoll;
              }
              newWounds[type].push(wound);
              continue;
            }

            let newWound = {};
            dataset.option5 = wound.bonus;
            patient.rollData.init(dataset, patient);
            let roll = await stressDie(
              patient,
              dataset.roll,
              CONFIG.ARM5E.recovery.rollMode,
              undefined,
              1
            );
            recoverylog +=
              `<li>${game.i18n.format("arm5e.sanatorium.msg.logWound", {
                type: game.i18n.localize("arm5e.sheet." + type)
              })}` +
              `<br/>${game.i18n.format("arm5e.sanatorium.msg.logRoll", {
                total: roll.total,
                mod: roll.offset
              })}<br/>`;

            let newType = type;

            if (roll.total >= CONFIG.ARM5E.recovery.wounds[type].improvement) {
              recoverylog += `${game.i18n.format("arm5e.sanatorium.msg.logWoundBetter", {
                days: CONFIG.ARM5E.recovery.wounds[type].interval
              })}<br/>`;
              log(false, "Wound improvement");
              newType =
                CONFIG.ARM5E.recovery.rankMapping[CONFIG.ARM5E.recovery.wounds[type].rank - 1];
              newWound.bonus = 0;
              newWound.style = "improved";
              // if (newWound.nextRoll >)
            } else if (roll.total >= CONFIG.ARM5E.recovery.wounds[type].stability) {
              log(false, "Wound stable");
              recoverylog += `${game.i18n.localize("arm5e.sanatorium.msg.logWoundStable")}<br/>`;
              newWound.bonus = wound.bonus + 3;
            } else {
              log(false, "Wound worsened");
              recoverylog += `${game.i18n.localize("arm5e.sanatorium.msg.logWoundWorse", {
                days: CONFIG.ARM5E.recovery.wounds[type].interval
              })}<br/>`;
              newType =
                CONFIG.ARM5E.recovery.rankMapping[CONFIG.ARM5E.recovery.wounds[type].rank + 1];

              newWound.bonus = 0;
              newWound.style = "worsened";
            }
            newWound.new = false;
            newWound.icon = CONFIG.ARM5E.recovery.wounds[newType].icon;
            newWound.label = CONFIG.ARM5E.recovery.wounds[newType].label;
            newWound.nextRoll = wound.nextRoll + CONFIG.ARM5E.recovery.wounds[type].interval;
            log(false, `Next roll: ${newWound.nextRoll}`);
            if (newWound.nextRoll > this.object.availableDays) {
              log(false, `Locked for this season`);
              newWound.nextRoll -= this.object.availableDays;
              newWound.locked = true;
            } else {
              tmpPeriod = tmpPeriod < newWound.nextRoll ? tmpPeriod : newWound.nextRoll;
              log(false, `New Period: ${tmpPeriod}`);
            }

            newWounds[newType].push(newWound);
            recoverylog += `</li>`;
          }
        }
      }
    }
    if (tmpPeriod == 1000) {
      tmpPeriod = this.object.availableDays;
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
