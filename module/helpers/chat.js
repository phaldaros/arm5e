function getFlavorForPlayersTotalSpell(flavorTotalSpell, actorCaster, showDataOfNPC) {
    if(actorCaster.hasPlayerOwner) {
        return flavorTotalSpell;
    }
    if(showDataOfNPC) {
        return flavorTotalSpell;
    }
    return '';
}

function getFlavorForPlayersTotalPenetration(flavorTotalPenetration, actorCaster, showDataOfNPC) {
    if(actorCaster.hasPlayerOwner) {
        return flavorTotalPenetration;
    }
    if(showDataOfNPC) {
        return flavorTotalPenetration;
    }
    return '';
}

function getFlavorForPlayersTotalMagicResistance(flavorTotalMagicResistance, actorTarget, showDataOfNPC) {
    if(actorTarget.hasPlayerOwner) {
        return flavorTotalMagicResistance;
    }
    if(showDataOfNPC) {
        return flavorTotalMagicResistance;
    }
    return '';
}

function getFlavorForPlayersResult({ messageOnlyWithName, messageTotalWithName, actorTarget, actorCaster, showDataOfNPC }) {
    if(actorTarget.hasPlayerOwner && actorCaster.hasPlayerOwner) {
        return messageTotalWithName;
    }
    if(showDataOfNPC) {
        return messageTotalWithName;
    }
    return messageOnlyWithName;
}

function chatContestOfMagic({ actorCaster, actorTarget, penetration, magicResistance, total, form }) {
    const title = '<h2 class="ars-chat-title">' + game.i18n.localize("arm5e.sheet.contestOfMagic") + "</h2>";
    const messageTotalOfSpell = `${game.i18n.localize("arm5e.sheet.spellTotal")} (${penetration.totalOfSpell})`;
    const messageLevelOfSpell = `- ${game.i18n.localize("arm5e.sheet.spellLevel")} (${penetration.levelOfSpell})`;
    const messagePenetration = `+ ${game.i18n.localize("arm5e.sheet.penetration")} (${penetration.penetration})`;
    const messageSpeciality = penetration.specialityIncluded ?
        ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${penetration.specialityIncluded})` :
        '';
    const messageTotalPenetration = `${game.i18n.localize("arm5e.sheet.totalPenetration")}: (${penetration.total})`;

    const messageMight = magicResistance?.might ?
        `${game.i18n.localize("arm5e.sheet.might")}: (${magicResistance.might})` :
        '';

    const messageForm = magicResistance?.formScore ?
        `+ ${game.i18n.localize("arm5e.sheet.formScore")}: (${magicResistance.formScore})`.replace('$form$', form) :
        '';

    const messageParma = magicResistance?.parma?.score ?
        `${game.i18n.localize("arm5e.sheet.parma")}: (${magicResistance.parma.score})` :
        '';

    const messageParmaSpeciality = magicResistance?.specialityIncluded ?
        ` (${game.i18n.localize("arm5e.sheet.specialityBonus")}: +1 ${magicResistance.specialityIncluded})` :
        '';
    const messageTotalMagicResistance = `${game.i18n.localize("arm5e.sheet.totalMagicResistance")}: (${magicResistance.total})`;

    const flavorTotalSpell = `${title} ${messageTotalOfSpell}<br/> ${messageLevelOfSpell}<br/>`;
    const flavorTotalPenetration = `${messagePenetration}${messageSpeciality}<br/><b>${messageTotalPenetration}</b><br/>`;
    const flavorTotalMagicResistance = `${messageMight}${messageParma}${messageParmaSpeciality}${messageForm}<br/><b>${messageTotalMagicResistance}</b>`;

    const messageTotal = total > 0 ?
        `${game.i18n.localize("arm5e.sheet.spellOverMagicResistance")}` :
        `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpell")}`;

    const messageWithoutTotal = total > 0 ?
        `${game.i18n.localize("arm5e.sheet.spellOverMagicResistanceWithNoTotal")}` :
        `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpellWithNoTotal")}`;

    const messageTotalWithName = total > 0 ?
        messageTotal.replace('$target$', actorTarget.data.name).replace('$total$', total) :
        messageTotal.replace('$target$', actorTarget.data.name).replace('$total$', -total);

    const messageOnlyWithName = total > 0 ?
        messageWithoutTotal.replace('$target$', actorTarget.data.name) :
        messageWithoutTotal.replace('$target$', actorTarget.data.name);

    const showDataOfNPC = game.settings.get("arm5e", "defaultIconStyle") === 'SHOW_ALL';
    const flavorForPlayersTotalSpell = getFlavorForPlayersTotalSpell(flavorTotalSpell, actorCaster, showDataOfNPC)
    const flavorForPlayersTotalPenetration = getFlavorForPlayersTotalPenetration(flavorTotalPenetration, actorCaster, showDataOfNPC)
    const flavorForPlayersTotalMagicResistance = getFlavorForPlayersTotalMagicResistance(flavorTotalMagicResistance, actorTarget, showDataOfNPC)
    const flavorForPlayersResult = getFlavorForPlayersResult({ messageOnlyWithName, messageTotalWithName, actorTarget, actorCaster, showDataOfNPC })
    const flavorForGM = `${flavorTotalSpell}${flavorTotalPenetration}${flavorTotalMagicResistance}`;
    const flavorForPlayers = `${flavorForPlayersTotalSpell}${flavorForPlayersTotalPenetration}${flavorForPlayersTotalMagicResistance}`;

    const content = `<h4 class="dice-total">${flavorForPlayersResult}</h4>`;
    ChatMessage.create({
        content,
        flavor: flavorForPlayers,
        speaker: ChatMessage.getSpeaker({
            actorCaster,
        }),
    });
    if(flavorForPlayers !== flavorForGM) {
        ChatMessage.create({
            content: `<h4 class="dice-total">${messageTotalWithName}</h4>`,
            flavor: flavorForGM,
            speaker: ChatMessage.getSpeaker({
                actorCaster,
            }),
            whisper : ChatMessage.getWhisperRecipients("gm"),
        });
    }

}

export {
    chatContestOfMagic,
}