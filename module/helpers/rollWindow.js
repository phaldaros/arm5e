import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "./active-effects.js";
import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import { simpleDie, stressDie } from "../dice.js";
import { getActorsFromTargetedTokens } from "./tokens.js";
import { calculateSuccessOfMagic } from "./magic.js";
import { chatContestOfMagic } from "./chat.js";
import { ArM5ePCActor } from "../actor/actor-pc.js";

const CALL_BACK_AFTER_ROLL = {
  SPELL: {
    CALLBACK: checkTargetAndCalculateResistance
  },
  AGING: {
    CALLBACK: applyAgingEffects
  }
};

const STRESS_DIE = {
  COMBAT: {
    TITLE: "arm5e.dialog.title.rolldie"
  },
  MAGIC: {
    TITLE: "arm5e.dialog.title.rolldie"
  },
  SPONT: {
    TITLE: "arm5e.dialog.title.rolldie"
  },
  OPTION: {
    TITLE: "arm5e.dialog.title.rolldie"
  },
  AGING: {
    TITLE: "arm5e.aging.roll.label"
  }
};

function prepareRollVariables(dataset, actorData, activeEffects) {
  if (dataset.roll) {
    if (actorData.data.roll == undefined) actorData.data.roll = {};
    // clean roll data
    actorData.data.roll.year = "";
    actorData.data.roll.season = "";
    actorData.data.roll.type = "";
    actorData.data.roll.label = "";
    actorData.data.roll.modifier = 0;
    actorData.data.roll.advantage = 0;
    actorData.data.roll.characteristic = "";
    actorData.data.roll.ability = "";
    actorData.data.roll.abilitySpeciality = false;
    actorData.data.roll.technique = "";
    actorData.data.roll.form = "";
    actorData.data.roll.total = "";
    actorData.data.roll.aura = 0;
    actorData.data.roll.bonus = 0;
    actorData.data.roll.divide = 1;
    actorData.data.roll.rollLabel = "";
    actorData.data.roll.rollFormula = "";
    actorData.data.roll.useFatigue = true;
    actorData.data.roll.ritual = false;
    actorData.data.roll.focus = false;
    actorData.data.roll.spell = null;

    actorData.data.roll.techniqueScore = 0;
    actorData.data.roll.formScore = 0;

    actorData.data.roll.option1 = 0;
    actorData.data.roll.txtOption1 = "";
    actorData.data.roll.option2 = 0;
    actorData.data.roll.txtOption2 = "";
    actorData.data.roll.option3 = 0;
    actorData.data.roll.txtOption3 = "";
    actorData.data.roll.option4 = 0;
    actorData.data.roll.txtOption4 = "";
    actorData.data.roll.option5 = 0;
    actorData.data.roll.txtOption5 = "";
    actorData.data.roll.bonusActiveEffects = 0;

    // set data to roll
    if (dataset.roll) {
      actorData.data.roll.type = dataset.roll;
    }
    if (dataset.name) {
      actorData.data.roll.label = dataset.name;
    }

    if (dataset.roll == "char") {
      actorData.data.roll.characteristic = dataset.characteristic;
    } else if (dataset.roll == "ability" && dataset.defaultcharacteristicforability) {
      actorData.data.roll.characteristic = dataset.defaultcharacteristicforability;

      if (dataset.ability) {
        actorData.data.roll.ability = dataset.ability;
      }
    } else if (dataset.roll == "spell" || dataset.roll == "magic" || dataset.roll == "spont") {
      if (dataset.id) {
        actorData.data.roll.effectId = dataset.id;
        // TODO: perf: get it from spells array?
        actorData.data.roll.spell = actorData.items.get(dataset.id);
        actorData.data.roll.label += " (" + actorData.data.roll.spell.data.data.level + ")";
        let techData = actorData.data.roll.spell._getTechniqueData(actorData);
        actorData.data.roll.techniqueText = techData[0];
        actorData.data.roll.techniqueScore = techData[1];

        let formData = actorData.data.roll.spell._getFormData(actorData);
        actorData.data.roll.formText = formData[0];
        actorData.data.roll.formScore = formData[1];

        actorData.data.roll.focus = actorData.data.roll.spell.data.data.focus;
        actorData.data.roll.ritual = actorData.data.roll.spell.data.data.ritual;
      } else {
        if (dataset.technique) {
          actorData.data.roll.techniqueText = ARM5E.magic.techniques[dataset.technique].label;
          actorData.data.roll.techniqueScore = parseInt(actorData.data.arts.techniques[dataset.technique].finalScore);
        }
        if (dataset.mform) {
          actorData.data.roll.formScore = parseInt(actorData.data.arts.forms[dataset.mform].finalScore);
          actorData.data.roll.formText = ARM5E.magic.forms[dataset.mform].label;
        }
      }
      // if (dataset.focus) {
      //     if ((dataset.focus) == "false") {
      //         actorData.data.roll.focus = false;
      //     } else if ((dataset.focus) == "true") {
      //         actorData.data.roll.focus = true;
      //     } else {
      //         actorData.data.roll.focus = dataset.ritual;
      //     }
      // }

      if (dataset.bonusActiveEffects) {
        actorData.data.roll.bonusActiveEffects = Number(dataset.bonusActiveEffects);
        const activeEffectsByType = ArM5eActiveEffect.findAllActiveEffectsWithType(activeEffects, "spellcasting");
        actorData.data.roll.activeEffects = activeEffectsByType.map((activeEffect) => {
          const label = activeEffect.data.label;
          let value = 0;
          activeEffect.data.changes
            .filter((c, idx) => {
              return (
                c.mode == CONST.ACTIVE_EFFECT_MODES.ADD && activeEffect.getFlag("arm5e", "type")[idx] == "spellcasting"
              );
            })
            .forEach((item) => {
              value += Number(item.value);
            });
          return {
            label,
            value
          };
        });
      }

      if (dataset.technique) {
        actorData.data.roll.technique = dataset.technique;
      }
      if (dataset.mform) {
        actorData.data.roll.form = dataset.mform;
      }
      // if (dataset.ritual) {
      //     if ((dataset.ritual) == "false") {
      //         actorData.data.roll.ritual = false;
      //     } else if ((dataset.ritual) == "true") {
      //         actorData.data.roll.ritual = true;
      //     } else {
      //         actorData.data.roll.ritual = dataset.ritual;
      //     }
      // }
    } else if (dataset.roll == "aging") {
      actorData.data.roll.year = parseInt(dataset.year);
      actorData.data.roll.season = ARM5E.seasons.winter.label;
      actorData.data.roll.label =
        game.i18n.localize("arm5e.aging.roll.label") +
        " " +
        actorData.data.roll.season +
        " " +
        actorData.data.roll.year;
      actorData.data.roll.txtOption1 = game.i18n.localize("arm5e.sheet.ageModifier");
      actorData.data.roll.option1 = Math.round(parseInt(actorData.data.age.value) / 10);
      actorData.data.roll.txtOption2 = game.i18n.localize("arm5e.sheet.modifiersLife");
      let livingMod = 0;
      if (actorData.data.covenant.linked) {
        let cov = game.actors.get(actorData.data.covenant.actorId);
        if (ArM5ePCActor.isMagus(actorData.type, actorData.data.charType.value)) {
          livingMod = cov.data.data.modifiersLife.magi ?? 0;
        } else {
          livingMod = cov.data.data.modifiersLife.mundane ?? 0;
        }
      }
      actorData.data.roll.option2 = livingMod;
      actorData.data.roll.txtOption3 = game.i18n.localize("arm5e.sheet.longevityModifier");
      actorData.data.roll.option3 = actorData.data.laboratory.longevityRitual.modifier;

      actorData.data.roll.useFatigue = false;
    }
    if (dataset.divide) {
      actorData.data.roll.divide = dataset.divide;
    }
    if (dataset.usefatigue) {
      actorData.data.roll.useFatigue = dataset.usefatigue;
    }
  }
}

function prepareRollFields(dataset, actorData) {
  if (dataset.bonus) {
    actorData.data.roll.bonus = parseInt(actorData.data.roll.bonus) + parseInt(dataset.bonus);
  }
  if (dataset.bonus2) {
    actorData.data.roll.bonus = parseInt(actorData.data.roll.bonus) + parseInt(dataset.bonus2);
  }
  if (dataset.bonus3) {
    actorData.data.roll.bonus = parseInt(actorData.data.roll.bonus) + parseInt(dataset.bonus3);
  }
  if (dataset.option1) {
    actorData.data.roll.option1 = dataset.option1;
  }
  if (dataset.txtoption1) {
    actorData.data.roll.txtOption1 = dataset.txtoption1;
  }
  if (dataset.option2) {
    actorData.data.roll.option2 = dataset.option2;
  }
  if (dataset.txtoption2) {
    actorData.data.roll.txtOption2 = dataset.txtoption2;
  }
  if (dataset.option3) {
    actorData.data.roll.option3 = dataset.option3;
  }
  if (dataset.txtoption3) {
    actorData.data.roll.txtOption3 = dataset.txtoption3;
  }
  if (dataset.option4) {
    actorData.data.roll.option4 = dataset.option4;
  }
  if (dataset.txtoption4) {
    actorData.data.roll.txtOption4 = dataset.txtoption4;
  }
  if (dataset.option5) {
    actorData.data.roll.option5 = dataset.option5;
  }
  if (dataset.txtoption5) {
    actorData.data.roll.txtOption5 = dataset.txtoption5;
  }
}

function cleanBooleans(dataset, actorData) {
  // clean booleans
  if (actorData.data.roll.useFatigue === "false") {
    actorData.data.roll.useFatigue = false;
  }
  if (actorData.data.roll.useFatigue === "false") {
    actorData.data.roll.useFatigue = false;
  }
}

function chooseTemplate(dataset) {
  if (dataset.roll == "combat" || dataset.roll == "option" || dataset.roll == "general") {
    return "systems/arm5e/templates/roll/roll-options.html";
  }
  if (dataset.roll == "char" || dataset.roll == "ability") {
    return "systems/arm5e/templates/roll/roll-characteristic.html";
  }
  if (dataset.roll == "spont") {
    //spontaneous magic
    return "systems/arm5e/templates/roll/roll-magic.html";
  }
  if (dataset.roll == "magic" || dataset.roll == "spell") {
    return "systems/arm5e/templates/roll/roll-spell.html";
  }
  if (dataset.roll == "aging") {
    //aging roll
    return "systems/arm5e/templates/roll/roll-aging.html";
  }
  return "";
}

function updateCharacteristicDependingOnRoll(dataset, actorData) {
  if (dataset.roll == "spont") {
    //spontaneous magic
    actorData.data.roll.characteristic = "sta";
  } else if (dataset.roll == "magic" || dataset.roll == "spell") {
    actorData.data.roll.characteristic = "sta";
  }
}

function getDebugButtonsIfNeeded(actor, callback) {
  if (!game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.MODULE_ID)) return {};
  return {
    explode: {
      label: "DEV Roll 1",
      callback: (html) => stressDie(html, actor, 1, callback)
    },
    zero: {
      label: "DEV Roll 0",
      callback: (html) => stressDie(html, actor, 2, callback)
    }
  };
}

function getDialogData(dataset, html, actor) {
  const callback = CALL_BACK_AFTER_ROLL[dataset.roll.toUpperCase()]?.CALLBACK;
  if (STRESS_DIE[dataset.roll.toUpperCase()]) {
    let mode = 0;
    if (dataset.roll == "aging") {
      mode = 4; // no botches for aging rolls
    }
    return {
      title: game.i18n.localize(STRESS_DIE[dataset.roll.toUpperCase()].TITLE),
      content: html,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("arm5e.dialog.button.stressdie"),
          callback: (html) => stressDie(html, actor, mode, callback)
        },
        no: {
          icon: "<i class='fas fa-ban'></i>",
          label: game.i18n.localize("arm5e.dialog.button.cancel"),
          callback: null
        },
        ...getDebugButtonsIfNeeded(actor, callback)
      }
    };
  } else {
    return {
      title: game.i18n.localize("arm5e.dialog.title.rolldie"),
      content: html,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("arm5e.dialog.button.simpledie"),
          callback: (html) => simpleDie(html, actor, callback)
        },
        no: {
          icon: "<i class='fas fa-bomb'></i>",
          label: game.i18n.localize("arm5e.dialog.button.stressdie"),
          callback: (html) => stressDie(html, actor, 0, callback)
        },
        ...getDebugButtonsIfNeeded(actor, callback)
      }
    };
  }
}

function addListenersDialog(html) {
  html.find(".toggleHidden").click((event) => {
    const hidden = $(event.target).data("hidden");
    html.find(`.${hidden}`).toggle();
  });
}

async function renderRollTemplate(dataset, template, actor, actorData) {
  if (!template) {
    return;
  }

  const renderedTemplate = await renderTemplate(template, actorData);
  const dialogData = getDialogData(dataset, renderedTemplate, actor);
  const dialog = new Dialog(
    {
      ...dialogData,
      render: addListenersDialog
    },
    {
      classes: ["arm5e-dialog", "dialog"],
      height: "600px",
      width: "400px"
    }
  );
  dialog.render(true);
}

async function checkTargetAndCalculateResistance(html, actorCaster, roll, message) {
  const actorsTargeted = getActorsFromTargetedTokens(actorCaster);
  if (!actorsTargeted) {
    return false;
  }
  actorsTargeted.forEach(async (actorTarget) => {
    const successOfMagic = calculateSuccessOfMagic({ actorTarget, actorCaster, roll, spell: message });
    await chatContestOfMagic({ actorCaster, actorTarget, ...successOfMagic });
  });
}

function applyAgingEffects(tml, actorCaster, roll, message) {}

export {
  chooseTemplate,
  updateCharacteristicDependingOnRoll,
  cleanBooleans,
  renderRollTemplate,
  prepareRollFields,
  prepareRollVariables
};
