import {
    log
} from "../tools.js"
/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ArM5eItem extends Item {


    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        let itemData = this.data;
        let actorData = this.actor ? this.actor.data : {};
        let data = itemData.data;
        if (actorData) {
            if (this.data.type == "weapon" && this.actor != null) {
                let abilitiesSelect = {};

                const temp = {
                    id: "",
                    name: "N/A"
                };
                abilitiesSelect['a0'] = temp;

                // find the actor abilities and create the select
                for (let [key, i] of Object.entries(this.actor.data.items)) {
                    if (i.type === 'ability') {
                        const temp = {
                            id: i.id,
                            name: i.name
                        };
                        //abilitiesSelect.push(temp);
                        abilitiesSelect['a' + key] = temp;
                    }
                }

                itemData.data.abilities = abilitiesSelect;

            }
        }
        let enforceSpellLevel = (this.type == "spell") && (game.settings.get("arm5e", "magicRulesEnforcement"));
        if (this.type == "magicalEffect" || enforceSpellLevel) {

            // if base level is 0, the "magicRulesEnforcement" has just been enabled, try to compute the base level
            let recomputeSpellLevel = true;
            if (data.baseLevel == 0) {
                let newBaseLevel = this.data.data.level;
                let shouldBeRitual = false;
                if (data.range.value) {
                    newBaseLevel = this._addSpellMagnitude(newBaseLevel, -CONFIG.ARM5E.magic.ranges[data.range.value].impact);
                }
                if (data.duration.value) {
                    newBaseLevel = this._addSpellMagnitude(newBaseLevel, -CONFIG.ARM5E.magic.durations[data.duration.value].impact);
                }
                if (data.target.value) {
                    newBaseLevel = this._addSpellMagnitude(newBaseLevel, -CONFIG.ARM5E.magic.targets[data.target.value].impact);
                }
                if (newBaseLevel < 1) {
                    // ui.notifications.warn(`Spell named \"${this.name}\" is not strictly following magic theory, its level will be recomputed using a base effect of level 1`, {
                    //     permanent: true
                    // });
                    this.data.data.baseLevel = 1
                } else {
                    this.data.data.baseLevel = newBaseLevel;
                    recomputeSpellLevel = false;
                }
            }
            if (recomputeSpellLevel) {
                let effectLevel = this.data.data.baseLevel;
                let shouldBeRitual = data.ritual;
                if (data.range.value) {
                    effectLevel = this._addSpellMagnitude(effectLevel, CONFIG.ARM5E.magic.ranges[data.range.value].impact);
                }
                if (data.duration.value) {
                    effectLevel = this._addSpellMagnitude(effectLevel, CONFIG.ARM5E.magic.durations[data.duration.value].impact);
                }
                if (data.target.value) {
                    effectLevel = this._addSpellMagnitude(effectLevel, CONFIG.ARM5E.magic.targets[data.target.value].impact);
                }
                if (data.complexity) {
                    effectLevel = this._addSpellMagnitude(effectLevel, data.complexity);
                }
                if (data.targetSize) {
                    effectLevel = this._addSpellMagnitude(effectLevel, data.targetSize);
                }
                if (data.enhancingRequisite) {
                    effectLevel = this._addSpellMagnitude(effectLevel, data.enhancingRequisite);
                }

                // Duration above moon are rituals and rituals are minimum level 20
                if (CONFIG.ARM5E.magic.durations[data.duration.value].impact > 3 ||
                    data.target.value == "bound" ||
                    effectLevel >= 50) {
                    shouldBeRitual = true;
                }

                if (shouldBeRitual && effectLevel < 20) {
                    effectLevel = 20;
                }

                this.data.data.ritual = shouldBeRitual;
                this.data.data.level = effectLevel;
            }
            // compute casting total
            if (actorData && this.actor != null) {
                itemData.data.castingTotal = this._computeCastingTotal(actorData, itemData);
            }
        }
        // log(false,"prepare-item");
        // log(false,itemData);
    }

    _addSpellMagnitude(base, num) {

        if (num == 0) {
            return base;
        }
        if (num > 0) {
            // log(false, `Adding ${num} magnitudes from ${base}`);
            if (base + num <= 5) {
                return base + num;
            }
            let loop = num;
            let res = base;
            while (loop > 0) {
                if (res < 5) {
                    res++;
                } else {
                    res = res + 5;
                }
                loop--;
            }
            return res;
        } else {
            log(false, `Adding ${num} magnitudes from ${base}`);
            if (base + num <= 1) {
                return base + num;
            }
            let loop = num;
            let res = base;
            while (loop < 0) {
                if (res <= 5) {
                    res--;
                } else {
                    res = res - 5;
                }
                loop++;
            }
            log(false, `returns ${res}`);
            return res;
        }

    }

    _computeCastingTotal(actorData, itemData) {
        if (actorData.type != "player" && actorData.type != "npc") {
            return 0;
        }
        let res = actorData.data.sta;
        let tech = 0;
        let form = 0;
        let focusBonus = 0;
        if (itemData.data["technique-requisite"].value != "") {
            tech = Math.min(actorData.data.arts.techniques[itemData.data.technique.value].score,
                actorData.data.arts.techniques[itemData.data["technique-requisite"].value].score);
        } else {
            tech = actorData.data.arts.techniques[itemData.data.technique.value].score;
        }

        if (itemData.data["form-requisite"].value != "") {
            form = Math.min(actorData.data.arts.forms[itemData.data.form.value].score,
                actorData.data.arts.forms[itemData.data["form-requisite"].value].score);
        } else {
            form = actorData.data.arts.forms[itemData.data.form.value].score;
        }
        if (itemData.data.applyFocus) {
            res += tech + form + Math.min(tech, form);
        } else {
            res += tech + form;
        }

        return res;

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

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    async roll() {
        // Basic template rendering data
        const token = this.actor.token;
        const item = this.data;
        const actorData = this.actor ? this.actor.data.data : {};
        const itemData = item.data;

        let roll = new Roll('d20+@abilities.str.mod', actorData);
        let label = `Rolling ${item.name}`;
        roll.roll().toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: this.actor
            }),
            flavor: label
        });
    }
}