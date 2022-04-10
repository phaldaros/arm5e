import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import ArM5eActiveEffect from "./active-effects.js";

const ICON = "icons/magic/defensive/barrier-shield-dome-blue-purple.webp";

function getAuraActiveEffect(numericValue) {
  const label = `${game.i18n.localize("arm5e.sheet.levelAura")}`;

  const changeData = [
    {
      key: ACTIVE_EFFECTS_TYPES.spellcasting.subtypes.aura.key,
      value: numericValue,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD
    }
  ];
  const activeEffectData = {
    label: label,
    icon: ICON,
    duration: {
      rounds: undefined
    },
    flags: {
      arm5e: {
        type: ["spellcasting"],
        subtype: ["aura"],
        option: [null],
        value: ["AURA"]
      }
    },
    changes: changeData,
    tint: "#000000"
  };

  return activeEffectData;
}

async function addEffect(actor, activeEffectData) {
  const ae = ArM5eActiveEffect.findFirstActiveEffectBySubtype(actor.data.effects, "aura");
  if (ae) {
    activeEffectData._id = ae.data._id;
    return await actor.updateEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  }
  return await actor.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
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
