/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { resetOwnerFields } from "../item/item-converter.js";
import { ARM5E } from "../config.js";
import {
  log,
  getLastMessageByHeader,
  calculateWound,
  getDataset,
  compareSpellsData,
  compareMagicalEffectsData,
  hermeticFilter
} from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { VOICE_AND_GESTURES_VALUES } from "../constants/voiceAndGestures.js";
import { HERMETIC_FILTER, updateUserCache } from "../constants/userdata.js";
import {
  findVoiceAndGesturesActiveEffects,
  modifyVoiceOrGesturesActiveEvent
} from "../helpers/voiceAndGestures.js";

import {
  prepareRollVariables,
  prepareRollFields,
  cleanBooleans,
  updateCharacteristicDependingOnRoll,
  renderRollTemplate,
  chooseTemplate,
  ROLL_MODES,
  getRollTypeProperties
} from "../helpers/rollWindow.js";

import { spellTechniqueLabel, spellFormLabel } from "../helpers/spells.js";

export class ArM5eActorSheet extends ActorSheet {
  // /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: ".macro-ready" }]
      /*         classes: ["arm5e", "sheet", "actor"],
         template: "systems/arm5e/templates/actor/actor-pc-sheet.html",
         width: 1100,
         height: 900,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "description"
        }
      ]*/
    });
  }

  /* -------------------------------------------- */

  isItemDropAllowed(itemData) {
    return false;

    // template for future sheet:
    // switch (itemData.type) {
    //     case "weapon":
    //     case "armor":
    //     case "spell":
    //     case "vis":
    //     case "item":
    //     case "book":
    //     case "virtue":
    //     case "flaw":
    //     case "ability":
    //     case "abilityFamiliar":
    //     case "diaryEntry":
    //     case "might":
    //     case "mightFamiliar":
    //     case "speciality":
    //     case "distinctive":
    //     case "sanctumRoom":
    //     case "magicItem":
    //     case "personality":
    //     case "reputation":
    //     case "habitantMagi":
    //     case "habitantCompanion":
    //     case "habitantSpecialists":
    //     case "habitantHabitants":
    //     case "habitantHorses":
    //     case "habitantLivestock":
    //     case "possessionsCovenant":
    //     case "visSourcesCovenant":
    //     case "visStockCovenant":
    //     case "magicalEffect":
    //     case "baseEffect":
    //     case "calendarCovenant":
    //     case "incomingSource":
    //     case "laboratoryText":
    //     case "mundaneBook":
    //         return true;
    //     default:
    //         return false;
    // }
  }

  isActorDropAllowed(type) {
    return false;
    // template for future sheet:
    // switch (type) {
    //     case "player":
    //     case "npc":
    //     case "laboratory":
    //     case "covenant":
    //     case "magicCodex":
    //         return true;
    //     default:
    //         return false;
    // }
  }

  // tells whether or not a type of item needs to be converted when dropped to a specific sheet.
  needConversion(type) {
    return false;
  }

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties fore
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    context.config = CONFIG.ARM5E;
    context.config.constants = { VOICE_AND_GESTURES_VALUES: VOICE_AND_GESTURES_VALUES };

    context.data.dtypes = ["String", "Number", "Boolean"];

    // Xzotl : not sure what this was used for
    // for (let attr of Object.values(context.data.attributes)) {
    //   attr.isCheckbox = attr.dtype === "Boolean";
    // }

    // Allow effect creation
    actorData.data.effectCreation = true;

    if (actorData.type == "player" || actorData.type == "npc") {
      let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
      if (usercache[this.actor.id]) {
        context.userData = usercache[this.actor.id];
      } else {
        usercache[this.actor.id] = {
          filters: {
            hermetic: {
              spells: HERMETIC_FILTER,
              magicalEffects: HERMETIC_FILTER,
              laboratoryTexts: HERMETIC_FILTER
            },
            abilities: {
              category: ""
            }
          }
        };
        context.userData = usercache[this.actor.id];
        sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
      }

      context.data.world = {};

      // check whether the character is linked to an existing covenant
      context.data.world.covenants = game.actors
        .filter((a) => a.type == "covenant")
        .map(({ name, id }) => ({
          name,
          id
        }));
      if (context.data.covenant) {
        let cov = context.data.world.covenants.filter((c) => c.name == context.data.covenant.value);
        if (cov.length > 0) {
          context.data.covenant.linked = true;
          context.data.covenant.actorId = cov[0].id;
        } else {
          context.data.covenant.linked = false;
        }
      }

      if (context.data.charType.value == "magusNPC" || context.data.charType.value == "magus") {
        // Arts icons style
        context.artsIcons = game.settings.get("arm5e", "artsIcons");
        context.data.world.labs = game.actors
          .filter((a) => a.type == "laboratory")
          .map(({ name, id }) => ({
            name,
            id
          }));

        // check whether the character is linked to an existing lab
        if (context.data.sanctum) {
          let lab = context.data.world.labs.filter((c) => c.name == context.data.sanctum.value);
          if (lab.length > 0) {
            context.data.sanctum.linked = true;
            context.data.sanctum.actorId = lab[0].id;
          } else {
            context.data.sanctum.linked = false;
          }
        }

        // lab total modifiers
        if (context.data.labtotal === undefined) {
          context.data.labtotal = {};
        }
        if (context.data.labtotal.modifier === undefined) {
          context.data.labtotal.modifier = 0;
        }
        if (context.data.sanctum.linked) {
          let lab = game.actors.get(context.data.sanctum.actorId);
          if (lab) {
            context.data.labtotal.quality = parseInt(lab.data.data.generalQuality.total);
          }
        } else {
          if (context.data.labtotal.quality === undefined) {
            context.data.labtotal.quality = 0;
          }
        }

        if (context.data.covenant.linked) {
          let cov = game.actors.get(context.data.covenant.actorId);
          if (cov) {
            if (cov.data.data.levelAura == "") {
              context.data.labtotal.aura = 0;
            } else {
              context.data.labtotal.aura = cov.data.data.levelAura;
            }
          }
        } else {
          if (context.data.labtotal.aura === undefined) {
            context.data.labtotal.aura = 0;
          }
        }

        if (context.data.labtotal.applyFocus == undefined) {
          context.data.labtotal.applyFocus = false;
        }

        // hermetic filters
        // 1. Filter
        // Spells
        let spellsFilters = context.userData.filters.hermetic.spells;
        context.ui = {};
        context.data.spells = hermeticFilter(spellsFilters, context.data.spells);
        if (spellsFilters.expanded) {
          context.ui.spellsFilterVisibility = "";
        } else {
          context.ui.spellsFilterVisibility = "hidden";
        }
        if (
          spellsFilters.formFilter != "" ||
          spellsFilters.techniqueFilter != "" ||
          (spellsFilters.levelFilter != 0 && spellsFilters.levelFilter != null)
        ) {
          context.ui.spellFilter = 'style="text-shadow: 0 0 5px maroon"';
        }

        // magical effects
        let magicEffectFilters = context.userData.filters.hermetic.magicalEffects;
        context.data.magicalEffects = hermeticFilter(
          magicEffectFilters,
          context.data.magicalEffects
        );
        if (magicEffectFilters.expanded) {
          context.ui.magicEffectFilterVisibility = "";
        } else {
          context.ui.magicEffectFilterVisibility = "hidden";
        }
        if (
          magicEffectFilters.formFilter != "" ||
          magicEffectFilters.techniqueFilter != "" ||
          (magicEffectFilters.levelFilter != 0 && magicEffectFilters.levelFilter != null)
        ) {
          context.ui.magicEffectFilter = 'style="text-shadow: 0 0 5px maroon"';
        }
        // 2. Sort
        context.data.spells = context.data.spells.sort(compareSpellsData);
        context.data.magicalEffects = context.data.magicalEffects.sort(compareMagicalEffectsData);

        // magic arts
        for (let [key, technique] of Object.entries(context.data.arts.techniques)) {
          if (!technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = { style: 'style="border: 0px; height: 40px;"' };
          } else if (!technique.bonus && technique.xpCoeff != 1.0) {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px maroon"',
              title: "Affinity, "
            };
          } else if (technique.bonus && technique.xpCoeff == 1.0) {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px blue"',
              title: ""
            };
          } else {
            technique.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px purple"',
              title: "Affinity, "
            };
          }
        }
        context.data.labTotals = {};
        for (let [key, form] of Object.entries(context.data.arts.forms)) {
          if (!form.bonus && form.xpCoeff == 1.0) {
            form.ui = { style: 'style="border: 0px; height: 40px;"' };
          } else if (!form.bonus && form.xpCoeff != 1.0) {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px maroon"',
              title: "Affinity, "
            };
          } else if (form.bonus && form.xpCoeff == 1.0) {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px blue"',
              title: ""
            };
          } else {
            form.ui = {
              style: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px purple"',
              title: "Affinity, "
            };
          }
          // compute lab totals:
          context.data.labTotals[key] = {};
          for (let [k2, technique] of Object.entries(context.data.arts.techniques)) {
            let techScore = technique.finalScore;
            let formScore = form.finalScore;
            if (context.data.labtotal.applyFocus) {
              if (techScore > formScore) {
                formScore *= 2;
              } else {
                techScore *= 2;
              }
            }
            context.data.labTotals[key][k2] =
              formScore +
              techScore +
              context.data.laboratory.basicLabTotal.value +
              parseInt(context.data.labtotal.quality) +
              parseInt(context.data.labtotal.aura) +
              parseInt(context.data.labtotal.modifier) +
              context.data.bonuses.arts.laboratory;
          }
        }
      }

      for (let [key, ab] of Object.entries(context.data.abilities)) {
        if (ab.data.derivedScore == ab.data.finalScore && ab.data.xpCoeff == 1.0) {
          ab.ui = { style: "" };
        } else if (ab.data.derivedScore == ab.data.finalScore && ab.data.xpCoeff != 1.0) {
          ab.ui = { style: 'style="box-shadow: 0 0 10px maroon"', title: "Affinity, " };
        } else if (ab.data.derivedScore != ab.data.finalScore && ab.data.xpCoeff == 1.0) {
          ab.ui = { style: 'style="box-shadow: 0 0 10px blue"', title: "" };
        } else {
          ab.ui = { style: 'style="box-shadow: 0 0 10px purple"', title: "Affinity, " };
        }
      }

      for (let [key, charac] of Object.entries(context.data.characteristics)) {
        let shadowWidth = 2 * charac.aging;
        charac.ui = {
          style: 'style="box-shadow: 0 0 ' + shadowWidth + 'px black"',
          title: `${charac.aging} ` + game.i18n.localize("arm5e.sheet.agingPts")
        };
        // log(false, `${key} has ${charac.aging} points`);
      }
    }
    context.isGM = game.user.isGM;

    context.devMode = game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.MODULE_ID);
    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = ArM5eActiveEffect.prepareActiveEffectCategories(this.actor.effects);
    if (context.data?.arts?.voiceAndGestures) {
      context.data.arts.voiceAndGestures = findVoiceAndGesturesActiveEffects(this.actor.effects);
    }
    this._prepareCharacterItems(context);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(actorData) {
    if (
      actorData.actor.type == "player" ||
      actorData.actor.type == "npc" ||
      actorData.actor.type == "laboratory" ||
      actorData.actor.type == "covenant"
    ) {
      for (let virtue of actorData.data.virtues) {
        if (virtue.effects.size > 0) {
          virtue.data.ui = { style: 'style="font-style:italic"' };
        }
      }

      for (let flaw of actorData.data.flaws) {
        if (flaw.effects.size > 0) {
          flaw.data.ui = { style: 'style="font-style:italic"' };
        }
      }
    }

    if (actorData.actor.type == "player" || actorData.actor.type == "npc") {
      for (let spell of actorData.data.spells) {
        spell.TechReq = spellTechniqueLabel(spell);
        spell.FormReq = spellFormLabel(spell);
      }

      for (let effect of actorData.data.magicalEffects) {
        effect.TechReq = spellTechniqueLabel(effect);
        effect.FormReq = spellFormLabel(effect);
      }
    }
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // filters
    html.find(".toggleHidden").click(async (ev) => {
      const list = $(ev.target).data("list");
      const val = html.find(`.${list}`).attr("class").indexOf("hidden");
      await updateUserCache(this.actor.id, list, "expanded", val >= 0);
      html.find(`.${list}`).toggleClass("hidden");
    });

    html.find(".technique-filter").change(async (ev) => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "techniqueFilter", val);
      this.render();
    });

    html.find(".form-filter").change(async (ev) => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "formFilter", val);
      this.render();
    });

    html.find(".levelOperator-filter").change(async (ev) => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "levelOperator", val);
      this.render();
    });

    html.find(".level-filter").change(async (ev) => {
      ev.preventDefault();
      const list = $(ev.currentTarget).data("list");
      const val = ev.target.value;
      await updateUserCache(this.actor.id, list, "levelFilter", val);
      this.actor.update();
    });

    html.find(".sortable").click((ev) => {
      const listName = ev.currentTarget.dataset.list;
      let val = this.actor.getFlag("arm5e", "sorting", listName);
      if (val === undefined) {
        this.actor.setFlag("arm5e", "sorting", {
          [listName]: true
        });
      } else {
        this.actor.setFlag("arm5e", "sorting", {
          [listName]: !val[listName]
        });
      }
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Render the linked actor sheet for viewing/editing prior to the editable check.
    html.find(".actor-link").click(this._onActorRender.bind(this));

    // Add Inventory Item
    html.find(".item-create").click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find(".item-edit").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getEmbeddedDocument("Item", li.data("itemId"));
      // const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true);
    });

    html.find(".increase-tech").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._increaseArt("techniques", element[0].dataset.attribute);
    });
    html.find(".decrease-tech").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._deccreaseArt("techniques", element[0].dataset.attribute);
    });

    html.find(".increase-form").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._increaseArt("forms", element[0].dataset.attribute);
    });
    html.find(".decrease-form").click((event) => {
      const element = $(event.currentTarget).parents(".art");
      this._deccreaseArt("forms", element[0].dataset.attribute);
    });

    // Quick edit of Item from inside Actor sheet
    html.find(".quick-edit").change((event) => {
      const li = $(event.currentTarget).parents(".item");
      let field = $(event.currentTarget).attr("name");
      let itemId = li.data("itemId");
      const item = this.actor.getEmbeddedDocument("Item", itemId);
      let value = event.target.value;
      if ($(event.currentTarget).attr("data-dtype") === "Number") {
        value = Number(event.target.value);
      } else if ($(event.currentTarget).attr("data-dtype") === "Boolean") {
        // let oldValue = getProperty(item, "data.data." + field);;
        let oldValue = item.data.data[[field]];
        value = !oldValue;
      }

      this.actor.updateEmbeddedDocuments("Item", [
        {
          _id: itemId,
          data: {
            [field]: value
          }
        }
      ]);
    });

    // Delete Inventory Item
    html.find(".item-delete").click((ev) => {
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      itemId = itemId instanceof Array ? itemId : [itemId];
      this.actor.deleteEmbeddedDocuments("Item", itemId, {});
      li.slideUp(200, () => this.render(false));
    });

    html.find(".item-delete-confirm").click(async (event) => {
      event.preventDefault();
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      const li = $(event.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      await Dialog.confirm({
        title: `${li[0].dataset.name}`,
        content: `<p>${question}</p>`,
        yes: () => {
          itemId = itemId instanceof Array ? itemId : [itemId];
          this.actor.deleteEmbeddedDocuments("Item", itemId, {});
          li.slideUp(200, () => this.render(false));
        },
        no: () => null,
        rejectClose: true
      });
    });

    // Generate abilities automatically
    html.find(".abilities-generate").click(this._onGenerateAbilities.bind(this));

    html.find(".rest").click((ev) => {
      if (
        this.actor.data.type === "player" ||
        this.actor.data.type === "npc" ||
        this.actor.type == "beast"
      ) {
        this.actor.rest();
      }
    });

    // Rollable abilities.
    html.find(".rollable").click(this._onRoll.bind(this));
    // html.find(".agingPoints").click(this._onRoll.bind(this));

    html.find(".pick-covenant").click(this._onPickCovenant.bind(this));
    html.find(".soak-damage").click(this._onSoakDamage.bind(this));
    html.find(".damage").click(this._onCalculateDamage.bind(this));
    html.find(".voice-and-gestures").change(this._onSelectVoiceAndGestures.bind(this));
    html.find(".addFatigue").click((event) => this.actor._changeFatigueLevel(1));
    html.find(".removeFatigue").click((event) => this.actor._changeFatigueLevel(-1));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find("li.item").each((i, li) => {
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    // Active Effect management
    html
      .find(".effect-control")
      .click((ev) => ArM5eActiveEffect.onManageActiveEffect(ev, this.actor));

    // migrate actor
    html.find(".migrate").click((event) => this.actor.migrate());
  }

  async _increaseArt(type, art) {
    let oldXp = this.actor.data.data.arts[type][art].xp;
    let newXp = Math.round(
      ((this.actor.data.data.arts[type][art].derivedScore + 1) *
        (this.actor.data.data.arts[type][art].derivedScore + 2)) /
        (2 * this.actor.data.data.arts[type][art].xpCoeff)
    );
    let updateData = {};
    updateData[`data.arts.${type}.${art}.xp`] = newXp;
    await this.actor.update(updateData, {});

    let delta = newXp - oldXp;
    console.log(`Added ${delta} xps from ${oldXp} to ${newXp}`);
  }

  async _deccreaseArt(type, art) {
    if (this.actor.data.data.arts[type][art].derivedScore != 0) {
      let oldXp = this.actor.data.data.arts[type][art].xp;
      let newXp = Math.round(
        ((this.actor.data.data.arts[type][art].derivedScore - 1) *
          this.actor.data.data.arts[type][art].derivedScore) /
          (2 * this.actor.data.data.arts[type][art].xpCoeff)
      );
      let updateData = {};
      updateData[`data.arts.${type}.${art}.xp`] = newXp;

      await this.actor.update(updateData, {});
      let delta = newXp - oldXp;
      console.log(`Removed ${delta} xps from ${oldXp} to ${newXp} total`);
    }
  }

  async _onActorRender(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const id = header.dataset.actorid;
    const actor = game.actors.get(id);
    actor.sheet.render(true);
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = [
      {
        name: name,
        type: type,
        data: foundry.utils.deepClone(header.dataset)
      }
    ];
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData[0].data["type"];

    // Finally, create the item!
    // console.log("Add item");
    // console.log(itemData);

    let newItem = await this.actor.createEmbeddedDocuments("Item", itemData, {});

    newItem[0].sheet.render(true);
    return newItem;
  }

  /* Handle covenant pick */
  async _onPickCovenant(event) {
    event.preventDefault();
    const element = event.currentTarget;
    log("false", this.actor.data);
    var actor = this.actor;
    let template = "systems/arm5e/templates/generic/simpleListPicker.html";
    renderTemplate(template, this.actor).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.chooseCovenant"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: (html) => setCovenant(html, actor)
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: `Cancel`,
              callback: null
            }
          }
        },
        {
          jQuery: true,
          height: "140px",
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }

  async _onSoakDamage(html, actor) {
    const lastMessageDamage = getLastMessageByHeader(game, "arm5e.sheet.damage");
    const damage = parseInt($(lastMessageDamage?.data?.content).text()) || 0;
    const extraData = {
      damage,
      modifier: 0
    };

    const element = event.currentTarget;
    log("false", this.actor.data);
    var actor = this.actor;

    const data = {
      actor,
      extraData
    };
    let template = "systems/arm5e/templates/actor/parts/actor-soak.html";
    renderTemplate(template, data).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.woundCalculator"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: (html) => setWounds(html, actor)
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: `Cancel`,
              callback: null
            }
          }
        },
        {
          jQuery: true,
          height: "140px",
          width: "400px",
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }

  async _onSelectVoiceAndGestures(event) {
    event.preventDefault();
    const name = $(event.target).attr("effect");
    await modifyVoiceOrGesturesActiveEvent(this, name, $(event.target).val());
  }

  async _onCalculateDamage(html, actor) {
    event.preventDefault();
    const lastAttackMessage = getLastMessageByHeader(game, "arm5e.sheet.attack");
    const lastDefenseMessage = getLastMessageByHeader(game, "arm5e.sheet.defense");
    const attack = parseInt(lastAttackMessage?.data?.content || "0");
    const defense = parseInt(lastDefenseMessage?.data?.content || "0");
    const advantage = attack - defense;

    const extraData = {
      advantage,
      modifier: 0
    };

    const element = event.currentTarget;
    log("false", this.actor.data);
    var actor = this.actor;

    const data = {
      actor,
      extraData
    };
    let template = "systems/arm5e/templates/actor/parts/actor-calculateDamage.html";
    renderTemplate(template, data).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.dialog.damageCalculator"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Yes`,
              callback: (html) => calculateDamage(html, actor)
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: `Cancel`,
              callback: null
            }
          }
        },
        {
          jQuery: true,
          height: "140px",
          width: "400px",
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }

  async _onGenerateAbilities(event) {
    let charType = this.actor.data.data.charType.value;
    let updateData = {};
    if (charType === "magus" || charType === "magusNPC") {
      let abilities = this.actor.items.filter((i) => i.type == "ability");
      let newAbilities = [];
      for (let [key, a] of Object.entries(CONFIG.ARM5E.character.magicAbilities)) {
        let localizedA = game.i18n.localize(a);
        // check if the ability already exists in the Actor
        let abs = abilities.filter((ab) => ab.name == localizedA || ab.name === localizedA + "*");

        if (abs.length == 0) {
          log(false, `Did not find ${game.i18n.localize(a)}, creating it...`);
          const itemData = {
            name: localizedA,
            type: "ability"
          };
          // First, check if the Ability is found in the world
          abs = game.items.filter(
            (i) => i.type === "ability" && (i.name === localizedA || i.name === localizedA + "*")
          );
          if (abs.length == 0) {
            // Then, check if the Abilities compendium exists
            let abPack = game.packs.filter(
              (p) => p.metadata.package === "arm5e" && p.metadata.name === "abilities"
            );
            const documents = await abPack[0].getDocuments();
            for (let doc of documents) {
              if (doc.name === localizedA || doc.name === localizedA + "*") {
                itemData.data = foundry.utils.deepClone(doc.data.data);
                break;
              }
            }
          } else {
            itemData.data = foundry.utils.deepClone(abs[0].data.data);
          }

          newAbilities.push(itemData);
        } else {
          // found the ability, assign its Id
          updateData[`data.laboratory.abilitiesSelected.${key}.abilityID`] = abs[0].id;
        }
      }
      this.actor.update(updateData, {});
      this.actor.createEmbeddedDocuments("Item", newAbilities, {});
    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    const dataset = getDataset(event);

    if (this.actor.data.data.wounds.dead.number > 0) {
      ui.notifications.info(game.i18n.localize("arm5e.notification.dead"), {
        permanent: true
      });
      return;
    }
    if ((getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.UNCONSCIOUS) == 0) {
      // if (dataset.roll != "char" && dataset.roll != "aging" && dataset.roll != "crisis") {
      if (this.actor.data.data.pendingCrisis) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.pendingCrisis"), {
          permanent: true
        });
        return;
      }

      if (this.actor.data.data.fatigueCurrent == this.actor.data.data.fatigueMaxLevel) {
        ui.notifications.info(game.i18n.localize("arm5e.notification.unconscious"), {
          permanent: true
        });
        return;
      }
    }

    prepareRollVariables(dataset, this.actor.data, this.actor.effects);
    prepareRollFields(dataset, this.actor.data);
    cleanBooleans(dataset, this.actor.data);

    var actor = this.actor;
    this.actor.data.data.charmetadata = ARM5E.character.characteristics;
    updateCharacteristicDependingOnRoll(dataset, this.actor.data);

    const template = chooseTemplate(dataset);
    renderRollTemplate(dataset, template, actor, this.actor.data);
  }

  // Overloaded core functions (TODO: review at each Foundry update)

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData     The item data requested for creation
   * @return {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    let filtered = itemData.filter((e) => this.isItemDropAllowed(e));
    for (let item of filtered) {
      // log(false, "Before reset " + JSON.stringify(item.data));
      item = resetOwnerFields(item);
      // log(false, "After reset " + JSON.stringify(item.data));
    }

    return super._onDropItemCreate(filtered);
  }

  /**
   * Handle dropping of an actor reference or item data onto an Actor Sheet
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {Object} data         The data transfer extracted from the event
   * @return {Promise<Object>}    A data object which describes the result of the drop
   * @private
   * @override
   */
  async _onDropActor(event, data) {
    if (!super._onDropActor(event, data)) {
      return false;
    }
    let droppedActor;
    // if coming from a compendium, reject
    if (data.pack) {
      return false;
    } else if (data.id != undefined) {
      droppedActor = game.actors.get(data.id);
    } else {
      console.warn("No Id for actor dropped");
      return false;
    }
    // link both ways
    let res = await this._bindActor(droppedActor);
    let res2 = await droppedActor.sheet._bindActor(this.actor);
    return res && res2;
  }

  async _bindActor(actor) {
    return false;
  }
}

export async function setCovenant(selector, actor) {
  let actorUpdate = {};
  let found = selector.find(".SelectedItem");
  if (found.length > 0) {
    actorUpdate["data.covenant.value"] = found[0].value;
  }

  await actor.update(actorUpdate);
}

export async function setWounds(selector, actor) {
  const damageToApply = parseInt(selector.find('input[name$="damage"]').val());
  const modifier = parseInt(selector.find('input[name$="modifier"]').val());
  const prot = parseInt(selector.find('label[name$="prot"]').attr("value") || 0);
  const bonus = parseInt(selector.find('label[name$="soak"]').attr("value") || 0);
  const stamina = parseInt(selector.find('label[name$="stamina"]').attr("value") || 0);
  const damage = damageToApply - modifier - prot - stamina - bonus;
  const size = actor?.data?.data?.vitals?.siz?.value || 0;
  const typeOfWound = calculateWound(damage, size);
  if (typeOfWound === false) {
    ui.notifications.info(game.i18n.localize("arm5e.notification.notPossibleToCalculateWound"), {
      permanent: true
    });
    return false;
  }

  const title = '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.soak") + "</h2>";
  const messageDamage = `${game.i18n.localize("arm5e.sheet.damage")} (${damage})`;
  const messageStamina = `${game.i18n.localize("arm5e.sheet.stamina")} (${stamina})`;
  let messageBonus = "";
  if (bonus) {
    messageBonus = `${game.i18n.localize("arm5e.sheet.soakBonus")} (${bonus})<br/> `;
  }
  const messageProt = `${game.i18n.localize("arm5e.sheet.protection")} (${prot})`;
  let messageModifier = "";
  if (modifier) {
    messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${modifier})<br/>`;
  }
  const messageWound = typeOfWound
    ? game.i18n.format("arm5e.messages.woundResult", {
        typeWound: game.i18n.localize("arm5e.messages.wound." + typeOfWound.toLowerCase())
      })
    : game.i18n.localize("arm5e.messages.noWound");

  ChatMessage.create({
    content: `<h4 class="dice-total">${messageWound}</h4>`,
    flavor: `${title} ${messageDamage}<br/> ${messageStamina}<br/> ${messageProt}<br/> ${messageBonus}${messageModifier}`,
    speaker: ChatMessage.getSpeaker({
      actor
    })
  });

  if (typeOfWound) {
    let actorUpdate = {
      data: {
        wounds: {
          [typeOfWound]: {
            number: {
              value: actor.data.data.wounds[typeOfWound].number.value + 1
            }
          }
        }
      }
    };

    await actor.update(actorUpdate);
  }
}

export async function calculateDamage(selector, actor) {
  const strenght = parseInt(selector.find('label[name$="strenght"]').attr("value") || 0);
  const weapon = parseInt(selector.find('label[name$="weapon"]').attr("value") || 0);
  const advantage = parseInt(selector.find('input[name$="advantage"]').val());
  const modifier = parseInt(selector.find('input[name$="modifier"]').val());
  const damage = strenght + weapon + advantage + modifier;
  const title = '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.damage") + "</h2>";
  const messageStrenght = `${game.i18n.localize("arm5e.sheet.strength")} (${strenght})`;
  const messageWeapon = `${game.i18n.localize("arm5e.sheet.damage")} (${weapon})`;
  const messageAdvantage = `${game.i18n.localize("arm5e.sheet.advantage")} (${advantage})`;
  const messageModifier = `${game.i18n.localize("arm5e.sheet.modifier")} (${modifier})`;
  const messageDamage = `<h4 class="dice-total">${damage}</h4>`;
  ChatMessage.create({
    content: messageDamage,
    flavor: `${title} ${messageStrenght}<br/> ${messageWeapon}<br/> ${messageAdvantage}<br/> ${messageModifier}<br/>`,
    speaker: ChatMessage.getSpeaker({
      actor
    })
  });
}
