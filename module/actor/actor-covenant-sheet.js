import {
    log
} from "../tools.js"
import {
    ArM5eActorSheet
} from "./actor-sheet.js";
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



    /**
     * Handle dropping of an item reference or item data onto an Actor Sheet
     * @param {DragEvent} event     The concluding DragEvent which contains drop data
     * @param {Object} data         The data transfer extracted from the event
     * @return {Promise<Object>}    A data object which describes the result of the drop
     * @private
     * @override
     */
    // async _onDropItem(event, data) {
    //     if (data.actorId !== undefined) {
    //         let actor = game.actors.get(data.actorId);
    //         // transform input into labText 
    //         if (actor.data.type === "magicCodex") {
    //             if (data.data.type == "spell" || data.data.type == "magicalEffect") {
    //                 log(false, "Valid drop");
    //                 // create a labText data:

    //                 if (data.data.type == "spell") {
    //                     delete data.data.data.mastery;
    //                     delete data.data.data.exp;
    //                     delete data.data.data.bonus;
    //                 }
    //                 data.data.type = "laboratoryText";
    //                 delete data.data.data.applyFocus;
    //             }
    //         }
    //     }
    //     const res = await super._onDropItem(event, data);
    //     return res;
    // }

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
        log(false, "COvenant-sheet getData");
        log(false, context);
        // this._prepareCodexItems(context);

        return context;
    }

    isDropAllowed(type) {

        switch (type) {
            case "weapon":
            case "armor":
                //case "spell":
            case "vis":
            case "item":
            case "book":
            case "virtue":
            case "flaw":
            case "magicItem":
            case "spell":
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
                //case "magicalEffect":
            case "calendarCovenant":
            case "incomingSource":
            case "laboratoryText":
            case "mundaneBook":
                return true;
            default:
                return false;
        }
    }





}