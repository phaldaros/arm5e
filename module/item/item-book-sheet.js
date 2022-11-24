import { getDataset, log } from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { Scriptorium } from "../tools/scriptorium.js";
import { ArM5eItemSheet } from "./item-sheet.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eBookSheet extends ArM5eItemSheet {
  /** @override */
  //   static get defaultOptions() {
  //     return mergeObject(super.defaultOptions, {
  //       classes: ["arm5e", "sheet", "item"],
  //       width: 650,
  //       height: 750,
  //       // dragDrop: [{dragSelector: ".item-list .item", dropSelector: null}],
  //       tabs: [
  //         {
  //           navSelector: ".sheet-tabs",
  //           contentSelector: ".sheet-body",
  //           initial: "description"
  //         }
  //       ]
  //     });
  //   }

  constructor(data, options) {
    super(data, options);
  }

  /** @override */
  get template() {
    return super.template;
  }

  // async _onSubmit(event, { updateData = null, preventClose = false, preventRender = false } = {}) {
  //   event.preventDefault();
  //   // Process the form data
  //   const formData = this._getSubmitData(updateData);
  //   return super._onSubmit(event, {});
  // }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;
    let idx = 0;
    context.topicsUi = [];
    for (let topic of Object.values(context.system.topics)) {
      if (topic.category == "mastery") {
        context.topicsUi[idx] = { bookTypeEdit: "disabled" };
      }
      idx++;
    }
    context.topicIdx = this.item.getFlag("arm5e", "currentBookTopic") ?? 0;
    context.currentTopicNumber = context.topicIdx + 1;
    context.currentTopic = context.system.topics[context.topicIdx];
    context.topicNum = context.system.topics.length;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".sheet-body");
    const bodyHeight = position.height - 500;
    sheetBody.css("height", bodyHeight);
    return position;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".plan-reading").click(event => this._readBook(this.item, event));
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // books
    html.find(".book-category").change(event => this._changeTopicCategory(this.item, event));

    html.find(".new-topic").click(async event => this._addTopic(this.item, event));

    html.find(".delete-topic").click(async event => this._removeTopic(this.item, event));
    html.find(".next-topic").click(async event => this._changeCurrentTopic(this.item, event, 1));
    html
      .find(".previous-topic")
      .click(async event => this._changeCurrentTopic(this.item, event, -1));
  }

  async _readBook(item, event) {
    event.preventDefault();
    const dataset = getDataset(event);
    let formData = {
      seasons: CONFIG.ARM5E.seasons,
      abilityKeysList: CONFIG.ARM5E.LOCALIZED_ABILITIES,
      arts: CONFIG.ARM5E.magic.arts,
      techs: CONFIG.ARM5E.magic.techniques,
      forms: CONFIG.ARM5E.magic.forms,
      bookTopics: CONFIG.ARM5E.books.categories,
      bookTypes: CONFIG.ARM5E.books.types,
      ...game.settings.get("arm5e", "currentDate"),
      reading: {
        reader: { id: null },
        book: {
          id: item.id,
          title: item.name,
          language: item.system.language,
          author: item.system.author,
          topics: item.system.topics,
          topicIndex: dataset.index
        }
      }
    };

    if (item.isOwned && item.actor._isCharacter()) {
      formData.reading.reader.id = item.actor.id;
    }

    const scriptorium = new Scriptorium(formData, {}); // data, options
    const res = await scriptorium.render(true);
  }

  async _changeCurrentTopic(item, event, offset) {
    event.preventDefault();
    const newIndex = Number(getDataset(event).index) + offset;
    if (newIndex > item.system.topics.length - 1 || newIndex < 0) {
      // no effect
      return;
    }
    await item.setFlag("arm5e", "currentBookTopic", newIndex);
  }

  async _addTopic(item, event) {
    event.preventDefault();
    const dataset = getDataset(event);
    let newTopic = {
      art: "cr",
      key: null,
      option: null,
      spellName: null,
      category: "art",
      quality: 1,
      level: 1,
      mastery: false
    };
    const topics = item.system.topics;
    topics.push(newTopic);

    await item.update({ "system.topics": topics });
  }

  async _removeTopic(item, event) {
    event.preventDefault();
    const dataset = getDataset(event);
    const topics = item.system.topics;
    const idx = Number(dataset.index);
    topics.splice(idx, 1);
    if (game.settings.get("arm5e", "confirmDelete")) {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      await Dialog.confirm(
        {
          title: game.i18n.localize("arm5e.dialog.delete-topic"),
          content: `<p>${question}</p>`,
          yes: async () => {
            await item.update({
              "system.topics": topics,
              "flags.arm5e.currentBookTopic": Math.max(0, Math.min(idx - 1, topics.length))
            });
          },
          no: () => null
        },
        {
          rejectClose: true
        }
      );
    } else {
      await item.update({
        "system.topics": topics,
        "flags.arm5e.currentBookTopic": Math.max(0, Math.min(idx - 1, topics.length))
      });
    }
  }

  async _changeTopicCategory(item, event) {
    event.preventDefault();

    let chosenTopic = $(".book-category")
      .find("option:selected")
      .val();
    let index = Number(getDataset(event).index);
    const topics = item.system.topics;
    let bookType = topics[index].type;
    let topic = {};

    if (chosenTopic === "ability") {
      topic.type = bookType;
      topic.art = null;
      topic.key = "awareness";
      topic.option = "";
      topic.spellName = null;
      topic.category = "ability";
    } else if (chosenTopic === "art") {
      // missing data, reset to default
      topic.type = bookType;
      topic.art = "cr";
      topic.key = null;
      topic.option = null;

      topic.category = "art";
    } else if (chosenTopic === "mastery") {
      topic.type = "Tractatus";
      topic.art = null;
      topic.key = null;
      topic.option = null;
      topic.spellName = "Mastered spell";
      topic.category = "mastery";
    } else {
      topic.type = null;
      topic.art = null;
      topic.key = null;
      topic.option = null;
      topic.spellName = null;
      topic.category = "labText";
    }
    topics[index] = topic;
    let updateData = {};
    updateData[`system.topics`] = topics;
    this.submit({ preventClose: true, updateData: updateData });
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    if (!this.object.id) return;
    const expanded = expandObject(formData);

    const newTopics = this.object.system.topics;
    const index = Number(Object.keys(expanded.system.topics)[0]);
    newTopics[index] = expanded.system.topics[index];
    // Since type is read only when mastery, it is not part of the form data
    if (expanded.system.topics[index].category == "mastery") {
      expanded.system.topics[index].type = "Tractatus";
    }
    const newFormData = { ...formData, ...flattenObject({ system: { topics: newTopics } }) };
    return this.object.update(newFormData);
  }
}
