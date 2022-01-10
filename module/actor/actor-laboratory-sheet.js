import {
    log
} from "../tools.js"
import {
    ArM5eActorSheet
} from "./actor-sheet.js";
/**
 * Extend the basic ArM5eActorSheet with some very simple modifications
 * @extends {ArM5eActorSheet}
 */
export class ArM5eLaboratoryActorSheet extends ArM5eActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-laboratory-sheet.html",
            width: 790,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "virtues"
            }]

        });
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const context = super.getData();

        context.metadata = CONFIG.ARM5E;

        context.data.world = {};
        context.data.world.covenants = game.actors.filter(a => a.type == "covenant").map(({
            name,
            id
        }) => ({
            name,
            id
        }));
        if (context.data.covenant) {
            let cov = context.data.world.covenants.filter(c => c.name == context.data.covenant.value);
            if (cov.length > 0) {
                context.data.covenant.linked = true;
                context.data.covenant.actorId = cov[0].id
            } else {
                context.data.covenant.linked = false;
            }
        }

        context.data.world.magi = game.actors.filter(a => a._isMagus() === true).map(({
            name,
            id
        }) => ({
            name,
            id
        }));
        if (context.data.world.magi.length > 1) {
            let per = context.data.world.magi.filter(p => p.name == context.data.owner.value);
            if (per.length > 0) {
                context.data.owner.linked = true;
                context.data.owner.actorId = per[0].id;
            } else {
                context.data.owner.linked = false;
            }
        }


        // Prepare items.
        this._prepareCharacterItems(context);

        log(false, "lab-sheet getData");
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

        //console.log("sheetData from laboratory sheet");
        //console.log(sheetData);
    }

    isItemDropAllowed(type) {

        switch (type) {
            case "spell":
            case "vis":
            case "item":
            case "book":
            case "virtue":
            case "flaw":
            case "speciality":
            case "distinctive":
            case "sanctumRoom":
            case "magicItem":
            case "personality":
            case "magicalEffect":
            case "laboratoryText":
                return true;
            default:
                return false;
        }
    }

    isActorDropAllowed(type) {
        switch (type) {
            case "player":
            case "npc":
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
        } else if (actor.type == "player" || actor.type == "npc") {
            updateData["data.owner.value"] = actor.name;
        }
        return await this.actor.update(updateData, {});
    }

}