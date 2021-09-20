/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ArM5eCovenantActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   **/

  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    this._prepareCharacterData(actorData);

  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    let data = actorData.data;

    console.log("data from pc object");
    console.log(data);

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    // for (let [key, ability] of Object.entries(data.abilities)) {
    //   // Calculate the modifier using d20 rules.
    //   ability.mod = Math.floor((ability.value - 10) / 2);
    // }
  }

}