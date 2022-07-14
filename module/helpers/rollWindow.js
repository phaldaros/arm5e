import { ARM5E } from "../config.js";
import ArM5eActiveEffect from "./active-effects.js";
import { simpleDie, stressDie, noRoll } from "../dice.js";
import { checkTargetAndCalculateResistance } from "./magic.js";
import { chatFailedCasting } from "./chat.js";
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
    TITLE: "arm5e.dialog.title.rolldie",
    CALLBACK: castSpell
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
    CALLBACK: castSpell
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

function prepareRollVariables(dataset, actor) {
  actor.rollData.init(dataset, actor);
  log(false, `Roll data: ${JSON.stringify(actor.rollData)}`);
}

function prepareRollFields(dataset, actor) {
  const rollData = actor.rollData;
  if (dataset.modifier) {
    rollData.common.modifier =
      parseInt(actorData.rollData.common.modifier) + parseInt(dataset.modifier);
  }

  if (dataset.txtoption1) {
    rollData.setGenericField(dataset.txtoption1, dataset.option1, 1);
  }
  if (dataset.txtoption2) {
    rollData.setGenericField(dataset.txtoption2, dataset.option2, 2);
  }
  if (dataset.txtoption3) {
    rollData.setGenericField(dataset.txtoption3, dataset.option3, 3);
  }
  if (dataset.txtoption4) {
    rollData.setGenericField(dataset.txtoption4, dataset.option4, 4);
  }
  if (dataset.txtoption5) {
    rollData.setGenericField(dataset.txtoption5, dataset.option5, 5);
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

function updateCharacteristicDependingOnRoll(dataset, actor) {
  if (dataset.roll == "spont") {
    //spontaneous magic
    actor.rollData.characteristic = "sta";
  } else if (dataset.roll == "magic" || dataset.roll == "spell") {
    actorData.rollData.characteristic = "sta";
  }
}

function getDebugButtonsIfNeeded(actor, callback) {
  if (!game.modules.get("_dev-mode")?.api?.getPackageDebugValue(ARM5E.MODULE_ID)) return {};
  return {
    explode: {
      label: "DEV Roll 1",
      callback: html => stressDie(html, actor, 1, callback, actor.rollData.type)
    },
    zero: {
      label: "DEV Roll 0",
      callback: html => stressDie(html, actor, 2, callback, actor.rollData.type)
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
      callback: html => altAction(html, actor, mode, callback, dataset.roll)
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
      callback: html => stressDie(html, actor, mode, callback, dataset.roll)
    };
    if (altAction) {
      btns.alt = altBtn;
    }
    if (getRollTypeProperties(dataset.roll).MODE & ROLL_MODES.SIMPLE) {
      btns.no = {
        icon: "<i class='fas fa-check'></i>",
        label: game.i18n.localize("arm5e.dialog.button.simpledie"),
        callback: async html => await simpleDie(html, actor, dataset.roll, callback)
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
      callback: async html => await simpleDie(html, actor, dataset.roll, callback)
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
      ...btns,
      ...getDebugButtonsIfNeeded(actor, callback)
    }
  };
}

async function usePower(dataset, actor) {
  if (Number(dataset.cost > actor.data.data.might.points)) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.noMightPoints"));
    return;
  }

  prepareRollVariables(dataset, actor);
  log(false, `Roll variables: ${JSON.stringify(actor.data.data.roll)}`);
  let template = "systems/arm5e/templates/actor/parts/actor-powerUse.html";
  const renderedTemplate = await renderTemplate(template, actor.data);

  const dialog = new Dialog(
    {
      title: dataset.name,
      content: renderedTemplate,
      render: addListenersDialog,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("arm5e.dialog.powerUse"),
          callback: async html => await noRoll(html, actor)
        },
        no: {
          icon: "<i class='fas fa-ban'></i>",
          label: game.i18n.localize("arm5e.dialog.button.cancel"),
          callback: null
        }
      }
    },
    {
      jQuery: true,
      height: "600px",
      width: "400px",
      classes: ["arm5e-dialog", "dialog"]
    }
  );
  dialog.render(true);
}
function addListenersDialog(html) {
  html.find(".toggleHidden").click(event => {
    log(false, "toggle Hidden");
    const hidden = $(event.target).data("hidden");
    html.find(`.${hidden}`).toggle();
  });
}

async function renderRollTemplate(dataset, template, actor) {
  if (!template) {
    return;
  }

  const renderedTemplate = await renderTemplate(template, actor.rollData);
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

async function castSpell(html, actorCaster, roll, message) {
  // first check that the spell succeeds
  const levelOfSpell = actorCaster.rollData.magic.level;
  const totalOfSpell = roll._total;
  if (actorCaster.data.data.roll.type == "spell") {
    if (totalOfSpell < levelOfSpell) {
      let fatigue = 1;
      if (actorCaster.rollData.magic.ritual) {
        fatigue = Math.ceil((levelOfSpell - totalOfSpell) / 5);
      }
      // lose fatigue levels
      actorCaster.loseFatigueLevel(fatigue);
      if (totalOfSpell < levelOfSpell - 10) {
        await chatFailedCasting(actorCaster, roll, message, fatigue);
        return false;
      }
    }
  } else {
    // Magic effect
    if (totalOfSpell < levelOfSpell) {
      await chatFailedCasting(actorCaster, roll, message, 0);
      return false;
    }
  }
  // then do contest of magic
  checkTargetAndCalculateResistance(actorCaster, roll, message);
}

export {
  chooseTemplate,
  updateCharacteristicDependingOnRoll,
  renderRollTemplate,
  prepareRollFields,
  prepareRollVariables,
  ROLL_MODES,
  ROLL_PROPERTIES,
  getRollTypeProperties,
  usePower
};
