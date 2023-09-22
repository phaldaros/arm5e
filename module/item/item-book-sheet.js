import { getDataset, log } from "../tools.js";
import ArM5eActiveEffect from "../helpers/active-effects.js";
import { Scriptorium } from "../tools/scriptorium.js";
import { ArM5eItemSheet } from "./item-sheet.js";
import { spellFormLabel, spellTechniqueLabel } from "../helpers/spells.js";
import { ArM5eItemMagicSheet } from "./item-magic-sheet.js";
import { getConfirmation } from "../constants/ui.js";
import { ArM5eActorSheet } from "../actor/actor-sheet.js";
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eBookSheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      dragDrop: [{ dragSelector: null, dropSelector: ".drop-labtext" }]
    });
  }

  constructor(data, options) {
    super(data, options);
  }

  /** @override */
  get template() {
    return super.template;
  }

  async _onDrop(event) {
    const dropData = TextEditor.getDragEventData(event);

    let index = Number(getDataset(event).index);
    if (dropData.type == "Item")
      if (getDataset(event).drop === "labtext") {
        const labtext = await Item.implementation.fromDropData(dropData);
        switch (labtext.type) {
          case "spell":
            labtext.system.type = "spell";
          case "laboratoryText": {
            const topics = this.item.system.topics;
            let topic = {};
            topic.type = null;
            topic.art = null;
            topic.key = null;
            topic.option = null;
            topic.spellName = null;
            topic.category = "labText";
            topic.labtextTitle = labtext.name;
            topic.labtext = labtext.system;
            topics[index] = topic;
            let updateData = {};
            updateData[`system.topics`] = topics;
            await this.item.update(updateData);
          }
        }
        // this.submit({ preventClose: true, updateData: updateData });
      }
    //  else if (event.currentTarget.dataset.drop === "labtext") {
  }
  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = await super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;
    let idx = 0;
    context.topicsUi = [];
    for (let topic of Object.values(context.system.topics)) {
      if (topic.category == "mastery" || topic.category == "labText") {
        context.topicsUi[idx] = { bookTypeEdit: "disabled" };
      }
      if (topic.category == "labText" && topic.labtextTitle != "") {
        topic.labtext.summary = game.i18n.localize(
          context.config.lab.labTextType[topic.labtext.type]
        );
        topic.labtext.summary += `: ${topic.labtextTitle} - ${spellTechniqueLabel(
          topic.labtext
        )} ${spellFormLabel(topic.labtext)} ${topic.labtext.level}`;
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
    html.find(".plan-reading").click((event) => this._readBook(this.item, event));
    html.find(".show-details").click(async (event) => this._showLabText(this.item, event));
    html.find(".next-topic").click(async (event) => this._changeCurrentTopic(this.item, event, 1));
    html
      .find(".previous-topic")
      .click(async (event) => this._changeCurrentTopic(this.item, event, -1));
    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // books
    html.find(".book-category").change((event) => this._changeTopicCategory(this.item, event));
    html.find(".book-type").change((event) => this._changeBookType(this.item, event));

    html
      .find(".table-contents")
      .click(async (event) => this._createTableOfContent(this.item, event));

    html.find(".new-topic").click(async (event) => this._addTopic(this.item, event));

    html.find(".delete-topic").click(async (event) => this._removeTopic(this.item, event));
  }

  async _readBook(item, event) {
    event.preventDefault();

    const dataset = getDataset(event);
    await this.item.system.readBook(this.item, dataset);
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
      level: 0,
      mastery: false,
      labtext: null,
      labtextTitle: ""
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
    let confirm = true;
    let flavor = "Neutral";
    if (this.item.isOwned) {
      flavor = ArM5eActorSheet.getFlavor(this.item.actor.type);
    }
    if (game.settings.get("arm5e", "confirmDelete")) {
      const confirm = await getConfirmation(
        game.i18n.localize("arm5e.dialog.delete-topic"),
        game.i18n.localize("arm5e.dialog.delete-question"),
        flavor
      );
    }
    if (confirm) {
      await item.update({
        "system.topics": topics,
        "flags.arm5e.currentBookTopic": Math.max(0, Math.min(idx - 1, topics.length))
      });
    }
  }

  async _changeBookType(item, event) {
    event.preventDefault();
    // let tmp = $(".book-category");
    let index = Number(getDataset(event).index);
    const topics = item.system.topics;
    let bookType = topics[index].type;

    let chosenType = $(".book-type").find("option:selected")[0].value;
    let topic = topics[index];
    topic.type = chosenType;
    if (chosenType === "Tractatus") {
      topic.level = 0;
    }
    topics[index] = topic;
    let updateData = {};
    updateData[`system.topics`] = topics;
    this.submit({ preventClose: true, updateData: updateData });
  }

  async _changeTopicCategory(item, event) {
    event.preventDefault();
    // let tmp = $(".book-category");
    // let tmp2 = tmp.find("option:selected");
    // let chosenTopic = tmp2[0].value;
    let chosenTopic = $(".book-category").find("option:selected")[0].value;

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
      topic.labtext = null;
      topic.labtextTitle = "";
    } else if (chosenTopic === "art") {
      // missing data, reset to default
      topic.type = bookType;
      topic.art = "cr";
      topic.key = null;
      topic.option = null;
      topic.category = "art";
      topic.labtext = null;
      topic.labtextTitle = "";
    } else if (chosenTopic === "mastery") {
      topic.type = "Tractatus";
      topic.art = null;
      topic.key = null;
      topic.option = null;
      topic.level = 0;
      topic.spellName = "Mastered spell";
      topic.category = "mastery";
      topic.labtext = null;
      topic.labtextTitle = "";
    } else {
      topic.type = null;
      topic.art = null;
      topic.key = null;
      topic.option = null;
      topic.spellName = null;
      topic.category = "labText";
      topic.labtext = null;
      topic.labtextTitle = "";
    }
    topics[index] = topic;
    let updateData = {};
    updateData[`system.topics`] = topics;
    this.submit({ preventClose: true, updateData: updateData });
  }

  async _showLabText(item, event) {
    let index = Number(getDataset(event).index);
    const topic = item.system.topics[index];

    const labText = await Item.create(
      {
        name: topic.labtextTitle,
        type: "laboratoryText",
        ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
        editable: false,
        system: topic.labtext
      },
      { temporary: true }
    );
    labText.sheet.render(true);
  }

  get tableOfContents() {
    let res = `<h3>${game.i18n.localize("arm5e.book.tableContents")}</h3><ol>`;
    for (const topic of this.item.system.topics) {
      if (topic.category == "labText") {
        res += `<li>${game.i18n.localize("arm5e.book.labText.intro")} `;
      } else {
        switch (topic.type) {
          case "Summa":
            res += `<li>${game.i18n.format("arm5e.book.summaLong", {
              quality: topic.quality,
              level: topic.level
            })} `;
            break;
          case "Tractatus":
            res += `<li>${game.i18n.format("arm5e.book.tractLong", {
              quality: topic.quality
            })} `;
            break;
        }
      }
      res += `${getTopicDescription(topic)}</li>`;
    }
    res += "</ol>";
    return res;
  }

  get tableOfContentsSynthetic() {
    let res = `<h3>${game.i18n.localize("arm5e.book.tableContents")}</h3><ol>`;
    for (const topic of this.item.system.topics) {
      let about;
      switch (topic.category) {
        case "mastery":
          about = `"${topic.spellName}" (${CONFIG.ARM5E.magic.arts[topic.spellTech].short} ${
            CONFIG.ARM5E.magic.arts[topic.spellForm].short
          }) `;
          break;
        case "ability":
          const ab = CONFIG.ARM5E.ALL_ABILITIES[topic.key];
          if (ab) {
            about = `"${game.i18n.format(ab.mnemonic, { option: topic.option })}"`;
          } else {
            about = `"${game.i18.localize("arm5e.generic.unknown")} ${game.i18nlocalize(
              "arm5e.sheet.bookTopic"
            )}"`;
          }
          break;
        case "art":
          about = CONFIG.ARM5E.magic.arts[topic.art].label;
          break;
        case "labText":
          about = topic.labtextTitle;
          break;
      }

      if (topic.category == "labText") {
        let type = "other";
        switch (topic.labtext.type) {
          case "spell":
            type = game.i18n.localize("ITEM.TypeSpell");

            break;
          case "enchantment":
            type = game.i18n.localize("ITEM.TypeEnchantment");
            break;
        }
        res += `<li>${game.i18n.localize("ITEM.TypeLaboratorytext")} (${type}) "${about}"`;
      } else {
        switch (topic.type) {
          case "Summa":
            res += `<li>${game.i18n.format("arm5e.book.summaShort", {
              quality: topic.quality,
              level: topic.level
            })} ${about}`;
            break;
          case "Tractatus":
            res += `<li>${game.i18n.format("arm5e.book.tractShort", {
              quality: topic.quality
            })} ${about}`;
            break;
        }
      }
      //
    }
    res += "</ol>";
    return res;
  }

  _createTableOfContent(item, event) {
    let desc = item.system.description;
    if (event.shiftKey) {
      desc += this.tableOfContents;
    } else {
      desc += this.tableOfContentsSynthetic;
    }
    item.update({ "system.description": desc });
  }

  /** @inheritdoc */
  async _updateObject(event, formData) {
    if (!this.object.id) return;
    const expanded = expandObject(formData);
    const source = this.object.toObject();
    const index = Number(Object.keys(expanded.system.topics)[0]);
    if (expanded?.system?.topics) {
      expanded.system.topics = mergeObject(source.system.topics, expanded.system.topics);
    }

    // manage readonly fields
    if (expanded.system.topics[index].category == "mastery") {
      expanded.system.topics[index].type = "Tractatus";
    } else if (expanded.system.topics[index].category == "labText") {
      expanded.system.topics[index].labtextTitle = source.system.topics[index].labtextTitle;
      expanded.system.topics[index].labtext = source.system.topics[index].labtext;
    }

    return await this.object.update(expanded);
  }
}
export function getTopicDescription(topic) {
  let desc;
  switch (topic.category) {
    case "ability":
      const ab = CONFIG.ARM5E.ALL_ABILITIES[topic.key];
      if (ab) {
        desc = `"${game.i18n.format(ab.mnemonic, { option: topic.option })}"`;
      } else {
        desc = `"${game.i18.localize("arm5e.generic.unknown")} ${game.i18nlocalize(
          "arm5e.sheet.bookTopic"
        )}"`;
      }
      break;
    case "art":
      desc = game.i18n.format("arm5e.scriptorium.msg.diaryTopic.art", {
        art: CONFIG.ARM5E.magic.arts[topic.art].label
      });
      break;
    case "mastery":
      desc = game.i18n.format("arm5e.scriptorium.msg.diaryTopic.spell", {
        spell: topic.spellName
      });
      break;
    case "labText":
      if (topic.labtextTitle === "") {
        return game.i18.localize("arm5e.generic.nothing");
      } else {
        switch (topic.labtext.type) {
          case "spell":
            desc = game.i18n.format("arm5e.book.labText.spell", {
              spell: topic.labtextTitle
            });
            break;
          case "enchantment":
            desc = game.i18n.format("arm5e.book.labText.enchantment", {
              enchantment: topic.labtextTitle
            });
            break;
          case "raw":
            desc = topic.labtextTitle;
            break;
        }
      }
      break;
  }
  return desc;
}
