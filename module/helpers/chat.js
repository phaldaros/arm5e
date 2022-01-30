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

    const messageTotal = total > 0 ?
        `${game.i18n.localize("arm5e.sheet.spellOverMagicResistance")}` :
        `${game.i18n.localize("arm5e.sheet.magicResistanceOverSpell")}`;

    const messageTotalWithName = total > 0 ?
        messageTotal.replace('$target$', actorTarget.data.name).replace('$total$', total) :
        messageTotal.replace('$target$', actorTarget.data.name).replace('$total$', -total);

    ChatMessage.create({
        content: `<h4 class="dice-total">${messageTotalWithName}</h4>`,
        flavor: `${title} ${messageTotalOfSpell}<br/> ${messageLevelOfSpell}<br/>${messagePenetration}${messageSpeciality}<br/><b>${messageTotalPenetration}</b><br/>
${messageMight}${messageParma}${messageParmaSpeciality}${messageForm}<br/><b>${messageTotalMagicResistance}</b>`,
        speaker: ChatMessage.getSpeaker({
            actorCaster,
        }),
    });
}

export {
    chatContestOfMagic,
}