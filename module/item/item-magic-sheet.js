import {
    ArM5eItemSheet
} from "./item-sheet.js";
import {
    log
} from "../tools.js"
/**
 * Extend the basic ArM5eItemSheet with some very simple modifications
 * @extends {ArM5eItemSheet}
 */
export class ArM5eItemMagicSheet extends ArM5eItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "item"],
            width: 610,
            height: 650,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "spell-design"
            }]
        });
    }

    /** @override */
    get template() {
        const path = "systems/arm5e/templates/item";
        // Return a single sheet for all item types.
        // return `${path}/item-sheet.html`;

        // Alternatively, you could use the following return statement to do a
        // unique item sheet by type, like `weapon-sheet.html`.
        return `${path}/item-${this.item.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the item object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 192;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;


    }


}