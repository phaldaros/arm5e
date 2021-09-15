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
        if(this.data.type == "weapon" && this.actor != null){
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
      if (this.type == "magicalEffect") {
        let effectLevel = data.baseLevel;
        let shouldBeRitual = false;
        if (data.range.value) {effectLevel = this._addSpellMagnitude(effectLevel,CONFIG.ARM5E.ranges[data.range.value].impact);}
        if (data.duration.value) {effectLevel = this._addSpellMagnitude(effectLevel,CONFIG.ARM5E.durations[data.duration.value].impact);}
        if (data.target.value) {effectLevel = this._addSpellMagnitude(effectLevel,CONFIG.ARM5E.targets[data.target.value].impact);}
        if (data.complexity) {effectLevel = this._addSpellMagnitude(effectLevel,data.complexity);}
        if (data.targetSize) {effectLevel = this._addSpellMagnitude(effectLevel,data.targetSize);}
        if (data.enhancingRequisite) {effectLevel = this._addSpellMagnitude(effectLevel,data.enhancingRequisite);}
        
        // Duration above moon are rituals and rituals are minimum level 20
        if (CONFIG.ARM5E.durations[data.duration.value].impact > 3 ||
          data.target.value == "bound" || 
          effectLevel >= 50) {
          shouldBeRitual = true;
        }

        if (shouldBeRitual && effectLevel < 20) {effectLevel = 20;}

        this.data.data.ritual= shouldBeRitual;
        this.data.data.level = effectLevel;

        // compute casting total
        if (actorData && this.actor != null) {
          itemData.data.castingTotal = this._computeCastingTotal(actorData,itemData);
        }
      }
  }

  _addSpellMagnitude(base,num) {
    if (base + num <= 5) {
      return base + num;
    }
    let loop = num;
    let res = base;
    while (loop > 0) {
      if (res < 5) {
        res++;
      }
      else {
        res = res + 5;
      }
      loop--;
    }
    return res;

  }

  _computeCastingTotal(actorData, itemData) {
    let res = actorData.data.sta ;
    if (itemData.data["technique-requisite"].value != "") {
      res  += Math.min(actorData.data.arts.techniques[itemData.data.technique.value].score,
        actorData.data.arts.techniques[itemData.data["technique-requisite"].value].score);
    }
    else {
      res  += actorData.data.arts.techniques[itemData.data.technique.value].score;
    }

    if (itemData.data["form-requisite"].value != "") {
      res  += Math.min(actorData.data.arts.forms[itemData.data.form.value].score,
        actorData.data.arts.forms[itemData.data["form-requisite"].value].score);
    }
    else {
      res  += actorData.data.arts.forms[itemData.data.form.value].score;
    }
    return res;

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
