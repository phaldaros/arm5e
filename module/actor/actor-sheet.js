/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import {
    simpleDie,
    stressDie
} from '../dice.js';
import {
    ARM5E
} from '../metadata.js';
import {
    log
} from "../tools.js"

export class ArM5eActorSheet extends ActorSheet {

    // /** @override */
    // static get defaultOptions() {
    //     return mergeObject(super.defaultOptions, {
    //         classes: ["arm5e", "sheet", "actor"],
    //         template: "systems/arm5e/templates/actor/actor-pc-sheet.html",
    //         width: 1100,
    //         height: 900,
    //         tabs: [{
    //             navSelector: ".sheet-tabs",
    //             contentSelector: ".sheet-body",
    //             initial: "description"
    //         }]
    //     });
    // }

    /* -------------------------------------------- */


    isDropAllowed(type) {
        return false;

        // template for future sheet:
        // switch (type) {
        //     case "weapon":
        //     case "armor":
        //     case "spell":
        //     case "vis":
        //     case "item":
        //     case "book":
        //     case "virtue":
        //     case "flaw":
        //     case "ability":
        //     case "abilityFamiliar":
        //     case "diaryEntry":
        //     case "might":
        //     case "mightFamiliar":
        //     case "speciality":
        //     case "distinctive":
        //     case "sanctumRoom":
        //     case "magicItem":
        //     case "personality":
        //     case "reputation":
        //     case "habitantMagi":
        //     case "habitantCompanion":
        //     case "habitantSpecialists":
        //     case "habitantHabitants":
        //     case "habitantHorses":
        //     case "habitantLivestock":
        //     case "possessionsCovenant":
        //     case "visSourcesCovenant":
        //     case "visStockCovenant":
        //     case "magicalEffect":
        //     case "baseEffect":
        //     case "calendarCovenant":
        //     case "incomingSource":
        //     case "laboratoryText":
        //     case "mundaneBook":
        //         return true;
        //     default:
        //         return false;
        // }
    }

    // tells whether or not a type of item needs to be converted when dropped to a specific sheet.
    needConversion(type) {
        return false;
    }

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        // Use a safe clone of the actor data for further operations.
        const actorData = context.actor.data;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData.data;
        context.flags = actorData.flags;

        context.metadata = CONFIG.ARM5E;

        context.data.dtypes = ["String", "Number", "Boolean"];

        // Xzotl : not sure what this was used for
        // for (let attr of Object.values(context.data.attributes)) {
        //   attr.isCheckbox = attr.dtype === "Boolean";
        // }

        // Arts icons style
        if (actorData.type == "player" || actorData.type == "npc") {
            if (context.data.charType.value == "magusNPC" || context.data.charType.value == "magus") {
                context.artsIcons = game.settings.get("arm5e", "artsIcons");
            }
        }

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Prepare active effects
        //context.effects = prepareActiveEffectCategories(this.actor.effects);

        this._prepareCharacterItems(context);
        // console.log("sheetData from pc sheet");
        // console.log(context);

        return context;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
        //let actorData = sheetData.actor.data;

    }


    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");

            const item = this.actor.items.get(li.data("itemId"))
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            let itemId = li.data("itemId");
            itemId = itemId instanceof Array ? itemId : [itemId];
            this.actor.deleteEmbeddedDocuments("Item", itemId, {});
            li.slideUp(200, () => this.render(false));
        });


        // Generate abiliy automatically
        html.find('.abilities-generate').click(ev => {
            let charType = this.actor.data.data.charType.value;
            if (charType === "magus" || charType === "magusNPC") {
                let abilities = this.actor.items.filter(i => i.type == "ability");
                let newAbilities = [];
                for (let [key, a] of Object.entries(CONFIG.ARM5E.character.abilities)) {
                    // if the ability doesn't exists create it
                    let abs = abilities.filter(ab => ab.data.name == game.i18n.localize(a))
                    if (abs.length == 0) {
                        log(false, `Did not find ${game.i18n.localize(a)}, creating it...`);
                        const itemData = {
                            name: game.i18n.localize(a),
                            type: "ability"
                        };
                        newAbilities.push(itemData);
                    }
                }
                this.actor.createEmbeddedDocuments("Item", newAbilities, {});
            }
        });

        html.find('.sortable').click(ev => {

            const listName = ev.currentTarget.dataset.list;
            let val = this.actor.getFlag("arm5e", "sorting", listName)
            if (val === undefined) {
                this.actor.setFlag("arm5e", "sorting", {
                    [listName]: true
                });
            } else {
                this.actor.setFlag("arm5e", "sorting", {
                    [listName]: !val[listName]
                });
            }
        });

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));

        // Drag events for macros.
        if (this.actor.isOwner) {
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = [{
            name: name,
            type: type,
            data: foundry.utils.deepClone(header.dataset)
        }];
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData[0].data["type"];

        // Finally, create the item!
        // console.log("Add item");
        // console.log(itemData);

        let newItem = await this.actor.createEmbeddedDocuments("Item", itemData, {});

        newItem[0].sheet.render(true);
        return newItem;
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            // clean roll data
            this.actor.data.data.roll.type = "";
            this.actor.data.data.roll.label = "";
            this.actor.data.data.roll.modifier = 0;
            this.actor.data.data.roll.characteristic = "";
            this.actor.data.data.roll.ability = "";
            this.actor.data.data.roll.abilitySpeciality = false;
            this.actor.data.data.roll.technique = "";
            this.actor.data.data.roll.form = "";
            this.actor.data.data.roll.total = "";
            this.actor.data.data.roll.aura = 0;
            this.actor.data.data.roll.bonus = 0;
            this.actor.data.data.roll.divide = 1;
            this.actor.data.data.roll.rollLabel = "";
            this.actor.data.data.roll.rollFormula = "";
            this.actor.data.data.roll.useFatigue = true;
            this.actor.data.data.roll.ritual = false;
            this.actor.data.data.roll.focus = false;
            this.actor.data.data.roll.spell = null;

            this.actor.data.data.roll.techniqueScore = 0;
            this.actor.data.data.roll.formScore = 0;

            this.actor.data.data.roll.option1 = 0;
            this.actor.data.data.roll.txtOption1 = "";
            this.actor.data.data.roll.option2 = 0;
            this.actor.data.data.roll.txtOption2 = "";
            this.actor.data.data.roll.option3 = 0;
            this.actor.data.data.roll.txtOption3 = "";
            this.actor.data.data.roll.option4 = 0;
            this.actor.data.data.roll.txtOption4 = "";
            this.actor.data.data.roll.option5 = 0;
            this.actor.data.data.roll.txtOption5 = "";

            // set data to roll
            if (dataset.roll) {
                this.actor.data.data.roll.type = dataset.roll;
            }
            if (dataset.name) {
                this.actor.data.data.roll.label = dataset.name;
            }

            if (dataset.characteristic) {
                this.actor.data.data.roll.characteristic = dataset.characteristic;
            }
            if (dataset.ability) {
                this.actor.data.data.roll.ability = dataset.ability;
            }

            if (dataset.roll == "spell" || dataset.roll == "magic" || dataset.roll == "spont") {

                if (dataset.id) {
                    this.actor.data.data.roll.effectId = dataset.id;

                    this.actor.data.data.roll.spell = this.actor.data.items.get(dataset.id);
                    let techData = this.actor.data.data.roll.spell._getTechniqueData(this.actor.data);
                    this.actor.data.data.roll.techniqueText = techData[0];
                    this.actor.data.data.roll.techniqueScore = techData[1];

                    let formData = this.actor.data.data.roll.spell._getFormData(this.actor.data);
                    this.actor.data.data.roll.formText = formData[0];
                    this.actor.data.data.roll.formScore = formData[1];

                    this.actor.data.data.roll.focus = this.actor.data.data.roll.spell.data.data.focus;
                    this.actor.data.data.roll.ritual = this.actor.data.data.roll.spell.data.data.ritual;


                } else {
                    if (dataset.technique) {
                        this.actor.data.data.roll.techniqueText = ARM5E.magic.techniques[dataset.technique].label;
                        this.actor.data.data.roll.techniqueScore = parseInt(this.actor.data.data.arts.techniques[dataset.technique].score);
                    }
                    if (dataset.mform) {
                        this.actor.data.data.roll.formScore = parseInt(this.actor.data.data.arts.forms[dataset.mform].score)
                        this.actor.data.data.roll.formText = ARM5E.magic.forms[dataset.mform].label;
                    }
                }
                // if (dataset.focus) {
                //     if ((dataset.focus) == "false") {
                //         this.actor.data.data.roll.focus = false;
                //     } else if ((dataset.focus) == "true") {
                //         this.actor.data.data.roll.focus = true;
                //     } else {
                //         this.actor.data.data.roll.focus = dataset.ritual;
                //     }
                // }
                if (dataset.technique) {
                    this.actor.data.data.roll.technique = dataset.technique;
                }
                if (dataset.mform) {
                    this.actor.data.data.roll.form = dataset.mform;
                }
                // if (dataset.ritual) {
                //     if ((dataset.ritual) == "false") {
                //         this.actor.data.data.roll.ritual = false;
                //     } else if ((dataset.ritual) == "true") {
                //         this.actor.data.data.roll.ritual = true;
                //     } else {
                //         this.actor.data.data.roll.ritual = dataset.ritual;
                //     }
                // }
            }
            if (dataset.divide) {
                this.actor.data.data.roll.divide = dataset.divide;
            }
            if (dataset.usefatigue) {
                this.actor.data.data.roll.useFatigue = dataset.usefatigue;
            }

        }

        if (dataset.bonus) {
            this.actor.data.data.roll.bonus = parseInt(this.actor.data.data.roll.bonus) + parseInt(dataset.bonus);
        }
        if (dataset.bonus2) {
            this.actor.data.data.roll.bonus = parseInt(this.actor.data.data.roll.bonus) + parseInt(dataset.bonus2);
        }
        if (dataset.bonus3) {
            this.actor.data.data.roll.bonus = parseInt(this.actor.data.data.roll.bonus) + parseInt(dataset.bonus3);
        }
        if (dataset.option1) {
            this.actor.data.data.roll.option1 = dataset.option1;
        }
        if (dataset.txtoption1) {
            this.actor.data.data.roll.txtOption1 = dataset.txtoption1;
        }
        if (dataset.option2) {
            this.actor.data.data.roll.option2 = dataset.option2;
        }
        if (dataset.txtoption2) {
            this.actor.data.data.roll.txtOption2 = dataset.txtoption2;
        }
        if (dataset.option3) {
            this.actor.data.data.roll.option3 = dataset.option3;
        }
        if (dataset.txtoption3) {
            this.actor.data.data.roll.txtOption3 = dataset.txtoption3;
        }
        if (dataset.option4) {
            this.actor.data.data.roll.option4 = dataset.option4;
        }
        if (dataset.txtoption4) {
            this.actor.data.data.roll.txtOption4 = dataset.txtoption4;
        }
        if (dataset.option5) {
            this.actor.data.data.roll.option5 = dataset.option5;
        }
        if (dataset.txtoption5) {
            this.actor.data.data.roll.txtOption5 = dataset.txtoption5;
        }

        // clean booleans
        if (this.actor.data.data.roll.useFatigue == "false") {
            this.actor.data.data.roll.useFatigue = false;
        }
        if (this.actor.data.data.roll.useFatigue == "false") {
            this.actor.data.data.roll.useFatigue = false;
        }


        var actor = this.actor
        this.actor.data.data.charmetadata = ARM5E.character.characteristics
        //console.log('onRoll');
        //console.log(actorData);

        // find the template
        let template = "";
        if (dataset.roll == 'option') {
            template = "systems/arm5e/templates/roll/roll-options.html";
        }
        if ((dataset.roll == 'char') || (dataset.roll == 'ability')) {
            template = "systems/arm5e/templates/roll/roll-characteristic.html";
        }
        if (dataset.roll == 'spont') {
            //spontaneous magic
            template = "systems/arm5e/templates/roll/roll-magic.html";
            this.actor.data.data.roll.characteristic = "sta";
        }
        if (dataset.roll == 'magic' || dataset.roll == 'spell') {
            template = "systems/arm5e/templates/roll/roll-spell.html";
            this.actor.data.data.roll.characteristic = "sta";

            // this.actor.data.data.roll.techniqueText = ARM5E.magic.techniques[this.actor.data.data.roll.technique].label + "(";
            // this.actor.data.data.roll.techniqueText = this.actor.data.data.roll.techniqueText + this.actor.data.data.arts.techniques[this.actor.data.data.roll.technique].score + ")";
            // this.actor.data.data.roll.formText = ARM5E.magic.forms[this.actor.data.data.roll.form].label + "(";
            // this.actor.data.data.roll.formText = this.actor.data.data.roll.formText + this.actor.data.data.arts.forms[this.actor.data.data.roll.form].score + ")";
        }

        if (template != "") {
            // render template
            renderTemplate(template, this.actor.data).then(function(html) {
                // show dialog
                if (dataset.roll == "magic" || dataset.roll == 'spont') {
                    //this.loseFatigueLevel(this.actor.data);
                    new Dialog({
                        title: 'Select Die',
                        content: html,
                        buttons: {
                            yes: {
                                icon: "<i class='fas fa-check'></i>",
                                label: `Stress Die`,
                                callback: (html) => stressDie(html, actor)
                            },
                            no: {
                                icon: "<i class='fas fa-ban'></i>",
                                label: `Cancel`,
                                callback: null
                            },
                        }
                    }, {
                        classes: ['arm5e-dialog', 'dialog'],
                        height: "auto"
                    }).render(true);
                } else {
                    new Dialog({
                        title: 'Select Die',
                        content: html,
                        buttons: {
                            yes: {
                                icon: "<i class='fas fa-check'></i>",
                                label: `Simple Die`,
                                callback: (html) => simpleDie(html, actor)
                            },
                            no: {
                                icon: "<i class='fas fa-bomb'></i>",
                                label: `Stress Die`,
                                callback: (html) => stressDie(html, actor)
                            },
                        }
                    }, {
                        classes: ['arm5e-dialog', 'dialog'],
                        height: "auto"
                    }).render(true);
                }
            });
        }
    }


    _rollMagicalStressDie(html, actorData) {

        stressDie(html, actorData);
        this.actor.loseFatigueLevel();
    }
    // Overloaded core functions (TODO: review at each Foundry update)


    /**
     * Handle the final creation of dropped Item data on the Actor.
     * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
     * @param {object[]|object} itemData     The item data requested for creation
     * @return {Promise<Item[]>}
     * @private
     */
    async _onDropItemCreate(itemData) {
        log(false, "_onDropItemCreate");
        log(false, itemData.name);
        itemData = itemData instanceof Array ? itemData : [itemData];
        return this.actor.createEmbeddedDocuments("Item", itemData.filter(e => this.isDropAllowed(e.type)));
    }
}