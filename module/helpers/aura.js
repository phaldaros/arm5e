import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import { findAllActiveEffectsWithType } from "./active-effects.js";

function getAuraActiveEffect(value) {
  const changeData = ACTIVE_EFFECTS_TYPES.aura.keys.map((key) => ({
    key,
    value: Number(value),
    mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    priority: 20
  }));
  const label = `${game.i18n.localize("arm5e.sheet.levelAura")}`;
  // create a new Active Effect
  const activeEffectData = {
    label: label,
    icon: ACTIVE_EFFECTS_TYPES.aura.icon,
    duration: {
      rounds: undefined
    },
    flags: {
      arm5e: {
        type: ACTIVE_EFFECTS_TYPES.aura.type.toUpperCase()
      }
    },
    changes: changeData
  };
  return activeEffectData;
}

async function addEffect(actor, activeEffectData) {
  const ae = findAllActiveEffectsWithType(actor.data.effects, ACTIVE_EFFECTS_TYPES.aura.type);
  for (let i = 0; i <= ae.length - 1; i++) {
    await ae[i].delete();
  }

  const effect = {
    ...activeEffectData,
    origin: actor.uuid
  };
  await ActiveEffect.create(effect, { parent: actor });
}

async function modifyAuraActiveEffectForAllTokensInScene(value) {
  const activeEffectData = getAuraActiveEffect(value);

  const tokens = canvas.tokens.placeables.filter((token) => token.actor);
  for (const token of tokens) {
    addEffect(token.actor, activeEffectData);
  }
}

async function addActiveEffectAuraToActor(actor, value) {
  const auraEffect = getAuraActiveEffect(value);
  addEffect(actor, auraEffect);
}

export { modifyAuraActiveEffectForAllTokensInScene, addActiveEffectAuraToActor };
