import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "./active-effects.js";
import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import { simpleDie, stressDie } from "../dice.js";
import { getActorsFromTargetedTokens } from "./tokens.js";
import { calculateSuccessOfMagic } from "./magic.js";
import { chatContestOfMagic } from "./chat.js";
import { ArM5ePCActor } from "../actor/actor-pc.js";
import { applyAgingEffects, agingCrisis } from "./long-term-activities.js";
import { exertSelf } from "./combat.js";
import { log } from "../tools.js";

// below is a bitmap
const ROLL_MODES = {
  STRESS: 1,
  SIMPLE: 2,
  NO_BOTCH: 4,
  NO_CONF: 8, // no confidence use
  UNCONSCIOUS: 16, // can roll unconscious
  PRIVATE: 32, // roll is private between the GM and player
  // common combos
  STRESS_OR_SIMPLE: 3
};

const ROLL_PROPERTIES = {
  DEFAULT: {
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  COMBAT: {
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie",
    ALT_ACTION: exertSelf,
    ALT_ACTION_LABEL: "arm5e.dialog.button.exertSelf"
  },
  INIT: {
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  MAGIC: {
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  SPONT: {
    MODE: ROLL_MODES.STRESS,
    TITLE: "arm5e.dialog.title.rolldie"
  },
  CHAR: {
    MODE: 19, // STRESS + SIMPLE + UNCONSCIOUS
    TITLE: "arm5e.dialog.title.rolldie"
  },
  SPELL: {
    MODE: ROLL_MODES.STRESS_OR_SIMPLE,
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: checkTargetAndCalculateResistance
  },
  AGING: {
    MODE: 61, // STRESS + NO_BOTCH + NO_CONF + UNCONSCIOUS + PRIVATE
    TITLE: "arm5e.aging.roll.label",
    CALLBACK: applyAgingEffects
  },
  CRISIS: {
    MODE: 58, // SIMPLE + NO_CONF + UNCONSCIOUS + PRIVATE
    TITLE: "arm5e.aging.crisis.label",
    CALLBACK: agingCrisis
  }
};
function getRollTypeProperties(type) {
  return ROLL_PROPERTIES[type.toUpperCase()] ?? ROLL_PROPERTIES.DEFAULT;
}

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
    // This is property will be used in the chat message as an icon for the roll
    actorData.data.roll.img = null;
    actorData.data.roll.name = null;
    //
    actorData.data.roll.difficulty = 0;

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

    if (dataset.roll == "combat") {
      actorData.data.roll.img = actorData.data.combat.img;
      actorData.data.roll.name = actorData.data.combat.name;
    }
    if (dataset.roll == "char") {
      actorData.data.roll.characteristic = dataset.characteristic;
    } else if (dataset.roll == "ability" && dataset.defaultcharacteristicforability) {
      actorData.data.roll.characteristic = dataset.defaultcharacteristicforability;

      if (dataset.ability) {
        actorData.data.roll.ability = dataset.ability;
        const ab = actorData.items.get(dataset.ability);
        actorData.data.roll.img = ab.img;
        actorData.data.roll.name = ab.name;
      }
    } else if (dataset.roll == "spell" || dataset.roll == "magic" || dataset.roll == "spont") {
      if (dataset.id) {
        actorData.data.roll.effectId = dataset.id;
        // TODO: perf: get it from spells array?
        actorData.data.roll.spell = actorData.items.get(dataset.id);
        actorData.data.roll.label += " (" + actorData.data.roll.spell.data.data.level + ")";
        actorData.data.roll.img = actorData.data.roll.spell.img;
        let techData = actorData.data.roll.spell._getTechniqueData(actorData);
        actorData.data.roll.techniqueText = techData[0];
        actorData.data.roll.techniqueScore = techData[1];

        let formData = actorData.data.roll.spell._getFormData(actorData);
        actorData.data.roll.formText = formData[0];
        actorData.data.roll.formScore = formData[1];

        actorData.data.roll.focus = actorData.data.roll.spell.data.data.applyFocus;
        actorData.data.roll.ritual = actorData.data.roll.spell.data.data.ritual;

        actorData.data.roll.difficulty =
          actorData.data.roll.spell.data.data.level - 10 > 0
            ? actorData.data.roll.spell.data.data.level - 10
            : 0;
      } else {
        if (dataset.technique) {
          actorData.data.roll.techniqueText = ARM5E.magic.techniques[dataset.technique].label;
          actorData.data.roll.techniqueScore = parseInt(
            actorData.data.arts.techniques[dataset.technique].finalScore
          );
        }
        if (dataset.mform) {
          actorData.data.roll.formScore = parseInt(
            actorData.data.arts.forms[dataset.mform].finalScore
          );
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
        const activeEffectsByType = ArM5eActiveEffect.findAllActiveEffectsWithType(
          activeEffects,
          "spellcasting"
        );
        actorData.data.roll.activeEffects = activeEffectsByType.map((activeEffect) => {
          const label = activeEffect.data.label;
          let value = 0;
          activeEffect.data.changes
            .filter((c, idx) => {
              return (
                c.mode == CONST.ACTIVE_EFFECT_MODES.ADD &&
                activeEffect.getFlag("arm5e", "type")[idx] == "spellcasting"
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
      actorData.data.roll.option3 =
        actorData.data.laboratory.longevityRitual.modifier + actorData.data.bonuses.traits.aging;
      if (actorData.data.familiar && actorData.data.familiar.cordFam.bronze > 0) {
        actorData.data.roll.txtOption4 = game.i18n.localize("arm5e.aging.roll.bronze");
        actorData.data.roll.option4 = actorData.data.familiar.cordFam.bronze;
      }
      actorData.data.roll.useFatigue = false;
    } else if (dataset.roll == "crisis") {
      actorData.data.roll.year = parseInt(dataset.year);
      actorData.data.roll.season = game.i18n.localize(ARM5E.seasons.winter.label);
      actorData.data.roll.label =
        game.i18n.localize("arm5e.aging.crisis.label") +
        " " +
        actorData.data.roll.season +
        " " +
        actorData.data.roll.year;

      actorData.data.roll.txtOption1 = game.i18n.localize("arm5e.sheet.decrepitude");
      actorData.data.roll.option1 = actorData.data.decrepitude.finalScore;
      actorData.data.roll.txtOption2 = game.i18n.localize("arm5e.sheet.ageModifier");
      actorData.data.roll.option2 = Math.round(parseInt(actorData.data.age.value) / 10);
      actorData.data.roll.useFatigue = false;
    }
    if (dataset.divide) {
      actorData.data.roll.divide = dataset.divide;
    }
    if (dataset.usefatigue) {
      actorData.data.roll.useFatigue = dataset.usefatigue;
    }
  }

  log(false, `Roll data: ${JSON.stringify(actorData.data.roll)}`);
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
  if (
    dataset.roll == "combat" ||
    dataset.roll == "init" ||
    dataset.roll == "option" ||
    dataset.roll == "general"
  ) {
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
  if (dataset.roll == "crisis") {
    //aging crisis roll
    return "systems/arm5e/templates/roll/roll-aging-crisis.html";
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
      callback: (html) => stressDie(html, actor, 1, callback, actor.data.data.roll.type)
    },
    zero: {
      label: "DEV Roll 0",
      callback: (html) => stressDie(html, actor, 2, callback, actor.data.data.roll.type)
    }
  };
}

function getDialogData(dataset, html, actor) {
  const callback = getRollTypeProperties(dataset.roll).CALLBACK;

  let btns = {};
  let mode = 0;
  const altAction = getRollTypeProperties(dataset.roll).ALT_ACTION;
  let altBtn;
  if (altAction) {
    const btnLabel = getRollTypeProperties(dataset.roll).ALT_ACTION_LABEL;
    altBtn = {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize(btnLabel),
      callback: (html) => altAction(html, actor, mode, callback, dataset.roll)
    };
  }

  const title = getRollTypeProperties(dataset.roll).TITLE;
  if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.STRESS) {
    if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.NO_BOTCH) {
      mode = 4; // no botches
    }
    btns.yes = {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize("arm5e.dialog.button.stressdie"),
      callback: (html) => stressDie(html, actor, mode, callback, dataset.roll)
    };
    if (altAction) {
      btns.alt = altBtn;
    }
    if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.SIMPLE) {
      btns.no = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize("arm5e.dialog.button.simpledie"),
        callback: async (html) => await simpleDie(html, actor, dataset.roll, callback)
      };
    } else {
      btns.no = {
        icon: "<i class='fas fa-ban'></i>",
        label: game.i18n.localize("arm5e.dialog.button.cancel"),
        callback: null
      };
    }
  } else {
    // Simple die only
    btns.yes = {
      icon: "<i class='fas fa-check'></i>",
      label: game.i18n.localize("arm5e.dialog.button.simpledie"),
      callback: async (html) => await simpleDie(html, actor, dataset.roll, callback)
    };
    if (altAction) {
      btns.alt = altBtn;
    }
    btns.no = {
      icon: "<i class='fas fa-ban'></i>",
      label: game.i18n.localize("arm5e.dialog.button.cancel"),
      callback: null
    };
  }
  return {
    title: game.i18n.localize(title),
    content: html,
    buttons: {
      ...btns
      // ...getDebugButtonsIfNeeded(actor, callback)
    }
  };
}

function addListenersDialog(html) {
  html.find(".toggle").click((event) => {
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
    const successOfMagic = calculateSuccessOfMagic({
      actorTarget,
      actorCaster,
      roll,
      spell: message
    });
    await chatContestOfMagic({ actorCaster, actorTarget, ...successOfMagic });
  });
}

export {
  chooseTemplate,
  updateCharacteristicDependingOnRoll,
  cleanBooleans,
  renderRollTemplate,
  prepareRollFields,
  prepareRollVariables,
  ROLL_MODES,
  ROLL_PROPERTIES,
  getRollTypeProperties
};
