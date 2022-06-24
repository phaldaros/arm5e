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

async function modifyAuraActiveEffectForAllTokensInScene(value, type) {
  const activeEffectData = getAuraActiveEffect(value);

  const tokens = canvas.tokens.placeables.filter((token) => token.actor);
  for (const token of tokens) {
    if (token.document.isLinked) {
      const modifier = computeAuraModifier(token.actor.data.data.realmAlignment, value, type);
      // patch the active effect data
      activeEffectData.changes[0].value = modifier;
      await addEffect(token.actor, activeEffectData);
    }
    // else {
    //   // not used yet, due to filter above
    //   log(false, `Change aura for ${token.name}`);
    //   addEffect(token.document, activeEffectData);
    // }
  }
}

async function addActiveEffectAuraToActor(actor, value, type) {
  const auraEffect = getAuraActiveEffect(value);
  const modifier = computeAuraModifier(actor.data.data.realmAlignment, Number(value), type);
  // patch the active effect data
  auraEffect.changes[0].value = modifier;
  addEffect(actor, auraEffect);
}

async function clearAuraFromActor(actor) {
  const effects = ArM5eActiveEffect.findAllActiveEffectsWithSubtype(actor.data.effects, "aura");
  for (const e of effects) {
    log(false, e);
    actor.deleteEmbeddedDocuments("ActiveEffect", [e.id]);
  }
}

function computeAuraModifier(alignment, auraVal, type) {
  const realm = CONFIG.ARM5E.lookupRealm[parseInt(type)];
  const char = CONFIG.ARM5E.lookupRealm[parseInt(alignment)];
  const multiplier = CONFIG.ARM5E.realmsExt[realm].influence[parseInt(alignment)];
  // log(
  //   false,
  //   "Computed aura :" +
  //     char +
  //     ", Aura: " +
  //     auraVal +
  //     " of type " +
  //     realm +
  //     " = " +
  //     auraVal * multiplier
  // );
  return auraVal * multiplier;
}

export {
  computeAuraModifier,
  modifyAuraActiveEffectForAllTokensInScene,
  addActiveEffectAuraToActor,
  clearAuraFromActor
};
