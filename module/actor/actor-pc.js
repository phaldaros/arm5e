import {
    ARM5E,
    ARM5E_DEFAULT_ICONS
} from "../metadata.js";
import {
    log
} from "../tools.js"

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5ePCActor extends Actor {

    /**
     * Augment the basic actor data with additional dynamic data.
     **/

    prepareData() {
        super.prepareData();

    }

    /** @override */
    prepareBaseData() {
        if (this.data.type == "magicCodex") {
            return this._prepareMagicCodexData(this.data);
        } else {
            return this._prepareCharacterData(this.data);
        }
    }

    /**
     * Prepare Character type specific data
     */
    _prepareCharacterData(actorData) {

        let overload = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 9999];
        // Initialize containers.
        let weapons = [];
        let armor = [];
        let spells = [];
        let magicalEffects = [];
        let vis = [];
        let items = [];
        let books = [];
        let virtues = [];
        let flaws = [];
        let abilities = [];
        let abilitiesSelect = {};
        let diaryEntries = [];
        let abilitiesFamiliar = [];
        let powersFamiliar = [];

        let powers = [];

        let specialities = [];
        let distinctive = [];
        let rooms = [];
        let magicItems = [];
        let personalities = [];

        let reputations = [];
        let magi = [];
        let companion = [];
        let specialists = [];
        let habitants = [];
        let horses = [];
        let livestock = [];
        let possessions = [];
        let visSources = [];
        let visStock = [];
        let calendar = [];
        let incomingSources = [];
        let laboratoryTexts = [];
        let mundaneBooks = [];

        let totalXPAbilities = 0;
        let totalXPArts = 0;
        let totalVirtues = 0;
        let totalFlaws = 0;
        let totalXPSpells = 0;

        let combat = {
            weight: 0,
            overload: -1,
            init: 0,
            atk: 0,
            dfn: 0,
            dam: 0,
            prot: 0,
            ability: 0,
        };

        const data = actorData.data;

        if (data.fatigue) {
            data.fatigueTotal = 0;
            for (let [key, item] of Object.entries(data.fatigue)) {
                if (item.level.value == true) {
                    data.fatigueTotal = item.number;
                }
            }
        }

        if (data.wounds) {
            data.woundsTotal = 0;
            for (let [key, item] of Object.entries(data.wounds)) {
                data.woundsTotal = data.woundsTotal + (item.number.value * item.penalty.value);
            }
        }

        //abilities
        const temp = {
            _id: "",
            name: "N/A",
            value: 0
        };
        abilitiesSelect['a0'] = temp;
        for (const [key, item] of actorData.items.entries()) {
            // Since 0.8, Item#data is now a class named ItemData
            // ItemData#data now contains the data
            let i = item.data;
            if (i.type === 'ability') {
                // score is null in some compendiums
                if (!i.data.score) {
                    i.data.score = 0;
                }
                i.data.experienceNextLevel = (i.data.score + 1) * 5;
                abilities.push(i);

                const temp = {
                    id: i._id,
                    name: i.name,
                    value: i.data.score
                };
                //abilitiesSelect.push(temp);
                abilitiesSelect['a' + key] = temp;

                totalXPAbilities = parseInt(totalXPAbilities) + this._getAbilityXp(i.data.score);

                if (((actorData.type == "player") || this._isNPCMagus()) &&
                    (actorData.data.laboratory) && (actorData.data.laboratory.abilitiesSelected)) {
                    if (i._id == actorData.data.laboratory.abilitiesSelected.finesse.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.finesse.value = i.data.score;
                    }
                    if (i._id == actorData.data.laboratory.abilitiesSelected.awareness.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.awareness.value = i.data.score;
                    }
                    if (i._id == actorData.data.laboratory.abilitiesSelected.concentration.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.concentration.value = i.data.score;
                    }
                    if (i._id == actorData.data.laboratory.abilitiesSelected.artesLib.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.artesLib.value = i.data.score;
                    }
                    if (i._id == actorData.data.laboratory.abilitiesSelected.philosophy.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.philosophy.value = i.data.score;
                    }
                    if (i._id == actorData.data.laboratory.abilitiesSelected.parma.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.parma.value = i.data.score;
                    }
                    if (i._id == actorData.data.laboratory.abilitiesSelected.magicTheory.abilityID) {
                        actorData.data.laboratory.abilitiesSelected.magicTheory.value = i.data.score;
                    }
                }
            }
        }

        for (let [key, item] of actorData.items.entries()) {
            const i = item.data
            i.img = i.img || DEFAULT_TOKEN;
            i._index = key;

            if (i.type === 'weapon') {
                if (i.data.equiped == true) {
                    combat.weight = parseInt(combat.weight) + parseInt(i.data.weight);
                    combat.init = parseInt(combat.init) + parseInt(i.data.init);
                    combat.atk = parseInt(combat.atk) + parseInt(i.data.atk);
                    combat.dfn = parseInt(combat.dfn) + parseInt(i.data.dfn);
                    combat.dam = parseInt(combat.dam) + parseInt(i.data.dam);

                    if (i.data.ability == "") {
                        if (i.data.weaponExpert) {
                            combat.ability = parseInt(combat.ability) + 1;
                        }
                    } else {
                        for (var a = 0; a < abilities.length; a++) {
                            if (abilities[a]._id == i.data.ability) {
                                let hab = abilities[a].data.score;
                                if (i.data.weaponExpert) {
                                    hab = parseInt(hab) + 1;
                                }
                                if (i.data.horse) {
                                    if (hab > 3) {
                                        hab = 3;
                                    }
                                }
                                combat.ability = parseInt(combat.ability) + parseInt(hab);
                            }
                        }
                    }
                }

                i.data.abilities = abilitiesSelect;
                weapons.push(i);
            } else if (i.type === 'armor') {
                if (i.data.equiped == true) {
                    combat.weight = parseInt(combat.weight) + parseInt(i.data.weight);
                    combat.prot = parseInt(combat.prot) + parseInt(i.data.prot);
                }
                armor.push(i);
            } else if (i.type === 'spell') {
                spells.push(i);
                totalXPSpells = parseInt(totalXPSpells) + parseInt(i.data.level);
            } else if (i.type === 'magicalEffect') {
                magicalEffects.push(i);
            } else if (i.type === 'vis') {
                vis.push(i);
            } else if (i.type === 'item') {
                items.push(i);
            } else if (i.type === 'book') {
                books.push(i);
            } else if (i.type === 'virtue') {
                virtues.push(i);
                if (ARM5E.impacts[i.data.impact.value]) {
                    totalVirtues = parseInt(totalVirtues) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
                }

            } else if (i.type === 'flaw') {
                flaws.push(i);
                if (ARM5E.impacts[i.data.impact.value]) {
                    totalFlaws = parseInt(totalFlaws) + parseInt(ARM5E.impacts[i.data.impact.value].cost);
                }
            }
            //else if (i.type === 'ability') {
            //  i.data.experienceNextLevel = (i.data.score + 1) * 5;
            //  abilities.push(i);
            //
            //  totalXPAbilities = parseInt(totalXPAbilities) + parseInt(CreationPx[i.data.score].abi);
            //
            //  if((actorData.type == "player") && (actorData.data.laboratory) && (actorData.data.laboratory.abilitiesSelected)){
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.finesse.abilityID){       actorData.data.laboratory.abilitiesSelected.finesse.value = i.data.score; }
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.awareness.abilityID){     actorData.data.laboratory.abilitiesSelected.awareness.value = i.data.score; }
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.concentration.abilityID){ actorData.data.laboratory.abilitiesSelected.concentration.value = i.data.score; }
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.artesLib.abilityID){      actorData.data.laboratory.abilitiesSelected.artesLib.value = i.data.score; }
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.philosophy.abilityID){    actorData.data.laboratory.abilitiesSelected.philosophy.value = i.data.score; }
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.parma.abilityID){         actorData.data.laboratory.abilitiesSelected.parma.value = i.data.score; }
            //    if(i._id == actorData.data.laboratory.abilitiesSelected.magicTheory.abilityID){   actorData.data.laboratory.abilitiesSelected.magicTheory.value = i.data.score; }
            //  }
            //}


            // ugly fix, but I don't know how to do better since prepare data is called before migration
            // to be removed when we break backward compatibility with 0.7
            else if (i.type === 'diaryEntry' || i.type === 'dairyEntry') {
                diaryEntries.push(i);
            } else if (i.type === 'abilityFamiliar') {
                abilitiesFamiliar.push(i);
            } else if (i.type === 'mightFamiliar' || i.type === 'powerFamiliar') {
                powersFamiliar.push(i);
            } else if (i.type === 'might' || i.type === 'power') {
                powers.push(i);
            } else if (i.type === 'speciality') {
                specialities.push(i);
            } else if (i.type === 'distinctive') {
                distinctive.push(i);
            } else if (i.type === 'sanctumRoom') {
                rooms.push(i);
            } else if (i.type === 'magicItem') {
                magicItems.push(i);
            } else if (i.type === 'personality') {
                personalities.push(i);
            } else if (i.type === 'reputation') {
                reputations.push(i);
            } else if (i.type === 'habitantMagi') {
                magi.push(i);
            } else if (i.type === 'habitantCompanion') {
                companion.push(i);
            } else if (i.type === 'habitantSpecialists') {
                specialists.push(i);
            } else if (i.type === 'habitantHabitants') {
                habitants.push(i);
            } else if (i.type === 'habitantHorses') {
                horses.push(i);
            } else if (i.type === 'habitantLivestock') {
                livestock.push(i);
            } else if (i.type === 'possessionsCovenant') {
                possessions.push(i);
            } else if (i.type === 'visSourcesCovenant') {
                visSources.push(i);
            } else if (i.type === 'visStockCovenant') {
                visStock.push(i);
            } else if (i.type === 'calendarCovenant') {
                calendar.push(i);
            } else if (i.type === 'incomingSource') {
                incomingSources.push(i);
            } else if (i.type === 'laboratoryText') {
                laboratoryTexts.push(i);
            } else if (i.type === 'mundaneBook') {
                mundaneBooks.push(i);
            }
        }

        // combat
        for (var a = 0; a < overload.length; a++) {
            if (combat.overload == -1) {
                if (overload[a] > combat.weight) {
                    combat.overload = parseInt(a) - 1;
                }
            }
        }
        if (combat.overload < 0) {
            combat.overload = 0;
        }
        if (actorData.data.characteristics) {
            if (actorData.data.characteristics.str.value > 0) {
                combat.overload = parseInt(combat.overload) - parseInt(actorData.data.characteristics.str.value);
            }
            if (combat.overload < 0) {
                combat.overload = 0;
            }
        }
        combat.overload = parseInt(combat.overload) * -1;

        if (actorData.type == "player" || this._isNPCMagus()) {
            /*
            "fastCastingSpeed":{"value": 0, "calc": "Qik + Finesse + stress die" },
            "determiningEffect":{"value": 0, "calc": "Per + Awareness + die VS 15-magnitude" },
            "targeting":{"value": 0, "calc": "Per + Finesse + die" },
            "concentration":{"value": 0, "calc": "Sta + Concentration + die" },
            "magicResistance":{"value": 0, "calc": "Parma * 5 + Form" },
            "multipleCasting":{"value": 0, "calc": "Int + Finesse + stress die - no of spells VS 9" },
            "basicLabTotal":{"value": 0, "calc": "Int + Magic theory + Aura (+ Technique + Form)" },
            "visLimit":{"value": 0, "calc": "Magic theory * 2" }
            */

            // calculate laboratori totals
            actorData.data.laboratory.fastCastingSpeed.value = actorData.data.characteristics.qik.value + actorData.data.laboratory.abilitiesSelected.finesse.value;
            actorData.data.laboratory.determiningEffect.value = actorData.data.characteristics.per.value + actorData.data.laboratory.abilitiesSelected.awareness.value;
            actorData.data.laboratory.targeting.value = actorData.data.characteristics.per.value + actorData.data.laboratory.abilitiesSelected.finesse.value;
            actorData.data.laboratory.concentration.value = actorData.data.characteristics.sta.value + actorData.data.laboratory.abilitiesSelected.concentration.value;
            actorData.data.laboratory.magicResistance.value = actorData.data.laboratory.abilitiesSelected.parma.value * 5;
            actorData.data.laboratory.multipleCasting.value = actorData.data.characteristics.int.value + actorData.data.laboratory.abilitiesSelected.finesse.value;
            actorData.data.laboratory.basicLabTotal.value = actorData.data.characteristics.int.value + actorData.data.laboratory.abilitiesSelected.magicTheory.value; // aura pending
            actorData.data.laboratory.visLimit.value = actorData.data.laboratory.abilitiesSelected.magicTheory.value * 2;

            //warping & decrepitude
            actorData.data.warping.experienceNextLevel = (parseInt(actorData.data.warping.score) + 1) * 5;
            if (!this._isNPCMagus()) {
                actorData.data.decrepitude.experienceNextLevel = (parseInt(actorData.data.decrepitude.score) + 1) * 5;
            }
        }

        if (data.arts) {
            for (let [key, technique] of Object.entries(data.arts.techniques)) {
                // Calculate the next level experience needed
                technique.experienceNextLevel = (technique.score + 1);
                totalXPArts = parseInt(totalXPArts) + this._getArtXp(technique.score);
            }

            for (let [key, form] of Object.entries(data.arts.forms)) {
                // Calculate the next level experience needed
                form.experienceNextLevel = (form.score + 1);
                if ((actorData.type == "player") && (actorData.data.laboratory) && (actorData.data.laboratory.abilitiesSelected)) {
                    form.magicResistance = (actorData.data.laboratory.abilitiesSelected.parma.value * 5) + form.score;
                }
                totalXPArts = parseInt(totalXPArts) + this._getArtXp(form.score);
            }
        }

        // Assign and return
        actorData.data.totalXPAbilities = totalXPAbilities;
        actorData.data.totalXPArts = totalXPArts;
        actorData.data.totalVirtues = totalVirtues;
        actorData.data.totalFlaws = totalFlaws;
        actorData.data.totalXPSpells = totalXPSpells;

        if (actorData.data.weapons) {
            actorData.data.weapons = weapons;
            actorData.data.combat = combat;
        }
        if (actorData.data.armor) {
            actorData.data.armor = armor;
        }
        if (actorData.data.spells) {
            actorData.data.spells = spells;
        }
        if (actorData.data.magicalEffects) {
            actorData.data.magicalEffects = magicalEffects;
        }
        if (actorData.data.vis) {
            actorData.data.vis = vis;
        }
        if (actorData.data.items) {
            actorData.data.items = items;
        }
        if (actorData.data.books) {
            actorData.data.books = books;
        }
        if (actorData.data.virtues) {
            actorData.data.virtues = virtues;
        }
        if (actorData.data.flaws) {
            actorData.data.flaws = flaws;
        }
        if (actorData.data.abilities) {
            actorData.data.abilities = abilities;
        }
        if (actorData.data.diaryEntries) {
            actorData.data.diaryEntries = diaryEntries;
        }
        if (actorData.data.familiar) {
            actorData.data.familiar.abilitiesFam = abilitiesFamiliar;
            actorData.data.familiar.powersFam = powersFamiliar;
        }

        if (actorData.data.powers) {
            actorData.data.powers = powers;
        }

        if (actorData.data.specialities) {
            actorData.data.specialities = specialities;
        }
        if (actorData.data.distinctive) {
            actorData.data.distinctive = distinctive;
        }
        if (actorData.data.rooms) {
            actorData.data.rooms = rooms;
        }
        if (actorData.data.magicItems) {
            actorData.data.magicItems = magicItems;
        }
        if (actorData.data.personalities) {
            actorData.data.personalities = personalities;
        }
        if (actorData.data.rawVis) {
            actorData.data.rawVis = vis;
        }

        if (actorData.data.reputations) {
            actorData.data.reputations = reputations;
        }
        if (actorData.data.habitants) {
            actorData.data.habitants.magi = magi;
            actorData.data.habitants.companion = companion;
            actorData.data.habitants.specialists = specialists;
            actorData.data.habitants.habitants = habitants;
            actorData.data.habitants.horses = horses;
            actorData.data.habitants.livestock = livestock;
        }
        if (actorData.data.possessions) {
            actorData.data.possessions = possessions;
        }
        if (actorData.data.visSources) {
            actorData.data.visSources = visSources;
        }
        if (actorData.data.visStock) {
            actorData.data.visStock = visStock;
        }
        if (actorData.data.calendar) {
            actorData.data.calendar = calendar;
        }
        if (actorData.data.incomingSources) {
            actorData.data.incomingSources = incomingSources;
        }
        if (actorData.data.magicBooks) {
            actorData.data.magicBooks = books;
        }
        if (actorData.data.laboratoryTexts) {
            actorData.data.laboratoryTexts = laboratoryTexts;
        }
        if (actorData.data.mundaneBooks) {
            actorData.data.mundaneBooks = mundaneBooks;
        }

        log(false, "pc end of prepare actorData");
        log(false, actorData);
    }

    _prepareMagicCodexData(codexData) {
        log(false, "_prepareMagicCodexData");
        codexData.img = CONFIG.ARM5E_DEFAULT_ICONS['magicCodex'];
        const data = codexData.data;
        let baseEffects = [];
        let magicEffects = [];
        let spells = [];
        for (let [key, item] of codexData.items.entries()) {
            if (item.data.type == "baseEffect") {
                baseEffects.push(item);
            }
            if (item.data.type == "magicalEffect") {
                magicEffects.push(item);
            }
            if (item.data.type == "spell") {
                spells.push(item);
            }
        }
        if (data.formFilter != "") {
            baseEffects = baseEffects.filter(e => e.data.data.form.value === data.formFilter);
            magicEffects = magicEffects.filter(e => e.data.data.form.value === data.formFilter);
            spells = spells.filter(e => e.data.data.form.value === data.formFilter);
        }
        if (data.techniqueFilter != "") {
            baseEffects = baseEffects.filter(e => e.data.data.technique.value === data.techniqueFilter);
            magicEffects = magicEffects.filter(e => e.data.data.technique.value === data.techniqueFilter);
            spells = spells.filter(e => e.data.data.technique.value === data.techniqueFilter);
        }
        if (data.levelFilter != 0) {
            magicEffects = magicEffects.filter(e => e.data.data.level === data.levelFilter);
            spells = spells.filter(e => e.data.data.level === data.levelFilter);
        }
        data.baseEffects = baseEffects.sort(function(e1, e2) {
            if (e1.data.data.form.value < e2.data.data.form.value) {
                return -1;
            } else if (e1.data.data.form.value > e2.data.data.form.value) {
                return 1;
            } else {
                if (e1.data.data.technique.value < e2.data.data.technique.value) {
                    return -1;
                } else if (e1.data.data.technique.value > e2.data.data.technique.value) {
                    return 1;
                } else {
                    if (e1.data.data.baseLevel < e2.data.data.baseLevel) {
                        return -1;
                    } else if (e1.data.data.baseLevel > e2.data.data.baseLevel) {
                        return 1;
                    } else {
                        return e1.data.name.localeCompare(e2.data.name);
                    }
                }
            }
        });
        log(false, data.baseEffects);
        data.magicEffects = magicEffects.sort(function(e1, e2) {
            if (e1.data.data.form.value < e2.data.data.form.value) {
                return -1;
            } else if (e1.data.data.form.value > e2.data.data.form.value) {
                return 1;
            } else {
                if (e1.data.data.technique.value < e2.data.data.technique.value) {
                    return -1;
                } else if (e1.data.data.technique.value > e2.data.data.technique.value) {
                    return 1;
                } else {
                    if (e1.data.data.level < e2.data.data.level) {
                        return -1;
                    } else if (e1.data.data.level > e2.data.data.level) {
                        return 1;
                    } else {
                        return e1.data.name.localeCompare(e2.data.name);
                    }
                }
            }
        });
        log(false, data.magicEffects);
        data.spells = spells.sort(function(e1, e2) {
            if (e1.data.data.form.value < e2.data.data.form.value) {
                return -1;
            } else if (e1.data.data.form.value > e2.data.data.form.value) {
                return 1;
            } else {
                if (e1.data.data.technique.value < e2.data.data.technique.value) {
                    return -1;
                } else if (e1.data.data.technique.value > e2.data.data.technique.value) {
                    return 1;
                } else {
                    if (e1.data.data.level < e2.data.data.level) {
                        return -1;
                    } else if (e1.data.data.level > e2.data.data.level) {
                        return 1;
                    } else {
                        return e1.data.name.localeCompare(e2.data.name);
                    }
                }
            }
        });
        log(false, data.spells);


    }

    _prepareLabData(labData) {
        log(false, "_prepareLabData");
    }

    _prepareCovenantData(covenantData) {
        log(false, "_prepareCovenantData");

    }

    _getAbilityXp(score) {
        return this._getArtXp(score) * 5;
    }
    _getArtXp(score) {
        return score * (score + 1) / 2;
    }

    _isNPCMagus() {
        return (this.data.type == "npc" && this.data.data.charType.value == "magusNPC")
    }

    loseFatigueLevel() {
        if ((this.data.type != 'player') && (this.data.type != 'npc')) {
            return;
        }
        if (this.data.data.fatigue.winded.level.value == false) {
            this.data.data.fatigue.winded.level.value = true;
            return;
        } else if (this.data.data.fatigue.weary.level.value == false) {
            this.data.data.fatigue.weary.level.value = true;
            return;
        } else if (this.data.data.fatigue.tired.level.value == false) {
            this.data.data.fatigue.tired.level.value = true;
            return;
        } else if (this.data.data.fatigue.dazed.level.value == false) {
            this.data.data.fatigue.dazed.level.value = true;
            return;
        } else if (this.data.data.fatigue.unconscious.level.value == false) {
            this.data.data.fatigue.unconscious.level.value = true;
            return;
        } else {
            this.data.data.wounds.light.number++;
        }
    }


    async _preCreate(data, options, userId) {
        await super._preCreate(data, options, userId);
        if (data.img === undefined) {
            if (data.type in CONFIG.ARM5E_DEFAULT_ICONS) {
                const img = CONFIG.ARM5E_DEFAULT_ICONS[data.type];
                if (img) await this.data.update({
                    img
                });
            }
        }
    }
}