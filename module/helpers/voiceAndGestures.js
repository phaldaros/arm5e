import {
  DEFAULT_VOICE,
  DEFAULT_GESTURES,
  VOICE,
  GESTURES,
  VOICE_AND_GESTURES_ICONS,
  VOICE_AND_GESTURES_VALUES
} from "../constants/voiceAndGestures.js";
import ArM5eActiveEffect from "./active-effects.js";

import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";

async function modifyVoiceOrGesturesActiveEvent(origin, type, value) {
  const actor = origin.actor;
  const numericValue = VOICE_AND_GESTURES_VALUES[type][value.toUpperCase()].value;
  const changeData = [
    {
      key: ACTIVE_EFFECTS_TYPES.spellcasting.subtypes[type].key,
      value: numericValue,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD
    }
  ];

  const dictType = `arm5e.sheet.magic.${type}`;
  const dictValue = VOICE_AND_GESTURES_VALUES[type][value.toUpperCase()].mnemonic;
  const label = `${game.i18n.localize(dictType)} ${game.i18n.localize(dictValue)}`;
  // create a new Active Effect
  const activeEffectData = {
    label: label,
    icon: VOICE_AND_GESTURES_ICONS[type],
    origin: actor.uuid,
    duration: {
      rounds: undefined
    },
    flags: {
      arm5e: {
        noEdit: true,
        type: ["spellcasting"],
        subtype: [type],
        value: [value.toUpperCase()],
        option: [null]
      }
    },
    changes: changeData,
    tint: "#000000"
  };
  console.log("activeEffectData:");
  console.log(activeEffectData);
  const ae = actor.data.effects.find(
    (m) =>
      m.getFlag("arm5e", "subtype") != null &&
      m.data.flags.arm5e.subtype.length != 0 &&
      m?.data.flags?.arm5e?.subtype[0] === type
  );
  if (ae) {
    activeEffectData._id = ae.data._id;
    return await actor.updateEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  } else {
    return await actor.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  }
}

function findVoiceAndGesturesActiveEffects(effects) {
  const actualVoiceEffect = ArM5eActiveEffect.findFirstActiveEffectBySubtype(effects, VOICE);
  const actualGesturesEffect = ArM5eActiveEffect.findFirstActiveEffectBySubtype(effects, GESTURES);
  try {
    return {
      // // only one change for voice and gestures => index 0 hardcoded
      voice: actualVoiceEffect?.getFlag("arm5e", "value")[0] || DEFAULT_VOICE,
      gestures: actualGesturesEffect?.getFlag("arm5e", "value")[0] || DEFAULT_GESTURES
      // voice: DEFAULT_VOICE,
      // gestures: DEFAULT_GESTURES
    };
  } catch (error) {
    console.error(error);
    console.log(`ActualVoiceEffects: ${JSON.stringify(actualVoiceEffect)}`);
    console.log(`ActualGesturesEffects: ${JSON.stringify(actualGesturesEffect)}`);
    return {
      voice: DEFAULT_VOICE,
      gestures: DEFAULT_GESTURES
    };
  }
}

export { findVoiceAndGesturesActiveEffects, modifyVoiceOrGesturesActiveEvent };
