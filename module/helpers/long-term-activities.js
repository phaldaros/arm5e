import { log } from "../tools.js";
import { ROLL_PROPERTIES } from "./rollWindow.js";

export async function applyAgingEffects(html, actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();
  const agingTable = docs.filter((rt) => rt.name === "Aging table")[0];
  let res = agingTable.getResultsForRoll(roll.total)[0].data.text;
  let dialogData = CONFIG.ARM5E.activities.aging[res];

  dialogData.year = actor.data.data.roll.year;
  dialogData.choice = res === "crisis" || res === "anyAgingPt";
  dialogData.chars = CONFIG.ARM5E.character.characteristics;

  const renderedTemplate = await renderTemplate(
    "systems/arm5e/templates/generic/aging-dialog.html",
    dialogData
  );
  let resultAging;
  await new Promise((resolve) => {
    new Dialog(
      {
        title: game.i18n.localize("arm5e.aging.crisis.summary"),
        content: renderedTemplate,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("Apply"),
            callback: async (html) => {
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
            callback: (html) => {
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

  createDiaryEntry(actor, resultAging);
}

export async function agingCrisis(html, actor, roll, message) {
  let rtCompendium = game.packs.get("arm5e.rolltables");
  let docs = await rtCompendium.getDocuments();

  const crisisTable = docs.filter((rt) => rt.name === "Aging crisis table")[0];
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

async function createDiaryEntry(actor, input) {
  let desc = actor.name + " aged 1 year during winter of " + input.year + ".<br/>";
  if (input.apparent == 0) {
    desc += "His/her appearance didn't change. <br/>";
  } else if (input.crisis) {
    desc += "It resulted in a health crisis.<br/>";
  }

  for (let [key, char] of Object.entries(input.charac)) {
    if (char.aging) {
      desc +=
        "- Gained " +
        char.aging +
        " point(s) of aging in " +
        game.i18n.localize(CONFIG.ARM5E.character.characteristics[key].label) +
        " <br/>";
    }
    if (char.score) {
      desc +=
        "- Lost one point in " +
        game.i18n.localize(CONFIG.ARM5E.character.characteristics[key].label) +
        " <br/>";
    }
  }

  if (input.decrepitude) {
    desc += "- Gained " + input.decrepitude + " point(s) of decrepitude<br/>";
  }

  desc += "<br/>- Roll: " + input.roll.formula + " => " + input.roll.result;
  let diaryEntry = {
    name: game.i18n.localize("arm5e.aging.roll.label"),
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
