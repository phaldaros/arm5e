/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5ePCActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   **/
  
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    //if (actorData.type === 'magus') this._prepareCharacterData(actorData);
    /*if (actorData.type === 'companion') this._prepareCharacterData(actorData);
    if (actorData.type === 'grog') this._prepareCharacterData(actorData);
    if (actorData.type === 'covenant') this._prepareCharacterData(actorData);*/
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    let data = actorData.data;

    for (let [key, technique] of Object.entries(data.arts.techniques)) {
      // Calculate the next level experience needed
      technique.experienceNextLevel = (technique.score + 1);
    }

    for (let [key, form] of Object.entries(data.arts.forms)) {
      // Calculate the next level experience needed
      form.experienceNextLevel = (form.score + 1);
    }

    console.log("data from pc object");
    //console.log(data);

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    // for (let [key, ability] of Object.entries(data.abilities)) {
    //   // Calculate the modifier using d20 rules.
    //   ability.mod = Math.floor((ability.value - 10) / 2);
    // }
  }

}