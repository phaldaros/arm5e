import {
  DEFAULT_VOICE,
  DEFAULT_GESTURES,
  VOICE,
  GESTURES,
  VOICE_AND_GESTURES_ICONS,
  VOICE_AND_GESTURES_VALUES
} from "../constants/voiceAndGestures.js";
import { findFirstActiveEffectBySubtype } from "./active-effects.js";

import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";

async function modifyVoiceOrGesturesActiveEvent(origin, type, value) {
  const actor = origin.actor;
  const numericValue = VOICE_AND_GESTURES_VALUES[type.toUpperCase()][value.toUpperCase()].value;
  const changeData = [
    { key: ACTIVE_EFFECTS_TYPES.spellcasting.key, value: numericValue, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
  ];

  const dictType = `arm5e.sheet.magic.${type.toLowerCase()}`;
  const dictValue = VOICE_AND_GESTURES_VALUES[type.toUpperCase()][value.toUpperCase()].mnemonic;
  const label = `${game.i18n.localize(dictType)} ${game.i18n.localize(dictValue)}`;
  // create a new Active Effect
  const activeEffectData = {
    label: label,
    icon: VOICE_AND_GESTURES_ICONS[type.toUpperCase()],
    origin: actor.uuid,
    duration: {
      rounds: undefined
    },
    flags: {
      arm5e: {
        type: ["spellcasting"],
        subType: [type.toUpperCase()],
        value: [value.toUpperCase()]
      }
    },
    changes: changeData,
    tint: "#000000"
  };
  console.log("activeEffectData:");
  console.log(activeEffectData);
  const ae = actor.data.effects.find((m) => m?.data.flags?.arm5e?.subType[0] === type.toUpperCase());
  if (ae) {
    activeEffectData._id = ae.data._id;
    return await actor.updateEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  } else {
    return await actor.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  }
}

function findVoiceAndGesturesActiveEffects(effects) {
  const actualVoiceEffect = findFirstActiveEffectBySubtype(effects, VOICE);
  const actualGesturesEffect = findFirstActiveEffectBySubtype(effects, GESTURES);
  return {
    // only one change for voice and gestures => index 0 hardcoded
    voice: actualVoiceEffect?.getFlag("arm5e", "value")[0] || DEFAULT_VOICE,
    gestures: actualGesturesEffect?.getFlag("arm5e", "value")[0] || DEFAULT_GESTURES
    // voice: actualVoiceEffect?.data?.flags?.value || DEFAULT_VOICE,
    // gestures: actualGesturesEffect?.data?.flags?.value || DEFAULT_GESTURES
  };
}

export { findVoiceAndGesturesActiveEffects, modifyVoiceOrGesturesActiveEvent };
