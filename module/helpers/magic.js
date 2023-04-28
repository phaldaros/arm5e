import { getActorsFromTargetedTokens } from "./tokens.js";
import { chatContestOfMagic, chatContestOfPower } from "./chat.js";

export function addSpellMagnitude(base, num) {
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
    // log(false, `Adding ${num} magnitudes from ${base}`);
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
    // log(false, `returns ${res}`);
    return res;
  }
}

export function computeLevel(system, type) {
  let effectLevel = system.baseLevel;

  if (system.range.value) {
    effectLevel = addSpellMagnitude(
      effectLevel,
      CONFIG.ARM5E.magic.ranges[system.range.value].impact
    );
  }
  if (system.duration.value) {
    effectLevel = addSpellMagnitude(
      effectLevel,
      CONFIG.ARM5E.magic.durations[system.duration.value].impact
    );
  }
  if (system.target.value) {
    effectLevel = addSpellMagnitude(
      effectLevel,
      CONFIG.ARM5E.magic.targets[system.target.value].impact
    );
  }
  if (system.complexity) {
    effectLevel = addSpellMagnitude(effectLevel, system.complexity);
  }
  if (system.targetSize) {
    effectLevel = addSpellMagnitude(effectLevel, system.targetSize);
  }
  if (system.enhancingRequisite) {
    effectLevel = addSpellMagnitude(effectLevel, system.enhancingRequisite);
  }

  if (type == "enchantment" || (type == "laboratoryText" && system.type == "enchantment")) {
    effectLevel += parseInt(system.effectfrequency);
    if (system.penetration % 2 == 1) {
      system.penetration += 1;
    }
    effectLevel += system.penetration / 2;

    if (system.maintainConc) {
      effectLevel += 5;
    }

    if (system.environmentalTrigger) {
      effectLevel += 3;
    }

    if (system.restrictedUse) {
      effectLevel += 3;
    }

    if (system.linkedTrigger) {
      effectLevel += 3;
    }
  } else {
    let shouldBeRitual = system.ritual;
    // Duration above moon are rituals and rituals are minimum level 20
    if (
      CONFIG.ARM5E.magic.durations[system.duration.value].impact > 3 ||
      system.target.value == "bound" ||
      effectLevel > 50
    ) {
      shouldBeRitual = true;
    }

    if (shouldBeRitual && effectLevel < 20) {
      effectLevel = 20;
    }
    system.ritual = shouldBeRitual;
  }
  if (system.general) {
    effectLevel += system.levelOffset ?? 0;
  }
  return effectLevel;
}

export function computeRawCastingTotal(effect, owner, options = {}) {
  if (owner.type != "player" && owner.type != "npc") {
    return 0;
  }
  let effectData = effect.system;
  let res = 0;
  let tech = 1000;
  let form = 1000;
  let label = "";
  let deficientTech = false;
  let deficientForm = false;
  let techReq = Object.entries(effectData["technique-req"]).filter(r => r[1] === true);
  let formReq = Object.entries(effectData["form-req"]).filter(r => r[1] === true);
  if (owner.system.arts.techniques[effectData.technique.value].deficient) {
    deficientTech = true;
  }
  if (owner.system.arts.forms[effectData.form.value].deficient) {
    deficientForm = true;
  }
  if (techReq.length > 0) {
    techReq.forEach(key => {
      if (owner.system.arts.techniques[key[0]].deficient) {
        deficientTech = true;
      }
      tech = Math.min(tech, owner.system.arts.techniques[key[0]].finalScore);
    });

    tech = Math.min(owner.system.arts.techniques[effectData.technique.value].finalScore, tech);
  } else {
    tech = owner.system.arts.techniques[effectData.technique.value].finalScore;
  }
  if (formReq.length > 0) {
    formReq.forEach(key => {
      if (owner.system.arts.forms[key[0]].deficient) {
        deficientForm = true;
      }
      form = Math.min(tech, owner.system.arts.forms[key[0]].finalScore);
    });
    form = Math.min(owner.system.arts.forms[effectData.form.value].finalScore, form);
  } else {
    form = owner.system.arts.forms[effectData.form.value].finalScore;
  }
  let techlabel = `${game.i18n.localize("arm5e.sheet.tech")}: ${tech}`;
  let formlabel = `${game.i18n.localize("arm5e.sheet.fo")}: ${form}`;

  if (effectData.applyFocus || options.focus) {
    res += tech + form + Math.min(tech, form);
    if (tech >= form) {
      techlabel = `(${techlabel} x 2) : ${2 * tech}`;
    } else {
      formlabel += `(${formlabel} x 2) : ${2 * form}`;
    }
  } else {
    res += tech + form;
  }

  return {
    total: res,
    deficientTech: deficientTech,
    deficientForm: deficientForm,
    label: `${techlabel} + ${formlabel} &#10`
  };
}

async function noFatigue(actor) {
  if (actor._isMagus()) {
    actor.rollData.useFatigue = false;
    actor.rollData.magic.divide = 5;
  }
}

async function checkTargetAndCalculateResistance(actorCaster, roll, message) {
  const actorsTargeted = getActorsFromTargetedTokens(actorCaster);
  if (!actorsTargeted) {
    return false;
  }
  if (actorCaster.system.roll.type != "power") {
    actorsTargeted.forEach(async actorTarget => {
      const successOfMagic = calculateSuccessOfMagic({
        actorTarget,
        actorCaster,
        roll,
        spell: message
      });
      await chatContestOfMagic({ actorCaster, actorTarget, ...successOfMagic });
    });
  } else {
    actorsTargeted.forEach(async actorTarget => {
      const successOfPower = calculateSuccessOfPower({
        actorTarget,
        actorCaster,
        roll,
        spell: message
      });
      await chatContestOfPower({ actorCaster, actorTarget, ...successOfPower });
    });
  }
}

function calculatePenetration({ actorCaster, roll, spell }) {
  const levelOfSpell = actorCaster.rollData.magic.level;
  const totalOfSpell = roll._total;
  const penetrationRolldata = actorCaster.rollData.penetration;
  const penetration = actorCaster.getAbilityStats("penetration");
  let specialityIncluded = "";
  if (penetrationRolldata.specApply) {
    specialityIncluded = penetration.speciality;
  }
  // if (
  //   CONFIG.ARM5E.magic.arts[spell.system.form.value].label.toUpperCase() ===
  //     penetration.speciality.toUpperCase() ||
  //   CONFIG.ARM5E.magic.arts[spell.system.form.value].label.toUpperCase() ===
  //     penetration.speciality.toUpperCase()
  // ) {
  //   penetration += 1;
  //   specialityIncluded = penetration.speciality;
  // }

  return {
    totalOfSpell,
    levelOfSpell,
    penetration: penetrationRolldata.total,
    specialityIncluded,
    total: totalOfSpell - levelOfSpell + penetrationRolldata.total
  };
}

function calculateResistance(actor, form) {
  let magicResistance =
    Number(actor.system.laboratory?.magicResistance?.value) ||
    Number(actor.system?.might?.value) ||
    0; //  no magicResistance != magicResistance of 0
  let specialityIncluded = "";
  const parma = actor.getAbilityStats("parma");
  if (parma.speciality && parma.speciality.toUpperCase() === form.toUpperCase()) {
    specialityIncluded = form;
    magicResistance += 5;
  }

  const arts = actor.system?.arts;
  let auraMod = 0;
  // TODO, do a better job for player aligned to a realm
  if (actor._hasMight()) {
    auraMod = actor.getActiveEffectValue("spellcasting", "aura");
    magicResistance += parseInt(auraMod);
  }

  let formScore = 0;
  if (arts) {
    const formKey = Object.keys(arts.forms).filter(
      key => arts.forms[key].label.toUpperCase() === form.toUpperCase()
    )[0];
    formScore = arts.forms[formKey].finalScore || 0;
  }

  return {
    might: actor.system?.might?.value,
    specialityIncluded,
    total: magicResistance + formScore,
    formScore,
    parma,
    aura: auraMod
  };
}

function calculateSuccessOfMagic({ actorCaster, actorTarget, roll }) {
  const form = CONFIG.ARM5E.magic.arts[actorCaster.rollData.magic.form].label;
  const penetration = calculatePenetration({ actorCaster, roll });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetration,
    magicResistance,
    total: penetration.total - magicResistance.total,
    form
  };
}

// TODO: merge with above for big refactorization next version

function calculateSuccessOfPower({ actorCaster, actorTarget, roll }) {
  const form = CONFIG.ARM5E.magic.arts[actorCaster.rollData.power.form].label;
  const penetrationTotal = actorCaster.rollData.secondaryScore + roll.total;

  // calculatePenetration({ actorCaster, roll, spell });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetrationTotal,
    magicResistance,
    total: penetrationTotal - magicResistance.total,
    form
  };
}

export { calculateSuccessOfMagic, checkTargetAndCalculateResistance, noFatigue };
