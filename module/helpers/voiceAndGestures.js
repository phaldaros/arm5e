import { DEFAULT_VOICE, DEFAULT_GESTURES, VOICE, GESTURES, VOICE_AND_GESTURES_ICONS, VOICE_AND_GESTURES_VALUES } from "../constants/voiceAndGestures.js";
import { findFirstActiveEffectBySubtype } from "../helpers/effects.js"

import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js"

async function modifyVoiceOrGesturesActiveEvent(origin, type, value) {
    const actor = origin.actor;
    const numericValue = VOICE_AND_GESTURES_VALUES[type.toUpperCase()][value.toUpperCase()];
    const changeData = [
        {key: ACTIVE_EFFECTS_TYPES.SPELLCASTING.key, value: numericValue, mode: 2},
    ];
    const ae = actor.data.effects.find(m => m.data.flags.subType === type.toUpperCase());
    if (ae) await ae.delete();

    const dictType = `arm5e.sheet.magic.${type.toLowerCase()}`;
    const dictValue = `arm5e.sheet.magic.${type.toLowerCase()}Type.${value.toLowerCase()}`;
    const label = `${game.i18n.localize(dictType)} ${game.i18n.localize(dictValue)}`
    // create a new Active Effect
    const activeEffectData = {
        label: label,
        icon: VOICE_AND_GESTURES_ICONS[type.toUpperCase()],
        origin: actor.uuid,
        duration: {
            rounds: undefined
        },
        flags: {
            type: ACTIVE_EFFECTS_TYPES.SPELLCASTING.type,
            subType: type.toUpperCase(),
            value: value.toUpperCase(),
        },
        changes: changeData
    }
    return await ActiveEffect.create(activeEffectData, {parent: actor});
}

function findVoiceAndGesturesActiveEffects(effects) {
    const actualVoiceEffect = findFirstActiveEffectBySubtype(effects, VOICE);
    const actualGesturesEffect = findFirstActiveEffectBySubtype(effects, GESTURES);
    return {
        voice: actualVoiceEffect?.data?.flags?.value || DEFAULT_VOICE,
        gestures: actualGesturesEffect?.data?.flags?.value || DEFAULT_GESTURES,
    }
}

export {
    findVoiceAndGesturesActiveEffects,
    modifyVoiceOrGesturesActiveEvent,
}