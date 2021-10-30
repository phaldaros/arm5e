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

export class ArM5eNPCActorSheet extends ArM5eActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-npc-sheet.html",
            width: 790,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {

        const context = super.getData();

        context.metadata = CONFIG.ARM5E;
        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();


        // Prepare items.
        //if (this.actor.data.type == 'magus') {
        this._prepareCharacterItems(context);
        //}
        log(false, "Npc-sheet getData");
        log(false, context);

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


}