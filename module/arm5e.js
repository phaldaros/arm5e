// Import Modules
import {
    ARM5E,
    ARM5E_DEFAULT_ICONS
} from "./metadata.js";
import {
    ArM5ePCActor
} from "./actor/actor-pc.js";
import {
    ArM5ePCActorSheet
} from "./actor/actor-pc-sheet.js";
import {
    ArM5eNPCActor
} from "./actor/actor-npc.js";
import {
    ArM5eNPCActorSheet
} from "./actor/actor-npc-sheet.js";
import {
    ArM5eLaboratoryActor
} from "./actor/actor-laboratory.js";
import {
    ArM5eLaboratoryActorSheet
} from "./actor/actor-laboratory-sheet.js";
import {
    ArM5eCovenantActor
} from "./actor/actor-covenant.js";
import {
    ArM5eCovenantActorSheet
} from "./actor/actor-covenant-sheet.js";
import {
    ArM5eMagicCodexSheet
} from "./actor/actor-magic-codex-sheet.js";
import {
    ArM5eItem
} from "./item/item.js";
import {
    ArM5eItemSheet
} from "./item/item-sheet.js";
import {
    ArM5eItemMagicSheet
} from "./item/item-magic-sheet.js";

import {
    ArM5ePreloadHandlebarsTemplates
} from "./templates.js";

import {
    migration
} from './migration.js';
import {
    log
} from "./tools.js"


Hooks.once('init', async function() {

    game.arm5e = {
        ArM5ePCActor,
        ArM5eNPCActor,
        ArM5eLaboratoryActor,
        ArM5eCovenantActor,
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
            "MONO": "Monochrome",
            "COLOR": "Color"
        },
        default: "MONO",
        onChange: value => {
            CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[value];
        }
    });

    // Add custom metadata
    CONFIG.ARM5E = ARM5E;

    CONFIG.ARM5E_DEFAULT_ICONS = ARM5E_DEFAULT_ICONS[game.settings.get("arm5e", "defaultIconStyle")];

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


    Actors.registerSheet("arm5eMagicCodex", ArM5eMagicCodexSheet, {
        types: ["magicCodex"],
        makeDefault: true,
        label: "arm5e.sheet.magic-codex"
    });


    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("arm5e", ArM5eItemMagicSheet, {
        types: ["magicalEffect"],
        makeDefault: true
    });
    Items.registerSheet("arm5e", ArM5eItemSheet, {
        makeDefault: true
    });


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
    Hooks.on("dropActorSheetData", (actor, sheet, data) => onDropActorSheetData(actor, sheet, data));

    // Determine whether a system migration is required and feasible
    if (!game.user.isGM) return;
    // this assumes that we stay on single digit version numbers...
    const currentVersion = parseInt(game.settings.get("arm5e", "systemMigrationVersion").replace(/\./g, ''));
    const SYSTEM_VERSION_NEEDED = 111;
    const COMPATIBLE_MIGRATION_VERSION = 10;
    const totalDocuments = game.actors.size + game.scenes.size + game.items.size;

    if (!currentVersion && totalDocuments === 0) return game.settings.set("arm5e", "systemMigrationVersion", game.system.data.version);
    const needsMigration = !currentVersion || SYSTEM_VERSION_NEEDED > currentVersion;
    if (!needsMigration) return;
    // Perform the migration
    if (currentVersion && COMPATIBLE_MIGRATION_VERSION > currentVersion) {
        const warning = `Your Ars Magica system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`;
        ui.notifications.error(warning, {
            permanent: true
        });
    }
    migration(currentVersion);

});



/**
 * This function runs after game data has been requested and loaded from the servers, so entities exist
 */

Hooks.once("setup", function() {

});

Hooks.once('devModeReady', ({
    registerPackageDebugFlag
}) => {
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
            flags: {
                "arm5e.itemMacro": true
            }
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;

}

function onDropActorSheetData(actor, sheet, data) {

    if (actor.data.type == "magicCodex") {
        if (data.type != "baseEffect" && data.type != "magicalEffect" && data.type != "spell") {
            console.log("Prevented invalid item drop");
            return false;
        }
        return true;
    }
    // TODO: more filtering for other Actor types
    return true;

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