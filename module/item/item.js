import {
    getLabUpkeepCost,
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
        if (this._needLevelComputation()) {

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
                if (data.complexity) {
                    newBaseLevel = this._addSpellMagnitude(newBaseLevel, -data.complexity);
                }
                if (data.enhancingRequisite) {
                    newBaseLevel = this._addSpellMagnitude(newBaseLevel, -data.enhancingRequisite);
                }
                if (data.targetSize) {
                    newBaseLevel = this._addSpellMagnitude(newBaseLevel, -data.targetSize);
                }
                if (newBaseLevel < 1) {
                    // ui.notifications.warn(`Spell named \"${this.name}\" is not strictly following magic theory, its level will be recomputed using a base effect of level 1`, {
                    //     permanent: true
                    // });
                    this.data.data.baseLevel = 1
                } else {
                    this.data.data.baseLevel = newBaseLevel;
                    if (this.data._id != undefined) {
                        this.update({
                            "data.baseLevel": newBaseLevel
                        });
                    }
                    recomputeSpellLevel = false;
                }
            }
            if (recomputeSpellLevel) {
                let effectLevel = this.data.data.baseLevel;

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

                if (this.type == "enchantment" || (this.type == "laboratoryText" && this.data.data.type == "enchantment")) {
                    effectLevel += parseInt(data.effectfrequency);
                    if (data.penetration % 2 == 1) {
                        this.data.data.penetration += 1;
                    }
                    effectLevel += this.data.data.penetration / 2;

                    if (data.maintainConc) {
                        effectLevel += 5;
                    }

                    if (data.environmentalTrigger) {
                        effectLevel += 3;
                    }

                    if (data.restrictedUse) {
                        effectLevel += 3;
                    }

                    if (data.linkedTrigger) {
                        effectLevel += 3;
                    }

                } else {
                    let shouldBeRitual = data.ritual;
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
                }
                this.data.data.level = effectLevel;
            }




            // compute casting total
            if (actorData && this.actor != null) {
                itemData.data.castingTotal = this._computeCastingTotal(actorData, itemData);
            } else {
                itemData.data.castingTotal = 0;
            }
        } else if (this.type == "labCovenant") {
            let pts = getLabUpkeepCost(data.upkeep);
            this.data.data.points = pts * CONFIG.ARM5E.lab.usage[data.usage].coeff;
        }
        // log(false,"prepare-item");
        // log(false,itemData);
    }

    _needLevelComputation() {

        let enforceSpellLevel = (this.type == "spell") && (game.settings.get("arm5e", "magicRulesEnforcement"));
        let enforceEnchantmentLevel = (this.type == "laboratoryText" && (this.data.data.type == "spell" || this.data.data.type == "enchantment"))
        return (this.type == "magicalEffect" || this.type == "enchantment" || enforceSpellLevel || enforceEnchantmentLevel)
    }

    _isMagicalEffect() {
        return (this.type == "magicalEffect" || this.type == "enchantment" || this.type == "spell");
    }


    _getTechniqueData(actorData) {

        if (!this._isMagicalEffect()) return ["", 0];

        let label = CONFIG.ARM5E.magic.techniques[this.data.data.technique.value].label;
        let tech = 1000;
        let techReq = Object.entries(this.data.data["technique-req"]).filter(r => r[1] === true);
        if (techReq.length > 0) {
            label += " ("
            techReq.forEach((key) => {
                tech = Math.min(tech, actorData.data.arts.techniques[key[0]].score)
                label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
            });
            // remove last comma
            label = label.substring(0, label.length - 1);
            label += ")"
            tech = Math.min(actorData.data.arts.techniques[this.data.data.technique.value].score,
                tech);
        } else {
            tech = actorData.data.arts.techniques[this.data.data.technique.value].score;
        }

        return [label, tech];
    }
    _getFormData(actorData) {

        if (!this._isMagicalEffect()) return ["", 0];

        let label = CONFIG.ARM5E.magic.forms[this.data.data.form.value].label;
        let form = 1000;
        let formReq = Object.entries(this.data.data["form-req"]).filter(r => r[1] === true);
        if (formReq.length > 0) {
            label += " ("
            formReq.forEach((key) => {
                form = Math.min(form, actorData.data.arts.forms[key[0]].score)
                label += CONFIG.ARM5E.magic.arts[key[0]].short + " ";
            });
            // remove last comma
            label = label.substring(0, label.length - 1);
            label += ")"
            form = Math.min(actorData.data.arts.forms[this.data.data.form.value].score,
                form);
        } else {
            form = actorData.data.arts.forms[this.data.data.form.value].score;
        }

        return [label, form];
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
        let tech = 1000;
        let form = 1000;
        let focusBonus = 0;

        let techReq = Object.entries(itemData.data["technique-req"]).filter(r => r[1] === true);
        let formReq = Object.entries(itemData.data["form-req"]).filter(r => r[1] === true);

        if (techReq.length > 0) {
            techReq.forEach((key) => {
                tech = Math.min(tech, actorData.data.arts.techniques[key[0]].score)
            });

            tech = Math.min(actorData.data.arts.techniques[itemData.data.technique.value].score,
                tech);
        } else {
            tech = actorData.data.arts.techniques[itemData.data.technique.value].score;
        }
        if (formReq.length > 0) {
            formReq.forEach((key) => {
                form = Math.min(tech, actorData.data.arts.forms[key[0]].score)
            });
            form = Math.min(actorData.data.arts.forms[itemData.data.form.value].score,
                form);
        } else {
            form = actorData.data.arts.forms[itemData.data.form.value].score;
        }
        if (itemData.data.applyFocus) {
            res += tech + form + Math.min(tech, form);
        } else {
            res += tech + form;
        }
        // log(false, `Casting total: ${res}`)
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