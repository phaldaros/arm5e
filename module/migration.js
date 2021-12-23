import {
    log
} from "./tools.js"

async function migration(originalVersion) {

    ui.notifications.info(`Applying ARM5E System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {
        permanent: true
    });

    console.log("Starting migration...");

    // Migrate World Actors
    for (let a of game.actors.contents) {
        try {
            if (a.data.type == "magus") {
                a.data.type = "player";
            }

            const updateData = migrateActorData(a.data);

            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, {
                    enforceTypes: false
                });
            }

            // const cleanData = cleanActorData(a.data)
            // if (!isObjectEmpty(cleanData)) {
            //     console.log(`Cleaning up Actor entity ${a.name}`);
            //     a.data.data = cleanData.data;
            // }

        } catch (err) {
            err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
            console.error(err);
        }
    }

    // Migrate World Items
    for (let i of game.items) {
        try {
            const updateData = migrateItemData(i.toObject());
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Item entity ${i.name}`);
                await i.update(updateData, {
                    enforceTypes: false
                });
            }
            console.log(`Migrated Item entity ${i.data.data}`);

            // const cleanData = cleanItemData(i.data)
            // if (!isObjectEmpty(cleanData)) {
            //     console.log(`Cleaning up Item entity ${i.name}`);
            //     i.data.data = cleanData.data;
            // }

        } catch (err) {
            err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
            console.error(err);
        }
    }


    //   // Migrate Actor Override Tokens
    //   for ( let s of game.scenes ) {
    //     try {
    //       const updateData = migrateSceneData(s.data);
    //       if ( !foundry.utils.isObjectEmpty(updateData) ) {
    //         console.log(`Migrating Scene entity ${s.name}`);
    //         await s.update(updateData, {enforceTypes: false});
    //         // If we do not do this, then synthetic token actors remain in cache
    //         // with the un-updated actorData.
    //         s.tokens.forEach(t => t._actor = null);
    //       }
    //     } catch(err) {
    //       err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
    //       console.error(err);
    //     }
    //   }

    // Migrate World Compendium Packs
    for (let p of game.packs) {
        if (p.metadata.package !== "world") continue;
        if (!["Actor", "Item", "Scene"].includes(p.metadata.entity)) continue;
        await migrateCompendium(p);
    }


    // Set the migration as complete
    game.settings.set("arm5e", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(`Ars Magica 5e System Migration to version ${game.system.data.version} completed!`, {
        permanent: true
    });
}

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function(pack) {
    const entity = pack.metadata.entity;
    if (!["Actor", "Item", "Scene"].includes(entity)) return;

    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({
        locked: false
    });

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const documents = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for (let doc of documents) {
        let updateData = {};
        try {
            switch (entity) {
                case "Actor":
                    updateData = migrateActorData(doc.toObject());
                    break;
                case "Item":
                    updateData = migrateItemData(doc.toObject());
                    break;
                    // case "Scene":
                    //     updateData = migrateSceneData(doc.data);
                    //     break;
            }

            // Save the entry, if data was changed
            if (foundry.utils.isObjectEmpty(updateData)) continue;
            await doc.update(updateData);
            console.log(`Migrated ${entity} entity ${doc.name} in Compendium ${pack.collection}`);
        }

        // Handle migration failures
        catch (err) {
            err.message = `Failed arm5e system migration for entity ${doc.name} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }
    }

    // Apply the original locked status for the pack
    await pack.configure({
        locked: wasLocked
    });
    console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
};
/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @return {Object}         The updateData to apply
 */

export const migrateActorData = function(actorData) {
    const updateData = {};


    // 
    if (actorData.type == 'laboratory') {
        return updateData;
    }

    //updateData["type"] = "player";
    updateData["data.version"] = "0.3";

    if (actorData.data.diaryEntries === undefined) {
        updateData["data.diaryEntries"] = [];
    }
    // convert after fixing typo dairy => diary
    if (actorData.data.version == "0.1") {
        if (actorData.data.dairyEntries) {
            updateData["data.diaryEntries"] = actorData.data.dairyEntries;
            updateData["data.-=dairyEntries"] = null;
        }
    }

    // convert after fixing typo labarotary => laboratory
    if (actorData.data.version == "0.1") {
        if (actorData.data.labarotary) {
            updateData["data.laboratory"] = actorData.data.labarotary;
            updateData["data.-=labarotary"] = null;
        }
    }

    if (actorData.data.mightsFam) {
        updateData["data.powersFam"] = actorData.data.mightsFam;
        updateData["data.-=mightsFam"] = null;
    }

    if (actorData.data.mights) {
        updateData["data.powers"] = actorData.data.mights;
        updateData["data.-=mights"] = null;
    }


    // remove redundant data
    if (actorData.data.houses != undefined) {
        updateData["data.-=houses"] = null;
    }

    if (actorData.data.weapons === undefined) {
        updateData["data.weapons"] = [];
    }
    if (actorData.data.armor === undefined) {
        updateData["data.armor"] = [];
    }
    if (actorData.data.vis === undefined) {
        updateData["data.vis"] = [];
    }
    if (actorData.data.items === undefined) {
        updateData["data.items"] = [];
    }
    if (actorData.data.books === undefined) {
        updateData["data.books"] = [];
    }
    if (actorData.data.spells === undefined) {
        updateData["data.spells"] = [];
    }

    if (actorData.type != "covenant") {
        updateData["data.roll.characteristic"] = "";
        updateData["data.roll.ability"] = "";
        updateData["data.roll.technique"] = "";
        updateData["data.roll.form"] = "";
        updateData["data.roll.total"] = "";
        updateData["data.roll.aura"] = 0;
        updateData["data.roll.rollLabel"] = "";
        updateData["data.roll.rollFormula"] = "";
    }

    if (actorData.data.charType == "magus") {
        updateData["data.laboratory.longevityRitual.labTotal"] = 0;
        updateData["data.laboratory.longevityRitual.modifier"] = 0;
        updateData["data.laboratory.longevityRitual.twilightScars"] = "";

        updateData["data.laboratory.abilitiesSelected.finesse.abilityID"] = "";
        // updateData["data.laboratory.abilitiesSelected.finesse.value"] = 0;
        updateData["data.laboratory.abilitiesSelected.finesse.label"] = "";
        updateData["data.laboratory.abilitiesSelected.awareness.abilityID"] = "";
        // updateData["data.laboratory.abilitiesSelected.awareness.value"] = 0;
        updateData["data.laboratory.abilitiesSelected.awareness.label"] = "";
        updateData["data.laboratory.abilitiesSelected.concentration.abilityID"] = "";

        // updateData["data.laboratory.abilitiesSelected.concentration.value"] = 0;

        updateData["data.laboratory.abilitiesSelected.concentration.label"] = "";
        updateData["data.laboratory.abilitiesSelected.artesLib.abilityID"] = "";
        // updateData["data.laboratory.abilitiesSelected.artesLib.value"] = 0;
        updateData["data.laboratory.abilitiesSelected.artesLib.label"] = "";
        updateData["data.laboratory.abilitiesSelected.philosophy.abilityID"] = "";
        // updateData["data.laboratory.abilitiesSelected.philosophy.value"] = 0;
        updateData["data.laboratory.abilitiesSelected.philosophy.label"] = "";
        updateData["data.laboratory.abilitiesSelected.parma.abilityID"] = "";
        // updateData["data.laboratory.abilitiesSelected.parma.value"] = 0;
        updateData["data.laboratory.abilitiesSelected.parma.label"] = "";
        updateData["data.laboratory.abilitiesSelected.magicTheory.abilityID"] = "";
        // updateData["data.laboratory.abilitiesSelected.magicTheory.value"] = 0;
        updateData["data.laboratory.abilitiesSelected.magicTheory.label"] = "";

        // updateData["data.laboratory.fastCastingSpeed.value"] = 0;
        // updateData["data.laboratory.determiningEffect.value"] = 0;
        // updateData["data.laboratory.targeting.value"] = 0;
        // updateData["data.laboratory.concentration.value"] = 0;
        // updateData["data.laboratory.magicResistance.value"] = 0;
        // updateData["data.laboratory.multipleCasting.value"] = 0;
        // updateData["data.laboratory.basicLabTotal.value"] = 0;
        // updateData["data.laboratory.visLimit.value"] = 0;



        updateData["data.familiar.characteristicsFam.int"] = {
            "value": actorData.data.familiar.characteristicsFam.int.value
        };
        updateData["data.familiar.characteristicsFam.per"] = {
            "value": actorData.data.familiar.characteristicsFam.per.value
        };
        updateData["data.familiar.characteristicsFam.str"] = {
            "value": actorData.data.familiar.characteristicsFam.str.value
        };
        updateData["data.familiar.characteristicsFam.sta"] = {
            "value": actorData.data.familiar.characteristicsFam.sta.value
        };
        updateData["data.familiar.characteristicsFam.pre"] = {
            "value": actorData.data.familiar.characteristicsFam.pre.value
        };
        updateData["data.familiar.characteristicsFam.com"] = {
            "value": actorData.data.familiar.characteristicsFam.com.value
        };
        updateData["data.familiar.characteristicsFam.dex"] = {
            "value": actorData.data.familiar.characteristicsFam.dex.value
        };
        updateData["data.familiar.characteristicsFam.qik"] = {
            "value": actorData.data.familiar.characteristicsFam.qik.value
        };
    }

    // Migrate Owned Items
    if (!actorData.items) return updateData;

    const items = actorData.items.reduce((arr, i) => {
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        let itemUpdate = migrateItemData(itemData);
        // Update the Owned Item
        if (!isObjectEmpty(itemUpdate)) {
            itemUpdate._id = itemData._id;
            arr.push(expandObject(itemUpdate));
        }
        return arr;
    }, []);
    if (items.length > 0) updateData.items = items;




    return updateData;
}

export const migrateItemData = function(itemData) {

    const updateData = {};
    if (_isMagicalItem(itemData)) {
        if (itemData.type != "baseEffect") {
            if (itemData.data.duration.value === undefined) {
                // console.log(`Guessing duration: ${itemData.data.duration}`);
                updateData["data.duration.value"] = _guessDuration(itemData.name, itemData.data.duration);
            }
            if (itemData.data.range.value === undefined) {
                // console.log(`Guessing range: ${itemData.data.range}`);
                updateData["data.range.value"] = _guessRange(itemData.name, itemData.data.range);
            }
            if (itemData.data.target.value === undefined) {
                // console.log(`Guessing target: ${itemData.data.target}`);
                updateData["data.target.value"] = _guessTarget(itemData.name, itemData.data.target);
            }
        }
        // remove redundant data
        if (itemData.data.techniques != undefined) {
            updateData["data.-=techniques"] = null;
        }
        if (itemData.data.forms != undefined) {
            updateData["data.-=forms"] = null;
        }
        if (itemData.data["technique-requisites"] != undefined) {
            updateData["data.-=technique-requisites"] = null;
        }
        if (itemData.data["form-requisites"] != undefined) {
            updateData["data.-=form-requisites"] = null;
        }
        if (itemData.data["technique-requisite"] != undefined) {
            if (itemData.data["technique-requisite"].value != "n-a" && itemData.data["technique-requisite"].value != "") {
                updateData["data.technique-req." + itemData.data["technique-requisite"].value] = true;
            }
        }

        if (itemData.data["form-requisite"] != undefined) {
            if (itemData.data["form-requisite"].value != "n-a" && itemData.data["form-requisite"].value != "") {
                updateData["data.form-req." + itemData.data["form-requisite"].value] = true;
            }
        }

    }
    // Fix type of Item
    if (itemData.type == "dairyEntry") {
        updateData["type"] = "diaryEntry";
    }
    if (itemData.type == "might") {
        updateData["type"] = "power";
    }
    if (itemData.type == "mightFamiliar") {
        updateData["type"] = "powerFamiliar";
    }

    return updateData;
}

function _isMagicalItem(itemData) {
    switch (itemData.type) {
        case "spell":
        case "magicalEffect":
        case "enchantment":
        case "baseEffect":
            return true;
        case "laboratoryText": {
            return itemData.data.type == "spell";
        }
        default:
            return false;
    }
}


/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actorData    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
function cleanActorData(actorData) {

    // Scrub system data
    const model = game.system.model.Actor[actorData.type];
    actorData.data = filterObject(actorData.data, model);


    // Return the scrubbed data
    return actorData;
}


/**
 * Scrub an Item's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} itemData    The data object for an Item
 * @return {Object}             The scrubbed Item data
 */
function cleanItemData(itemData) {

    // Scrub system data
    const model = game.system.model.Item[itemData.type];
    itemData.data = filterObject(itemData.data, model);



    // Return the scrubbed data
    return itemData;
}


// Unfortunaltly, since the range was a free input field, it has to be guessed
function _guessRange(name, value) {
    switch (value.toLowerCase()) {
        case "personal":
        case "pers":
        case "per":
        case game.i18n.localize("arm5e.spell.ranges.personal"):
            return "personal";
        case "touch":
        case game.i18n.localize("arm5e.spell.ranges.touch"):
            return "touch";
        case "eye":
        case game.i18n.localize("arm5e.spell.ranges.eye"):
            return "eye"
        case "voice":
        case game.i18n.localize("arm5e.spell.ranges.voice"):
            return "voice";
        case "road":
        case game.i18n.localize("arm5e.spell.ranges.road"):
            return "road";
        case "sight":
        case game.i18n.localize("arm5e.spell.ranges.sight"):
            return "sight";
        case "arc":
        case "arcane connection":
        case game.i18n.localize("arm5e.spell.ranges.arc"):
            return "arc";
        case "special":
        case "spe":
        case "spec":
        case game.i18n.localize("arm5e.config.special"):
            return "special";
        default:
            ui.notifications.warn(`Warning: Unable to guess range \"${value}\" of ${name}, you will have to set it manually`, {
                permanent: true
            });
            console.warn(`Range \"${value}\" of spell ${name} could not be guessed`);
            return "personal";
    }
}

// Unfortunaltly, since the target was a free input field, it has to be guessed
function _guessTarget(name, value) {

    switch (value.toLowerCase().trim()) {
        case "individual":
        case "ind":
        case "indiv":
        case game.i18n.localize("arm5e.spell.ranges.ind"):
            return "ind";
        case "circle":
        case "cir":
        case game.i18n.localize("arm5e.spell.ranges.circle"):
            return "circle";
        case "part":
        case "par":
        case game.i18n.localize("arm5e.spell.ranges.part"):
            return "part"
        case "group":
        case "gro":
        case "grp":
        case game.i18n.localize("arm5e.spell.ranges.group"):
            return "group";
        case "room":
        case game.i18n.localize("arm5e.spell.ranges.room"):
            return "room";
        case "struct":
        case "str":
        case game.i18n.localize("arm5e.spell.ranges.struct"):
            return "struct";
        case "boundary":
        case "bound":
        case "bou":
        case game.i18n.localize("arm5e.spell.ranges.bound"):
            return "bound";
        case "taste":
        case "tas":
        case game.i18n.localize("arm5e.spell.ranges.taste"):
            return "taste";
        case "hearing":
        case "hea":
        case game.i18n.localize("arm5e.spell.ranges.hearing"):
            return "hearing";
        case "touch":
        case "tou":
        case game.i18n.localize("arm5e.spell.ranges.touch"):
            return "touch";
        case "smell":
        case "sme":
        case game.i18n.localize("arm5e.spell.ranges.smell"):
            return "smell";
        case "sight":
        case "sig":
        case game.i18n.localize("arm5e.spell.ranges.sight"):
            return "sight";
        case "special":
        case "spe":
        case "spec":
        case game.i18n.localize("arm5e.config.special"):
            return "special";
        default:
            ui.notifications.warn(`Warning: Unable to guess target \"${value}\" of ${name}, you will have to set it manually`, {
                permanent: true
            });
            console.warn(`Target \"${value}\" of spell ${name} could not be guessed`);
            return "ind";
    }
}



// Unfortunaltly, since the duration was a free input field, it has to be guessed
function _guessDuration(name, value) {

    switch (value.toLowerCase().trim()) {
        case "moment":
        case "momentary":
        case "mom":
        case game.i18n.localize("arm5e.spell.ranges.moment"):
            return "moment";
        case "diameter":
        case "dia":
        case "diam":
            return "diam";
        case "concentration":
        case game.i18n.localize("arm5e.spell.ranges.conc"):
            return "conc";
        case "sun":
        case game.i18n.localize("arm5e.spell.ranges.sun"):
            return "sun"
        case "ring":
        case game.i18n.localize("arm5e.spell.ranges.ring"):
            return "ring";
        case "moon":
        case game.i18n.localize("arm5e.spell.ranges.moon"):
            return "moon";
        case "fire":
        case game.i18n.localize("arm5e.spell.ranges.fire"):
            return "fire";
        case "bargain":
        case "barg":
        case game.i18n.localize("arm5e.spell.ranges.barg"):
            return "bargain";
        case "year":
        case game.i18n.localize("arm5e.spell.ranges.year"):
            return "year";
        case "condition":
        case "cond":
        case game.i18n.localize("arm5e.spell.ranges.condition"):
            return "condition";
        case "year+1":
        case game.i18n.localize("arm5e.spell.ranges.year+1"):
            return "year+1";
        case "special":
        case "spe":
        case "spec":
        case game.i18n.localize("arm5e.config.special"):
            return "special";
        default:
            ui.notifications.warn(`Warning: Unable to guess duration \"${value}\" of ${name}, you will have to set it manually`, {
                permanent: true
            });
            console.warn(`Duration \"${value}\" of spell ${name} could not be guessed`);
            return "moment";
    }
}
export {
    migration
}