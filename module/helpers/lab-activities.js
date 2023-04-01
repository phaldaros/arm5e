export function validateLearning(planning) {
  let delta = planning.labTotal.score - planning.data.system.level;
  if (delta < 0) {
    return {
      valid: false,
      waste: delta,
      duration: 0,
      message: game.i18n.localize("arm5e.lab.planning.msg.notSkilledLearn")
    };
  }

  return { valid: true, waste: delta, duration: 1, message: "" };
}

export function validateInvention(planning) {
  let lvl = planning.data.system.level;
  let delta = planning.labTotal.score - lvl;
  if (delta < 1) {
    return {
      valid: false,
      waste: delta,
      duration: 0,
      message: game.i18n.localize("arm5e.lab.planning.msg.notSkilledInvent")
    };
  } else if (delta >= lvl) {
    return { valid: true, waste: delta - lvl, duration: 1, message: "" };
  } else {
    let dur = Math.ceil(lvl / delta);
    // TODO set valid true when multi-season supported
    return {
      valid: false,
      waste: (delta * dur) % lvl,
      duration: dur,
      message: ""
    };
  }
}

export function validateExtraction(planning) {
  let delta = planning.labTotal.score % 10;
  let isValid = true;
  if (planning.labTotal.score < 10) {
    isValid = false;
  }
  // TODO check aura

  return {
    valid: isValid,
    waste: delta,
    duration: 1,
    message: game.i18n.format("arm5e.lab.planning.msg.visExtracted", {
      num: Math.floor(planning.labTotal.score / 10)
    })
  };
}
