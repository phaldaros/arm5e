/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ArM5eItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    let itemData = this.data;
    let actorData = this.actor ? this.actor.data : {};
    let data = itemData.data;
    if (actorData ) {
        if(this.data.type == "weapon"){
          let abilitiesSelect = {};

          const temp = { id: "", name: "N/A" };
          abilitiesSelect['a0'] = temp;

          // find the actor abilities and create the select
          for (let [key, i] of Object.entries(this.actor.data.items)) {
            if (i.type === 'ability') {
              const temp = {
                id: i.id,
                name: i.name
              };
              //abilitiesSelect.push(temp);
              abilitiesSelect['a'+key] = temp;
            }
          }

          itemData.data.abilities = abilitiesSelect;

        }
      }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    let roll = new Roll('d20+@abilities.str.mod', actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }
}
