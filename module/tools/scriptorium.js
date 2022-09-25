import { debug, log } from "../tools.js";

export class ScriptoriumObject {
  seasons = CONFIG.ARM5E.seasons;
  abilityKeysList = CONFIG.ARM5E.LOCALIZED_ABILITIES;
  arts = CONFIG.ARM5E.magic.arts;
  bookTopics = CONFIG.ARM5E.books.topics;
  bookTypes = CONFIG.ARM5E.books.types;
  year = game.settings.get("arm5e", "currentDate").year;
  season = game.settings.get("arm5e", "currentDate").season;

  reading = {
    reader: { id: null },
    book: {
      id: null,
      title: game.i18n.localize("arm5e.activity.book.title"),
      language: game.i18n.localize("arm5e.skill.commonCases.latin"),
      topic: "ability",
      type: "Summa",
      author: game.i18n.localize("arm5e.generic.unknown"),
      quality: 1,
      level: 1,
      key: "",
      option: "",
      spell: "",
      art: ""
    }
  };
}

export class Scriptorium extends FormApplication {
  constructor(data, options) {
    super(data, options);
  }
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "scriptorium-sheet"],
      title: "Scriptorium",
      template: "systems/arm5e/templates/generic/scriptorium.html",
      dragDrop: [
        { dragSelector: null, dropSelector: ".drop-book" },
        { dragSelector: null, dropSelector: ".drop-reader" }
      ],
      tabs: [
        {
          navSelector: ".scriptorium-tabs",
          contentSelector: ".scriptorium-body",
          initial: "reading"
        }
      ],
      width: "600",
      height: "800",
      submitOnChange: true,
      closeOnSubmit: false
    });
  }

  async _onDrop(event) {
    const dropData = TextEditor.getDragEventData(event);
    if (dropData.type == "Item" && event.currentTarget.dataset.drop === "book") {
      // if (this.item.system.activity === "teaching" || this.item.system.activity === "training") {
      const book = await Item.implementation.fromDropData(dropData);
      if (book.type === "book") {
        await this._setBook(book);
      }
    } else if (dropData.type == "Actor" && event.currentTarget.dataset.drop === "reader") {
      const reader = await Actor.implementation.fromDropData(dropData);
      if (reader.type === "player" || reader.type === "npc") {
        await this._setReader(reader);
      }
    }
  }

  async getData(options = {}) {
    const context = foundry.utils.expandObject(await super.getData().object);
    context.error = false;
    context.ui = { createPossible: "disabled", warning: "", warningParam: "", editItem: "" };
    let currentDate = game.settings.get("arm5e", "currentDate");
    context.curYear = currentDate.year;
    context.curSeason = currentDate.season;
    let maxLevel = 99;
    if (context.type === "Summa" || context.reading.book.level) {
      maxLevel = context.reading.book.level;
    }
    if (context.reading.book.id !== null) {
      context.ui.canEditBook = "readonly";
      context.ui.disabledBook = "disabled";
    }
    if (context.reading.book.topic == "spell") {
      context.ui.disableType = "disabled";
    }

    if (!context.reading.reader?.id) {
      return context;
    }

    context.ui.canEditReader = "readonly";
    context.ui.disabledReader = "disabled";
    let reader = game.actors.get(context.reading.reader.id);

    // get known languages
    context.reading.reader.languages = reader.system.abilities
      .filter(e => {
        return (
          (e.system.key === "livingLanguage" || e.system.key === "deadLanguage") &&
          e.system.finalScore >= 4
        );
      })
      .map(lang => {
        return { id: lang.id, name: lang.name, score: lang.system.finalScore };
      });

    // always get spell list to have at least one spell selected
    context.reading.reader.spells = reader.system.spells.map(s => {
      return { id: s.id, name: s.name };
    });
    switch (context.reading.book.topic) {
      case "ability": {
        context.reading.reader.abilities = reader.system.abilities.map(a => {
          return {
            id: a.id,
            key: a.system.key,
            option: a.system.option,
            name: game.i18n.format(
              CONFIG.ARM5E.LOCALIZED_ABILITIES[a.system.key]
                ? CONFIG.ARM5E.LOCALIZED_ABILITIES[a.system.key].mnemonic
                : "Unknown",
              {
                option: a.system.option
              }
            ),
            score: a.system.finalScore
          };
        });

        let filteredAbilities = context.reading.reader.abilities.filter(a => a.score < maxLevel);
        // does the reader has the book topic ability?
        let abilityId = context.reading.reader.abilities.find(
          a => a.key == context.reading.book.key && a.option == context.reading.book.option
        )?.id;

        if (abilityId) {
          // is the reader low skilled enough?
          if (filteredAbilities.find(a => a.id == abilityId)) {
            context.reading.reader.ability = abilityId;
          } else {
            context.ui.editItem = "disabled";
            context.ui.warning = "arm5e.scriptorium.msg.tooSkilled";
            context.ui.warningParam = "";
            context.error = true;
          }
          context.reading.reader.abilities = filteredAbilities;
        } else {
          // check if the ability is not found because of the option field
          filteredAbilities = filteredAbilities.filter(a => a.key == context.reading.book.key);
          if (filteredAbilities.length > 0) {
            context.ui.warning = "arm5e.scriptorium.msg.whichItem";
            context.ui.warningParam = game.i18n.localize("arm5e.sheet.ability");
            context.reading.reader.ability = filteredAbilities[0];
            context.reading.reader.abilities = filteredAbilities;
          } else {
            context.ui.editItem = "disabled";
            context.ui.warning = "arm5e.scriptorium.msg.missingItem";
            context.ui.warningParam = game.i18n.localize("arm5e.sheet.ability");
            context.error = true;
          }
          //context.error = true;
        }

        break;
      }
      case "art": {
        break;
      }
      case "spell": {
        if (context.reading.reader.spells.length === 0) {
          context.ui.editItem = "disabled";
          context.ui.warning = "arm5e.scriptorium.msg.missingItem";
          context.ui.warningParam = game.i18n.localize("arm5e.sheet.spell");
          context.error = true;
        } else {
          if (!context.reading.reader.spell) {
            context.reading.reader.spell = context.reading.reader.spells[0].id;
          }
        }

        break;
      }
      default:
        context.ui.warning = "Error";
        break;
    }
    this.checkReading(context, reader);
    if (context.error === false) {
      context.ui.createPossible = "";
    }

    log(false, `Scriptorium reading data: ${JSON.stringify(context.reading)}`);
    log(false, `Scriptorium ui: ${JSON.stringify(context.ui)}`);
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find(".set-date").click(this.setDate.bind(this));
    html.find(".change-season").change(this._changeSeason.bind(this));
    html.find(".change-year").change(this._changeYear.bind(this));
    html.find(".book-topic").change(this._changeBookTopic.bind(this));
    html.find(".unlink-read-book").click(this._resetReadBook.bind(this));
    html.find(".unlink-reader").click(this._resetReader.bind(this));
    html.find(".create-activity").click(this._createDiaryEntry.bind(this));
  }

  async _createDiaryEntry(event) {
    const objectData = foundry.utils.expandObject(this.object);
    const reader = game.actors.get(objectData.reading.reader.id);
    const readerData = objectData.reading.reader;
    const book = objectData.reading.book;
    const dataset = event.currentTarget.dataset;
    let activityName = game.i18n.format("arm5e.scriptorium.reading.activity", {
      title: book.title
    });

    const entryData = [
      {
        name: activityName,
        type: "diaryEntry",
        system: {
          season: objectData.season,
          year: objectData.year,
          sourceQuality: book.quality,
          activity: "reading",
          progress: {
            abilities: [],
            arts: [],
            spells: []
          },
          optionKey: "standard",
          applied: false,
          description: activityName
        }
      }
    ];

    switch (book.topic) {
      case "ability":
        entryData[0].system.progress.abilities.push({
          id: dataset.abilityId,
          category: CONFIG.ARM5E.LOCALIZED_ABILITIES[book.key]?.category ?? "general",
          name: CONFIG.ARM5E.LOCALIZED_ABILITIES[book.key]?.name ?? book.title,
          xp: book.quality
        });
        log(false, entryData[0].system.progress.abilities[0]);
        break;
      case "art":
        entryData[0].system.progress.arts.push({
          key: book.art,
          xp: book.quality
        });
        break;
      case "spell":
        let readerSpell = reader.system.spells.find(s => s.id === dataset.spellId);
        entryData[0].system.progress.spells.push({
          id: dataset.spellId,
          name: readerSpell.name,
          form: readerSpell.system.form.value,
          xp: book.quality
        });
    }
    let entry = await reader.createEmbeddedDocuments("Item", entryData, {});
    entry[0].sheet.render(true);
  }

  async _resetReader(event) {
    let updatedData = {
      "reading.reader.id": null,
      "reading.reader.name": "",
      "reading.reader.ability": "",
      "reading.reader.spellName": "",
      "reading.reader.language": ""
    };
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _resetReadBook(event) {
    let updatedData = {
      "reading.book.id": null,
      "reading.book.level":
        this.object.reading.book.type === "Tractatus" ? 0 : this.object.reading.book.level
    };
    await this.submit({
      preventClose: true,
      updateData: updatedData
    });
  }

  async _changeSeason(event) {
    await this.submit({
      preventClose: true,
      updateData: { season: event.currentTarget.value }
    });
  }

  async _changeYear(event) {
    await this.submit({
      preventClose: true,
      updateData: { year: event.currentTarget.value }
    });
  }

  async _setBook(book) {
    log(false, "set book info");
    let bookInfo = {
      id: book._id,
      title: book.name,
      type: book.system.type,
      quality: book.system.quality,
      level: book.system.level,
      language: book.system.language,
      author: book.system.author,
      topic: book.system.topic.category,
      key: book.system.topic.key,
      option: book.system.topic.option == null ? "" : book.system.topic.option,
      art: book.system.topic.art,
      spellName: book.system.topic.spellName
    };
    // const readingData = { book: bookInfo };
    await this.submit({
      preventClose: true,
      updateData: { ["reading.book"]: bookInfo }
    });
  }

  async _setReader(reader) {
    log(false, "set reader info");
    let readerInfo = {
      id: reader._id,
      name: reader.name
    };
    const readingData = { reader: readerInfo };
    await this.submit({
      preventClose: true,
      updateData: { reading: readingData }
    });
  }

  async setDate(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    ui.notifications.info(
      game.i18n.format("arm5e.notification.setDate", {
        year: dataset.year,
        season: game.i18n.localize(CONFIG.ARM5E.seasons[dataset.season].label)
      })
    );
    await game.settings.set("arm5e", "currentDate", {
      year: dataset.year,
      season: dataset.season
    });
    this.render();
  }

  async _updateObject(event, formData) {
    if (formData.season) {
      this.object.season = formData.season;
    }
    if (formData.year) {
      this.object.year = formData.year;
    }
    for (let [key, value] of Object.entries(formData)) {
      log(false, `Updated ${key} : ${value}`);
      this.object[key] = value;
    }
    // this.object = foundry.utils.expandObject(this.object);
    // log(false, `Scriptorium object: ${JSON.stringify(this.object)}`);
    this.render();

    return;
  }

  async _changeBookTopic(event) {
    event.preventDefault();

    let chosenTopic = $(".book-topic")
      .find("option:selected")
      .val();
    let bookInfo = {};
    if (chosenTopic === "ability") {
      bookInfo.art = null;
      bookInfo.key = "awareness";
      bookInfo.option = "";
      bookInfo.spellName = null;
      bookInfo.topic = "ability";
    } else if (chosenTopic === "art") {
      // missing data, reset to default
      bookInfo.art = "cr";
      bookInfo.key = null;
      bookInfo.option = "";
      bookInfo.spellName = null;
      bookInfo.topic = "art";
    } else {
      bookInfo.art = null;
      bookInfo.key = null;
      bookInfo.option = "";
      bookInfo.spellName = "Mastered spell";
      bookInfo.topic = "spell";
      bookInfo.type = "Tractatus";
    }
    const readingData = { book: bookInfo };
    await this.submit({
      preventClose: true,
      updateData: { reading: readingData }
    });
    // log(false, `Book topic: ${item.system.topic}`);
  }

  checkReading(context, reader) {
    const bookData = context.reading.book;

    // is the character able to  read?
    let readingSkill = reader.getAbilityStats("artesLib");
    if (readingSkill.score == 0) {
      context.ui.warning = "arm5e.scriptorium.msg.illiterate";
      context.ui.warningParam = "";
      context.error = true;
    }
    // know any language at proper level?
    if (context.reading.reader.languages.length == 0) {
      context.ui.warning = "arm5e.scriptorium.msg.noLanguage";
      context.ui.warningParam = "";
      context.error = true;
    }
    if (context.reading.book.type === "Summa") {
      if (isNaN(context.reading.book.level) || context.reading.book.level < 1) {
        context.ui.warning = "arm5e.scriptorium.msg.invalidLevel";
        context.ui.warningParam = "";
        context.error = true;
      }
    }
    if (isNaN(context.reading.book.quality) || context.reading.book.quality < 1) {
      context.ui.warning = "arm5e.scriptorium.msg.invalidQuality";
      context.ui.warningParam = "";
      context.error = true;
    }

    switch (bookData.topic) {
      case "ability": {
        if (bookData.type === "Summa") {
          let ab = reader.system.abilities.find(a => {
            return a._id === context.reading.reader.ability;
          });
          if (ab?.system.finalscore >= bookData.level) {
            context.ui.warning = "arm5e.scriptorium.msg.tooSkilled";
            context.ui.warningParam = "";
            context.error = true;
          }
        }
        break;
      }
      default:
        if (!reader._isMagus()) {
          context.ui.warning = "arm5e.scriptorium.msg.notMagus";
          context.ui.warningParam = "";
          context.error = true;
        }
    }
  }
}
