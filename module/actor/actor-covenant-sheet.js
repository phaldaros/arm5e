import {
    log
} from "../tools.js"
import {
    ArM5eActorSheet
} from "./actor-sheet.js";

import {
    effectToLabText
} from "../item/item-converter.js"

/**
 * Extend the basic ArM5eActorSheet
 * @extends {ArM5eActorSheet}
 */
export class ArM5eCovenantActorSheet extends ArM5eActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-covenant-sheet.html",
            width: 790,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "attributes"
            }]
        });
    }




    /* -------------------------------------------- */
    /**
     *     @override 
     */

    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        context.metadata = CONFIG.ARM5E;
        log(false, "Covenant-sheet getData");
        log(false, context);
        // this._prepareCodexItems(context);

        return context;
    }

    isDropAllowed(type) {

        switch (type) {
            case "spell":
            case "vis":
            case "book":
            case "virtue":
            case "flaw":
            case "magicItem":
            case "reputation":
            case "habitantMagi":
            case "habitantCompanion":
            case "habitantSpecialists":
            case "habitantHabitants":
            case "habitantHorses":
            case "habitantLivestock":
            case "possessionsCovenant":
            case "visSourcesCovenant":
            case "visStockCovenant":
            case "magicalEffect":
            case "calendarCovenant":
            case "incomingSource":
            case "laboratoryText":
            case "mundaneBook":
            case "enchantment":
                return true;
            default:
                return false;
        }
    }

    // tells whether or not a type of item needs to be converted when dropped to a specific sheet.
    needConversion(type) {
        switch (type) {
            case "spell":
            case "magicalEffect":
            case "enchantment":
                return true;
            default:
                return false;
        }
    }

    // Overloaded core functions (TODO: review at each Foundry update)

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
            // data.data.effects = [];
            const item = await Item.implementation.fromDropData(data);
            itemData = item.toObject();
            type = itemData.type;
        } else {
            type = data.data.type;
            itemData = data.data;
        }
        // log(false, "_onDropItem");
        // log(false, itemData.name);
        // transform input into labText 
        if (type == "spell" || type == "magicalEffect" || type == "enchantment") {
            log(false, "Valid drop");
            // create a labText data:
            data.data = effectToLabText(foundry.utils.deepClone(itemData));
        }
        // }
        const res = await super._onDropItem(event, data);
        return res;
    }

    /**
     * TODO: Review in case of Foundry update
     * Handle dropping of a Folder on an Actor Sheet.
     * Currently supports dropping a Folder of Items to create all items as owned items.
     * @param {DragEvent} event     The concluding DragEvent which contains drop data
     * @param {Object} data         The data transfer extracted from the event
     * @return {Promise<Item[]>}
     * @private
     */

    async _onDropFolder(event, data) {
        // log(false, "_onDropFolder");

        if (!this.actor.isOwner) return [];
        if (data.documentName !== "Item") return [];
        const folder = game.folders.get(data.id);
        if (!folder) return [];
        let nonConvertibleItems = folder.contents.filter(e => this.needConversion(e.type) === false);
        let res = await this._onDropItemCreate(nonConvertibleItems.map(e => e.toObject()));
        let convertibleItems = folder.contents.filter(e => this.needConversion(e.type) === true);
        for (let item of convertibleItems) {
            // let actorID = this.actor.id;
            let itemData = {
                // actorId: actorID,
                data: item.data,
                type: "Item"
            };
            res.push(await this._onDropItem(event, itemData));
        }
        return res;
    }


}