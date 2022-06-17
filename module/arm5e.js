// Import Modules
import { ARM5E, ARM5E_DEFAULT_ICONS } from "./config.js";
import { ArM5ePCActor } from "./actor/actor-pc.js";
import { ArM5ePCActorSheet } from "./actor/actor-pc-sheet.js";
import { ArM5eBeastActorSheet } from "./actor/actor-beast-sheet.js";
import { ArM5eNPCActorSheet } from "./actor/actor-npc-sheet.js";
import { ArM5eLaboratoryActorSheet } from "./actor/actor-laboratory-sheet.js";
import { ArM5eCovenantActorSheet } from "./actor/actor-covenant-sheet.js";
import { ArM5eMagicCodexSheet } from "./actor/actor-magic-codex-sheet.js";
import { ArM5eCrucibleSheet } from "./actor/actor-crucible-sheet.js";
import { ArM5eItem } from "./item/item.js";
import { ArM5eItemSheet } from "./item/item-sheet.js";
import { ArM5eItemMagicSheet } from "./item/item-magic-sheet.js";
import { ArM5eItemDiarySheet } from "./item/item-diary-sheet.js";
import ArM5eActiveEffect from "./helpers/active-effects.js";

import { prepareDatasetByTypeOfItem } from "./helpers/items.js";
import { ArM5ePreloadHandlebarsTemplates } from "./templates.js";
import { ArM5eActiveEffectConfig } from "./helpers/active-effect-config.sheet.js";
import * as Arm5eChatMessage from "./helpers/chat.js";

import {
  addActiveEffectAuraToActor,
  modifyAuraActiveEffectForAllTokensInScene
} from "./helpers/aura.js";

// experiment
import { ArsLayer, addArsButtons } from "./ui/ars-layer.js";

import { migration } from "./migration.js";
import { log, generateActiveEffectFromAbilities, getDocumentFromCompendium } from "./tools.js";

Hooks.once("init", async function () {
  game.arm5e = {
    ArM5ePCActor,
    ArM5eItem,
    rollItemMacro,
    setAuraValueForAllTokensInScene,
    setAuraValueForToken,
    resetTokenAuraToSceneAura
  };

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d10 + @characteristics.qik.value + @combat.init + @combat.overload",
    decimals: 2
  };

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("arm5e", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: true,
    type: String,
    default: ""
  });

  /**
   * 2 Different sets of default icons for new documents
   */
  game.settings.register("arm5e", "defaultIconStyle", {
    name: "Default icons style",
    scope: "world",
    config: true,
    type: String,
    choices: {
      MONO: "Monochrome",
      COLOR: "Color"
    },
    default: "MONO",
    onChange: (value) => {
      CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[value];
    }
  });

  /**
   * 2 Different sets of default icons for new documents
   */
  game.settings.register("arm5e", "artsIcons", {
    name: "Icons style for art",
    scope: "client",
    config: true,
    type: String,
    choices: {
      symbol: "Hermetic symbols",
      hand: "Hand gestures"
    },
    default: "symbol"
  });

  /**
   * Show source of document
   */
  game.settings.register("arm5e", "metagame", {
    name: "Show metagame information (sourcebook, page)",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  /**
   * Show NPC magic details (cast, penetration and defense)
   */
  game.settings.register("arm5e", "showNPCMagicDetails", {
    name: "Show NPC magic details (cast, penetration and defense)",
    scope: "world",
    config: true,
    choices: {
      SHOW_ALL: "Give me all details!",
      ONLY_RESULTS: "Show me only the result"
    },
    default: "ONLY_RESULTS"
  });

  /**
   * Fun rolls
   */

  game.settings.register("arm5e", "funRolls", {
    name: "Show a dialog when rolling a 1 on stress die",
    scope: "world",
    config: true,
    choices: {
      NOBODY: "Nobody",
      PLAYERS_ONLY: "Players only",
      EVERYONE: "Everyone"
    },
    default: "PLAYERS_ONLY"
  });

  CONFIG.Canvas.layers["arsmagica"] = {
    layerClass: ArsLayer,
    group: "primary"
  };

  /**
   * Whether to sort lists of stuff
   */
  // game.settings.register("arm5e", "sortItems", {
  //     name: "Sort lists of item",
  //     scope: "world",
  //     config: true,
  //     type: Boolean,
  //     default: false
  // });

  // Add system metadata
  CONFIG.ARM5E = ARM5E;

  CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[game.settings.get("arm5e", "defaultIconStyle")];

  // Define custom Entity classes
  CONFIG.Actor.documentClass = ArM5ePCActor;
  CONFIG.Item.documentClass = ArM5eItem;
  CONFIG.ActiveEffect.documentClass = ArM5eActiveEffect;

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
  Actors.registerSheet("arm5eBeast", ArM5eBeastActorSheet, {
    types: ["beast"],
    makeDefault: true,
    label: "arm5e.sheet.beast"
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

  Actors.registerSheet("arm5eMagicCodex", ArM5eMagicCodexSheet, {
    types: ["magicCodex"],
    makeDefault: true,
    label: "arm5e.sheet.magic-codex"
  });

  // Actors.registerSheet("arm5eCrucible", ArM5eCrucibleSheet, {
  //     types: ["crucible"],
  //     makeDefault: true,
  //     label: "arm5e.sheet.crucible"
  // });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("arm5e", ArM5eItemMagicSheet, {
    types: ["magicalEffect", "enchantment", "spell", "baseEffect", "laboratoryText", "magicItem"],
    makeDefault: true
  });

  Items.registerSheet("arm5e", ArM5eItemDiarySheet, {
    types: ["diaryEntry"],
    makeDefault: true
  });

  Items.registerSheet("arm5e", ArM5eItemSheet, {
    types: [
      "weapon",
      "armor",
      "vis",
      "item",
      "book",
      "virtue",
      "flaw",
      "ability",
      "abilityFamiliar",
      "power",
      "might",
      "powerFamiliar",
      "mightFamiliar",
      "speciality",
      "distinctive",
      "sanctumRoom",
      "personality",
      "reputation",
      "habitantMagi",
      "habitantCompanion",
      "habitantSpecialists",
      "habitantHabitants",
      "habitantHorses",
      "habitantLivestock",
      "possessionsCovenant",
      "visSourcesCovenant",
      "visStockCovenant",
      "calendarCovenant",
      "incomingSource",
      "mundaneBook",
      "labCovenant"
    ],
    makeDefault: true
  });

  // [DEV] comment line bellow to get access to the original sheet
  DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, "arm5e", ArM5eActiveEffectConfig);

  // Preload handlebars templates
  ArM5ePreloadHandlebarsTemplates();

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper("concat", function () {
    var outStr = "";
    for (var arg in arguments) {
      if (typeof arguments[arg] != "object") {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });
  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("ifIn", function (elem, list, options) {
    if (list.indexOf(elem) > -1) {
      return options.fn(this);
    }
    return options.inverse(this);
  });
});

Hooks.once("ready", async function () {
  // DEV:
  // generateActiveEffectFromAbilities();

  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createArM5eMacro(data, slot));

  Hooks.on("dropActorSheetData", (actor, sheet, data) => onDropActorSheetData(actor, sheet, data));
  Hooks.on("dropCanvasData", (canvas, data) => onDropOnCanvas(canvas, data));

  if (game.user.isGM) {
    // Determine whether a system migration is required and feasible
    // this below assumes that we stay on single digit version numbers...
    const currentVersion = game.settings.get("arm5e", "systemMigrationVersion");
    const SYSTEM_VERSION_NEEDED = game.system.data.version;
    const COMPATIBLE_MIGRATION_VERSION = "1.0";
    const totalDocuments = game.actors.size + game.scenes.size + game.items.size;

    if (!currentVersion && totalDocuments === 0) {
      game.settings.set("arm5e", "systemMigrationVersion", game.system.data.version);
    } else {
      const needsMigration =
        !currentVersion || foundry.utils.isNewerVersion(SYSTEM_VERSION_NEEDED, currentVersion);
      if (needsMigration) {
        // Perform the migration
        if (
          currentVersion &&
          foundry.utils.isNewerVersion(COMPATIBLE_MIGRATION_VERSION, currentVersion)
        ) {
          const warning = `Your Ars Magica system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
          ui.notifications.error(warning, {
            permanent: true
          });
        }
        await migration(currentVersion);
      }
    }
  }

  // check and warning that magic codex is missing or more than one occurence.
  const codex = game.actors.filter((a) => a.data.type === "magicCodex");
  if (codex.length > 1) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.codex.tooMany"), {
      permanent: false
    });
  } else if (codex.length === 0) {
    ui.notifications.warn(game.i18n.localize("arm5e.notification.codex.none"), {
      permanent: false
    });
  }

  // setup session storage:

  let userData = sessionStorage.getItem(`usercache-${game.user.id}`);
  if (!userData) {
    // create user cache if it doesn't exist yet
    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify({}));
  }
});

/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */

Hooks.once("setup", function () {});

Hooks.once("devModeReady", ({ registerPackageDebugFlag }) => {
  registerPackageDebugFlag(ARM5E.MODULE_ID);
});

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
  //if (data.type !== "Item") return;
  if (!("data" in data))
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.arm5e.rollItemMacro('${data.data._id}', '${data.actorId}');`;
  let macro = game.macros.contents.find((m) => m.name === item.name && m.command === command);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: {
        "arm5e.itemMacro": true
      }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

async function onDropActorSheetData(actor, sheet, data) {
  if (data.type == "Folder") {
    return true;
  }
  if (data.pack) {
    const item = await getDocumentFromCompendium(data.pack, data.id);
    if (sheet.isItemDropAllowed(item.data)) {
      return true;
    } else {
      return false;
    }
  }
  if (data.type == "Item") {
    let item;
    if (data.actorId === undefined) {
      // Doesn't have owner,
      item = game.items.get(data.id);
    } else {
      item = data;
    }

    if (sheet.isItemDropAllowed(item.data)) {
      return true;
    } else {
      log(true, "Prevented invalid item drop ", item.data, " on actor ", actor)
      return false;
    }
  } else if (data.type == "Actor") {
    let droppedActor = game.actors.get(data.id);

    if (sheet.isActorDropAllowed(droppedActor.type)) {
      return true;
    } else {
      console.log("Prevented invalid Actor drop");
      return false;
    }
  } else {
    return false;
  }
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemId, actorId) {
  const actor = game.actors.get(actorId);
  const item = actor.items.get(itemId);
  if (!item)
    return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);
  const dataset = prepareDatasetByTypeOfItem(item);
  actor.sheet._onRoll(dataset);
}

function setAuraValueForAllTokensInScene(value) {
  // Store a flag with the current aura
  game.scenes.viewed.setFlag("world", "aura_" + game.scenes.viewed.data._id, Number(value));
  modifyAuraActiveEffectForAllTokensInScene(value);
}

function setAuraValueForToken(value) {
  addActiveEffectAuraToActor(this, Number(value));
}

function resetTokenAuraToSceneAura() {
  const aura = game.scenes.viewed.getFlag("world", "aura_" + game.scenes.viewed.data._id);
  if (aura !== undefined && !isNaN(aura)) {
    addActiveEffectAuraToActor(this, Number(aura));
  }
}

function onDropOnCanvas(canvas, data) {
  const aura = game.scenes.viewed.getFlag("world", "aura_" + game.scenes.viewed.data._id);
  if (aura !== undefined && !isNaN(aura)) {
    const actor = game.actors.get(data.id);
    if (actor) addActiveEffectAuraToActor(actor, Number(aura));
  }
}

Hooks.on("renderChatMessage", (message, html, data) =>
  Arm5eChatMessage.addChatListeners(message, html, data)
);

Hooks.on("getSceneControlButtons", (buttons) => addArsButtons(buttons));
