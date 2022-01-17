import {
    ArM5eActorSheet
} from "./actor-sheet.js";

import {
    log
} from "../tools.js"


/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ArM5eActorSheet}
 */
export class ArM5eCrucibleSheet extends ArM5eActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-crucible-sheet.html",
            width: 790,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "receptacle"
            }]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        // no need to import everything
        context.metadata = {};
        context.metadata.magic = CONFIG.ARM5E.magic;
        context.metadata.lab = CONFIG.ARM5E.lab;
        log(false, "Crucible-sheet getData");
        log(false, context);

        // // put magic item data in the crucible to use the same html fragment
        // if (context.data.receptacle != null) {
        //     context.data.enchantmentName = context.data.receptacle.data.data.enchantmentName;
        //     context.data.sizeMultiplier = context.data.receptacle.data.data.sizeMultiplier;
        //     context.data.materialBase = context.data.receptacle.data.data.materialBase;

        //     context.data.material = context.data.receptacle.data.data.material;
        //     context.data.materialBonus = context.data.receptacle.data.data.materialBonus;

        //     context.data.shape = context.data.receptacle.data.data.shape;
        //     context.data.shapeBonus = context.data.receptacle.data.data.shapeBonus;

        //     context.data.charges = context.data.receptacle.data.data.charges;

        //     context.data.expiry = context.data.receptacle.data.data.expiry;
        // }

        return context;
    }


    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        // html.find('.item-create').click(this._onItemCreate.bind(this));

        html.find('.reset').click(ev => {
            const ids = this.actor.items.keys()
            this.actor.deleteEmbeddedDocuments("Item", Array.from(ids));
        });

        // html.find('.GMonly').click(this._restrict.bind(this));



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



    isItemDropAllowed(type) {
        switch (type) {
            case "enchantment":
            case "item":
            case "magicItem":
                // case "weapon":
                // case "armor":
                // case "laboratoryText":
                return true;
            default:
                return false;
        }
    }

    /**
     * Handle dropping of an item reference or item data onto an Actor Sheet
     * @param {DragEvent} event     The concluding DragEvent which contains drop data
     * @param {Object} data         The data transfer extracted from the event
     * @return {Promise<Object>}    A data object which describes the result of the drop
     * @private
     * @override
     */
    async _onDropItem(event, data) {
            let itemData = {};
            let type;
            if (data.pack) {
                const item = await Item.implementation.fromDropData(data);
                itemData = item.toObject();
                type = itemData.type;
            } else if (data.actorId === undefined) {
                const item = await Item.implementation.fromDropData(data);
                itemData = item.toObject();
                type = itemData.type;
            } else {
                type = data.data.type;
                itemData = data.data;
            }
            // transform input into magicItem 
            if (type == "item") { // TODO or weapon or armor
                log(false, "Valid drop");
                if (this.actor.data.data.receptacle != null) {
                    let updateData = [{
                        _id: this.actor.data.data.receptacle.id,
                        name: itemData.name,
                        type: "magicItem",
                        img: itemData.img,
                        data: foundry.utils.deepClone(itemData.data)
                    }]


                    return await this.actor.updateEmbeddedDocuments("Item", updateData, {});
                }
            } else if (type == "enchantment") {
                // if there is no item yet, reject
                if (this.actor.data.data.receptacle === null) {
                    return [];
                }
                if (this.actor.data.data.enchantments.length > 0) {
                    let updateData = [{
                        _id: this.actor.data.data.enchantments[0].id,
                        name: itemData.name,
                        img: itemData.img,
                        data: foundry.utils.deepClone(itemData.data)
                    }]

                    await this.actor.updateEmbeddedDocuments("Item", updateData, {});
                    // patch the receptable with information from enchantment
                    updateData = [{
                            _id: this.actor.data.data.receptacle.id,
                            data: {
                                description: this.actor.data.data.receptacle
                            }
                        }
                    }
                    else {
                        return [];
                    }
                    // }
                    const res = await super._onDropItem(event, data);
                    return res;
                }

                /**
                 * Handle the final creation of dropped Item data on the Actor.
                 * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
                 * @param {object[]|object} itemData     The item data requested for creation
                 * @return {Promise<Item[]>}
                 * @private
                 */
                async _onDropItemCreate(itemData) {
                    itemData = itemData instanceof Array ? itemData : [itemData];

                    // change item, (TODO weapon, armor)
                    if (itemData[0].type === "item") {
                        itemData[0].type = "magicItem";
                    }


                    return super._onDropItemCreate(itemData);
                }



            }