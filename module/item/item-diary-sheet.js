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
      dragDrop: [
        { dragSelector: null, dropSelector: ".progress-teacher" },
        { dragSelector: null, dropSelector: ".progress-abilities" }
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
    if (data.type == "Actor") {
      if (this.item.system.type === "teaching" || this.item.system.type === "training") {
        if (data.id == this.actor.id) {
          ui.notifications.info(game.i18n.localize("arm5e.activity.msg.selfTeaching"));
          return;
        }
        const actor = await Actor.implementation.fromDropData(data);
        if (actor._isCharacter()) await this._setTeacher(actor);
      }
    } else if (data.type == "Item") {
      const item = await Item.implementation.fromDropData(data);
      if (item.type === "ability") {
        if (this.item.system.type === "teaching" || this.item.system.type === "training") return;

        log(false, `Ability ${item.name} added`);
        this._addAbility(item);
      }
    }
  }
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();
    const itemData = this.item.toObject(false);
    const actType = context.system.activity;
    if (this.actor == null || this.actor.type == "covenant" || this.actor.type == "laboratory") {
      context.ui.showTab = false;
      context.system.disabled = "disabled";
      return context;
    }

    if (itemData.system.year == "") {
      // supposedly the first time a diary entry is created
      context.system.year = this.actor.system.datetime.year;
      context.system.season = this.actor.system.datetime.season;
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
    context.system.sourceBonus = 0;
    context.system.applied = itemData.system.applied;
    context.ui.showTab = true;
    context.ui.showLegacyXp = activityConfig.display.legacyXp;
    context.ui.showProgress = activityConfig.display.progress;
    context.ui.showAbilities = activityConfig.display.abilities;
    context.ui.showArts = activityConfig.display.arts;
    context.ui.showSpells = activityConfig.display.spells;

    context.ui.showTeacher = hasTeacher;
    context.ui.editSource = true;
    context.ui.bonusOptions = false;

    if (activityConfig.source.readonly && !context.system.applied) {
      context.system.sourceQuality = itemData.system.baseQuality;
      context.ui.editSource = false;
      context.system.sourceDefault = activityConfig.source.default;
    }

    if (activityConfig.bonusOptions != null && !context.system.applied) {
      context.ui.bonusOptions = true;
      context.bonusOptions = activityConfig.bonusOptions;
      context.system.sourceBonus = activityConfig.bonusOptions[itemData.system.optionKey].modifier;
      context.system.sourceQuality += context.system.sourceBonus;
    }
    context.system.aeBonus = 0;
    if (this.actor.system.bonuses.activities[actType] !== undefined && !context.system.applied) {
      context.system.aeBonus = this.actor.system.bonuses.activities[actType];
    }

    if (this.actor._isMagus()) {
      context.ui.showMagicProgress = true;
    }

    if (!itemData.system.progress) {
      context.system.progress = {};
    }

    // create the actor abilities tree
    context.system.ownedAbilities = {};
    context.system.defaultAbility = "";
    context.system.teacherScore = 0;
    context.system.ownedSpells = {};
    context.system.defaultArt = "";
    context.system.ownedArts = [];
    context.system.defaultSpell = "";

    context.system.applyPossible = "";
    context.system.applyError = "";

    context.system.canEdit = "";
    context.system.disabled = "";

    context.system.canEditTeacher = "";
    context.system.disabledTeacher = "";

    if (itemData.system.applied) {
      context.system.canEdit = "readonly";
      context.system.canEditTeacher = "readonly";
      context.system.disabledTeacher = "disabled";
      context.system.disabled = "disabled";
    }
    context.system.cappedGain = false;
    if (
      context.system.theoriticalSource !== undefined &&
      context.system.theoriticalSource !== context.system.sourceQuality
    ) {
      context.system.cappedGain = true;
      context.system.applyError = "arm5e.activity.msg.gainCapped";
    }

    context.system.teacherLinked = this.item.system.teacher.id !== null;
    let teacher;
    let availableAbilities = this.actor.system.abilities;
    // additionnal filtering based on the teacher skills
    if (hasTeacher) {
      if (context.system.teacherLinked) {
        context.system.canEditTeacher = "readonly";
        context.system.disabledTeacher = "disabled";
        // check trainer/teacher exists
        teacher = game.actors.get(this.item.system.teacher.id);
        if (teacher === undefined) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = "disabled";
          if (actType === "training") {
            context.system.applyError = "arm5e.activity.msg.noTrainer";
          } else {
            context.system.applyError = "arm5e.activity.msg.noTeacher";
          }
          context.system.errorParam = "";
          return context;
        }
        context.system.aeBonus += teacher.system.bonuses.activities.teacher;
        context.teacherAbilities = teacher.system.abilities.filter(e => {
          return e.system.finalScore >= 2;
        });
        availableAbilities = this.actor.system.abilities.filter(e => {
          return context.teacherAbilities.some(filter => {
            if (context.system.applied)
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
        if (itemData.system.teacher.score < 2) {
          context.system.canEdit = "readonly";
          context.system.applyPossible = "disabled";
          context.system.applyError = "arm5e.activity.msg.uselessTeacher";
          context.system.errorParam =
            itemData.system.teacher.name === ""
              ? game.i18n.localize("arm5e.activity.teacher.label")
              : itemData.system.teacher.name;
          return context;
        }
        availableAbilities = this.actor.system.abilities.filter(e => {
          return e.system.finalScore < itemData.system.teacher.score;
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
        if (itemData.system.teacher.id === null) {
          teacherScore = itemData.system.teacher.score ?? 0;
        } else {
          let teacherAbility = context.teacherAbilities.find(e => {
            return e.system.key === ability.system.key && e.system.option === ability.system.option;
          });
          teacherScore = teacherAbility.system.finalScore;
        }
      }
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
        let filteredList = Object.values(context.system.progress.abilities).filter(e => {
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

    if (context.ui.showMagicProgress) {
      // Arts
      let availableArts = [];
      if (hasTeacher) {
        // get the arts the teacher is skilled enough in to teach
        if (context.system.teacherLinked) {
          let teacherTechniques = Object.entries(teacher.system.arts.techniques)
            .filter(e => {
              if (context.system.applied) {
                return e[1].finalScore >= 5;
              } else {
                return (
                  e[1].finalScore >= 5 &&
                  e[1].finalScore > this.actor.system.arts.techniques[e[0]].finalScore
                );
              }
            })
            .map(e => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.techniques[e[0]].finalScore,
                teacherScore: e[1].finalScore
              };
            });

          let teacherForms = Object.entries(teacher.system.arts.forms)
            .filter(e => {
              if (context.system.applied) {
                return e[1].finalScore >= 5;
              } else {
                return (
                  e[1].finalScore >= 5 &&
                  e[1].finalScore > this.actor.system.arts.forms[e[0]].finalScore
                );
              }
            })
            .map(e => {
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
          if (hasTeacher && itemData.system.teacher.id === null) {
            teacherScore = itemData.system.teacher.score ?? 0;
          }
          if (teacherScore < 5) {
            // must have a score of 5 to teach an Art
            availableArts = [];
          } else {
            let actorTechniques = Object.entries(this.actor.system.arts.techniques).map(e => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.techniques[e[0]].finalScore,
                teacherScore: teacherScore
              };
            });

            let actorForms = Object.entries(this.actor.system.arts.forms).map(e => {
              return {
                key: e[0],
                label: CONFIG.ARM5E.magic.arts[e[0]].label,
                score: this.actor.system.arts.forms[e[0]].finalScore,
                teacherScore: teacherScore
              };
            });

            availableArts = actorTechniques.concat(actorForms);
            availableArts = availableArts.filter(e => {
              return e.score < itemData.system.teacher.score;
            });
          }
        }
      } else {
        availableArts = [
          ...Object.entries(this.actor.system.arts.techniques).map(e => {
            return {
              key: e[0],
              score: e[1].finalScore,
              label: CONFIG.ARM5E.magic.arts[e[0]].label,
              teacherScore: 0
            };
          }),
          ...Object.entries(this.actor.system.arts.forms).map(e => {
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
          let filteredList = Object.values(context.system.progress.arts).filter(e => {
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
      //spells

      let availableSpells = this.actor.system.spells;
      if (hasTeacher) {
        if (context.system.teacherLinked) {
          context.teacherMasteries = teacher.system.spells.filter(e => {
            return e.system.mastery >= 2;
          });
          availableSpells = this.actor.system.spells.filter(e => {
            return context.teacherMasteries.some(filter => {
              if (context.system.applied) {
                return (
                  // for rollback, the item must still be there
                  filter.system.key === e.system.key &&
                  filter.name === e.name &&
                  filter.system.technique === e.system.technique &&
                  filter.system.form === e.system.form
                );
              } else {
                return (
                  filter.system.key === e.system.key &&
                  filter.name === e.name &&
                  filter.system.technique === e.system.technique &&
                  filter.system.form === e.system.form &&
                  filter.system.mastery > e.system.mastery
                );
              }
            });
          });
        } else {
          availableSpells = this.actor.system.spells.filter(e => {
            return e.system.mastery < itemData.system.teacher.score;
          });
        }
      }
      let firstSpell = true;
      for (const spell of availableSpells) {
        let teacherScore = 0;
        if (hasTeacher) {
          if (itemData.system.teacher.id === null) {
            teacherScore = itemData.system.teacher.score ?? 0;
          } else {
            let teacherSpell = context.teacherSpells.find(e => {
              return (
                e.system.key === ability.system.key && e.system.option === ability.system.option
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
          let filteredList = Object.values(context.system.progress.spells).filter(e => {
            return e.id === spell._id;
          });
          if (
            // if spell doesn't exist in current items, set it as next default
            filteredList.length === 0
          ) {
            context.system.defaultSpell = spell._id;
            context.system.teacherScore = teacherScore;
            firstSpell = false;
          }
        }
        context.system.ownedSpells[spell.system.form.value].push(tmp);
      }
    }

    if (!context.system.applied) {
      context.system.sourceQuality += Number(context.system.aeBonus);
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
    updateData["system.teacher.id"] = null;
    updateData[`system.progress.abilities`] = [];
    updateData[`system.progress.arts`] = [];
    updateData[`system.progress.spells`] = [];
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
    updateData["system.sourceQuality"] = 0;
    if (CONFIG.ARM5E.activities.generic[actType].display.abilities === false) {
      updateData["system.progress.abilities"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.arts === false) {
      updateData["system.progress.arts"] = [];
    }
    if (CONFIG.ARM5E.activities.generic[actType].display.spells === false) {
      updateData["system.progress.spells"] = [];
    }
    updateData["system.sourceQuality"] = CONFIG.ARM5E.activities.generic[actType].source.default;
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
    this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _onProgressApply(event) {
    event.preventDefault();
    // this.render();
    let description = this.item.system.description + "<h4>Technical part:<h4><ol>";
    let updateData = [];
    let sourceQuality = 0;

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
      actorUpdate.system.arts[artType][a.key].xp = this.actor.system.arts[artType][a.key].xp + a.xp;
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
        system: {
          applied: true,
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

  async _onProgressRollback(event) {
    event.preventDefault();
    // this.render();
    const actor = this.actor;
    let updateData = [];
    switch (this.item.system.activity) {
      case "adventuring":
      case "exposure":
      case "practice":
      case "training":
      case "teaching":
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
              value: currentCharValue + 1,
              aging: newAgingPts < 0 ? 0 : newAgingPts
            };
          }
        }
        let newDecrepitude = actor.system.decrepitude.points - effects.decrepitude;
        actorUpdate.system.decrepitude = { points: newDecrepitude < 0 ? 0 : newDecrepitude };
        await this.actor.update(actorUpdate, {});
        await this.actor.deleteEmbeddedDocuments("Item", [this.item.id], {});
        return;
        break;
      }
    }
    let description = this.item.system.description + "<h4>Rollbacked<h4>";
    await this.item.update({ system: { applied: false, description: description } });
  }

  async _addAbility(ability) {
    let currentData = Object.values(this.item.system.progress["abilities"]) ?? [];
    let updateData = {};

    if (ability.isOwned && ability.actor._id == this.item.actor._id) {
      // check if it is owned by the character
      log(false, "Owned by the character");
    } else {
      // check if the character already has that skill and use it instead
      let actorAbility = this.item.actor.system.abilities.find(
        e => e.system.key == ability.system.key && e.system.option == ability.system.option
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
      category: CONFIG.ARM5E.ALL_ABILITIES[ability.system.key]?.category ?? "general",
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
    if (button.dataset.applied == "true" || button.dataset.applied === true) {
      return;
    }
    let currentData = Object.values(this.item.system.progress[button.dataset.type]) ?? [];
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
              category: newAb.system.category,
              name: newAb.name,
              currentXp: newAb.system.xp,
              xpNextLevel: newAb.system.xpNextLevel,
              teacherScore: button.dataset.teacherscore,
              xp: 0
            };

            currentData.push(data);
            updateData[`system.progress.abilities`] = currentData;
            // );
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
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }

  async _setCategory(event) {
    event.preventDefault();
    let updateData = {};
    const target = event.currentTarget;
    const idx = target.dataset.index;
    const value = $(target).val();
    const progressType = target.dataset.type;
    let currentData = Object.values(this.item.system.progress[progressType]) ?? [];
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
    let currentData = Object.values(this.item.system.progress[target.dataset.type]) ?? [];
    const selectedAbility = this.actor.items.get(value);
    const data = {
      id: selectedAbility.id,
      name: selectedAbility.name,
      category: selectedAbility.system.category,
      currentXp: selectedAbility.system.xp,
      xpNextLevel: selectedAbility.system.experienceNextLevel,
      xp: 0,
      teacherScore: Object.values(
        this.item.system.ownedAbilities[selectedAbility.system.category]
      ).find(e => {
        return e.key === selectedAbility.system.key && e.option === selectedAbility.system.option;
      }).teacherScore
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
    let currentData = Object.values(this.item.system.progress[target.dataset.type]) ?? [];
    const data = {
      key: value,
      xp: 0,
      teacherScore: this.item.system.ownedArts.find(e => {
        return e.key === value;
      }).teacherScore
    };
    currentData[idx] = data;
    updateData[`system.progress.arts`] = currentData;
    return this.submit({ preventClose: true, updateData: updateData }).then(() => this.render());
  }
}
