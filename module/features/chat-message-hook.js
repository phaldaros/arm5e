import { log } from "../tools.js";

export function addChatListeners(message, html, data) {
  if (!message.isRoll) return;

  let actorId = data.message.speaker.actor;

  if (!(game.users.get(game.userId).isGM || game.users.get(game.userId).data.character == actorId)) {
    return;
  }

  // old chat messages, ignore them
  if (data.message.flags.arm5e === undefined) {
    return;
  }
  // confidence has been used already => no button
  if ((data.message.flags.arm5e.usedConf ?? 0) >= data.message.flags.arm5e?.confScore) {
    return;
  }

  //   const damageButton = $(
  //     `<button class="dice-total-damage" style="${btnStyling}"><i class="fas fa-user-injured" title="{{localize "arm5e.messages.applyDamage"}}"></i></button>`
  //   );
  let title = game.i18n.localize("arm5e.messages.useConf");
  let divide = data.message.flags.arm5e.divide;
  const useConfButton = $(
    `<button class="dice-confidence chat-button" data-divide="${divide}" data-msg-id="${data.message._id}" data-actor-id="${actorId}"><i class="fas fa-user-plus" title="${title}" ></i></button>`
  );

  const btnContainer = $('<span class="btn-container" style="position:absolute; right:0; bottom:1px;"></span>');
  //   btnContainer.append(damageButton);
  btnContainer.append(useConfButton);

  html.find(".dice-total").append(btnContainer);

  // Handle button clicks
  useConfButton.click((ev) => useConfidence(ev));
}

async function useConfidence(ev) {
  ev.stopPropagation();
  const actorId = ev.currentTarget.dataset.actorId;
  const message = game.messages.get(ev.currentTarget.dataset.msgId);
  const actor = game.actors.get(actorId);

  if ((message.data.flags.arm5e.usedConf ?? 0) < message.data.flags.arm5e.confScore) {
    if (await actor.useConfidencePoint()) {
      // add +3 * useConf to roll
      let bonus = 3;
      if (parseInt(ev.currentTarget.dataset.divide) === 2) {
        bonus /= 2;
      }

      // horrible code, TODO find a cleaner way.
      let total = $(ev.currentTarget).closest(".dice-total").text();
      let usedConf = message.data.flags.arm5e.usedConf + 1 || 1;
      let flavor = message.data.flavor;
      if (usedConf == 1) {
        flavor += "<br/> --------------- <br/>" + game.i18n.localize("arm5e.dialog.button.roll") + " : ";
        if ((message.data.flags.arm5e.botchCheck ?? 0) == 0) {
          flavor += message.roll.dice[0].results[0].result;
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
      msgData.speaker = message.data.speaker;
      msgData.flavor = flavor;
      msgData.flags = {
        arm5e: {
          usedConf: usedConf,
          confScore: message.data.flags.arm5e.confScore
        }
      };
      msgData.content = newContent;
      msgData.roll = message.data.roll;

      // updateData["data.flags.arm5e.usedConf"] = 1;
      // updateData["data.content"] = newContent;
      dieRoll.toMessage(msgData);
      // let msg = await ChatMessage.create(msgData);
      message.delete();
    }
  }
}
