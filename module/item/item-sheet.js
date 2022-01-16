import {
    log
} from "../tools.js"
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemSheet extends ItemSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["arm5e", "sheet", "item"],
            width: 650,
            height: 650,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
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

        // Use a safe clone of the item data for further operations.
        const itemData = context.item.data;

        // Add the item's data to context.data for easier access, as well as flags.
        context.data = itemData.data;
        context.flags = itemData.flags;

        context.metadata = CONFIG.ARM5E;
        if (itemData.type == "weapon") {
            let abilitiesSelect = {};
            const temp = {
                id: "",
                name: "N/A"
            };
            abilitiesSelect['a0'] = temp;
            if (this.actor != null) {
                // find the actor habilities and create the select
                for (let [key, i] of this.actor.data.items.entries()) {
                    if (i.type === 'ability') {
                        const temp = {
                            id: i.id,
                            name: i.name
                        };
                        //abilitiesSelect.push(temp);
                        abilitiesSelect['a' + key] = temp;
                    }
                }
            }

            context.data.abilities = abilitiesSelect;
            itemData.data.abilities = abilitiesSelect;

            //console.log("item-sheet get data weapon")
            //console.log(data)
        } else if (itemData.type == "spell" || itemData.type == "enchantment" || itemData.type == "laboratoryText") {
            context.enforceMagicRules = game.settings.get("arm5e", "magicRulesEnforcement");
        }

        context.metagame = game.settings.get("arm5e", "metagame");

        log(false, 'item-sheet get data');
        log(false, context);
        // console.log('item-sheet get data');
        // console.log(context);


        return context;
    }

    /* -------------------------------------------- */

    /** @override */
    setPosition(options = {}) {
        const position = super.setPosition(options);
        const sheetBody = this.element.find(".sheet-body");
        const bodyHeight = position.height - 380;
        sheetBody.css("height", bodyHeight);
        return position;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // data-id and data-attr needed
        html.find(".increase-ability").click(event => this._increaseScore(this.item));
        html.find(".decrease-ability").click((event) => this._deccreaseScore(this.item));
        html.find(".default-characteristic").change((event) => this._onSelectDefaultCharacteristic(this.item, event));
    }

    async _onSelectDefaultCharacteristic(item, event) {
        event.preventDefault();
        await item.update({
            data: {
                defaultCharacteristicForAbility: $( ".default-characteristic" ).find("option:selected").val()
            },
        }, {});
        return false;
    }
    async _increaseScore(item) {
        await item.update({
            data: {
                xp: (item.data.data.derivedScore + 1) * (item.data.data.derivedScore + 2) * 5 / 2
            }
        }, {});
    }
    async _deccreaseScore(item) {
        let newScore = 0;
        if (item.data.data.derivedScore != 0) {
            await item.update({
                data: {
                    xp: (item.data.data.derivedScore - 1) * item.data.data.derivedScore * 5 / 2
                }
            }, {});
        }

    }

}