import ACTIVE_EFFECTS_TYPES from "../constants/activeEffectsTypes.js";

/**
 * Manage Active Effect instances through the Actor Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning entity which manages this effect
 */
async function onManageActiveEffect(event, owner) {
  event.preventDefault();
  const a = event.currentTarget;
  const li = a.closest("li");
  const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
  switch (a.dataset.action) {
    case "create":
      return await owner.createEmbeddedDocuments("ActiveEffect", [
        {
          label: "New Effect",
          icon: "icons/svg/aura.svg",
          origin: owner.uuid,
          "duration.rounds": li.dataset.effectType === "temporary" ? 1 : undefined,
          disabled: li.dataset.effectType === "inactive",
          tint: "#000000",
          changes: [],
          flags: {
            arm5e: {
              type: [],
              subtype: []
            }
          }
        }
      ]);
    case "edit":
      return effect.sheet.render(true);
    case "delete":
      return await effect.delete();
    case "toggle":
      return await effect.update({ disabled: !effect.data.disabled });
  }
}

/**
 * Prepare the data structure for Active Effects which are currently applied to an Actor or Item.
 * @param {ActiveEffect[]} effects    The array of Active Effect instances to prepare sheet data for
 * @return {object}                   Data for rendering
 */
function prepareActiveEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    temporary: {
      type: "temporary",
      label: "Temporary Effects",
      effects: []
    },
    passive: {
      type: "passive",
      label: "Passive Effects",
      effects: []
    },
    inactive: {
      type: "inactive",
      label: "Inactive Effects",
      effects: []
    }
  };

  // Iterate over active effects, classifying them into categories
  for (let e of effects) {
    e._getSourceName(); // Trigger a lookup for the source name
    // if the effect is from an Item (virtue, etc) and is owned prevent edition
    e.data.noEdit =
      (e.parent.documentName === "Item" && e.parent.isOwned == true) ||
      (e.parent.documentName === "Actor" && e.data.origin.includes("Item"));
    // e.data.descr = buildActiveEffectDescription(e);
    if (e.data.disabled) categories.inactive.effects.push(e);
    else if (e.isTemporary) categories.temporary.effects.push(e);
    else categories.passive.effects.push(e);
  }
  return categories;
}

function findAllActiveEffectsWithType(effects, type) {
  const activeEffects = [];
  for (let e of effects) {
    e._getSourceName(); // Trigger a lookup for the source name
    if (!e.data.disabled && e?.getFlag("arm5e", "type")?.includes(type)) {
      activeEffects.push(e);
    }
  }
  return activeEffects;
}

function findAllActiveEffectsByAffectedKey(effects, key) {
  const activeEffects = [];
  for (let e of effects) {
    e._getSourceName(); // Trigger a lookup for the source name
    if (!e.data.disabled && e.data.changes.find((change) => change.key === key)) {
      activeEffects.push(e);
    }
  }
  return activeEffects;
}

function findFirstActiveEffectByType(effects, type) {
  for (let e of effects) {
    e._getSourceName(); // Trigger a lookup for the source name
    if (!e.data.disabled && e.data.flags.type.toUpperCase() === type.toUpperCase()) {
      return e;
    }
  }
  return false;
}

function findFirstActiveEffectBySubtype(effects, subtype) {
  for (let e of effects) {
    e._getSourceName(); // Trigger a lookup for the source name
    if (!e.data.disabled && e?.getFlag("arm5e", "subType")?.includes(subtype)) {
      return e;
    }
  }
  return null;
}

// TODO review before use
function buildActiveEffectDescription(effect) {
  let descr;
  let effectType = game.i18n.localize(CONST.ACTIVE_EFFECTS_TYPES[effect.getFlag("arm5e", "type")].label);
  // TODO multiple types
  for (let c of Object.values(effect.data.changes)) {
    switch (c.mode) {
      case 1:
        descr =
          game.i18n.format("arm5e.sheet.activeEffect.multiply", {
            type: effectType
          }) +
          (c.value < 0 ? "" : "+") +
          c.value;
      case 2:
        descr =
          game.i18n.localize("arm5e.sheet.activeEffect.add") + (c.value < 0 ? "" : "+") + c.value + " to " + effectType;
      default:
        descr = "Unsupported effect mode";
    }
    descr + "<br/>";
  }
  return descr;
}

export {
  onManageActiveEffect,
  prepareActiveEffectCategories,
  findAllActiveEffectsWithType,
  findAllActiveEffectsByAffectedKey,
  findFirstActiveEffectBySubtype,
  buildActiveEffectDescription
};
