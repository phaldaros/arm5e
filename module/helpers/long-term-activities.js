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
