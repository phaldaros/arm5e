let mult = 1;

async function simpleDie(html, actorData) {
    actorData = getFormData(html, actorData);
    actorData = getRollFormula(actorData);

    //console.log('simple die');
    //console.log(actorData);
    let name = "<h2 class=\"ars-chat-title\">" + actorData.data.data.roll.label + "</h2>";
    let formula = "1D10+" + actorData.data.data.roll.rollFormula;
    if (actorData.data.data.roll.divide > 1) {
        formula = "(1D10+" + actorData.data.data.roll.rollFormula + ")/" + actorData.data.data.roll.divide;
    }
    const dieRoll = new Roll(formula, actorData.data.data);
    let tmp = await dieRoll.roll({
        async: true
    });
    tmp.toMessage({
        speaker: ChatMessage.getSpeaker({
            actor: actorData
        }),
        flavor: name + 'Simple die: <br />' + actorData.data.data.roll.rollLabel
    });
}


async function stressDie(html, actor) {
    mult = 1;
    actor = getFormData(html, actor);
    actor = getRollFormula(actor);

    let name = "<h2 class=\"ars-chat-title\">" + actor.data.data.roll.label + "</h2>";
    let dieRoll = await explodingRoll(actor);
    let flavorTxt = name + 'Stress die: <br />';
    if (mult > 1) {
        flavorTxt = name + '<h3>EXPLODING Stress die: </h3><br/>';
    }
    multiplyRoll(mult, dieRoll, actor.data.data.roll.rollFormula, actor.data.data.roll.divide).toMessage({
        flavor: flavorTxt + actor.data.data.roll.rollLabel,
        speaker: ChatMessage.getSpeaker({
            actor: actor
        }),
    });
}


function getFormData(html, actorData) {
    let find = html.find('.SelectedCharacteristic');
    if (find.length > 0) {
        actorData.data.data.roll.characteristic = find[0].value;
    }

    find = html.find('.SelectedAbility');
    if (find.length > 0) {
        actorData.data.data.roll.ability = find[0].value;
    }

    find = html.find('.abilitySpeciality');
    if (find.length > 0) {
        actorData.data.data.roll.abilitySpeciality = find[0].checked;
    }

    find = html.find('.SelectedTechnique');
    if (find.length > 0) {
        actorData.data.data.roll.technique = find[0].value;
    }

    find = html.find('.SelectedForm');
    if (find.length > 0) {
        actorData.data.data.roll.form = find[0].value;
    }

    find = html.find('.SelectedAura');
    if (find.length > 0) {
        actorData.data.data.roll.aura = find[0].value;
    }

    find = html.find('.SelectedModifier');
    if (find.length > 0) {
        actorData.data.data.roll.modifier = find[0].value;
    }

    find = html.find('.SelectedAdvantage');
    if (find.length > 0) {
        actorData.data.data.roll.advantage = find[0].value;
    }

    find = html.find('.SelectedFocus');
    if (find.length > 0) {
        actorData.data.data.roll.focus = find[0].checked;
    }

    return actorData;
}

/*
    "roll":{
        "characteristic": "",
        "ability": "",
        "technique": "",
        "form": "",
        "total": "",
        "rollLabel": "",
        "rollFormula": ""
    }
*/

function getRollFormula(actor) {
    let total = 0;
    let value = 0;
    let msg = "";
    let actorData = actor.data.data;
    if (actorData.roll.type == "spell" || actorData.roll.type == "magic" || actorData.roll.type == "spont") {
        let valueTech = 0
        let valueForm = 0
        if (actorData.roll.type == "spell") {
            valueTech = actorData.roll.techniqueScore;
            valueForm = actorData.roll.formScore;
            actorData.roll.technique = actorData.roll.spell.technique;
            actorData.roll.form = actorData.roll.spell.form;

        } else {
            actorData.roll.techniqueText = actorData.arts.techniques[actorData.roll.technique].label;
            actorData.roll.formText = actorData.arts.forms[actorData.roll.form].label;
            valueTech = parseInt(actorData.arts.techniques[actorData.roll.technique].score);
            valueForm = parseInt(actorData.arts.forms[actorData.roll.form].score)
        }
        if (actorData.roll.focus === true) {
            if (valueTech < valueForm) {
                total = parseInt(total) + 2 * valueTech + valueForm;
                msg = msg + actorData.roll.techniqueText;
                msg = msg + " ( 2 x " + valueTech + ") + <br />";
                msg = msg + actorData.roll.formText;
                msg = msg + " (" + valueForm + ")";

            } else {
                total = parseInt(total) + 2 * valueForm + valueTech;
                msg = msg + actorData.roll.techniqueText;
                msg = msg + " (" + valueTech + ") + <br />";
                msg = msg + actorData.roll.formText;
                msg = msg + " ( 2 x " + valueForm + ")";

            }
        } else {

            total = parseInt(total) + valueTech;
            msg = msg + actorData.roll.techniqueText;
            msg = msg + " (" + valueTech + ")";

            total = parseInt(total) + valueForm;
            if (msg != "") {
                msg = msg + " + <br />";
            }
            msg = msg + actorData.roll.formText;
            msg = msg + " (" + valueForm + ")";
        }
        if (actorData.roll.type == "magic" || actorData.roll.type == "spont") {
            actor.loseFatigueLevel(1);
        }
    }


    if (actorData.roll.characteristic != "") {
        value = actorData.characteristics[actorData.roll.characteristic].value
        total = parseInt(total) + parseInt(value);
        if (msg != "") {
            msg = msg + " + <br />";
        }
        let name = game.i18n.localize(actorData.charmetadata[actorData.roll.characteristic].label);
        if (actorData.roll.type == "char") {
            actorData.roll.label = name;
        }

        msg = msg + name;
        msg = msg + " (" + value + ")";
    }

    if (actorData.roll.ability != "") {
        for (var i = 0; i < actorData.abilities.length; i++) {
            if (actorData.abilities[i]._id == actorData.roll.ability) {
                value = actorData.abilities[i].data.score;
                total = parseInt(total) + parseInt(value);
                if (msg != "") {
                    msg = msg + " + <br />";
                }
                actorData.roll.label = actorData.abilities[i].name;
                msg = msg + actorData.roll.label;
                msg = msg + " (" + value + ")";
                break;
            }
        }

        if (actorData.roll.abilitySpeciality == true) {
            total = parseInt(total) + 1;
            msg = msg + " ( + 1 " + game.i18n.localize("arm5e.sheet.speciality") + " )";
        }
    }

    if (actorData.roll.aura != "" && actorData.roll.aura != 0) {
        value = actorData.roll.aura
        total = parseInt(total) + parseInt(value);
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + "Aura";
        msg = msg + " (" + value + ")";
    }

    if (actorData.roll.ritual === true) {
        value = actorData.laboratory.abilitiesSelected.artesLib.value;
        value += actorData.laboratory.abilitiesSelected.philosophy.value;
        total = parseInt(total) + parseInt(value);
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + game.i18n.localize("arm5e.skill.artesLib") + " + " + game.i18n.localize("arm5e.skill.philosophy");
        //msg = msg + "Artes Liberales + Philosophiae";
        msg = msg + " (" + value + ")";
    }
     if (actorData.roll.advantage != 0) {
        value = actorData.roll.advantage;
        total = parseInt(total) + parseInt(value);
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + game.i18n.localize("arm5e.sheet.advantage");
        msg = msg + " (" + value + ")";

    }
    if (actorData.roll.modifier != 0) {
        value = actorData.roll.modifier;
        total = parseInt(total) + parseInt(value);
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + game.i18n.localize("arm5e.sheet.modifier");
        msg = msg + " (" + value + ")";

    }

    if (actorData.roll.type == "spont") {
        actorData.roll.label = game.i18n.localize("arm5e.sheet.spontaneousMagic") +
            " (" + actorData.metadata.magic.arts[actorData.roll.technique].short +
            actorData.metadata.magic.arts[actorData.roll.form].short + ")";
    }

    if (actorData.roll.txtOption1 != "") {
        total = total + parseInt(actorData.roll.option1)
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + actorData.roll.txtOption1 + " (" + actorData.roll.option1 + ")";
    }
    if (actorData.roll.txtOption2 != "") {
        total = total + parseInt(actorData.roll.option2)
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + actorData.roll.txtOption2 + " (" + actorData.roll.option2 + ")";
    }
    if (actorData.roll.txtOption3 != "") {
        total = total + parseInt(actorData.roll.option3)
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + actorData.roll.txtOption3 + " (" + actorData.roll.option3 + ")";
    }
    if (actorData.roll.txtOption4 != "") {
        total = total + parseInt(actorData.roll.option4)
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + actorData.roll.txtOption4 + " (" + actorData.roll.option4 + ")";
    }
    if (actorData.roll.txtOption5 != "") {
        total = total + parseInt(actorData.roll.option5)
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + actorData.roll.txtOption5 + " (" + actorData.roll.option5 + ")";
    }


    if (actorData.roll.bonus > 0) {
        total = total + actorData.roll.bonus
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + "Bonus (" + actorData.roll.bonus + ")";
    }

    if (actorData.roll.useFatigue == true) {

        if (actorData.fatigueTotal != 0) {
            total = total + actorData.fatigueTotal
            if (msg != "") {
                msg = msg + " + <br />";
            }
            msg = msg + game.i18n.localize("arm5e.sheet.fatigue");
            msg = msg + " (" + actorData.fatigueTotal + ")";
        }
        if (actorData.woundsTotal != 0) {
            total = total + actorData.woundsTotal
            if (msg != "") {
                msg = msg + " + <br />";
            }
            msg = msg + game.i18n.localize("arm5e.sheet.wounds");
            msg = msg + " (" + actorData.woundsTotal + ")";
        }
    }

    if (actorData.roll.divide > 1) {
        if (msg != "") {
            msg = msg + " + <br />";
        }
        msg = msg + "Divide by " + actorData.roll.divide;
    }
    actorData.roll.rollFormula = total;
    actorData.roll.rollLabel = msg;

    return actor;
}

async function CheckBotch(html, actorData) {
    let resultMessage = "";

    let botchDice = html.find('#botchDice').val();
    if (!botchDice) {
        return ui.notifications.info("Please enter the number of botch dice.");
    }

    let rollCommand = botchDice;
    rollCommand = rollCommand.concat('d10cf=10');
    const botchRoll = new Roll(rollCommand);
    await botchRoll.roll({
        async: true
    });

    if (botchRoll.result == 0) {
        resultMessage = "<p>No botch!</p>";
    } else if (botchRoll.result == 1) {
        resultMessage = "<p>BOTCH: " + botchRoll.result + " zero was rolled.</p>";
    } else if (botchRoll.result > 1) {
        resultMessage = "<p>BOTCH: " + botchRoll.result + " zeros were rolled.</p>";
    }
    botchRoll.toMessage({
        flavor: resultMessage,
        speaker: ChatMessage.getSpeaker({
            actor: actorData
        }),
    });
}

async function explodingRoll(actorData) {
    let dieRoll = new Roll(`1d10`);
    await dieRoll.roll({
        async: true
    });

    if (dieRoll.total === 1) {
        mult *= 2;
        dieRoll = await explodingRoll();
    } else {
        if (mult === 1 && dieRoll.total === 10) {
            mult *= 0;

            renderTemplate("systems/arm5e/templates/roll/roll-botch.html").then(function(html) {
                // show dialog
                new Dialog({
                    title: 'Checking for Botch',
                    content: html,
                    buttons: {
                        yes: {
                            icon: "<i class='fas fa-check'></i>",
                            label: `Roll for Botch!`,
                            callback: (html) => CheckBotch(html, actorData)
                        },
                        no: {
                            icon: "<i class='fas fa-times'></i>",
                            label: `Cancel`,
                            callback: (html) => {
                                ChatMessage.create({
                                    content: `Botch not checked.`,
                                    speaker: ChatMessage.getSpeaker({
                                        actor: actorData
                                    }),
                                });
                            }
                        },
                    }
                }, {
                    classes: ['arm5e-dialog', 'dialog']
                }).render(true);
            });
        }
    }
    return dieRoll;
}

function multiplyRoll(mult, roll, rollFormula, divide) {
    if (!roll._evaluated) return;
    let output_roll = new Roll(`${mult} * (${roll._formula}) + ${rollFormula}`);
    output_roll.data = {};
    // output_roll._total = [ mult, `*`, ...roll.result];
    output_roll.terms = [mult, `*`, ...roll.terms];
    //console.log(output_roll)
    //if(parseInt(divide) > 1){
    //    output_roll.terms.push("/"+ divide);
    //}
    output_roll._evaluated = true;
    output_roll._total = ((mult * roll._total) + parseInt(rollFormula)) / parseInt(divide);

    return output_roll;
}


export {
    simpleDie,
    stressDie
}