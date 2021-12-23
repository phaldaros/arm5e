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
            width: 650,
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

    // /** @override */
    // setPosition(options = {}) {
    //     const position = super.setPosition(options);
    //     const sheetBody = this.element.find(".sheet-body");
    //     const bodyHeight = position.height - 380;
    //     sheetBody.css("height", bodyHeight);
    //     return position;
    // }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;
        html.find('.advanced-req').click(this._pickRequisites.bind(this));

    }


    async _pickRequisites(event) {
        event.preventDefault();
        this.item.data.metadata = {
            magic: {
                techniques: CONFIG.ARM5E.magic.techniques,
                forms: CONFIG.ARM5E.magic.forms
            }
        };
        log("false", this.item.data);
        var itemData = this.item;
        let template = "systems/arm5e/templates/item/parts/requisites.html";
        renderTemplate(template, this.item.data).then(function(html) {
            new Dialog({
                title: game.i18n.localize("arm5e.sheet.Requisites"),
                content: html,
                buttons: {
                    yes: {
                        icon: "<i class='fas fa-check'></i>",
                        label: `Yes`,
                        callback: (html) => _setRequisites(html, itemData)
                    },
                    no: {
                        icon: "<i class='fas fa-ban'></i>",
                        label: `Cancel`,
                        callback: null
                    },
                }
            }, {
                jQuery: true,
                classes: ['arm5e-dialog', 'dialog']
            }).render(true);;
        });
    }


}

export async function _setRequisites(selector, item) {
    let itemUpdate = {};
    let found = selector.find('.SelectedCreo');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.technique-req.cr"] = true;
        }
    }
    found = selector.find('.SelectedIntellego');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.technique-req.in"] = true;
        }
    }
    found = selector.find('.SelectedMuto');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.technique-req.mu"] = true;
        }
    }
    found = selector.find('.SelectedPerdo');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.technique-req.pe"] = true;
        }
    }
    found = selector.find('.SelectedRego');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.technique-req.re"] = true;
        }
    }

    // Forms
    found = selector.find('.SelectedAnimal');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.an"] = true;
        }
    }

    found = selector.find('.SelectedAquam');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.aq"] = true;
        }
    }
    found = selector.find('.SelectedAuram');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.au"] = true;
        }
    }

    found = selector.find('.SelectedCorpus');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.co"] = true;
        }
    }

    found = selector.find('.SelectedHerbam');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.he"] = true;
        }
    }

    found = selector.find('.SelectedIgnem');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.ig"] = true;
        }
    }

    found = selector.find('.SelectedImaginem');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.im"] = true;
        }
    }
    found = selector.find('.SelectedMentem');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.me"] = true;
        }
    }

    found = selector.find('.SelectedTerram');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.te"] = true;
        }
    }

    found = selector.find('.SelectedVim');
    if (found.length > 0) {
        if (found[0].checked == true) {
            itemUpdate["data.form-req.vi"] = true;
        }
    }

    await item.update(itemUpdate);

}