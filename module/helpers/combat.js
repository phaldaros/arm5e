import { log } from "../tools.js";
import { stressDie } from "../dice.js";

export async function exertSelf(html, actor, mode, callback, roll) {
  log(false, "Exert self in combat");

  actor.rollData.combat.exertion = true;

  await stressDie(html, actor, mode, callback, roll);

  await actor.loseFatigueLevel(1);
}
