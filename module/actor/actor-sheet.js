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

        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();

        // Prepare active effects
        //context.effects = prepareActiveEffectCategories(this.actor.effects);

        this._prepareCharacterItems(context);
        console.log("sheetData from pc sheet");
        console.log(context);
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
    _onItemCreate(event) {
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
        return this.actor.createEmbeddedDocuments("Item", itemData, {});
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
            if (dataset.characteristic) {
                this.actor.data.data.roll.characteristic = dataset.characteristic;
            }
            if (dataset.ability) {
                this.actor.data.data.roll.ability = dataset.ability;
            }
            if (dataset.technique) {
                this.actor.data.data.roll.technique = dataset.technique;
            }
            if (dataset.mform) {
                this.actor.data.data.roll.form = dataset.mform;
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
            if (dataset.divide) {
                this.actor.data.data.roll.divide = dataset.divide;
            }
            if (dataset.usefatigue) {
                this.actor.data.data.roll.useFatigue = dataset.usefatigue;
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
            if (this.actor.data.data.roll.useFatigue == "true") {
                this.actor.data.data.roll.useFatigue = true;
            }

            var actorData = this.actor
            //console.log('onRoll');
            //console.log(actorData);

            // find the template
            let template = "";
            if (dataset.roll == 'option') {
                template = "systems/arm5e/templates/roll/roll-options.html";
            }
            if (dataset.roll == 'char') {
                template = "systems/arm5e/templates/roll/roll-characteristic.html";
            }
            if (dataset.roll == 'magic') {
                //spontaneous magic
                template = "systems/arm5e/templates/roll/roll-magic.html";
                this.actor.data.data.roll.characteristic = "sta";
            }
            if (dataset.roll == 'spell') {
                template = "systems/arm5e/templates/roll/roll-spell.html";
                this.actor.data.data.roll.characteristic = "sta";

                this.actor.data.data.roll.techniqueText = ARM5E.magic.techniques[this.actor.data.data.roll.technique].label + "(";
                this.actor.data.data.roll.techniqueText = this.actor.data.data.roll.techniqueText + this.actor.data.data.arts.techniques[this.actor.data.data.roll.technique].score + ")";
                this.actor.data.data.roll.formText = ARM5E.magic.forms[this.actor.data.data.roll.form].label + "(";
                this.actor.data.data.roll.formText = this.actor.data.data.roll.formText + this.actor.data.data.arts.forms[this.actor.data.data.roll.form].score + ")";
            }

            if (template != "") {
                // render template
                renderTemplate(template, this.actor.data).then(function(html) {
                    // show dialog
                    if (dataset.roll == "magic") {
                        //this.loseFatigueLevel(this.actor.data);
                        new Dialog({
                            title: 'Select Die',
                            content: html,
                            buttons: {
                                yes: {
                                    icon: "<i class='fas fa-check'></i>",
                                    label: `Stress Die`,
                                    callback: (html) => stressDie(html, actorData)
                                },
                                no: {
                                    icon: "<i class='fas fa-ban'></i>",
                                    label: `Cancel`,
                                    callback: null
                                },
                            }
                        }).render(true);
                    } else {
                        new Dialog({
                            title: 'Select Die',
                            content: html,
                            buttons: {
                                yes: {
                                    icon: "<i class='fas fa-check'></i>",
                                    label: `Simple Die`,
                                    callback: (html) => simpleDie(html, actorData)
                                },
                                no: {
                                    icon: "<i class='fas fa-bomb'></i>",
                                    label: `Stress Die`,
                                    callback: (html) => stressDie(html, actorData)
                                },
                            }
                        }).render(true);
                    }
                });
            }
        }
    }


}