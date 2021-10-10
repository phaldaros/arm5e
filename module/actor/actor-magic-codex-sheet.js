/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import {
    log
} from "../tools.js"

export class ArM5eMagicCodexSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "actor"],
            template: "systems/arm5e/templates/actor/actor-magic-codex-sheet.html",
            width: 800,
            height: 900,
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

        // Use a safe clone of the actor data for further operations.
        const actorData = context.actor.data;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.data = actorData.data;
        context.flags = actorData.flags;

        // no need to import everything
        context.metadata = {};
        context.metadata.magic = CONFIG.ARM5E.magic;


        this._prepareCodexItems(context);
        console.log("sheetData from codex sheet");
        console.log(context);
        // console.log("sheetData from pc sheet");
        // console.log(context);

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
        log(false, "_prepareCodexItems");

    }



    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const itid = li.data("itemId");
            const item = this.actor.items.get(itid)
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(this._onDeleteEffect.bind(this));

        // Design spell.
        html.find('.design').click(this._onClickEffect.bind(this));



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

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Initialize a default name.
        const name = `__New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = [{
            name: name,
            type: type,
            data: foundry.utils.deepClone(header.dataset)
        }];
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData[0].data["type"];

        // Finally, create the item!
        // console.log("Add item");
        // console.log(itemData);
        return this.actor.createEmbeddedDocuments("Item", itemData, {});
    }

    /**
     * Handle clickable base effect.
     * @param {Event} event   The originating click event
     * @private
     */
    _onDeleteEffect(event) {
        event.preventDefault();
        const question = game.i18n.localize("arm5e.dialog.delete-question");
        const li = $(event.currentTarget).parents(".item");
        let itemId = li.data("itemId");
        Dialog.confirm({
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

    /**
     * Handle clickable base effect.
     * @param {Event} event   The originating click event
     * @private
     */
    _onClickEffect(event) {
        event.preventDefault();
        const li = $(event.currentTarget).parents(".item");
        let itemId = li.data("itemId");
        const element = event.currentTarget;
        const dataset = element.dataset;
        const question = game.i18n.localize("arm5e.dialog.design-question");
        new Dialog({
            title: `${dataset.name}`,
            content: `<p>${question}</p>`,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Yes`,
                    callback: () => this._onDesignEffect(itemId)
                },
                no: {
                    icon: "<i class='fas fa-ban'></i>",
                    label: `Cancel`,
                    callback: null
                },
            }
        }).render(true);
    }

    _onDesignEffect(id) {
        const item = this.actor.items.get(id)
        const itemdata = item.data;
        const dataset = itemdata.data;
        let newItemData;
        if (dataset.type = "baseEffect") {
            // Initialize a default name.
            const name = `_New "${itemdata.name}" effect`;
            newItemData = [{
                name: name,
                type: "magicalEffect",
                img: "icons/commodities/materials/parchment-secrets.webp",
                data: {
                    "BaseEffectDescription": itemdata.name,
                    "baseLevel": dataset.baseLevel,
                    "technique": {
                        "value": dataset.technique.value
                    },
                    "form": {
                        "value": dataset.form.value
                    }
                }
            }];

        } else //
        {
            newItemData = [{
                name: itemdata.name,
                type: "spell",
                data: foundry.utils.deepClone(header.dataset)
            }];
            // Remove the type from the dataset since it's in the itemData.type prop.
            delete newItemData[0].data["type"];
        }

        return this.actor.createEmbeddedDocuments("Item", newItemData, {});
        // TODO render item sheet

    }




}