import { ArM5eItemSheet } from "./item-sheet.js";
import { log } from "../tools.js";
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
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "spell-design"
        }
      ]
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
    context.data.localizedDesc = this.item._getEffectAttributesLabel();

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
    html.find(".advanced-req").click(this._pickRequisites.bind(this));
  }

  async _pickRequisites(event) {
    event.preventDefault();
    this.item.data.config = {
      magic: {
        techniques: CONFIG.ARM5E.magic.techniques,
        forms: CONFIG.ARM5E.magic.forms
      }
    };
    this.item.data.ui = { flavor: event.currentTarget.dataset.flavor };
    log("false", this.item.data);
    var itemData = this.item;
    let template = "systems/arm5e/templates/item/parts/requisites.html";
    renderTemplate(template, this.item.data).then(function (html) {
      new Dialog(
        {
          title: game.i18n.localize("arm5e.sheet.Requisites"),
          content: html,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: game.i18n.localize("arm5e.dialog.button.save"),
              callback: (html) => _setRequisites(html, itemData)
            },
            no: {
              icon: "<i class='fas fa-ban'></i>",
              label: game.i18n.localize("arm5e.dialog.button.cancel"),
              callback: null
            }
          }
        },
        {
          classes: ["arm5e-dialog", "dialog"]
        }
      ).render(true);
    });
  }
}

export async function _setRequisites(selector, item) {
  let itemUpdate = {};
  let found = selector.find(".SelectedCreo");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.technique-req.cr"] = true;
    } else {
      itemUpdate["data.technique-req.cr"] = false;
    }
  }
  found = selector.find(".SelectedIntellego");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.technique-req.in"] = true;
    } else {
      itemUpdate["data.technique-req.in"] = false;
    }
  }
  found = selector.find(".SelectedMuto");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.technique-req.mu"] = true;
    } else {
      itemUpdate["data.technique-req.mu"] = false;
    }
  }
  found = selector.find(".SelectedPerdo");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.technique-req.pe"] = true;
    } else {
      itemUpdate["data.technique-req.pe"] = false;
    }
  }
  found = selector.find(".SelectedRego");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.technique-req.re"] = true;
    } else {
      itemUpdate["data.technique-req.re"] = false;
    }
  }

  // Forms
  found = selector.find(".SelectedAnimal");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.an"] = true;
    } else {
      itemUpdate["data.form-req.an"] = false;
    }
  }

  found = selector.find(".SelectedAquam");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.aq"] = true;
    } else {
      itemUpdate["data.form-req.aq"] = false;
    }
  }
  found = selector.find(".SelectedAuram");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.au"] = true;
    } else {
      itemUpdate["data.form-req.au"] = false;
    }
  }

  found = selector.find(".SelectedCorpus");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.co"] = true;
    } else {
      itemUpdate["data.form-req.co"] = false;
    }
  }

  found = selector.find(".SelectedHerbam");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.he"] = true;
    } else {
      itemUpdate["data.form-req.he"] = false;
    }
  }

  found = selector.find(".SelectedIgnem");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.ig"] = true;
    } else {
      itemUpdate["data.form-req.ig"] = false;
    }
  }

  found = selector.find(".SelectedImaginem");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.im"] = true;
    } else {
      itemUpdate["data.form-req.im"] = false;
    }
  }
  found = selector.find(".SelectedMentem");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.me"] = true;
    } else {
      itemUpdate["data.form-req.me"] = false;
    }
  }

  found = selector.find(".SelectedTerram");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.te"] = true;
    } else {
      itemUpdate["data.form-req.te"] = false;
    }
  }

  found = selector.find(".SelectedVim");
  if (found.length > 0) {
    if (found[0].checked == true) {
      itemUpdate["data.form-req.vi"] = true;
    } else {
      itemUpdate["data.form-req.vi"] = false;
    }
  }

  await item.update(itemUpdate);
}
