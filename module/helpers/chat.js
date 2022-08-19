import { log, putInFoldableLink } from "../tools.js";

export function addChatListeners(message, html, data) {
  let actor = game.actors.get(data.message.speaker.actor);

  if (actor === undefined) {
    // Actor no longer exists in the world
    return;
  }

  let tokenName;
  let actorImg = actor.img;

  if (actor.token != null) {
    tokenName = actor.token.name;
    if (actor.token.img != undefined) {
      actorImg = actor.system.token.img;
    }
  } else if (actor.prototypeToken !== null) {
    tokenName = actor.prototypeToken.name;
    if (actor.prototypeToken.img) {
      actorImg = actor.prototypeToken.img;
    }
  }

  const msgTitle = html.find(".message-sender");
  // is there a better way?
  let text = msgTitle.text();
  text = text.replace("Gamemaster", tokenName);
  msgTitle.text(text);
  const actorFace = $(
    `<div class="item-image flex01"><img src="${actorImg}" title="${tokenName}" width="30" height="30">`
  );

  msgTitle.prepend(actorFace);
  let actorId = data.message.speaker.actor;
  const originatorOrGM =
    game.users.get(game.userId).isGM || game.users.get(game.userId).data.character == actorId;
  // Hide the details if you are not the GM

  if (originatorOrGM) {
    html.find(".clickable").click(ev => {
      html.find(`.details`).toggle();
    });
  } else {
    html.find(".clickable").remove();

    if (actor.type != "player") {
      html.find(".dice-result").remove();
      return;
    }
  }

  if (!message.isRoll) return;
  // old chat messages, ignore them
  if (data.message.flags.arm5e === undefined) {
    return;
  }
  let img = data.message.flags.arm5e?.roll?.img;
  if (img) {
    const chatTitle = html.find(".ars-chat-title");
    const newTitle = $(`<div class="item-image"><img src="${img}" width="30" height="30"></div>`);
    chatTitle.append(newTitle);
  }

  if (!originatorOrGM) {
    return;
  }

  let rollResult = html.find(".dice-total");
  if (data.message.flags.arm5e.secondaryScore) {
    let newValue = data.message.flags.arm5e.secondaryScore + Number(message.rolls[0].total);
    rollResult.text(rollResult.text() + ` ( ${(newValue < 0 ? "" : "+") + newValue} ) `);
  }

  // confidence has been used already => no button
  if (
    data.message.flags.arm5e.type === "confidence" &&
    (data.message.flags.arm5e.usedConf ?? 0) >= data.message.flags.arm5e?.confScore
  ) {
    return;
  }

  //   const damageButton = $(
  //     `<button class="dice-total-damage" style="${btnStyling}"><i class="fas fa-user-injured" title="{{localize "arm5e.messages.applyDamage"}}"></i></button>`
  //   );
  if (actor._isGrog()) {
    return;
  }
  let title = game.i18n.localize("arm5e.messages.useConf");
  let divide = data.message.flags.arm5e.divide;
  const useConfButton = $(
    `<button class="dice-confidence chat-button" data-divide="${divide}" data-msg-id="${data.message._id}" data-actor-id="${actorId}"><i class="fas fa-user-plus" title="${title}" ></i></button>`
  );

  const btnContainer = $(
    '<span class="btn-container" style="position:absolute; right:0; bottom:1px;"></span>'
  );
  //   btnContainer.append(damageButton);
  btnContainer.append(useConfButton);

  rollResult.append(btnContainer);

  // Handle button clicks
  useConfButton.click(ev => useConfidence(ev));
}

async function useConfidence(ev) {
  ev.stopPropagation();
  const actorId = ev.currentTarget.dataset.actorId;
  const message = game.messages.get(ev.currentTarget.dataset.msgId);
  const actor = game.actors.get(actorId);

  if ((message.flags.arm5e.usedConf ?? 0) < message.flags.arm5e.confScore) {
    if (await actor.useConfidencePoint()) {
      // add +3 * useConf to roll
      let bonus = 3;
      if (parseInt(ev.currentTarget.dataset.divide) === 2) {
        bonus /= 2;
      }

      // horrible code, TODO find a cleaner way.
      let total = $(ev.currentTarget)
        .closest(".dice-total")
        .text();
      let usedConf = message.flags.arm5e.usedConf + 1 || 1;
      let flavor = message.flavor;
      if (usedConf == 1) {
        flavor += "--------------- <br/>" + game.i18n.localize("arm5e.dialog.button.roll") + " : ";
        if ((message.flags.arm5e.botchCheck ?? 0) == 0) {
          flavor += message.rolls[0].dice[0].results[0].result;
        } else {
          flavor += 0;
        }
      }
      flavor += "<br/>" + game.i18n.localize("arm5e.sheet.confidence") + " : + 3";

      log(false, flavor);
      let newContent = parseFloat(total) + bonus;
      const dieRoll = new Roll(newContent.toString(10));
      await dieRoll.evaluate({ async: true });
      let msgData = {};
      msgData.speaker = message.speaker;
      msgData.flavor = flavor;
      msgData.flags = {
        arm5e: {
          usedConf: usedConf,
          confScore: message.flags.arm5e.confScore
        }
      };
      msgData.content = newContent;
      msgData.rolls = message.rolls;

      // updateData["data.flags.arm5e.usedConf"] = 1;
      // updateData["data.content"] = newContent;
      dieRoll.toMessage(msgData);
      // let msg = await ChatMessage.create(msgData);
      message.delete();
    }
  }
}

function getFlavorForPlayersTotalSpell(flavorTotalSpell, actorCaster, showDataOfNPC) {
  if (actorCaster.hasPlayerOwner) {
    return flavorTotalSpell;
  }
  if (showDataOfNPC) {
    return flavorTotalSpell;
  }
  return "";
}

function getFlavorForPlayersTotalPenetration(flavorTotalPenetration, actorCaster, showDataOfNPC) {
  if (actorCaster.hasPlayerOwner) {
    return flavorTotalPenetration;
  }
  if (showDataOfNPC) {
    return flavorTotalPenetration;
  }
  return "";
}

function getFlavorForPlayersTotalMagicResistance(
  flavorTotalMagicResistance,
  actorTarget,
  showDataOfNPC
) {
  if (actorTarget.hasPlayerOwner) {
    return flavorTotalMagicResistance;
  }
  if (showDataOfNPC) {
    return flavorTotalMagicResistance;
  }
  return "";
}

function getFlavorForPlayersResult({
  messageOnlyWithName,
  messageTotalWithName,
  actorTarget,
  actorCaster,
  showDataOfNPC
}) {
  if (actorTarget.hasPlayerOwner && actorCaster.hasPlayerOwner) {
    return messageTotalWithName;
  }
  if (showDataOfNPC) {
    return messageTotalWithName;
  }
  return messageOnlyWithName;
}

async function chatFailedCasting(actorCaster, roll, message, fatigue) {
  const levelOfSpell = actorCaster.rollData.magic.level;
  const totalOfSpell = roll._total;
  const title =
    '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.spellFailed") + "</h2>";
  const messageTotalOfSpell = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${totalOfSpell})`;
  const messageLevelOfSpell = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${levelOfSpell})`;
  const castingTotal = `= ${totalOfSpell - levelOfSpell}`;
  let lostFatigue = "";
  if (fatigue > 0) {
    lostFatigue = `<br/>${game.i18n.format("arm5e.messages.fatigueLost", { num: fatigue })} `;
  }
  const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
  let flavorForPlayers = `${title}`;
  let extendedMsg = ` ${messageTotalOfSpell} ${messageLevelOfSpell} ${castingTotal}${lostFatigue}`;
  let flavorForGM = flavorForPlayers + extendedMsg;
  if (showDataOfNPC) {
    flavorForPlayers = flavorForGM;
  }
  ChatMessage.create({
    content: "",
    flavor: flavorForPlayers,
    speaker: ChatMessage.getSpeaker({
      actorCaster
    })
  });
  // if (flavorForPlayers !== flavorForGM) {
  //   privateMessage("", actorCaster, flavorForGM);
  // }
}

async function chatContestOfPower({
  actorCaster,
  actorTarget,
  penetrationTotal,
  magicResistance,
  total,
  form
}) {
  const title =
    '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.contestOfMagic") + "</h2>";
  const messageTotalOfSpell = `${game.i18n.localize("arm5e.sheet.powers")} (${penetrationTotal})`;
  const messageMight = magicResistance?.might
    ? `${game.i18n.localize("arm5e.sheet.might")}: (${magicResistance.might})`
    : "";

  const messageForm = magicResistance?.formScore
    ? `+ ${game.i18n.localize("arm5e.sheet.formScore")}: (${magicResistance.formScore})`.replace(
        "$form$",
        form
      )
    : "";
  const messageAura =
    magicResistance.aura == 0
      ? ""
      : ` + ${game.i18n.localize("arm5e.sheet.aura")}: (${magicResistance.aura})`;

  const messageParma = magicResistance?.parma?.score
    ? `${game.i18n.localize("arm5e.sheet.parma")}: (${magicResistance.parma.score})`
    : "";

  const messageParmaSpeciality = magicResistance?.specialityIncluded
    ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
        magicResistance.specialityIncluded
      })`
    : "";
  const messageTotalMagicResistance = `${game.i18n.localize(
    "arm5e.sheet.totalMagicResistance"
  )}: (${magicResistance.total})`;

  const flavorTotalSpell = `${messageTotalOfSpell}<br/> `;
  const flavorTotalMagicResistance = `${messageMight}${messageParma}${messageParmaSpeciality}${messageForm}${messageAura}<br/><b>${messageTotalMagicResistance}</b>`;
  const messageTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistance")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpell")}`;

  const messageWithoutTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistanceWithNoTotal")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpellWithNoTotal")}`;

  const messageTotalWithName =
    total > 0
      ? messageTotal.replace("$target$", actorTarget.name).replace("$total$", total)
      : messageTotal.replace("$target$", actorTarget.name).replace("$total$", -total);

  const messageOnlyWithName =
    total > 0
      ? messageWithoutTotal.replace("$target$", actorTarget.name)
      : messageWithoutTotal.replace("$target$", actorTarget.name);

  const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
  const flavorForPlayersTotalSpell = getFlavorForPlayersTotalSpell(
    flavorTotalSpell,
    actorCaster,
    showDataOfNPC
  );
  const flavorForPlayersTotalMagicResistance = getFlavorForPlayersTotalMagicResistance(
    flavorTotalMagicResistance,
    actorTarget,
    showDataOfNPC
  );
  const flavorForPlayersResult = getFlavorForPlayersResult({
    messageOnlyWithName,
    messageTotalWithName,
    actorTarget,
    actorCaster,
    showDataOfNPC
  });
  const flavorForGM = `${flavorTotalSpell}${flavorTotalMagicResistance}`;
  const flavorForPlayers = `${flavorForPlayersTotalSpell}${flavorForPlayersTotalMagicResistance}`;

  const content = `<h4 class="dice-total">${flavorForPlayersResult}</h4>`;
  ChatMessage.create({
    content,
    flavor: title + putInFoldableLink("arm5e.sheet.label.details", flavorForPlayers),
    speaker: ChatMessage.getSpeaker({
      actorCaster
    })
  });
  if (flavorForPlayers !== flavorForGM) {
    privateMessage(content, actorCaster, title, flavorForGM);
  }
}

async function chatContestOfMagic({
  actorCaster,
  actorTarget,
  penetration,
  magicResistance,
  total,
  form
}) {
  const title =
    '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.contestOfMagic") + "</h2>";
  const messageTotalOfSpell = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${
    penetration.totalOfSpell
  })`;
  const messageLevelOfSpell = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${
    penetration.levelOfSpell
  })`;

  const messagePenetration = `+ ${game.i18n.localize("arm5e.sheet.penetration")} (${
    penetration.penetration
  })`;
  const messageSpeciality = penetration.specialityIncluded
    ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
        penetration.specialityIncluded
      })`
    : "";
  const messageTotalPenetration = `${game.i18n.localize("arm5e.sheet.totalPenetration")}: (${
    penetration.total
  })`;

  const messageMight = magicResistance?.might
    ? `${game.i18n.localize("arm5e.sheet.might")}: (${magicResistance.might})`
    : "";

  const messageForm = magicResistance?.formScore
    ? `+ ${game.i18n.localize("arm5e.sheet.formScore")}: (${magicResistance.formScore})`.replace(
        "$form$",
        form
      )
    : "";
  const messageAura =
    magicResistance.aura == 0
      ? ""
      : ` + ${game.i18n.localize("arm5e.sheet.aura")}: (${magicResistance.aura})`;

  const messageParma = magicResistance?.parma?.score
    ? `${game.i18n.localize("arm5e.sheet.parma")}: (${magicResistance.parma.score})`
    : "";

  const messageParmaSpeciality = magicResistance?.specialityIncluded
    ? ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${
        magicResistance.specialityIncluded
      })`
    : "";
  const messageTotalMagicResistance = `${game.i18n.localize(
    "arm5e.sheet.totalMagicResistance"
  )}: (${magicResistance.total})`;
  const flavorTotalSpell = `${messageTotalOfSpell}<br/> ${messageLevelOfSpell}<br/>`;
  const flavorTotalPenetration = `${messagePenetration}${messageSpeciality}<br/><b>${messageTotalPenetration}</b><br/>`;
  const flavorTotalMagicResistance = `${messageMight}${messageParma}${messageParmaSpeciality}${messageForm}${messageAura}<br/><b>${messageTotalMagicResistance}</b>`;

  const messageTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistance")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpell")}`;

  const messageWithoutTotal =
    total > 0
      ? `${game.i18n.localize("arm5e.sheet.spellOverMagicResistanceWithNoTotal")}`
      : `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpellWithNoTotal")}`;

  const messageTotalWithName =
    total > 0
      ? messageTotal.replace("$target$", actorTarget.name).replace("$total$", total)
      : messageTotal.replace("$target$", actorTarget.name).replace("$total$", -total);

  const messageOnlyWithName =
    total > 0
      ? messageWithoutTotal.replace("$target$", actorTarget.name)
      : messageWithoutTotal.replace("$target$", actorTarget.name);

  const showDataOfNPC = game.settings.get("arm5e", "showNPCMagicDetails") === "SHOW_ALL";
  const flavorForPlayersTotalSpell = getFlavorForPlayersTotalSpell(
    flavorTotalSpell,
    actorCaster,
    showDataOfNPC
  );
  const flavorForPlayersTotalPenetration = getFlavorForPlayersTotalPenetration(
    flavorTotalPenetration,
    actorCaster,
    showDataOfNPC
  );
  const flavorForPlayersTotalMagicResistance = getFlavorForPlayersTotalMagicResistance(
    flavorTotalMagicResistance,
    actorTarget,
    showDataOfNPC
  );
  const flavorForPlayersResult = getFlavorForPlayersResult({
    messageOnlyWithName,
    messageTotalWithName,
    actorTarget,
    actorCaster,
    showDataOfNPC
  });
  const flavorForGM = `${flavorTotalSpell}${flavorTotalPenetration}${flavorTotalMagicResistance}`;
  const flavorForPlayers = `${flavorForPlayersTotalSpell}${flavorForPlayersTotalPenetration}${flavorForPlayersTotalMagicResistance}`;

  const content = `<h4 class="dice-total">${flavorForPlayersResult}</h4>`;
  ChatMessage.create({
    content,
    flavor: title + putInFoldableLink("arm5e.sheet.label.details", flavorForPlayers),
    speaker: ChatMessage.getSpeaker({
      actorCaster
    })
  });
  if (flavorForPlayers !== flavorForGM) {
    privateMessage(content, actorCaster, title, flavorForGM);
  }
}
async function privateMessage(content, actor, title, flavor) {
  // only roll messages can be hidden from roller

  let roll = new Roll("0");

  let messageData = {
    content: content,
    flavor: title + putInFoldableLink("arm5e.sheet.label.details", flavor),
    speaker: ChatMessage.getSpeaker({
      actor
    }),
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: "0",
    whisper: ChatMessage.getWhisperRecipients("gm"),
    blind: true,
    flags: {
      arm5e: {
        type: "damage"
      }
    }
  };
  await roll.toMessage(messageData, { rollMode: CONST.DICE_ROLL_MODES.BLIND });
}

export { chatContestOfMagic, chatFailedCasting, chatContestOfPower };
