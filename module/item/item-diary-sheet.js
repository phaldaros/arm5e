import { debug, log } from "../tools.js";
import { ArM5eItemSheet } from "./item-sheet.js";
import { getNewTitleForActivity } from "../helpers/long-term-activities.js";

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
      height: 850,
      dragDrop: [{ dragSelector: null, dropSelector: ".progress-teacher" }],
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
    if (data.type == "Actor") {
      if (data.id == this.actor.id) {
        ui.notifications.info(game.i18n.localize("arm5e.activity.msg.selfTeaching"));
        return;
      }
      const actor = await Actor.implementation.fromDropData(data);
      if (actor._isCharacter()) await this._setTeacher(actor);
    }
  }
  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the item object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();
    const itemData = context.item.data;
    const actType = context.data.activity;
    if (this.actor == null || this.actor.type == "covenant" || this.actor.type == "laboratory") {
      context.ui.showTab = false;
      context.data.disabled = "disabled";
      return context;
    }

    if (itemData.data.year == "") {
      itemData.data.year = this.actor.data.data.datetime.year;
    }

    const activityConfig = CONFIG.ARM5E.activities.generic[actType];

    // legacy diary or just a simple recounting of events
    if (actType == "none") {
      context.ui.showLegacyXp = true;
      context.ui.showTab = false;
      return context;
    }

    // configuration
    let hasTeacher = actType == "training" || actType == "teaching";
    context.data.sourceBonus = 0;
    context.data.applied = itemData.data.applied;
    context.ui.showTab = true;
    context.ui.showLegacyXp = activityConfig.display.legacyXp;
    context.ui.showProgress = activityConfig.display.progress;
    context.ui.showAbilities = activityConfig.display.abilities;
    context.ui.showArts = activityConfig.display.arts;
    context.ui.showSpells = activityConfig.display.spells;

    context.ui.showTeacher = hasTeacher;
    context.ui.editSource = true;
    context.ui.bonusOptions = false;

    if (activityConfig.source.readonly && !context.data.applied) {
      context.data.sourceQuality = itemData.data.baseQuality;
      context.ui.editSource = false;
      context.data.sourceDefault = activityConfig.source.default;
    }

    if (activityConfig.bonusOptions != null && !context.data.applied) {
      context.ui.bonusOptions = true;
      context.bonusOptions = activityConfig.bonusOptions;
      context.data.sourceBonus = activityConfig.bonusOptions[itemData.data.optionKey].modifier;
      context.data.sourceQuality += context.data.sourceBonus;
    }
    itemData.data.aeBonus = 0;
    if (this.actor.data.data.bonuses.activities[actType] !== undefined && !context.data.applied) {
      itemData.data.aeBonus = this.actor.data.data.bonuses.activities[actType];
    }

    if (this.actor._isMagus()) {
      context.ui.showMagicProgress = true;
    }

    if (!itemData.data.progress) {
      context.data.progress = {};
    }

    // create the actor abilities tree
    context.data.ownedAbilities = {};
    context.data.defaultAbility = "";
    context.data.teacherScore = 0;
    context.data.ownedSpells = {};
    context.data.defaultArt = "";
    context.data.ownedArts = [];
    context.data.defaultSpell = "";

    context.data.applyPossible = "";
    context.data.applyError = "";

    context.data.canEdit = "";
    context.data.disabled = "";

    context.data.canEditTeacher = "";
    context.data.disabledTeacher = "";

    if (itemData.data.applied) {
      context.data.canEdit = "readonly";
      context.data.canEditTeacher = "readonly";
      context.data.disabledTeacher = "disabled";
      context.data.disabled = "disabled";
    }
    context.data.cappedGain = false;
    if (
      context.data.theoriticalSource !== undefined &&
      context.data.theoriticalSource !== context.data.sourceQuality
    ) {
      context.data.cappedGain = true;
      context.data.applyError = "arm5e.activity.msg.gainCapped";
    }

    context.data.teacherLinked = this.item.data.data.teacher.id !== null;
    let teacher;
    let availableAbilities = this.actor.data.data.abilities;
    // additionnal filtering based on the teacher skills
    if (hasTeacher) {
      if (context.data.teacherLinked) {
        context.data.canEditTeacher = "readonly";
        context.data.disabledTeacher = "disabled";
        // check trainer/teacher exists
        teacher = game.actors.get(this.item.data.data.teacher.id);
        if (teacher === undefined) {
          context.data.canEdit = "readonly";
          context.data.applyPossible = "disabled";
          if (actType === "training") {
            context.data.applyError = "arm5e.activity.msg.noTrainer";
          } else {
            context.data.applyError = "arm5e.activity.msg.noTeacher";
          }
          context.data.errorParam = "";
          return context;
        }
        itemData.data.aeBonus += teacher.data.data.bonuses.activities.teacher;
        context.teacherAbilities = teacher.data.data.abilities.filter(e => {
          return e.data.finalScore >= 2;
        });
        availableAbilities = this.actor.data.data.abilities.filter(e => {
          return context.teacherAbilities.some(filter => {
            if (context.data.applied)
              // for rollback, the item must still be there
              return filter.data.key === e.data.key && filter.data.option === e.data.option;
            else
              return (
                filter.data.key === e.data.key &&
                filter.data.option === e.data.option &&
                filter.data.finalScore > e.data.finalScore
              );
          });
        });
      }

      // if teacher is not a Magus, he/she cannot teach spell masteries and arts
      if (teacher !== undefined && !teacher._isMagus()) {
        context.ui.showMagicProgress = false;
      }
    }
    let firstAb = true;
    // for each progressed ability, list the category and abilities available
    for (const ability of availableAbilities) {
      let teacherScore = 0;
      if (hasTeacher) {
        if (itemData.data.teacher.id === null) {
          teacherScore = itemData.data.teacher.score ?? 0;
        } else {
          let teacherAbility = context.teacherAbilities.find(e => {
            return e.data.key === ability.data.key && e.data.option === ability.data.option;
          });
          teacherScore = teacherAbility.data.finalScore;
        }
      }
      if (context.data.ownedAbilities[ability.data.category] == undefined)
        context.data.ownedAbilities[ability.data.category] = [];
      let tmp = {
        id: ability._id,
        category: ability.data.category,
        name: ability.name,
        key: ability.data.key,
        currentXp: ability.data.xp,
        score: ability.data.finalScore,
        option: ability.data.option,
        teacherScore: teacherScore
      };
      if (firstAb) {
        let filteredList = Object.values(context.data.progress.abilities).filter(e => {
          return e.id === ability._id;
        });
        if (
          // if ability doesn't exist in current items, set it as next default
          filteredList.length === 0
        ) {
          context.data.defaultAbility = ability._id;
          context.data.teacherScore = teacherScore;
          firstAb = false;
        }
      }
      context.data.ownedAbilities[ability.data.category].push(tmp);
    }

    if (context.ui.showMagicProgress) {
      // Arts
      let availableArts = Object.keys(CONFIG.ARM5E.magic.arts);
      // get the arts the teacher is skilled enough in to teach
      if (context.data.teacherLinked) {
        let teacherTechniques = Object.entries(teacher.data.data.arts.techniques)
          .filter(e => {
            if (context.data.applied) {
              return e[1].finalScore >= 5;
            } else {
              return (
                e[1].finalScore >= 5 &&
                e[1].finalScore > this.actor.data.data.arts.techniques[e[0]].finalScore
              );
            }
          })
          .map(e => {
            return {
              key: e[0],
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              score: this.actor.data.data.arts.techniques[e[0]].finalScore,
              teacherScore: e[1].finalScore
            };
          });

        let teacherForms = Object.entries(teacher.data.data.arts.forms)
          .filter(e => {
            if (context.data.applied) {
              return e[1].finalScore >= 5;
            } else {
              return (
                e[1].finalScore >= 5 &&
                e[1].finalScore > this.actor.data.data.arts.forms[e[0]].finalScore
              );
            }
          })
          .map(e => {
            return {
              key: e[0],
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              score: this.actor.data.data.arts.forms[e[0]].finalScore,
              teacherScore: e[1].finalScore
            };
          });

        availableArts = teacherTechniques.concat(teacherForms);
      } else {
        let teacherScore = 0;
        if (hasTeacher && itemData.data.teacher.id === null) {
          teacherScore = itemData.data.teacher.score ?? 0;
        }
        let actorTechniques = Object.entries(this.actor.data.data.arts.techniques).map(e => {
          return {
            key: e[0],
            label: CONFIG.ARM5E.magic.arts[e[0]].label,
            score: this.actor.data.data.arts.techniques[e[0]].finalScore,
            teacherScore: teacherScore
          };
        });

        let actorForms = Object.entries(this.actor.data.data.arts.forms).map(e => {
          return {
            key: e[0],
            label: CONFIG.ARM5E.magic.arts[e[0]].label,
            score: this.actor.data.data.arts.forms[e[0]].finalScore,
            teacherScore: teacherScore
          };
        });

        availableArts = actorTechniques.concat(actorForms);
      }

      let firstArt = true;
      for (const art of Object.values(availableArts)) {
        if (firstArt) {
          let filteredList = Object.values(context.data.progress.arts).filter(e => {
            return e.key === art.key;
          });
          if (
            // if art doesn't exist in current items, set it as next default
            filteredList.length === 0
          ) {
            context.data.defaultArt = art.key;
            context.data.teacherScore = art.teacherScore;
            firstArt = false;
          }
        }
        context.data.ownedArts.push(art);
      }
      //spells

      let availableSpells = this.actor.data.data.spells;
      if (context.data.teacherLinked) {
        context.teacherMasteries = teacher.data.data.spells.filter(e => {
          return e.data.mastery >= 2;
        });
        availableSpells = this.actor.data.data.spells.filter(e => {
          return context.teacherMasteries.some(filter => {
            if (context.data.applied) {
              return (
                // for rollback, the item must still be there
                filter.data.key === e.data.key &&
                filter.name === e.name &&
                filter.data.technique === e.data.technique &&
                filter.data.form === e.data.form
              );
            } else {
              return (
                filter.data.key === e.data.key &&
                filter.name === e.name &&
                filter.data.technique === e.data.technique &&
                filter.data.form === e.data.form &&
                filter.data.mastery > e.data.mastery
              );
            }
          });
        });
      }

      let firstSpell = true;
      for (const spell of availableSpells) {
        let teacherScore = 0;
        if (hasTeacher) {
          if (itemData.data.teacher.id === null) {
            teacherScore = itemData.data.teacher.score ?? 0;
          } else {
            let teacherSpell = context.teacherSpells.find(e => {
              return e.data.key === ability.data.key && e.data.option === ability.data.option;
            });
            teacherScore = teacherSpell.data.mastery;
          }
        }
        if (context.data.ownedSpells[spell.data.form.value] == undefined)
          context.data.ownedSpells[spell.data.form.value] = [];
        let tmp = {
          id: spell._id,
          form: spell.data.form.value,
          name: spell.name,
          currentXp: spell.data.xp,
          score: spell.data.mastery,
          teacherScore: teacherScore
        };
        if (firstSpell) {
          let filteredList = Object.values(context.data.progress.spells).filter(e => {
            return e.id === spell._id;
          });
          if (
            // if spell doesn't exist in current items, set it as next default
            filteredList.length === 0
          ) {
            context.data.defaultSpell = spell._id;
            context.data.teacherScore = teacherScore;
            firstSpell = false;
          }
        }
        context.data.ownedSpells[spell.data.form.value].push(tmp);
      }
    }

    if (!context.data.applied) {
      context.data.sourceQuality += Number(itemData.data.aeBonus);
    }
    if (activityConfig.validation != null) {
      activityConfig.validation(context, this.actor, this.item);
    }

    log(false, "ITEM-DIARY-sheet get data");
    log(false, context);
    return context;
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
    html.find(".progress-xp").change(this._setXp.bind(this));
    html.find(".break-link").click(this._resetTeacher.bind(this));
    html.find(".score-teacher").change(this._resetTeacher.bind(this));
    // html.find(".progress-bonus").change(this._setBonusOption.bind(this));
  }

  async _resetTeacher(event) {
    const target = event.currentTarget;
    if (target.dataset.applied == "true") {
      return;
    }
    let updateData = {};
    updateData["data.teacher.id"] = null;
    updateData[`data.progress.abilities`] = [];
    updateData[`data.progress.arts`] = [];
    updateData[`data.progress.spells`] = [];
    // updateData[`data.cappedGain`] = false;
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setXp(event) {
    event.preventDefault();
    debug("set xp");
    const target = event.currentTarget;
  }

  async _setActivity(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const actType = $(target).val();
    // just reset some fields so the new default can be set
    let updateData = {};
    updateData["data.sourceQuality"] = 0;
    if (CONFIG.ARM5E.activities.generic[actType].display.abilities === false) {
      updateData["data.progress.abilities"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.arts === false) {
      updateData["data.progress.arts"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.spells === false) {
      updateData["data.progress.spells"] = [];
    }

    // core bug?
    switch (actType) {
      case "none":
        this._tabs[0].activate("description");
        break;
      case "training":
      case "teaching":
        this._tabs[0].activate("advanced");
        // this.render();
        // this._tabs[1].activate("teacher");
        break;
      default:
        this._tabs[0].activate("advanced");
      // this.render();
      // this._tabs[1].activate("abilities");
    }
    // updateData[`data.cappedGain`] = false;
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _onProgressApply(event) {
    event.preventDefault();
    // this.render();
    let description = this.item.data.data.description + "<h4>Technical part:<h4><ol>";
    let updateData = [];
    let sourceQuality = 0;

    for (const ab of Object.values(this.item.data.data.progress.abilities)) {
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
        data: {
          xp: ability.data.data.xp + ab.xp
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
    for (const s of Object.values(this.item.data.data.progress.spells)) {
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
        data: {
          xp: spell.data.data.xp + s.xp
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

    let actorUpdate = { data: { arts: { forms: {}, techniques: {} } } };
    for (const a of Object.values(this.item.data.data.progress.arts)) {
      // ignore 0 xp gain
      if (a.xp == 0) {
        continue;
      }
      let artType = "techniques";
      if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
        artType = "forms";
      }
      actorUpdate.data.arts[artType][a.key] = {};
      actorUpdate.data.arts[artType][a.key].xp =
        this.actor.data.data.arts[artType][a.key].xp + a.xp;
      description += `<li>${game.i18n.format("arm5e.activity.descItem", {
        item: game.i18n.localize(CONFIG.ARM5E.magic.arts[a.key].label),
        xp: a.xp
      })}</li>`;
      log(false, `Added ${a.xp} to ${a.key}`);
      sourceQuality += a.xp;
    }
    description += "</ol>";
    let newTitle = getNewTitleForActivity(this.actor, this.item);

    await this.item.update(
      {
        name: newTitle,
        data: {
          applied: true,
          description: description,
          sourceQuality: sourceQuality,
          progress: this.item.data.data.progress
        }
      },
      { render: true }
    );

    await this.actor.updateEmbeddedDocuments("Item", updateData, { render: true });
    await this.actor.update(actorUpdate, { render: true });
  }

  async _onProgressRollback(event) {
    event.preventDefault();
    // this.render();
    const actorData = this.actor.data;
    let updateData = [];
    switch (this.item.data.data.activity) {
      case "adventuring":
      case "exposure":
      case "practice":
      case "training":
      case "teaching": {
        for (const ab of Object.values(this.item.data.data.progress.abilities)) {
          // check that ability still exists
          let ability = this.actor.items.get(ab.id);
          if (ability == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.abilityMissing"), {
              permanent: false
            });
            continue;
          }
          let xps = ability.data.data.xp - ab.xp;
          let data = {
            _id: ab.id,
            data: {
              xp: xps < 0 ? 0 : xps
            }
          };
          log(false, `Removed ${ab.xp} from ${ability.name}`);
          updateData.push(data);
        }
        for (const s of Object.values(this.item.data.data.progress.spells)) {
          let spell = this.actor.items.get(s.id);
          if (spell == undefined) {
            ui.notifications.warn(game.i18n.localize("arm5e.activity.msg.spellMissing"), {
              permanent: false
            });
            continue;
          }
          let xps = spell.data.data.xp - s.xp;
          let data = {
            _id: s.id,
            data: {
              xp: xps < 0 ? 0 : xps
            }
          };
          log(false, `Removed ${s.xp} from ${spell.name}`);
          updateData.push(data);
        }
        let actorUpdate = { data: { arts: { forms: {}, techniques: {} } } };
        for (const a of Object.values(this.item.data.data.progress.arts)) {
          let artType = "techniques";
          if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(a.key) == -1) {
            artType = "forms";
          }

          let xps = actorData.data.arts[artType][a.key].xp - a.xp;
          log(false, `Removed ${a.xp} from ${a.key}`);
          actorUpdate.data.arts[artType][a.key] = {};
          actorUpdate.data.arts[artType][a.key].xp = xps < 0 ? 0 : xps;
        }

        await this.actor.update(actorUpdate, { render: true });
        await this.actor.updateEmbeddedDocuments("Item", updateData, { render: true });
        break;
      }
      case "aging": {
        let confirmed = await new Promise(
          resolve => {
            Dialog.confirm({
              title: game.i18n.localize("arm5e.aging.rollback.title"),
              content: `<p>${game.i18n.localize("arm5e.aging.rollback.confirm")}</p>`,
              yes: () => {
                resolve(true);
              },
              no: () => {
                resolve(false);
              }
            });
          },
          {
            rejectClose: true
          }
        );
        if (!confirmed) return;
        let actorUpdate = {
          data: { age: { value: actorData.data.age.value - 1 }, pendingCrisis: false }
        };

        let effects = this.item.getFlag("arm5e", "effect");
        if (effects.apparent) {
          actorUpdate.data.apparent = { value: actorData.data.apparent.value - 1 };
        }
        if (effects.charac) {
          actorUpdate.data.characteristics = {};
        }
        for (let [char, stats] of Object.entries(effects.charac)) {
          let newAgingPts = actorData.data.characteristics[char].aging - stats.aging;
          let currentCharValue = actorData.data.characteristics[char].value;
          if (stats.score) {
            // characteristic was reduced
            actorUpdate.data.characteristics[char] = {
              value: currentCharValue + 1,
              aging: Math.max(0, Math.abs(currentCharValue + 1) - stats.aging)
            };
          } else {
            actorUpdate.data.characteristics[char] = {
              value: currentCharValue + 1,
              aging: newAgingPts < 0 ? 0 : newAgingPts
            };
          }
        }
        let newDecrepitude = actorData.data.decrepitude.points - effects.decrepitude;
        actorUpdate.data.decrepitude = { points: newDecrepitude < 0 ? 0 : newDecrepitude };
        await this.actor.update(actorUpdate, {});
        await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
        return;
        break;
      }
    }
    let description = this.item.data.data.description + "<h4>Rollbacked<h4>";
    await this.item.update({ data: { applied: false, description: description } });
  }

  async _onProgressControl(event) {
    event.preventDefault();
    const button = event.currentTarget;
    // no edit possible if applied
    if (button.dataset.applied == "true" || button.dataset.applied === true) {
      return;
    }
    let currentData = Object.values(this.item.data.data.progress[button.dataset.type]) ?? [];
    let updateData = {};
    debug("ADD progress item");
    switch (button.dataset.type) {
      case "abilities": {
        switch (button.dataset.action) {
          case "add":
            // get first ability of the tree
            const newAb = this.actor.items.get(button.dataset.default);
            const data = {
              id: newAb.id,
              category: newAb.data.data.category,
              name: newAb.name,
              currentXp: newAb.data.data.xp,
              xpNextLevel: newAb.data.data.xpNextLevel,
              teacherScore: button.dataset.teacherscore,
              xp: 0
            };

            currentData.push(data);
            updateData[`data.progress.abilities`] = currentData;
            // );
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`data.progress.abilities`] = currentData;
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
            updateData[`data.progress.arts`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`data.progress.arts`] = currentData;
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
              form: newSpell.data.data.form.value,
              name: newSpell.name,
              currentXp: newSpell.data.data.xp,
              xpNextLevel: newSpell.data.data.experienceNextLevel,
              xp: 0
            };
            currentData.push(data);
            updateData[`data.progress.spells`] = currentData;
            await this.item.update(updateData, {});
            break;
          case "delete":
            const idx = Number(button.dataset.idx);
            currentData.splice(idx, 1);
            button.closest(".diary-progress").remove();
            updateData[`data.progress.spells`] = currentData;
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
    updateData["data.teacher"] = {
      id: actor.id,
      name: actor.name,
      com: actor.data.data.characteristics.com.value,
      teaching: teaching.score,
      speciality: teaching.speciality,
      score: 0
    };
    updateData[`data.progress.abilities`] = [];
    updateData[`data.progress.arts`] = [];
    updateData[`data.progress.spells`] = [];
    // updateData[`data.cappedGain`] = false;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setCategory(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    const progressType = target.dataset.type;
    let currentData = Object.values(this.item.data.data.progress[progressType]) ?? [];
    switch (progressType) {
      case "abilities":
        currentData[idx] = this.item.data.data.ownedAbilities[value][0];
        currentData[idx].xp = 0;
        updateData[`data.progress.abilities`] = currentData;
        break;
      case "spells":
        currentData[idx] = this.item.data.data.ownedSpells[value][0];
        currentData[idx].xp = 0;
        updateData[`data.progress.spells`] = currentData;
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
    let currentData = Object.values(this.item.data.data.progress[target.dataset.type]) ?? [];
    const selectedAbility = this.actor.items.get(value);
    const data = {
      id: selectedAbility.id,
      name: selectedAbility.name,
      category: selectedAbility.data.data.category,
      currentXp: selectedAbility.data.data.xp,
      xpNextLevel: selectedAbility.data.data.experienceNextLevel,
      xp: 0,
      teacherScore: Object.values(
        this.item.data.data.ownedAbilities[selectedAbility.data.data.category]
      ).find(e => {
        return (
          e.key === selectedAbility.data.data.key && e.option === selectedAbility.data.data.option
        );
      }).teacherScore
    };
    currentData[idx] = data;
    updateData[`data.progress.abilities`] = currentData;
    // updateData[`data.cappedGain`] = false;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setArt(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    let currentData = Object.values(this.item.data.data.progress[target.dataset.type]) ?? [];
    const data = {
      key: value,
      xp: 0,
      teacherScore: this.item.data.data.ownedArts.find(e => {
        return e.key === value;
      }).teacherScore
    };
    currentData[idx] = data;
    updateData[`data.progress.arts`] = currentData;
    // updateData[`data.cappedGain`] = false;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }
}
