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

    isItemDropAllowed(type) {
        switch (type) {
            case "weapon":
            case "armor":
            case "spell":
            case "vis":
            case "item":
            case "book":
            case "virtue":
            case "flaw":
            case "ability":
            case "diaryEntry":
            case "powerFamiliar":
            case "magicItem":
            case "personality":
            case "reputation":
            case "magicalEffect":
                return true;
            default:
                return false;
        }
    }

    async _bindActor(actor) {
        let updateData = {};
        if (actor.type == "covenant") {
            updateData["data.covenant.value"] = actor.name;
        } else if (actor.type == "laboratory") {
            updateData["data.sanctum.value"] = actor.name;
        }
        return await this.actor.update(updateData, {});
    }

}