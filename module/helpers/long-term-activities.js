import { log } from "../tools.js";
import { ROLL_PROPERTIES } from "./rollWindow.js";
import { ArM5ePCActor } from "../actor/actor-pc.js";

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
// ********************
// Progress activities
// ********************

function genericValidationOfActivity(context) {}

function checkForDuplicates(param, context, array) {
  // look for duplicates
  let ids = array.map(e => {
    return e.id;
  });
  if (
    ids.some(e => {
      return ids.indexOf(e) !== ids.lastIndexOf(e);
    })
  ) {
    context.data.applyPossible = "disabled";
    context.data.errorParam = param;
    context.data.applyError = "arm5e.activity.msg.duplicates";
  }
}

function checkArtProgressItems(context, itemData, max) {
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
  let res = 0;
  for (const a of artsArr) {
    if (a.xp < 0 || a.xp > max) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activitymsg.wrongSingleItemXp";
      context.data.errorParam = max;
      return 0;
    }
    res += a.xp;
  }
  return res;
}

// return the total xp
function checkMaxXpPerItem(context, array, max) {
  let res = 0;
  for (const ab of array) {
    if (ab.xp < 0 || ab.xp > max) {
      context.data.applyPossible = "disabled";
      context.data.applyError = "arm5e.activity.msg.wrongSingleItemXp";
      context.data.errorParam = max;
      return 0;
    }
    res += Number(ab.xp);
  }
  return res;
}

export function validAdventuring(context, actor, item) {
  const itemData = item.data;
  context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };

  let abilitiesArr = Object.values(itemData.data.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.data.totalXp.abilities = checkMaxXpPerItem(context, abilitiesArr, 5);

  context.data.totalXp.arts += checkArtProgressItems(context, itemData, 5);

  let spellsArr = Object.values(itemData.data.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.data.totalXp.spells = checkMaxXpPerItem(context, spellsArr, 5);

  if (
    context.data.totalXp.abilities + context.data.totalXp.arts + context.data.totalXp.spells !=
    context.data.sourceQuality
  ) {
    context.data.applyPossible = "disabled";
    if (context.data.applyError === "") context.data.applyError = "arm5e.activity.msg.wrongTotalXp";
  }
}

export function validExposure(context, actor, item) {
  const itemData = item.data;

  context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };

  let abilitiesArr = Object.values(itemData.data.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.data.totalXp.abilities = checkMaxXpPerItem(context, abilitiesArr, 2);

  context.data.totalXp.arts += checkArtProgressItems(context, itemData, 2);

  let spellsArr = Object.values(itemData.data.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.data.totalXp.spells = checkMaxXpPerItem(context, spellsArr, 2);

  if (
    context.data.totalXp.abilities + context.data.totalXp.arts + context.data.totalXp.spells !=
    context.data.sourceQuality
  ) {
    context.data.applyPossible = "disabled";
    if (context.data.applyError === "") context.data.applyError = "arm5e.activity.msg.wrongTotalXp";
  }
}

export function validPractice(context, actor, item) {
  const itemData = item.data;
  const activityConfig = CONFIG.ARM5E.activities.generic[context.data.activity];
  context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };

  let abilitiesArr = Object.values(itemData.data.progress.abilities);
  checkForDuplicates("abilities", context, abilitiesArr);
  context.data.totalXp.abilities = checkMaxXpPerItem(
    context,
    abilitiesArr,
    context.data.sourceQuality
  );

  let spellsArr = Object.values(itemData.data.progress.spells);
  checkForDuplicates("spells", context, spellsArr);
  context.data.totalXp.spells = checkMaxXpPerItem(context, spellsArr, context.data.sourceQuality);
  let optionError = false;
  if (itemData.data.optionKey == "language") {
    if (spellsArr.length > 0) {
      optionError = true;
    } else {
      const filteredArray = actor.data.data.abilities.filter(e => {
        return abilitiesArr.some(filter => {
          return (
            filter.id === e._id && e.data.key != "livingLanguage" && e.data.key != "deadLanguage"
          );
        });
      });
      if (filteredArray.length > 0) {
        optionError = true;
      }
    }
  } else if (itemData.data.optionKey == "area") {
    if (spellsArr.length > 0) {
      optionError = true;
    } else {
      const filteredArray = actor.data.data.abilities.filter(e => {
        return abilitiesArr.some(filter => {
          return filter.id === e._id && e.data.key != "areaLore";
        });
      });
      if (filteredArray.length > 0) {
        optionError = true;
      }
    }
  } else if (itemData.data.optionKey == "mastery") {
    if (abilitiesArr.length > 0) {
      optionError = true;
    }
  }
  if (optionError === true) {
    context.data.applyPossible = "disabled";
    context.data.errorParam = game.i18n.localize(
      activityConfig.bonusOptions[itemData.data.optionKey].label
    );
    context.data.applyError = "arm5e.activity.msg.wrongOption";
  }

  if (
    context.data.totalXp.abilities + context.data.totalXp.arts + context.data.totalXp.spells !=
    context.data.sourceQuality
  ) {
    context.data.applyPossible = "disabled";
    if (context.data.applyError === "") context.data.applyError = "arm5e.activity.msg.wrongTotalXp";
  }
}

export function validTraining(context, actor, item) {
  const itemData = item.data;
  const activityConfig = CONFIG.ARM5E.activities.generic[context.data.activity];
  context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };
  let abilitiesArr = Object.values(itemData.data.progress.abilities);
  let spellsArr = Object.values(itemData.data.progress.spells);
  if (abilitiesArr.length + spellsArr.length > 1) {
    context.data.applyPossible = "disabled";
    context.data.applyError = "arm5e.activity.msg.tooManyItems";
    context.data.errorParam = 1;
    return;
  } else if (abilitiesArr.length + spellsArr.length == 0) {
    context.data.applyPossible = "disabled";
  }
  context.data.baseQuality = 3;
  if (itemData.data.teacher.id === null) {
    context.data.baseQuality += itemData.data.teacher.score;
  }

  if (abilitiesArr.length > 0) {
    const teacherScore = Number(itemData.data.progress.abilities[0].teacherScore);
    context.data.baseQuality = teacherScore + 3;
    let ability = Object.values(actor.data.data.abilities).find(e => {
      return e._id === itemData.data.progress.abilities[0].id;
    });
    if (ability === undefined) {
      // either the ability is no longer teachable or it has been deleted
      ability = actor.items.get(itemData.data.progress.abilities[0].id);

      if (ability === undefined) {
        // ability deleted
        // what should be done here?
        return;
      }
    }
    const coeff = actor._getAbilityXpCoeff(ability.data.key, ability.data.option);
    let newXp = (context.data.sourceQuality + ability.data.xp) * coeff;
    let teacherXp = ArM5ePCActor.getAbilityXp(teacherScore);
    if (newXp > teacherXp && !context.data.applied) {
      let newSource = teacherXp / coeff - ability.data.xp;
      context.data.theoriticalSource = context.data.sourceQuality;
      context.data.sourceQuality = newSource > 0 ? newSource : 0;
      context.data.errorParam = context.data.sourceQuality;
      context.data.applyError = "arm5e.activity.msg.gainCapped";
      context.data.cappedGain = true;
    }
    context.data.progress.abilities[0].xp = Number(context.data.sourceQuality);
    context.data.totalXp.abilities += Number(context.data.sourceQuality);
  } else if (spellsArr.length > 0) {
    const teacherScore = Number(itemData.data.progress.spells[0].teacherScore);
    context.data.baseQuality = teacherScore + 3;
    const ability = Object.values(actor.data.data.spells).find(e => {
      return e._id === itemData.data.progress.spells[0].id;
    });
    let newXp = context.data.sourceQuality + ability.data.xp;
    let teacherXp = ArM5ePCActor.getAbilityXp(teacherScore);
    if (newXp > teacherXp) {
      let newSource = teacherXp - ability.data.xp;
      context.data.theoriticalSource = context.data.sourceQuality;
      context.data.sourceQuality = newSource > 0 ? newSource : 0;
      context.data.errorParam = context.data.sourceQuality;
      context.data.applyError = "arm5e.activity.msg.gainCapped";
      context.data.cappedGain = true;
    }
    context.data.progress.spells[0].xp = Number(context.data.sourceQuality);
    context.data.totalXp.spells += Number(context.data.sourceQuality);
  }
}

export function validTeaching(context, actor, item) {
  const itemData = item.data;
  const activityConfig = CONFIG.ARM5E.activities.generic[context.data.activity];
  context.data.totalXp = { abilities: 0, arts: 0, spells: 0 };
  let abilitiesArr = Object.values(itemData.data.progress.abilities);
  let artsArr = Object.values(itemData.data.progress.arts);
  let spellsArr = Object.values(itemData.data.progress.spells);
  if (abilitiesArr.length + spellsArr.length + artsArr.length > 1) {
    context.data.applyPossible = "disabled";
    context.data.applyError = "arm5e.activity.msg.tooManyItems";
    context.data.errorParam = 1;
    return;
  } else if (abilitiesArr.length + artsArr.length + spellsArr.length == 0) {
    context.data.applyPossible = "disabled";
  }
  context.data.baseQuality = 6 + itemData.data.teacher.teaching + itemData.data.teacher.com;
  if (itemData.data.teacher.applySpec) {
    context.data.baseQuality++;
  }

  if (abilitiesArr.length > 0) {
    const teacherScore = Number(itemData.data.progress.abilities[0].teacherScore);
    let ability = Object.values(actor.data.data.abilities).find(e => {
      return e._id === itemData.data.progress.abilities[0].id;
    });
    if (ability === undefined) {
      // either the ability is no longer teachable or it has been deleted
      ability = actor.items.get(itemData.data.progress.abilities[0].id);

      if (ability === undefined) {
        // ability deleted
        // what should be done here?
        return;
      }
    }
    const coeff = actor._getAbilityXpCoeff(ability.data.key, ability.data.option);
    let newXp = (context.data.sourceQuality + ability.data.xp) * coeff;
    let teacherXp = ArM5ePCActor.getAbilityXp(teacherScore);
    if (newXp > teacherXp && !context.data.applied) {
      let newSource = teacherXp / coeff - ability.data.xp;
      context.data.theoriticalSource = context.data.sourceQuality;
      context.data.sourceQuality = newSource > 0 ? newSource : 0;
      context.data.errorParam = context.data.sourceQuality;
      context.data.applyError = "arm5e.activity.msg.gainCapped";
      context.data.cappedGain = true;
    }
    context.data.progress.abilities[0].xp = Number(context.data.sourceQuality);
    context.data.totalXp.abilities += Number(context.data.sourceQuality);
  } else if (spellsArr.length > 0) {
    const teacherScore = Number(itemData.data.progress.spells[0].teacherScore);
    const spell = Object.values(actor.data.data.spells).find(e => {
      return e._id === itemData.data.progress.spells[0].id;
    });
    let newXp = context.data.sourceQuality + spell.data.xp;
    let teacherXp = ArM5ePCActor.getAbilityXp(teacherScore);
    if (newXp > teacherXp) {
      let newSource = teacherXp - spell.data.xp;
      context.data.theoriticalSource = context.data.sourceQuality;
      context.data.sourceQuality = newSource > 0 ? newSource : 0;
      context.data.errorParam = context.data.sourceQuality;
      context.data.applyError = "arm5e.activity.msg.gainCapped";
      context.data.cappedGain = true;
    }
    context.data.progress.spells[0].xp = Number(context.data.sourceQuality);
    context.data.totalXp.spells += Number(context.data.sourceQuality);
  } else if (artsArr.length > 0) {
    const progressArt = itemData.data.progress.arts[0];
    const teacherScore = Number(progressArt.teacherScore);
    let artType = "techniques";
    if (Object.keys(CONFIG.ARM5E.magic.techniques).indexOf(progressArt.key) == -1) {
      artType = "forms";
    }
    const art = actor.data.data.arts[artType][progressArt.key];
    let newXp = context.data.sourceQuality + art.xp;
    let teacherXp = ArM5ePCActor.getArtXp(teacherScore);
    if (newXp > teacherXp) {
      let newSource = teacherXp - art.xp;
      context.data.theoriticalSource = context.data.sourceQuality;
      context.data.sourceQuality = newSource > 0 ? newSource : 0;
      context.data.errorParam = context.data.sourceQuality;
      context.data.applyError = "arm5e.activity.msg.gainCapped";
      context.data.cappedGain = true;
    }
    context.data.progress.arts[0].xp = Number(context.data.sourceQuality);
    context.data.totalXp.arts += Number(context.data.sourceQuality);
  }
}

// get a new title for a diary entry if it is still the default : "New DiaryEntry"
export function getNewTitleForActivity(actor, item) {
  const DEFAULT_TITLE = "New DiaryEntry";
  if (item.data.name !== DEFAULT_TITLE) {
    return item.data.name;
  }
  const systemData = item.data.data;
  let teacher = systemData.teacher.name;
  let skills = "";
  for (const ability of Object.values(systemData.progress.abilities)) {
    let tmp = actor.items.get(ability.id);
    if (tmp != null && ability.xp > 0) {
      skills += `${tmp.name}, `;
    }
  }
  for (const art of Object.values(systemData.progress.arts)) {
    let tmp = CONFIG.ARM5E.magic.arts[art.key].label;
    if (art.xp > 0) {
      skills += `${tmp}, `;
    }
  }
  for (const spell of Object.values(systemData.progress.spells)) {
    let tmp = actor.items.get(spell.id);
    if (tmp != null && spell.xp > 0) {
      skills += `${tmp.name} ${game.i18n.localize("arm5e.sheet.mastery")}, `;
    }
  }

  skills = skills.slice(0, -2);
  switch (item.data.data.activity) {
    case "adventuring":
      return game.i18n.format("arm5e.activity.title.adventuring", {
        season: game.i18n.localize(CONFIG.ARM5E.seasons[systemData.season].label),
        year: systemData.year
      });
    case "practice":
      return game.i18n.format("arm5e.activity.title.practice", { skills: skills });
    case "exposure":
      return game.i18n.format("arm5e.activity.title.exposure", { skills: skills });
    case "training":
      return game.i18n.format("arm5e.activity.title.training", {
        skills: skills,
        teacher: teacher
      });
    case "teaching":
      return game.i18n.format("arm5e.activity.title.teaching", {
        skills: skills,
        teacher: teacher
      });
    default:
      return DEFAULT_TITLE;
  }
}
