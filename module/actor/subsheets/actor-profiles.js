import { ARM5E } from "../../config.js";
import { getDataset, log } from "../../tools.js";
import { getAbilityFromCompendium, getItemFromCompendium } from "../../tools/compendia.js";

export class ArM5eActorProfiles {
  constructor(actor) {
    this.actor = actor;
  }
  async getData(context) {
    return context;
  }

  async addProfile(event) {
    const dataset = getDataset(event);
    const config = ARM5E.ActorProfiles[dataset.key];

    let items = [];
    for (let ab of config.abilities) {
      if (this.actor.hasSkill(ab.key)) {
        continue;
      }

      let ability = await getAbilityFromCompendium(ab.key, ab.option);
      if (ability == null) {
        console.error("Wrong actor config");
        continue;
      }
      // ability = ability.toObject();
      if (ab.xp) {
        ability.system.xp = ab.xp;
      }

      items.push(ability);
    }

    if (config.virtues) {
      for (let v of config.virtues) {
        if (this.actor.hasVirtue(v.index)) {
          continue;
        }
        let virtue = await getItemFromCompendium("virtues", v.index);
        if (virtue == null) {
          console.error("Wrong actor config");
          continue;
        }
        items.push(virtue.toObject());
      }
    }

    if (config.flaws) {
      for (let f of config.flaws) {
        if (this.actor.hasFlaw(f.index)) {
          continue;
        }
        let flaw = await getItemFromCompendium("flaws", f.index);
        if (flaw == null) {
          console.error("Wrong actor config");
          continue;
        }
        items.push(flaw.toObject());
      }
    }

    await this.actor.createEmbeddedDocuments("Item", items, {});
  }
}
