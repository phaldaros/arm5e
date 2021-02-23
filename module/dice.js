let mult = 1;

function simpleDie(html, actorData) {
    actorData = getFormData(html, actorData);
    actorData = getRollFormula(actorData);

    //console.log('simple die');
    //console.log(actorData);

    let formula = "1D10+" + actorData.data.data.roll.rollFormula;
    if(actorData.data.data.roll.divide > 1){
        formula = "(1D10+" + actorData.data.data.roll.rollFormula + ")/" + actorData.data.data.roll.divide;
    }
    let roll = new Roll(formula, actorData.data.data);
    roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actorData }),
        flavor: 'Simple die: <br />' + actorData.data.data.roll.rollLabel
    });  
}


function stressDie(html, actorData) {
    mult = 1;
    actorData = getFormData(html, actorData);
    actorData = getRollFormula(actorData);

    //console.log('stress die');
    //console.log(actorData);

    let roll = explodingRoll(actorData);
    multiplyRoll(mult, roll, actorData.data.data.roll.rollFormula, actorData.data.data.roll.divide).toMessage({
        flavor: 'Stress die: <br />' + actorData.data.data.roll.rollLabel,
        speaker: ChatMessage.getSpeaker({ actor: actorData }),
    });
}


function getFormData(html, actorData){
    let find = html.find('.SelectedCharacteristic');
    if(find.length > 0){ actorData.data.data.roll.characteristic = find[0].value; }

    find = html.find('.SelectedAbility');
    if(find.length > 0){ actorData.data.data.roll.ability = find[0].value; }

    find = html.find('.abilitySpeciality');
    if(find.length > 0){ actorData.data.data.roll.abilitySpeciality = find[0].checked; }

    actorData.data.data.roll.divide = 1;
    find = html.find('.Divide');
    if(find.length > 0){ actorData.data.data.roll.divide = find[0].value; }

    find = html.find('.SelectedTechnique');
    if(find.length > 0){ actorData.data.data.roll.technique = find[0].value; }

    find = html.find('.SelectedForm');
    if(find.length > 0){ actorData.data.data.roll.form = find[0].value; }

    find = html.find('.SelectedAura');
    if(find.length > 0){ actorData.data.data.roll.aura = find[0].value; }

    return actorData;
}

    /*
        "roll":{
            "characteristic": "",
            "ability": "",
            "tecnique": "",
            "form": "",
            "total": "",
            "rollLabel": "",
            "rollFormula": ""
        }
    */

function getRollFormula(actorData){
    let total = 0;
    let value = 0;
    let msg = "";

    if(actorData.data.data.roll.technique != ""){
        value = actorData.data.data.arts.techniques[actorData.data.data.roll.technique].score
        total = parseInt(total) + parseInt(value);
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.arts.techniques[actorData.data.data.roll.technique].label;
        msg = msg + " (" + value + ")";
    }

    if(actorData.data.data.roll.form != ""){
        value = actorData.data.data.arts.forms[actorData.data.data.roll.form].score
        total = parseInt(total) + parseInt(value);
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.arts.forms[actorData.data.data.roll.form].label;
        msg = msg + " (" + value + ")";
    }

    if(actorData.data.data.roll.characteristic != ""){
        value = actorData.data.data.characteristics[actorData.data.data.roll.characteristic].value
        total = parseInt(total) + parseInt(value);
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.characteristics[actorData.data.data.roll.characteristic].label;
        msg = msg + " (" + value + ")";
    }

    if(actorData.data.data.roll.ability != ""){
        for(var i=0; i<actorData.data.data.abilities.length; i++){
            if(actorData.data.data.abilities[i]._id == actorData.data.data.roll.ability){
                value = actorData.data.data.abilities[i].data.score;
                total = parseInt(total) + parseInt(value);
                if(msg != ""){ msg = msg + " + <br />"; }
                msg = msg + actorData.data.data.abilities[i].name;
                msg = msg + " (" + value + ")";
            }
        }

        if(actorData.data.data.roll.abilitySpeciality == true){
            total = parseInt(total) + 1;
            msg = msg + " ( + 1 speciality)";
        }
    }

    if(actorData.data.data.roll.aura != ""){
        value = actorData.data.data.roll.aura
        total = parseInt(total) + parseInt(value);
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + "Aura";
        msg = msg + " (" + value + ")";
    }


    if(actorData.data.data.roll.txtOption1 != ""){
        total = total + parseInt(actorData.data.data.roll.option1)
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.roll.txtOption1 + " ("+ actorData.data.data.roll.option1 + ")";
    }
    if(actorData.data.data.roll.txtOption2 != ""){
        total = total + parseInt(actorData.data.data.roll.option2)
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.roll.txtOption2 + " ("+ actorData.data.data.roll.option2 + ")";
    }
    if(actorData.data.data.roll.txtOption3 != ""){
        total = total + parseInt(actorData.data.data.roll.option3)
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.roll.txtOption3 + " ("+ actorData.data.data.roll.option3 + ")";
    }
    if(actorData.data.data.roll.txtOption4 != ""){
        total = total + parseInt(actorData.data.data.roll.option4)
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.roll.txtOption4 + " ("+ actorData.data.data.roll.option4 + ")";
    }
    if(actorData.data.data.roll.txtOption5 != ""){
        total = total + parseInt(actorData.data.data.roll.option5)
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + actorData.data.data.roll.txtOption5 + " ("+ actorData.data.data.roll.option5 + ")";
    }


    if(actorData.data.data.roll.bonus > 0){
        total = total + actorData.data.data.roll.bonus
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + "Bonus ("+ actorData.data.data.roll.bonus + ")";
    }

    if(actorData.data.data.roll.useFatigue == true){
        total = total + actorData.data.data.fatigueTotal
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + "Fatigue";
        msg = msg + " (" + actorData.data.data.fatigueTotal + ")";

        total = total + actorData.data.data.woundsTotal
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + "Wounds";
        msg = msg + " (" + actorData.data.data.woundsTotal + ")";
    }

    if(actorData.data.data.roll.divide > 1){
        if(msg != ""){ msg = msg + " + <br />"; }
        msg = msg + "Divide by "+ actorData.data.data.roll.divide;
    }
    actorData.data.data.roll.rollFormula = total;
    actorData.data.data.roll.rollLabel = msg;

    return actorData;
}

function CheckBotch(html, actorData){
    let resultMessage = "";

    let botchDice = html.find('#botchDice').val();
    if (!botchDice) {
        return ui.notifications.info("Please enter the number of botch dice.");
    }

    let rollCommand = botchDice;
    rollCommand = rollCommand.concat ('d10cf=10');
    const botchRoll =  new Roll(rollCommand);
    botchRoll.roll();
    
    if (botchRoll.result == 0) {
        resultMessage = "<p>No botch!</p>";
    } else if (botchRoll.result == 1) {
        resultMessage = "<p>BOTCH: "+  botchRoll.result +" cero was rolled.</p>";
    } else if (botchRoll.result > 1) {
        resultMessage = "<p>BOTCH: "+  botchRoll.result +" ceros were rolled.</p>";
    } 
    botchRoll.toMessage({
        flavor: resultMessage,
        speaker: ChatMessage.getSpeaker({ actor: actorData }),
    });	
}

function explodingRoll(actorData) {
    let roll = new Roll(`1d10`).roll();

    if(roll.total === 1){
        mult*=2;
        roll = explodingRoll();
    } else {
        if (mult === 1 && roll.total === 10) {
            mult *= 0;

            renderTemplate("systems/arm5e/templates/roll/roll-botch.html").then(function(html){
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
                                    speaker: ChatMessage.getSpeaker({ actor: actorData }),
                                });
                            }
                        },
                    }
                }).render(true);
            });
        }
    }
    return roll;
}

function multiplyRoll(mult, roll, rollFormula, divide)
{
    if(!roll._rolled) return;
    let output_roll = new Roll(`${mult} * (${roll._formula}) + ${rollFormula}`);
    output_roll.data = {};
    output_roll.results = [ mult, `*`, ...roll.results];
    output_roll.terms = [mult, `*`, ...roll.terms];
    //console.log(output_roll)
    //if(parseInt(divide) > 1){
    //    output_roll.terms.push("/"+ divide);
    //}
    output_roll._rolled = true;
    output_roll._total = ((mult * roll._total) + parseInt(rollFormula)) / parseInt(divide);
    if(mult == 0){
        output_roll._total = 0;
    }

    return output_roll;
}


export {simpleDie, stressDie}