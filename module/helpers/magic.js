import { getActorsFromTargetedTokens } from "./tokens.js";
import { chatContestOfMagic, chatContestOfPower } from "./chat.js";

async function checkTargetAndCalculateResistance(actorCaster, roll, message) {
  const actorsTargeted = getActorsFromTargetedTokens(actorCaster);
  if (!actorsTargeted) {
    return false;
  }
  if (actorCaster.data.data.roll.type != "power") {
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
  //   CONFIG.ARM5E.magic.arts[spell.data.data.form.value].label.toUpperCase() ===
  //     penetration.speciality.toUpperCase() ||
  //   CONFIG.ARM5E.magic.arts[spell.data.data.form.value].label.toUpperCase() ===
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
    Number(actor.data.data.laboratory?.magicResistance?.value) ||
    Number(actor.data.data?.might?.value) ||
    0;
  let specialityIncluded = "";
  const parma = actor.getAbilityStats("parma");
  if (parma.specialityIncluded && parma.specialityIncluded.toUpperCase() === form.toUpperCase()) {
    specialityIncluded = form;
    magicResistance += 5;
  }

  const arts = actor.data.data?.arts;
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
    might: actor.data.data?.might?.value,
    specialityIncluded,
    total: magicResistance + formScore,
    formScore,
    parma,
    aura: auraMod
  };
}

function calculateSuccessOfMagic({ actorCaster, actorTarget, roll }) {
  const form = CONFIG.ARM5E.magic.arts[actorCaster.rollData.magic.form].label;
  const penetration = calculatePenetration({ actorCaster, roll, spell });
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

export { calculateSuccessOfMagic, checkTargetAndCalculateResistance };
