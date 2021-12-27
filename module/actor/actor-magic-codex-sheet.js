import {
    ArM5eActorSheet
} from "./actor-sheet.js";

import {
    log
} from "../tools.js"
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ArM5eMagicCodexSheet extends ArM5eActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-magic-codex-sheet.html",
            width: 790,
            height: 800,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "base-effects"
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
        log(false, "Codex-sheet getData");
        log(false, context);
        // this._prepareCodexItems(context);

        return context;
    }

    /**
     * Organize and classify Items for Codex sheets.
     *
     * @param {Object} sheetData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCodexItems(codexData) {
        //let actorData = sheetData.actor.data;
        // log(false, "_prepareCodexItems");

    }



    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        // html.find('.item-create').click(this._onItemCreate.bind(this));

        // // Update Inventory Item
        // html.find('.item-edit').click(ev => {
        //     const li = $(ev.currentTarget).parents(".item");
        //     const itid = li.data("itemId");
        //     const item = this.actor.items.get(itid)
        //     item.sheet.render(true);
        // });

        // Add Inventory Item
        html.find('.base-effect-create').click(this._onBaseEffectCreate.bind(this));

        // Delete Inventory Item
        html.find('.effect-delete').click(this._onDeleteEffect.bind(this));

        // Design spell.
        html.find('.design').click(this._onClickEffect.bind(this));

        // Design spell.
        html.find('.alt-design').click(this._onClickAlternateDesign.bind(this));



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

    // async _onDropItem(event, data) {

    // }


    /**
     * Handle clickable base effect.
     * @param {Event} event   The originating click event
     * @private
     */
    async _onDeleteEffect(event) {
        event.preventDefault();
        const question = game.i18n.localize("arm5e.dialog.delete-question");
        const li = $(event.currentTarget).parents(".item");
        let itemId = li.data("itemId");
        await Dialog.confirm({
            title: `${li[0].dataset.name}`,
            content: `<p>${question}</p>`,
            yes: () => this._deleteEffect(itemId, li),
            no: () => null,
            rejectClose: true
        })
    }

    _deleteEffect(itemId, li) {

        itemId = itemId instanceof Array ? itemId : [itemId];
        this.actor.deleteEmbeddedDocuments("Item", itemId, {});
        li.slideUp(200, () => this.render(false));

    };


    async _onBaseEffectCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const tech = header.dataset.technique == "" ? "cr" : header.dataset.technique;
        const form = header.dataset.form == "" ? "an" : header.dataset.form;
        // Initialize a default name.
        const name = `New Base Effect`;
        // Prepare the item object.
        const itemData = [{
            name: name,
            type: "baseEffect",
            data: {
                "technique": {
                    "value": tech
                },
                "form": {
                    "value": form
                }
            }
        }];
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData[0].data["type"];

        // Finally, create the item!
        // console.log("Add item");
        // console.log(itemData);

        let newItem = await this.actor.createEmbeddedDocuments("Item", itemData, {});

        newItem[0].sheet.render(true);
        return newItem;
    }

    /**
     * Handle clickable base effect.
     * @param {Event} event   The originating click event
     * @private
     */
    _onClickAlternateDesign(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        let itemId = li.data("itemId");
        let type = li.data("itemType");
        this._onDesignEffect(itemId, true);
    }

    /**
     * Handle clickable base effect.
     * @param {Event} event   The originating click event
     * @private
     */
    _onClickEffect(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        let itemId = li.data("itemId");
        let type = li.data("itemType");
        let mnemo;
        switch (type) {
            case "baseEffect":
                mnemo = "arm5e.dialog.design-effect-question";
                break;
            case "magicalEffect":
                mnemo = "arm5e.dialog.design-spell-question";
                break;
            case "spell":
                mnemo = "arm5e.dialog.design-enchantment-question";
                break;
            default:
                return;
        }
        const element = event.currentTarget;
        const dataset = element.dataset;
        const question = game.i18n.localize(mnemo);
        new Dialog({
            title: `${dataset.name}`,
            content: `<p>${question}</p>`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Yes`,
                    callback: () => this._onDesignEffect(itemId, false)
                },
                no: {
                    icon: "<i class='fas fa-ban'></i>",
                    label: `Cancel`,
                    callback: null
                },
            }
        }).render(true);
    }

    async _onDesignEffect(id, alt) {
        const item = this.actor.items.get(id)
        const itemdata = item.data;
        const dataset = itemdata.data;
        let newItemData;
        if (itemdata.type == "baseEffect") {
            // Initialize a default name.
            let name = `_New "${itemdata.name}" effect`;
            let type = "magicalEffect";
            if (alt === true) { // alternate design
                let name = `_New "${itemdata.name}" spell`;
                type = "spell";
            }
            newItemData = [{
                name: name,
                type: type,
                data: {
                    "baseEffectDescription": itemdata.name,
                    "baseLevel": dataset.baseLevel,
                    "technique": {
                        "value": dataset.technique.value
                    },
                    "form": {
                        "value": dataset.form.value
                    }
                }
            }];

        } else if (itemdata.type == "magicalEffect") //
        {
            let itemType = "spell"
            if (alt === true) { // alternate design
                itemType = "enchantment";
            }
            newItemData = [{
                name: itemdata.name,
                type: itemType,
                data: foundry.utils.deepClone(itemdata.data)
            }];
            // Remove the type from the dataset since it's in the itemData.type prop.
            delete newItemData[0].data["type"];
        } else {
            if (itemdata.data.ritual) {
                ui.notifications.info("Impossible to make an enchantment with a ritual effect.");
                return [];
            }

            newItemData = [{
                name: itemdata.name,
                type: "enchantment",
                data: foundry.utils.deepClone(itemdata.data)
            }];
            // Remove the type from the dataset since it's in the itemData.type prop.

            delete newItemData[0].data["type"];
            // remove spell attributes linked to actor
            delete newItemData[0].data.ritual
            delete newItemData[0].data.mastery
            delete newItemData[0].data.exp
            delete newItemData[0].data.bonus


        }
        let newItem = await this.actor.createEmbeddedDocuments("Item", newItemData, {});

        newItem[0].sheet.render(true);

        return newItem;

    }




    isDropAllowed(type) {
        switch (type) {
            case "baseEffect":
            case "magicalEffect":
            case "enchantment":
            case "spell":
                return true;
            default:
                return false;
        }
    }


}