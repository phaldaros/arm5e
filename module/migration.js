import {
    log
} from "./tools.js"

async function migration() {

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

            const updateData = migrateActorData(a.toObject());

            if (!isObjectEmpty(updateData)) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, {
                    enforceTypes: false
                });
            }
            
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
        } catch (err) {
            err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
            console.error(err);
        }
    }
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

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function (pack) {
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
export const migrateActorData = function (actorData) {
    const updateData = {};

    if (actorData.type != 'player') {
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
            updateData["data.dairyEntries"] = null;
        }
        
    }
    // remove redundant data
    if (actorData.data.houses != undefined) {
        updateData["data.houses"] = null;
    }

    if (actorData.data.characteristics.int.short === undefined) {
        updateData["data.characteristics.int.short"] = "arm5e.sheet.int";
    }
    if (actorData.data.characteristics.per.short === undefined) {
        updateData["data.characteristics.per.short"] = "arm5e.sheet.per";
    }
    if (actorData.data.characteristics.str.short === undefined) {
        updateData["data.characteristics.str.short"] = "arm5e.sheet.str";
    }
    if (actorData.data.characteristics.sta.short === undefined) {
        updateData["data.characteristics.sta.short"] = "arm5e.sheet.sta";
    }
    if (actorData.data.characteristics.pre.short === undefined) {
        updateData["data.characteristics.pre.short"] = "arm5e.sheet.pre";
    }
    if (actorData.data.characteristics.com.short === undefined) {
        updateData["data.characteristics.com.short"] = "arm5e.sheet.com";
    }
    if (actorData.data.characteristics.dex.short === undefined) {
        updateData["data.characteristics.dex.short"] = "arm5e.sheet.dex";
    }
    if (actorData.data.characteristics.qik.short === undefined) {
        updateData["data.characteristics.qik.short"] = "arm5e.sheet.qik";
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


    updateData["data.description.born.label"] = "arm5e.sheet.yearBorn";
    updateData["data.description.apprentice.label"] = "arm5e.sheet.apprenticeshipYears";
    updateData["data.description.birthname.label"] = "arm5e.sheet.birthName";
    updateData["data.description.birthplace.label"] = "arm5e.sheet.birthplace";
    updateData["data.description.nationality.label"] = "arm5e.sheet.nationality";
    updateData["data.description.religion.label"] = "arm5e.sheet.religion";
    updateData["data.description.height.label"] = "arm5e.sheet.height";
    updateData["data.description.weight.label"] = "arm5e.sheet.weight";
    updateData["data.description.gender.label"] = "arm5e.sheet.gender";
    updateData["data.description.hair.label"] = "arm5e.sheet.hair";
    updateData["data.description.eyes.label"] = "arm5e.sheet.eyes";
    updateData["data.description.title.label"] = "arm5e.sheet.profession";
    updateData["data.description.handed.label"] = "arm5e.sheet.handedness";

    updateData["data.vitals.siz.label"] = "arm5e.sheet.size";
    updateData["data.vitals.soa.label"] = "arm5e.sheet.soak";
    updateData["data.vitals.enc.label"] = "arm5e.sheet.encumbrance";

    updateData["data.pendingXP"] = 0;

    updateData["data.personality.per1.notes"] = "";
    updateData["data.personality.per2.notes"] = "";
    updateData["data.personality.per3.notes"] = "";
    updateData["data.personality.per4.notes"] = "";
    updateData["data.personality.per5.notes"] = "";

    updateData["data.charType.value"] = "magus";
    updateData["data.charType.label"] = "Char. Type";
    updateData["data.charTypes.magus.label"] = "arm5e.sheet.magus";
    updateData["data.charTypes.companion.label"] = "arm5e.sheet.companion";
    updateData["data.charTypes.grog.label"] = "arm5e.sheet.grog";

    updateData["data.apprentice.name"] = "";
    updateData["data.apprentice.age"] = 0;
    updateData["data.apprentice.years"] = 0;
    updateData["data.apprentice.int"] = 0;
    updateData["data.apprentice.magicTheory"] = 0;

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
    updateData["data.laboratory.abilitiesSelected.finesse.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.finesse.label"] = "";
    updateData["data.laboratory.abilitiesSelected.awareness.abilityID"] = "";
    updateData["data.laboratory.abilitiesSelected.awareness.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.awareness.label"] = "";
    updateData["data.laboratory.abilitiesSelected.concentration.abilityID"] = "";
    updateData["data.laboratory.abilitiesSelected.concentration.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.concentration.label"] = "";
    updateData["data.laboratory.abilitiesSelected.artesLib.abilityID"] = "";
    updateData["data.laboratory.abilitiesSelected.artesLib.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.artesLib.label"] = "";
    updateData["data.laboratory.abilitiesSelected.philosophy.abilityID"] = "";
    updateData["data.laboratory.abilitiesSelected.philosophy.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.philosophy.label"] = "";
    updateData["data.laboratory.abilitiesSelected.parma.abilityID"] = "";
    updateData["data.laboratory.abilitiesSelected.parma.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.parma.label"] = "";
    updateData["data.laboratory.abilitiesSelected.magicTheory.abilityID"] = "";
    updateData["data.laboratory.abilitiesSelected.magicTheory.value"] = 0;
    updateData["data.laboratory.abilitiesSelected.magicTheory.label"] = "";

    updateData["data.laboratory.fastCastingSpeed.value"] = 0;
    updateData["data.laboratory.determiningEffect.value"] = 0;
    updateData["data.laboratory.targeting.value"] = 0;
    updateData["data.laboratory.concentration.value"] = 0;
    updateData["data.laboratory.magicResistance.value"] = 0;
    updateData["data.laboratory.multipleCasting.value"] = 0;
    updateData["data.laboratory.basicLabTotal.value"] = 0;
    updateData["data.laboratory.visLimit.value"] = 0;

    // convert after fixing typo labarotary => laboratory
    if (actorData.data.version == "0.1") {
        if (actorData.data.labarotary) {
            updateData["data.laboratory"] = actorData.data.labarotary;
        }
    }

    updateData["data.familiar.nameFam"] = "";
    updateData["data.familiar.specieFam"] = "";
    updateData["data.familiar.techniqueFam.value"] = "";
    updateData["data.familiar.formFam.value"] = "";
    updateData["data.familiar.cordFam.bronze"] = 0;
    updateData["data.familiar.cordFam.silver"] = 0;
    updateData["data.familiar.cordFam.gold"] = 0;
    updateData["data.familiar.characteristicsFam.int.short"] = "arm5e.sheet.int";
    updateData["data.familiar.characteristicsFam.int.value"] = 0;
    updateData["data.familiar.characteristicsFam.per.short"] = "arm5e.sheet.per";
    updateData["data.familiar.characteristicsFam.per.value"] = 0;
    updateData["data.familiar.characteristicsFam.str.short"] = "arm5e.sheet.str";
    updateData["data.familiar.characteristicsFam.str.value"] = 0;
    updateData["data.familiar.characteristicsFam.sta.short"] = "arm5e.sheet.sta";
    updateData["data.familiar.characteristicsFam.sta.value"] = 0;
    updateData["data.familiar.characteristicsFam.pre.short"] = "arm5e.sheet.pre";
    updateData["data.familiar.characteristicsFam.pre.value"] = 0;
    updateData["data.familiar.characteristicsFam.com.short"] = "arm5e.sheet.com";
    updateData["data.familiar.characteristicsFam.com.value"] = 0;
    updateData["data.familiar.characteristicsFam.dex.short"] = "arm5e.sheet.dex";
    updateData["data.familiar.characteristicsFam.dex.value"] = 0;
    updateData["data.familiar.characteristicsFam.qik.short"] = "arm5e.sheet.qik";
    updateData["data.familiar.characteristicsFam.qik.value"] = 0;

    updateData["data.familiar.vitalsFam.size.label"] = "arm5e.sheet.size";
    updateData["data.familiar.vitalsFam.size.value"] = 0;
    updateData["data.familiar.vitalsFam.might.label"] = "arm5e.sheet.might";
    updateData["data.familiar.vitalsFam.might.value"] = 0;
    updateData["data.familiar.vitalsFam.soak.label"] = "arm5e.sheet.soak";
    updateData["data.familiar.vitalsFam.soak.value"] = 0;
    updateData["data.familiar.vitalsFam.fatigue.label"] = "arm5e.sheet.fatigue";
    updateData["data.familiar.vitalsFam.fatigue.value"] = 0;
    updateData["data.familiar.vitalsFam.initiative.label"] = "arm5e.sheet.initiative";
    updateData["data.familiar.vitalsFam.initiative.value"] = 0;
    updateData["data.familiar.vitalsFam.attack.label"] = "arm5e.sheet.attack";
    updateData["data.familiar.vitalsFam.attack.value"] = 0;
    updateData["data.familiar.vitalsFam.defense.label"] = "arm5e.sheet.defense";
    updateData["data.familiar.vitalsFam.defense.value"] = 0;
    updateData["data.familiar.vitalsFam.damage.label"] = "arm5e.sheet.damage";
    updateData["data.familiar.vitalsFam.damage.value"] = 0;

    updateData["data.familiar.abilitiesFam"] = [];
    updateData["data.familiar.mightsFam"] = [];

 
    const items = actorData.items.reduce((arr, i) => {
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        let itemUpdate = migrateItemData(itemData);
        // Update the Owned Item
        if ( !isObjectEmpty(itemUpdate) ) {
          itemUpdate._id = itemData._id;
          arr.push(expandObject(itemUpdate));
        }
        return arr;
  }, []);

   if ( items.length > 0 ) updateData.items = items;

  return updateData;
}

export const migrateItemData = function (itemData) {
    const updateData = {};
    if (itemData.type == "spell") {
        if (itemData.data.duration.value === undefined) {
            // console.log(`Guessing duration: ${itemData.data.duration}`);
            updateData["data.duration.value"] = _guessDuration(itemData.name, itemData.data.duration);
            updateData["data.duration.label"] = "arm5e.sheet.duration";
        }
        if (itemData.data.range.value === undefined) {
            // console.log(`Guessing range: ${itemData.data.range}`);
            updateData["data.range.value"] = _guessRange(itemData.name, itemData.data.range);
            updateData["data.range.label"] = "arm5e.sheet.range";
        }
        if (itemData.data.target.value === undefined) {
            // console.log(`Guessing target: ${itemData.data.target}`);
            updateData["data.target.value"] = _guessTarget(itemData.name, itemData.data.target);
            updateData["data.target.label"] = "arm5e.sheet.target";
        }
        // remove redundant data
        if (itemData.data.techniques != undefined) {
        updateData["data.-techniques"] = null;
        }
        if (itemData.data.forms != undefined) {
            updateData["data.forms"] = null;
        }
        if (itemData.data["technique-requisites"] != undefined) {
            updateData["data.technique-requisites"] = null;
        }
        if (itemData.data["form-requisites"] != undefined) {
            updateData["data.form-requisites"] = null;
        }
    }
    if (itemData.type == "dairyEntry") {
        updateData["type"] = "diaryEntry";
    }

    return updateData;
}

// Unfortunaltly, since the range was a free input field, it has to be guessed
function _guessRange(name, value) {
    switch (value.toLowerCase()) {
        case "personal":
        case "pers":
        case "per":
        case game.i18n.localize("arm5e.config.ranges.personal"):
            return "personal";
        case "touch":
        case game.i18n.localize("arm5e.config.ranges.touch"):
            return "touch";
        case "eye":
        case game.i18n.localize("arm5e.config.ranges.eye"):
            return "eye"
        case "voice":
        case game.i18n.localize("arm5e.config.ranges.voice"):
            return "voice";
        case "road":
        case game.i18n.localize("arm5e.config.ranges.road"):
            return "road";
        case "sight":
        case game.i18n.localize("arm5e.config.ranges.sight"):
            return "sight";
        case "arc":
        case "arcane connection":
        case game.i18n.localize("arm5e.config.ranges.arc"):
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
            return "personnal";
    }
}

// Unfortunaltly, since the target was a free input field, it has to be guessed
function _guessTarget(name, value) {

    switch (value.toLowerCase().trim()) {
        case "individual":
        case "ind":
        case "indiv":
        case game.i18n.localize("arm5e.config.ranges.ind"):
            return "ind";
        case "circle":
        case "cir":
        case game.i18n.localize("arm5e.config.ranges.circle"):
            return "circle";
        case "part":
        case "par":
        case game.i18n.localize("arm5e.config.ranges.part"):
            return "part"
        case "group":
        case "gro":
        case "grp":
        case game.i18n.localize("arm5e.config.ranges.group"):
            return "group";
        case "room":
        case game.i18n.localize("arm5e.config.ranges.room"):
            return "room";
        case "struct":
        case "str":
        case game.i18n.localize("arm5e.config.ranges.struct"):
            return "struct";
        case "boundary":
        case "bound":
        case "bou":
        case game.i18n.localize("arm5e.config.ranges.bound"):
            return "bound";
        case "taste":
        case "tas":
        case game.i18n.localize("arm5e.config.ranges.taste"):
            return "taste";
        case "hearing":
        case "hea":
        case game.i18n.localize("arm5e.config.ranges.hearing"):
            return "hearing";
        case "touch":
        case "tou":
        case game.i18n.localize("arm5e.config.ranges.touch"):
            return "touch";
        case "smell":
        case "sme":
        case game.i18n.localize("arm5e.config.ranges.smell"):
            return "smell";
        case "sight":
        case "sig":
        case game.i18n.localize("arm5e.config.ranges.sight"):
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
        case game.i18n.localize("arm5e.config.ranges.moment"):
            return "moment";
        case "diameter":
        case "dia":
        case "diam":
            return "diam";
        case "concentration":
        case game.i18n.localize("arm5e.config.ranges.conc"):
            return "conc";
        case "sun":
        case game.i18n.localize("arm5e.config.ranges.sun"):
            return "sun"
        case "ring":
        case game.i18n.localize("arm5e.config.ranges.ring"):
            return "ring";
        case "moon":
        case game.i18n.localize("arm5e.config.ranges.moon"):
            return "moon";
        case "fire":
        case game.i18n.localize("arm5e.config.ranges.fire"):
            return "fire";
        case "bargain":
        case "barg":
        case game.i18n.localize("arm5e.config.ranges.barg"):
            return "bargain";
        case "year":
        case game.i18n.localize("arm5e.config.ranges.year"):
            return "year";
        case "condition":
        case game.i18n.localize("arm5e.config.ranges.condition"):
            return "condition";
        case "year+1":
        case game.i18n.localize("arm5e.config.ranges.year+1"):
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