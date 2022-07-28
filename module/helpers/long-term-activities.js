import { log } from "../tools.js";
import { ROLL_PROPERTIES } from "./rollWindow.js";

export async function applyAgingEffects(html, actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();
  const agingTable = docs.filter(rt => rt.name === "Aging table")[0];
  let res = agingTable.getResultsForRoll(roll.total)[0].data.text;
  let dialogData = CONFIG.ARM5E.activities.aging[res];

  dialogData.year = actor.rollData.environment.year;
  dialogData.choice = res === "crisis" || res === "anyAgingPt";
  dialogData.chars = CONFIG.ARM5E.character.characteristics;

  const renderedTemplate = await renderTemplate(
    "systems/arm5e/templates/generic/aging-dialog.html",
    dialogData
  );
  let resultAging;
  await new Promise(resolve => {
    new Dialog(
      {
        title: game.i18n.localize("arm5e.aging.crisis.summary"),
        content: renderedTemplate,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("Apply"),
            callback: async html => {
              let char = dialogData.char;
              let find = html.find(".SelectedCharacteristic");
              if (find.length > 0) {
                char = find[0].value;
              }
              resultAging = await actor.addAgingPoints(dialogData.impact, char, dialogData.char2);
              resolve();
            }
          },
          no: {
            icon: "<i class='fas fa-bomb'></i>",
            label: game.i18n.localize("Cancel"),
            callback: html => {
              resolve();
            }
          }
        }
      },
      {
        classes: ["arm5e-dialog", "dialog"],
        height: "600px",
        width: "400px"
      }
    ).render(true);
  });
  resultAging.type = "aging";
  resultAging.year = dialogData.year;
  resultAging.roll = { formula: roll._formula, result: roll.result };

  createAgingDiaryEntry(actor, resultAging);
}

export async function agingCrisis(html, actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();

  const crisisTable = docs.filter(rt => rt.name === "Aging crisis table")[0];
  let res = crisisTable.getResultsForRoll(roll.total)[0].data.text;

  const title =
    '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.aging.crisis.summary") + "</h2>";

  // log(false, `Crisis result expanded: ${msg}`);
  ChatMessage.create({
    content: title + "<h3>" + game.i18n.localize(`arm5e.aging.crisis.${res}`) + "</h3><br/>",
    speaker: ChatMessage.getSpeaker({
      actor: actor
    }),
    whisper: ChatMessage.getWhisperRecipients("gm")
  });

  await actor.update({ data: { pendingCrisis: false } }, {});
}

async function createAgingDiaryEntry(actor, input) {
  let desc =
    game.i18n.localize("arm5e.aging.result0") +
    "<br/>" +
    game.i18n.format("arm5e.aging.result1", {
      character: actor.name,
      year: input.year
    });
  if (input.apparent == 0) {
    desc += game.i18n.localize("arm5e.aging.result2");
  } else if (input.crisis) {
    desc += game.i18n.localize("arm5e.aging.result3");
  }
  for (let [key, char] of Object.entries(input.charac)) {
    if (char.aging) {
      desc += game.i18n.format("arm5e.aging.result4", {
        num: char.aging,
        characteristic: game.i18n.localize(CONFIG.ARM5E.character.characteristics[key].label)
      });
    }
    if (char.score) {
      desc += game.i18n.format("arm5e.aging.result5", {
        characteristic: game.i18n.localize(CONFIG.ARM5E.character.characteristics[key].label)
      });
    }
  }

  if (input.decrepitude) {
    desc += game.i18n.format("arm5e.aging.result6", {
      num: input.decrepitude
    });
  }

  desc += "<br/>- Roll: " + input.roll.formula + " => " + input.roll.result;
  let diaryEntry = {
    name: game.i18n.format("arm5e.aging.resultTitle", {
      character: actor.name
    }),
    img: "/systems/arm5e/assets/icons/Icon_Aging_and_Decrepitude.png",
    type: "diaryEntry",
    data: {
      year: input.year,
      season: "winter",
      activity: "aging",
      description: "<p>" + desc + "</p>",
      applied: true
    },
    flags: { arm5e: { effect: input } }
  };

  await actor.createEmbeddedDocuments("Item", [diaryEntry], {});
}

function genericValidationOfActivity(context) {}

function checkForDuplicate(context, array) {}

export function validAdventuring(context, actor, item) {
  const itemData = item.data;
  context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };
  let abilitiesArr = Object.values(itemData.data.progress.abilities);
  // look for duplicates
  let abiltiesIds = abilitiesArr.map(e => {
    return e.id;
  });
  if (
    abiltiesIds.some(e => {
      return abiltiesIds.indexOf(e) !== abiltiesIds.lastIndexOf(e);
    })
  ) {
    context.data.applyPossible = "disabled";
    context.data.errorParam = "abilities";
    context.data.applyError = "arm5e.activity.msg.duplicates";
  }
  for (const ab of abilitiesArr) {
    if (ab.xp < 0 || ab.xp > 5) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activity.msg.wrongSingleItemXp";
      break;
    }
    context.data.totalXp.abilities += ab.xp;
  }

  // look for duplicates arts
  let artsArr = Object.values(itemData.data.progress.arts);
  let artsKeys = artsArr.map(e => {
    return e.key;
  });
  if (
    artsKeys.some(e => {
      return artsKeys.indexOf(e) !== artsKeys.lastIndexOf(e);
    })
  ) {
    context.data.applyPossible = "disabled";
    context.data.applyError = "arm5e.activity.msg.duplicates";
    context.data.errorParam = "arts";
  }
  for (const a of artsArr) {
    if (a.xp < 0 || a.xp > 5) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activitymsg.wrongSingleItemXp";
      break;
    }
    context.data.totalXp.arts += a.xp;
  }

  // look for duplicates spells
  let spellsArr = Object.values(itemData.data.progress.spells);
  let spellsIds = spellsArr.map(e => {
    return e.id;
  });
  if (
    spellsIds.some(e => {
      return spellsIds.indexOf(e) !== spellsIds.lastIndexOf(e);
    })
  ) {
    context.data.applyPossible = "disabled";
    context.data.applyError = "arm5e.activity.msg.duplicates";
    context.data.errorParam = "spells";
  }
  for (const s of spellsArr) {
    if (s.xp < 0 || s.xp > 5) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activity.msg.wrongSingleItemXp";
      break;
    }
    context.data.totalXp.spells += s.xp;
  }

  if (
    context.data.totalXp.abilities + context.data.totalXp.arts + context.data.totalXp.spells !=
    context.data.sourceQuality
  ) {
    context.data.applyPossible = "disabled";
    if (context.data.applyError === "") context.data.applyError = "arm5e.activity.msg.wrongTotalXp";
  }
}
