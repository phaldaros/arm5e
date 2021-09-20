import {
  log
} from "../tools.js"
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ArM5eCovenantActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "actor"],
      template: "systems/arm5e/templates/actor/actor-covenant-sheet.html",
      width: 1100,
      height: 900,
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "attributes"
      }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;
    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;
    context.metadata = CONFIG.ARM5E;
    // Prepare items.
    this._prepareCharacterItems(context);
    log(false, "Covenant-sheet getData");
    log(false, context);
    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    //let actorData = sheetData.actor.data;

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
      const item = this.actor.items.get(li.data("itemId"))
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      let itemId = li.data("itemId");
      itemId = itemId instanceof Array ? itemId : [itemId];
      this.actor.deleteEmbeddedDocuments("Item", itemId, {});
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragItemStart(ev);
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
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = [{
      name: name,
      type: type,
      data: data
    }];
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData[0].data["type"];

    // Finally, create the item!
    return this.actor.createEmbeddedDocuments("Item", itemData, {});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    if (dataset.roll) {

      new Dialog({
          title: 'Select Die',
          content: ``,
          buttons: {
            yes: {
              icon: "<i class='fas fa-check'></i>",
              label: `Simple Die`,
              callback: (html) => {
                let roll = new Roll(dataset.roll, this.actor.data.data);
                let msg = `Simple Die`;
                roll.roll().toMessage({
                  speaker: ChatMessage.getSpeaker({
                    actor: this.actor
                  }),
                  flavor: msg
                });
              }
            },
            no: {
              icon: "<i class='fas fa-bomb'></i>",
              label: `Stress Die`,
              callback: (html) => {

                let mult = 1;
                let msg = "Stress Die";
                let resultMessage = "";
                let roll = explodingRoll(this.actor.data.data);
                multiplyRoll(mult, roll).toMessage({
                  flavor: msg,
                  speaker: ChatMessage.getSpeaker({
                    actor: this.actor
                  }),
                });

                function multiplyRoll(mult, roll) {
                  if (!roll._evaluated) return;
                  let output_roll = new Roll(`${mult} * (${roll._formula})`);
                  output_roll.data = {};
                  output_roll.results = [mult, `*`, ...roll.results];
                  output_roll.terms = [mult, `*`, ...roll.terms];
                  output_roll._evaluated = true;
                  output_roll._total = mult * roll._total;

                  return output_roll;
                }

                function explodingRoll(modifier) {
                  let roll = new Roll(dataset.roll, modifier).roll();

                  if (roll.results[0] === 1) {
                    mult *= 2;
                    roll = explodingRoll();
                  } else {
                    if (mult === 1 && roll.total === 10) {
                      mult *= 0;
                      msg = `Checking for Botch`;
                      new Dialog({
                        title: msg,
                        content: `
                                    <p>You rolled a 0. Check for Botch.</p>
                                    <form>
                                        <div style="display: flex; width: 100%; margin-bottom: 10px">
                                            <p><label for="botchDice" style="white-space: nowrap; margin-right: 10px; padding-top:4px">Number of Botch Dice: </label>
                                            <input type="number" id="botchDice" name="botchDice" min="1" max="10" autofocus /></p>
                                        </div>
                                    </form>			
                                    `,
                        buttons: {
                          yes: {
                            icon: "<i class='fas fa-check'></i>",
                            label: `Roll for Botch!`,
                            callback: (html) => {
                              let botchDice = html.find('#botchDice').val();
                              if (!botchDice) {
                                return ui.notifications.info("Please enter the number of botch dice.");
                              }
                              let rollCommand = botchDice;
                              rollCommand = rollCommand.concat('d10cf=10');
                              const botchRoll = new Roll(rollCommand);
                              botchRoll.roll();

                              if (botchRoll.result == 1) {
                                resultMessage = "<p>BOTCH: one 0 was rolled.</p>";
                              } else if (botchRoll.result == 2) {
                                resultMessage = "<p>BOTCH: two 0s were rolled.</p>";
                              } else if (botchRoll.result == 3) {
                                resultMessage = "<p>BOTCH: three 0s were rolled.</p>";
                              } else if (botchRoll.result == 4) {
                                resultMessage = "<p>BOTCH: four 0s were rolled.</p>";
                              } else if (botchRoll.result == 5) {
                                resultMessage = "<p>BOTCH: five 0s were rolled.</p>";
                              } else if (botchRoll.result == 6) {
                                resultMessage = "<p>BOTCH: six 0s were rolled.</p>";
                              } else if (botchRoll.result == 7) {
                                resultMessage = "<p>BOTCH: seven 0s were rolled.</p>";
                              } else if (botchRoll.result == 8) {
                                resultMessage = "<p>BOTCH: eight 0s were rolled.</p>";
                              } else if (botchRoll.result == 9) {
                                resultMessage = "<p>BOTCH: nine 0s were rolled.</p>";
                              } else if (botchRoll.result == 10) {
                                resultMessage = "<p>BOTCH: ten 0s were rolled.</p>";
                              } else if (botchRoll.result == 0) {
                                resultMessage = "<p>No botch!</p>";
                              }
                              botchRoll.toMessage({
                                flavor: resultMessage,

                              });
                            }
                          },

                          no: {
                            icon: "<i class='fas fa-times'></i>",
                            label: `Cancel`,
                            callback: (html) => {
                              ChatMessage.create({
                                content: `Botch not checked.`
                              });
                            }
                          }
                        }
                      }).render(true);
                    }
                  }
                  return roll;
                }
              }
            }
          }
        }

      ).render(true);


    }
  }
}