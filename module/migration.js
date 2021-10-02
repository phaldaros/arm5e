import {
    log
} from "./tools.js"

async function migration(originalVersion) {

    ui.notifications.info(`Applying ARM5E System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`, {
        permanent: true
    });


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

    //   // Migrate World Compendium Packs
    //   for ( let p of game.packs ) {
    //     if ( p.metadata.package !== "world" ) continue;
    //     if ( !["Actor", "Item", "Scene"].includes(p.metadata.entity) ) continue;
    //     await migrateCompendium(p);
    //   }

    // Set the migration as complete
    game.settings.set("arm5e", "systemMigrationVersion", game.system.data.version);
    ui.notifications.info(`Ars Magica 5e System Migration to version ${game.system.data.version} completed!`, {
        permanent: true
    });
}


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

    // if(actorData.data.version){
    //     if(actorData.data.version == "0.3"){
    //         return updateData;
    //     }
    // }

    if ((actorData.type == 'npc') || (actorData.type == 'laboratory') || (actorData.type == 'covenant')) {
        return updateData;
    }

    updateData["type"] = "player";
    updateData["data.version"] = "0.3";

    if (actorData.data.diaryEntries === undefined) {
        updateData["data.diaryEntries"] = [];
    }
    // convert after fixing typo dairy => diary
    if (actorData.data.version == "0.1") {
        if (actorData.data.dairyEntries) {
            updateData["data.diaryEntries"] = actorData.data.dairyEntries;
        }
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


    updateData["data.charType.value"] = "magus";
    updateData["data.charType.label"] = "Char. Type";
    updateData["data.charTypes.magus.label"] = "arm5e.sheet.magus";
    updateData["data.charTypes.companion.label"] = "arm5e.sheet.companion";
    updateData["data.charTypes.grog.label"] = "arm5e.sheet.grog";


    updateData["data.roll.characteristic"] = "";
    updateData["data.roll.ability"] = "";
    updateData["data.roll.technique"] = "";
    updateData["data.roll.form"] = "";
    updateData["data.roll.total"] = "";
    updateData["data.roll.aura"] = 0;
    updateData["data.roll.rollLabel"] = "";
    updateData["data.roll.rollFormula"] = "";


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

    // convert after fixing typo labarotary => laboratory
    if (actorData.data.version == "0.1") {
        if (actorData.data.labarotary) {
            updateData["data.laboratory"] = actorData.data.labarotary;
        }
    }


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


    // Migrate Owned Items
    if (!actorData.items) return updateData;
    const items = actorData.items
    for (let i of items) {
        try {
            log(false, `Migrating owned Item ${i.name}`);
            log(false, i.data);
            const updateData = migrateItemData(i.toObject());
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Item entity ${i.name}`);
                i.update(updateData, {
                    enforceTypes: false
                });
            }

            // const cleanData = cleanItemData(i.data)
            // if (!isObjectEmpty(cleanData)) {
            //     console.log(`Cleaning up Item entity ${i.name}`);
            //     i.data.data = cleanData.data;
            // }
        } catch (err) {
            err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
            console.error(err);
        }
        log(false, "After migration");
        log(false, i.data);
    }

    if (items.length > 0) updateData.items = items;

    return updateData;
}

export const migrateItemData = function(itemData) {
    const updateData = {};



    return updateData;
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
export {
    migration
}