import { log } from "../tools.js";
import { stressDie } from "../dice.js";

export async function exertSelf(actor, mode, callback, roll) {
  log(false, "Exert self in combat");

  actor.rollData.combat.exertion = true;

  await stressDie(actor, roll, callback, mode, 0);

  await actor.loseFatigueLevel(1);
}
