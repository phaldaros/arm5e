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
        context.metadata.seasons = CONFIG.ARM5E.seasons;
        log(false, "Crucible-sheet getData");
        log(false, context);

        if (context.data.receptacle == null) {
            context.data.state = 0; // empty
        } else {

            const receptacleData = context.data.receptacle.data;

            if (this.actor.data.data.enchantments.length) {
                const enchantData = this.actor.data.data.enchantments[0].data;
                if (receptacleData.data.maxLevel < enchantData.data.level) {
                    context.data.labInfo = game.i18n.localize("arm5e.notification.crucible.no.invest.possible");
                } else {
                    let neededLevel;
                    if (receptacleData.data.charged === false) {
                        neededLevel = enchantData.data.level * 2;
                    } else {
                        // for 1 charge, exceeding by one is enough
                        if (receptacleData.data.charges === 1) {
                            neededLevel = enchantData.data.level + 1
                        } else {
                            neededLevel = enchantData.data.level + receptacleData.data.charges * 5;
                        }
                    }

                    context.data.labInfo = game.i18n.localize("arm5e.notification.crucible.labTotal.needed") + ": " + neededLevel;
                }
                if (receptacleData.data.status === 0) {
                    context.data.state = 2; // prepared
                } else {
                    context.data.state = 3; // invested
                }

            } else {
                context.data.state = 1; // inert
            }
        }
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
            this.actor.deleteEmbeddedDocuments("Item", Array.from(ids), {
                render: false
            });
            // this below is supposed to be working without providing ids...
            // this.actor.deleteEmbeddedDocuments("Item", {}, {
            //     deleteAll: true
            // });
            this.actor.update({
                data: {
                    magicItemName: ""
                }
            });
        });

        html.find('.invest').click(ev => {
            const receptacleData = this.actor.data.data.receptacle.data;
            const enchantData = this.actor.data.data.enchantments[0].data;
            if (receptacleData.data.maxLevel < enchantData.data.level) {

                ui.notifications.warn(game.i18n.localize("arm5e.notification.crucible.no.invest.possible"));
            }
            // copy enchantment fields
            let updateData = [{
                _id: receptacleData._id,
                data: foundry.utils.deepClone(enchantData.data)

            }];
            // patch some additional fields
            updateData[0].name = this.actor.data.data.magicItemName;
            updateData[0].data.enchantmentName = enchantData.name;
            updateData[0].data.status = 1;
            updateData[0].data.description = this.actor.data.data.description;
            this.actor.updateEmbeddedDocuments("Item", updateData, {});
            log(false, "Investing");
        });

        html.find('.update').click(ev => {
            const receptacleData = this.actor.data.data.receptacle.data;
            const enchantData = this.actor.data.data.enchantments[0].data;
            if (receptacleData.data.maxLevel < enchantData.data.level) {

                ui.notifications.warn(game.i18n.localize("arm5e.notification.crucible.no.invest.possible"))
            }
            // copy enchantment fields
            let updateData = [{
                _id: receptacleData._id,
                data: foundry.utils.deepClone(enchantData.data)

            }];
            // patch some additional fields
            updateData[0].name = this.actor.data.data.magicItemName;
            updateData[0].data.enchantmentName = enchantData.name;
            updateData[0].data.status = 1;
            updateData[0].data.description = this.actor.data.data.description;
            this.actor.updateEmbeddedDocuments("Item", updateData, {});
            log(false, "Update enchantment");
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
        // transform item into magicItem 
        let updateDesc = {};
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
                updateDesc["data.magicItemName"] = this.actor.data.data.receptacle.name;
                await this.actor.update(updateDesc, {
                    render: false
                });

                return await this.actor.updateEmbeddedDocuments("Item", updateData, {});
            } else {
                updateDesc["data.magicItemName"] = itemData.name;
                await this.actor.update(updateDesc);
            }
        } else if (type == "enchantment") {
            // if there is no item yet, reject
            if (this.actor.data.data.receptacle === null) {
                return [];
            }
            if (this.actor.data.data.enchantments.length > 0) {
                // update status of item too
                let updateData = [{
                        _id: this.actor.data.data.receptacle.id,
                        data: {
                            status: 0
                        }
                    },
                    {
                        _id: this.actor.data.data.enchantments[0].id,
                        name: itemData.name,
                        img: itemData.img,
                        data: foundry.utils.deepClone(itemData.data)
                    }
                ];
                updateDesc["data.description"] = "<p>" +
                    this.actor.data.data.receptacle.data.data.description +
                    "</p><p><b>Enchantment:</b></p><p>" +
                    this.actor.data.data.enchantments[0].data.data.description + "</p>"
                await this.actor.update(updateDesc, {
                    render: false
                });
                return await this.actor.updateEmbeddedDocuments("Item", updateData, {});
                // patch the receptable with information from enchantment

            } else {
                // update status of item
                let updateData = [{
                    _id: this.actor.data.data.receptacle.id,
                    data: {
                        status: 0
                    }
                }];
                await this.actor.updateEmbeddedDocuments("Item", updateData, {
                    render: false
                });
            }


        } else if (type == "magicItem") { // update an existing magic item
            // reset everything
            const ids = this.actor.items.keys()
            await this.actor.deleteEmbeddedDocuments("Item", Array.from(ids), {
                render: false
            });

            // create the document with the same Id
            // let enchantData = {
            //     name: itemData.name,
            //     type: "enchantment",
            //     data: {
            //         effectfrequency: itemData.data.effectfrequency,
            //         penetration: itemData.data.penetration,
            //         maintainConc: itemData.data.maintainConc,
            //         environmentalTrigger: itemData.data.environmentalTrigger,
            //         restrictedUse: itemData.data.restrictedUse,
            //         linkedTrigger: itemData.data.linkedTrigger
            //     }
            // };
            let enchantData = {
                name: itemData.data.enchantmentName,
                type: "enchantment",
                data: foundry.utils.deepClone(itemData.data)
            };
            // remove item specific fields:
            delete enchantData.data.enchantmentName
            delete enchantData.data.charged;
            delete enchantData.data.charges;
            delete enchantData.data.materialBase;
            delete enchantData.data.sizeMultiplier;
            delete enchantData.data.material;
            delete enchantData.data.materialBonus;
            delete enchantData.data.shape;
            delete enchantData.data.shapeBonus;
            delete enchantData.data.expiry;
            itemData = [itemData];
            itemData.push(enchantData)
            await this.actor.createEmbeddedDocuments("Item", itemData, {
                keepId: true,
                render: false
            })
            let actorUpdate = {
                data: {
                    magicItemName: itemData[0].name,
                    description: itemData[0].data.description
                }
            }
            return await this.actor.update(actorUpdate);


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