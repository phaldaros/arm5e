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
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
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
    const data = super.getData();


    if(data.item.type == "weapon" && this.actor != null){
      let abilitiesSelect = {};

      const temp = { id: "", name: "N/A" };
      abilitiesSelect['a0'] = temp;

      // find the actor habilities and create the select
      for (let [key, i] of Object.entries(this.actor.data.items)) {
        if (i.type === 'ability') {
          const temp = {
            id: i._id,
            name: i.name
          };
          //abilitiesSelect.push(temp);
          abilitiesSelect['a'+key] = temp;
        }
      }

      data.data.abilities = abilitiesSelect;
      data.item.data.abilities = abilitiesSelect;

      //console.log("item-sheet get data weapon")
      //console.log(data)
    }

    //console.log('item-sheet get data');
    //console.log(data);

    //console.log("item-sheet get data this.actor")
    //console.log(this.actor)

    return data;
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

    // Roll handlers, click handlers, etc. would go here.
  }
}
