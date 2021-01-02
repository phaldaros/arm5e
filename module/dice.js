let mult = 1;
let msg = "";
let resultMessage = "";
let roll = explodingRoll();
multiplyRoll(mult, roll).toMessage({
    flavor: msg
});

function multiplyRoll(mult, roll)
{
    if(!roll._rolled) return;
    let output_roll = new Roll(`${mult} * (${roll._formula})`);
    output_roll.data = {};
    output_roll.results = [ mult, `*`, ...roll.results];
    output_roll.terms = [mult, `*`, ...roll.terms];
    output_roll._rolled = true;
    output_roll._total = mult * roll._total;

    return output_roll;
}

function explodingRoll() {
  let roll = new Roll(`1d10`).roll();
  if(roll.total === 1)
  {
    mult*=2;
    roll = explodingRoll();
  } else {
    if (mult === 1 && roll.total === 10) {
        mult *= 0;
        msg = `Checking for Botch`;
        new Dialog({
            title: msg,
            content: `
                <p>You rolled a 0. Check for Botch.</p>
                <form>
                    <div style="display: flex; width: 100%; margin-bottom: 10px">
                        <p><label for="botchDice" style="white-space: nowrap; margin-right: 10px; padding-top:4px">Number of Botch Dice: </label>
                        <input type="number" id="botchDice" name="botchDice" min="1" max="10" autofocus /></p>
                    </div>
                </form>			
                `,
            buttons: {
                yes: {
                    icon: "<i class='fas fa-check'></i>",
                    label: `Roll for Botch!`,
                    callback: (html) => {
                        let botchDice = html.find('#botchDice').val();
                        if (!botchDice) {
                             return ui.notifications.info("Please enter the number of botch dice.");
                         }
                        let rollCommand = botchDice;
                        rollCommand = rollCommand.concat ('d10cf=10');
                        const botchRoll = new Roll(rollCommand);
                        botchRoll.roll();
                        
                        if (botchRoll.result == 1) {
                            resultMessage = "<p>BOTCH: one 0 was rolled.</p>";
                        } else if (botchRoll.result == 2) {
                            resultMessage = "<p>BOTCH: two 0s were rolled.</p>";
                        } else if (botchRoll.result == 3) {
                            resultMessage = "<p>BOTCH: three 0s were rolled.</p>";
                        } else if (botchRoll.result == 4) {
                            resultMessage = "<p>BOTCH: four 0s were rolled.</p>";
                        } else if (botchRoll.result == 5) {
                            resultMessage = "<p>BOTCH: five 0s were rolled.</p>";
                        } else if (botchRoll.result == 6) {
                            resultMessage = "<p>BOTCH: six 0s were rolled.</p>";
                        } else if (botchRoll.result == 7) {
                            resultMessage = "<p>BOTCH: seven 0s were rolled.</p>";
                        } else if (botchRoll.result == 8) {
                            resultMessage = "<p>BOTCH: eight 0s were rolled.</p>";
                        } else if (botchRoll.result == 9) {
                            resultMessage = "<p>BOTCH: nine 0s were rolled.</p>";
                        } else if (botchRoll.result == 10) {
                            resultMessage = "<p>BOTCH: ten 0s were rolled.</p>";
                        } else if (botchRoll.result == 0) {
                            resultMessage = "<p>No botch!</p>";
                        }
                        botchRoll.toMessage({
                            flavor: resultMessage,
                            rollMode: html.find('[name="rollMode"]:checked').val()
                        });			
                        } 
                    },
                
                no: {
                    icon: "<i class='fas fa-times'></i>",
                    label: `Cancel`,
                    callback: (html) => {
                        ChatMessage.create({
                            content: `Botch not checked.`
                          });
                    }
                }
            }
        }
        ).render(true);
    }
}
  return roll;
}

export {multiplyRoll, explodingRoll}