// Import Modules
import { ArM5ePCActor } from "./actor/actor-pc.js";
import { ArM5ePCActorSheet } from "./actor/actor-pc-sheet.js";
import { ArM5eNPCActor } from "./actor/actor-npc.js";
import { ArM5eNPCActorSheet } from "./actor/actor-npc-sheet.js";
import { ArM5eLaboratoryActor } from "./actor/actor-laboratory.js";
import { ArM5eLaboratoryActorSheet } from "./actor/actor-laboratory-sheet.js";
import { ArM5eCovenantActor } from "./actor/actor-covenant.js";
import { ArM5eCovenantActorSheet } from "./actor/actor-covenant-sheet.js";

import { ArM5eItem } from "./item/item.js";
import { ArM5eItemSheet } from "./item/item-sheet.js";

import { ArM5ePreloadHandlebarsTemplates } from "./templates.js";

import {migration} from './migration.js';

const MODULE_ID = 'arm5e';

Hooks.once('init', async function() {

  game.arm5e = {
    ArM5ePCActor, ArM5eNPCActor, ArM5eLaboratoryActor, ArM5eCovenantActor,
    ArM5eItem,
    rollItemMacro
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @characteristics.qik.value",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ArM5ePCActor;
  CONFIG.Item.documentClass = ArM5eItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);

  // ["player","npc","laboratoy","covenant"],
  Actors.registerSheet("arm5ePC", ArM5ePCActorSheet, { 
    types: ["player"],
    makeDefault: true,
    label: "arm5e.sheet.player"
  });
  Actors.registerSheet("arm5eNPC", ArM5eNPCActorSheet, { 
    types: ["npc"],
    makeDefault: true,
    label: "arm5e.sheet.npc"
  });
  Actors.registerSheet("arm5eLaboratory", ArM5eLaboratoryActorSheet, { 
    types: ["laboratory"],
    makeDefault: true,
    label: "arm5e.sheet.laboratory"
  });
  Actors.registerSheet("arm5eCovenant", ArM5eCovenantActorSheet, { 
    types: ["covenant"],
    makeDefault: true,
    label: "arm5e.sheet.covenant"
  });


  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("arm5e", ArM5eItemSheet, { makeDefault: true });

  // Preload handlebars templates
  ArM5ePreloadHandlebarsTemplates();

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createArM5eMacro(data, slot));

  // Determine whether a system migration is required and feasible
  if ( !game.user.isGM ) return;

  migration();
});

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag( MODULE_ID);
});

export function log(force, ...args) {
  try {
    const isDebugging = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(MODULE_ID);

    if (force || isDebugging) {
      console.log(MODULE_ID, '|', ...args);
    }
  } catch (e) {}
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createArM5eMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.arm5e.rollItemMacro("${item.name}");`;
  let macro = game.macros.contents.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "arm5e.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}