import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";
import ArM5eActiveEffect from "./active-effects.js";
import { log } from "../tools.js";

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
  const ae = ArM5eActiveEffect.findAllActiveEffectsWithSubtype(actor.data.effects, "aura")[0];
  if (ae) {
    log(false, `Change aura for ${actor.name}, effect ID: ${ae.data._id}`);
    activeEffectData._id = ae.data._id;
    return await actor.updateEmbeddedDocuments("ActiveEffect", [activeEffectData]);
  }
  return await actor.createEmbeddedDocuments("ActiveEffect", [activeEffectData]);
}

async function modifyAuraActiveEffectForAllTokensInScene(value) {
  const activeEffectData = getAuraActiveEffect(value);

  const tokens = canvas.tokens.placeables.filter((token) => token.actor);
  for (const token of tokens) {
    if (token.isLinked) {
      addEffect(token.actor, activeEffectData);
    } else {
      // not used yet, due to filter above
      addEffect(token, activeEffectData);
    }
  }
}

async function addActiveEffectAuraToActor(actor, value) {
  const auraEffect = getAuraActiveEffect(value);
  addEffect(actor, auraEffect);
}

async function clearAuraFromActor(actor) {
  const effects = ArM5eActiveEffect.findAllActiveEffectsWithSubtype(actor.data.effects, "aura");
  for (const e of effects) {
    log(false, e);
    actor.deleteEmbeddedDocuments("ActiveEffect", [e.id]);
  }
}

export {
  modifyAuraActiveEffectForAllTokensInScene,
  addActiveEffectAuraToActor,
  clearAuraFromActor
};
