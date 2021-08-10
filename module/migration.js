
async function migration() {

    // Migrate World Actors
    for ( let a of game.actors.entities ) {
        try {
            if(a.data.type == "magus"){	a.data.type = "player"; }

            const updateData = migrateActorData(a.data);
            if ( !isObjectEmpty(updateData) ) {
                console.log(`Migrating Actor entity ${a.name}`);
                await a.update(updateData, {enforceTypes: false});
            }
        } catch(err) {
            err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
            console.error(err);
        }
    }
}

function migrateActorData(actorData){
    const updateData = {};

    if(actorData.data.version){
        if(actorData.data.version == "0.1"){
            return updateData;
        }
    }

    if((actorData.type == 'npc') || (actorData.type == 'laboratory') || (actorData.type == 'covenant')){
        return updateData;
    }

	updateData["type"] = "player";
    updateData["data.version"] = "0.1";
    if(actorData.data.diaryEntries === undefined){ updateData["data.diaryEntries"] = []; }

    if(actorData.data.characteristics.int.short === undefined){ updateData["data.characteristics.int.short"] = "arm5e.sheet.int"; }
    if(actorData.data.characteristics.per.short === undefined){ updateData["data.characteristics.per.short"] = "arm5e.sheet.per"; }
    if(actorData.data.characteristics.str.short === undefined){ updateData["data.characteristics.str.short"] = "arm5e.sheet.str"; }
    if(actorData.data.characteristics.sta.short === undefined){ updateData["data.characteristics.sta.short"] = "arm5e.sheet.sta"; }
    if(actorData.data.characteristics.pre.short === undefined){ updateData["data.characteristics.pre.short"] = "arm5e.sheet.pre"; }
    if(actorData.data.characteristics.com.short === undefined){ updateData["data.characteristics.com.short"] = "arm5e.sheet.com"; }
    if(actorData.data.characteristics.dex.short === undefined){ updateData["data.characteristics.dex.short"] = "arm5e.sheet.dex"; }
    if(actorData.data.characteristics.qik.short === undefined){ updateData["data.characteristics.qik.short"] = "arm5e.sheet.qik"; }

    if(actorData.data.weapons === undefined){ updateData["data.weapons"] = []; }
    if(actorData.data.armor === undefined){ updateData["data.armor"] = []; }
    if(actorData.data.vis === undefined){ updateData["data.vis"] = []; }
    if(actorData.data.items === undefined){ updateData["data.items"] = []; }
    if(actorData.data.books === undefined){ updateData["data.books"] = []; }
    if(actorData.data.spells === undefined){ updateData["data.spells"] = []; }

    updateData["data.seasons.spring.label"] = "arm5e.sheet.spring";
    updateData["data.seasons.summer.label"] = "arm5e.sheet.summer";
    updateData["data.seasons.autumn.label"] = "arm5e.sheet.autumn";
    updateData["data.seasons.winter.label"] = "arm5e.sheet.winter";

    updateData["data.description.born.label"] = "arm5e.sheet.yearBorn";
    updateData["data.description.apprentice.label"] = "arm5e.sheet.apprenticeshipYears";
    updateData["data.description.birthname.label"] = "arm5e.sheet.birthName";
    updateData["data.description.birthplace.label"] = "arm5e.sheet.birthplace";
    updateData["data.description.nationality.label"] = "arm5e.sheet.nationality";
    updateData["data.description.religion.label"] = "arm5e.sheet.religion";
    updateData["data.description.height.label"] = "arm5e.sheet.height";
    updateData["data.description.weight.label"] = "arm5e.sheet.weight";
    updateData["data.description.gender.label"] = "arm5e.sheet.gender";
    updateData["data.description.hair.label"] ="arm5e.sheet.hair";
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
    updateData["data.laboratory.abilitiesSelected.concentration.abilityID"] = "",
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

    return updateData;
}

export {migration}