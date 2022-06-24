import { getActorsFromTargetedTokens } from "./tokens.js";
import { chatContestOfMagic } from "./chat.js";

async function checkTargetAndCalculateResistance(actorCaster, roll, message) {
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

function getPenetrationAbilityDetails(actorData) {
  const penetrationId =
    actorData.data.data?.laboratory?.abilitiesSelected?.penetration?.abilityID || "";
  if (penetrationId) {
    const penetrationAbility = actorData.data.data.abilities.filter(
      (ability) => ability._id === penetrationId
    )[0];
    if (penetrationAbility) {
      return {
        score: penetrationAbility.data.score,
        speciality: penetrationAbility.data.speciality
      };
    }
  }
  return {
    score: 0,
    speciality: ""
  };
}

function getParmaAbilityDetails(actorData) {
  const parmaId = actorData.data.data?.laboratory?.abilitiesSelected?.parma?.abilityID || "";
  if (parmaId) {
    const parmaAbility = actorData.data.data.abilities.filter(
      (ability) => ability._id === parmaId
    )[0];
    if (parmaAbility) {
      return {
        score: parmaAbility.data.finalScore,
        specialityIncluded: parmaAbility.data.speciality
      };
    }
  }
  return {
    score: 0,
    specialityIncluded: ""
  };
}

function calculatePenetration({ actorCaster, roll, spell }) {
  const levelOfSpell = spell.data.data.level;
  const totalOfSpell = roll._total;

  let penetration = actorCaster.data.data.laboratory.totalPenetration.value;
  const speciality = getPenetrationAbilityDetails(actorCaster).speciality;
  let specialityIncluded = "";
  if (
    CONFIG.ARM5E.magic.arts[spell.data.data.form.value].label.toUpperCase() ===
      speciality.toUpperCase() ||
    CONFIG.ARM5E.magic.arts[spell.data.data.form.value].label.toUpperCase() ===
      speciality.toUpperCase()
  ) {
    penetration += 1;
    specialityIncluded = speciality;
  }
  return {
    totalOfSpell,
    levelOfSpell,
    penetration,
    specialityIncluded,
    total: totalOfSpell - levelOfSpell + penetration
  };
}

function calculateResistance(actor, form) {
  let magicResistance =
    Number(actor.data.data.laboratory?.magicResistance?.value) ||
    Number(actor.data.data?.might?.value) ||
    0;
  let specialityIncluded = "";
  const parma = getParmaAbilityDetails(actor);
  if (parma.specialityIncluded && parma.specialityIncluded.toUpperCase() === form.toUpperCase()) {
    specialityIncluded = form;
    magicResistance += 5;
  }

  const arts = actor.data.data?.arts;
  let auraMod = 0;
  // TODO, do a better job for player aligned to a realm
  if (actor.type == "npc" && actor.data.data.charType.value == "entity") {
    auraMod = actor.getActiveEffectValue("magic", "aura");
    magicResistance += parseInt(auraMod);
  }

  let formScore = 0;
  if (arts) {
    const formKey = Object.keys(arts.forms).filter(
      (key) => arts.forms[key].label.toUpperCase() === form.toUpperCase()
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

function getFormWithoutPrerequisite(form) {
  if (!form.includes(" ")) return form;
  return form.split(" ")[0];
}

function calculateSuccessOfMagic({ actorCaster, actorTarget, roll }) {
  const spell = actorCaster.data.data.roll.spell;
  const form = CONFIG.ARM5E.magic.arts[spell.data.data.form.value].label;
  const penetration = calculatePenetration({ actorCaster, roll, spell });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetration,
    magicResistance,
    total: penetration.total - magicResistance.total,
    form
  };
}

export { calculateSuccessOfMagic, checkTargetAndCalculateResistance };
