function getPenetrationAbilityDetails(actorData) {
  const penetrationId = actorData.data.data?.laboratory?.abilitiesSelected?.penetration?.abilityID || "";
  if (penetrationId) {
    const penetrationAbility = actorData.data.data.abilities.filter((ability) => ability._id === penetrationId)[0];
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
    const parmaAbility = actorData.data.data.abilities.filter((ability) => ability._id === parmaId)[0];
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

function calculatePenetration({ actorCaster, roll, form, technique }) {
  const levelOfSpell = actorCaster.data.data.roll.spell.data.data.level;
  const totalOfSpell = roll._total;

  let penetration = actorCaster.data.data.laboratory.totalPenetration.value;
  const speciality = getPenetrationAbilityDetails(actorCaster).speciality;
  let specialityIncluded = "";
  if (form.toUpperCase() === speciality.toUpperCase() || technique.toUpperCase() === speciality.toUpperCase()) {
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

function calculateResistance(actorData, form) {
  let magicResistance =
    Number(actorData.data.data.laboratory?.magicResistance?.value) || Number(actorData.data.data?.might?.value) || 0;
  let specialityIncluded = "";
  const parma = getParmaAbilityDetails(actorData);
  if (parma.specialityIncluded && parma.specialityIncluded.toUpperCase() === form.toUpperCase()) {
    specialityIncluded = form;
    magicResistance += 5;
  }

  const arts = actorData.data.data?.arts;

  let formScore = 0;
  if (arts) {
    const formKey = Object.keys(arts.forms).filter(
      (key) => arts.forms[key].label.toUpperCase() === form.toUpperCase()
    )[0];
    formScore = arts.forms[formKey].finalScore || 0;
  }

  return {
    might: actorData.data.data?.might?.value,
    specialityIncluded,
    total: magicResistance + formScore,
    formScore,
    parma
  };
}

function calculateSuccessOfMagic({ actorCaster, actorTarget, roll }) {
  const technique = actorCaster.data.data.roll.techniqueText;
  const form = actorCaster.data.data.roll.formText;
  const penetration = calculatePenetration({ actorCaster, roll, form, technique });
  const magicResistance = calculateResistance(actorTarget, form);
  return {
    penetration,
    magicResistance,
    total: penetration.total - magicResistance.total,
    form
  };
}

export { calculateSuccessOfMagic };
