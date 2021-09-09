/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ArM5eItem extends Item {

  static magicMetadata = {"arts": {
    "cr": {"label": "Creo","dtype": "String" },
    "in": {"label": "Intellego","dtype": "String" },
    "mu": {"label": "Muto","dtype": "String" },
    "pe": {"label": "Perdo","dtype": "String" },
    "re": {"label": "Rego","dtype": "String" },
    "an": {"label": "Animal","dtype": "String" },
    "au": {"label": "Auram","dtype": "String" },
    "aq": {"label": "Aquam","dtype": "String" },
    "co": {"label": "Corpus","dtype": "String" },
    "he": {"label": "Herbam","dtype": "String" },
    "ig": {"label": "Ignem","dtype": "String" },
    "im": {"label": "Imaginem","dtype": "String" },
    "me": {"label": "Mentem","dtype": "String" },
    "te": {"label": "Terram","dtype": "String" },
    "vi": {"label": "Vim","dtype": "String" }
  },
  "techniques": {
    "n-a": {"label": "N/A","dtype": "String" },
    "cr": {"label": "Creo","dtype": "String" },
    "in": {"label": "Intellego","dtype": "String" },
    "mu": {"label": "Muto","dtype": "String" },
    "pe": {"label": "Perdo","dtype": "String" },
    "re": {"label": "Rego","dtype": "String" }
  },
  "forms": {
    "n-a": {"label": "N/A","dtype": "String" },
    "an": {"label": "Animal","dtype": "String" },
    "au": {"label": "Auram","dtype": "String" },
    "aq": {"label": "Aquam","dtype": "String" },
    "co": {"label": "Corpus","dtype": "String" },
    "he": {"label": "Herbam","dtype": "String" },
    "ig": {"label": "Ignem","dtype": "String" },
    "im": {"label": "Imaginem","dtype": "String" },
    "me": {"label": "Mentem","dtype": "String" },
    "te": {"label": "Terram","dtype": "String" },
    "vi": {"label": "Vim","dtype": "String" }
  },
  "durations" : {
    "moment" : {"label": "arm5e.sheet.durations.moment","dtype": "String", "impact" : 0 },
    "conc" : {"label": "arm5e.sheet.durations.conc","dtype": "String", "impact" : 1 },
    "diam":{"label": "arm5e.sheet.durations.diam","dtype": "String", "impact" : 1 },
    "sun":{"label": "arm5e.sheet.durations.sun","dtype": "String", "impact" : 2 },
    "ring":{"label": "arm5e.sheet.durations.ring","dtype": "String", "impact" : 2 },
    "moon" :{"label": "arm5e.sheet.durations.moon","dtype": "String" , "impact" : 3},
    "fire":{"label": "arm5e.sheet.durations.fire","dtype": "String", "impact" : 3 },
    "bargain":{"label": "arm5e.sheet.durations.bargain","dtype": "String", "impact" : 3 },
    "year" :{"label": "arm5e.sheet.durations.year","dtype": "String", "impact" : 4 },
    "condition" : {"label": "arm5e.sheet.durations.condition","dtype": "String", "impact" : 4 },
    "year+1" : {"label": "arm5e.sheet.durations.year+1","dtype": "String", "impact" : 4 }
  },
  "ranges":  {
    "personal" : {"label": "arm5e.sheet.ranges.personal","dtype": "String", "impact" : 0 },
    "touch": {"label": "arm5e.sheet.ranges.touch","dtype": "String", "impact" : 1 },
    "eye": {"label": "arm5e.sheet.ranges.eye","dtype": "String", "impact" : 1 },
    "voice": {"label": "arm5e.sheet.ranges.voice","dtype": "String", "impact" : 2 },
    "road": {"label": "arm5e.sheet.ranges.road","dtype": "String", "impact" : 2 },
    "sight": {"label": "arm5e.sheet.ranges.sight","dtype": "String", "impact" : 3 },
    "arc" : {"label": "arm5e.sheet.ranges.arc","dtype": "String", "impact" : 4 }
  },
  "targets" : {
    "ind" : {"label": "arm5e.sheet.targets.ind","dtype": "String", "impact" : 0 },
    "circle" : {"label": "arm5e.sheet.targets.circle","dtype": "String", "impact" : 0 },
    "part":{"label": "arm5e.sheet.targets.part","dtype": "String", "impact" : 1 },
    "group":{"label": "arm5e.sheet.targets.group","dtype": "String", "impact" : 2 },
    "room" :{"label": "arm5e.sheet.targets.room","dtype": "String", "impact" : 2 },
    "struct" :{"label": "arm5e.sheet.targets.struct","dtype": "String", "impact" :3 },
    "bound" : {"label": "arm5e.sheet.targets.bound","dtype": "String", "impact" : 4 },
    "taste" : {"label": "arm5e.sheet.targets.taste","dtype": "String", "impact" : 0 },
    "touch" : {"label": "arm5e.sheet.targets.touch","dtype": "String", "impact" : 1 },
    "smell" : {"label": "arm5e.sheet.targets.smell","dtype": "String", "impact" : 2 },
    "hearing" : {"label": "arm5e.sheet.targets.hearing","dtype": "String", "impact" : 3 },
    "sight" : {"label": "arm5e.sheet.targets.sight","dtype": "String", "impact" : 4 }
  }
  }
    ;
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
