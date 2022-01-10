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
export class ArM5ePCActorSheet extends ArM5eActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-pc-sheet.html",
            width: 790,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }
    /** @override */
    getData() {

        const context = super.getData();

        context.metadata = CONFIG.ARM5E;
        // Add roll data for TinyMCE editors.
        context.rollData = context.actor.getRollData();


        // Prepare items.
        // this._prepareCharacterItems(context);
        log(false, "Player-sheet getData");
        log(false, context);

        return context;
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
            case "abilityFamiliar":
            case "diaryEntry":
            case "powerFamiliar":
            case "speciality":
            case "distinctive":
            case "sanctumRoom":
            case "magicItem":
            case "personality":
            case "reputation":
            case "magicalEffect":
            case "laboratoryText":
            case "mundaneBook":
                return true;
            default:
                return false;
        }
    }

    isActorDropAllowed(type) {
        switch (type) {
            case "laboratory":
            case "covenant":
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