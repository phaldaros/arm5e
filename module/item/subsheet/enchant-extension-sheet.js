import { ArM5eItemSheet } from "../item-sheet.js";
import { getDataset, log } from "../../tools.js";
import { ARM5E } from "../../config.js";
import { ArM5eItem } from "../item.js";
import { getConfirmation } from "../../constants/ui.js";
import { ArM5eActorSheet } from "../../actor/actor-sheet.js";
import { ASPECTS } from "../../constants/enchant-aspects.js";
import { EchantmentExtension, EnchantmentSchema } from "../../schemas/enchantmentSchema.js";
import { computeLevel } from "../../helpers/magic.js";
import { spellFormLabel, spellTechniqueLabel } from "../../helpers/spells.js";
import { ArM5eItemMagicSheet } from "../item-magic-sheet.js";
/**
 */
export class ArM5eItemEnchantmentSheet {
  constructor(sheet) {
    this.sheet = sheet;
    this.item = sheet.item;
  }

  getUserCache() {
    let usercache = JSON.parse(sessionStorage.getItem(`usercache-${game.user.id}`));
    if (usercache[this.item.id] == undefined) {
      usercache[this.item.id] = {
        sections: {
          visibility: {
            common: {},
            enchantExt: {
              capacity: "hide",
              aspect: "hide",
              info: "hide",
              enchant: ""
            }
          }
        }
      };
      let enchantments = [];
      for (let idx = 0; idx < this.item.system.enchantments.effects.length; idx++) {
        enchantments.push({ desc: "", attributes: "" });
      }
      usercache[this.item.id].sections.visibility.enchantments = enchantments;
    } else {
      let enchantments = [];
      for (let idx = 0; idx < this.item.system.enchantments.effects.length; idx++) {
        enchantments.push({ desc: "", attributes: "" });
      }
      let sections = {
        visibility: {
          common: {},
          enchantExt: {
            capacity: "hide",
            aspect: "hide",
            info: "hide",
            enchant: ""
          },
          enchantments: enchantments
        }
      };
      mergeObject(sections, usercache[this.item.id].sections);
      usercache[this.item.id].sections = sections;
    }

    sessionStorage.setItem(`usercache-${game.user.id}`, JSON.stringify(usercache));
    return usercache[this.item.id];
  }

  async getData(context) {
    const enchants = context.system.enchantments;
    enchants.ui = {};

    context.ui = this.getUserCache();
    context.ui.flavor = "Neutral";
    enchants.totalCapa = 0;

    if (enchants.charged) {
      enchants.minor = false;
      enchants.prepared = false;
    }

    if (enchants.capacities.length > 1) {
      enchants.charged = false;
      enchants.ui.charged = "disabled";
      enchants.minor = false;
      enchants.prepared = true;
    }

    for (let capa of enchants.capacities) {
      capa.total =
        ARM5E.lab.enchantment.materialBase[capa.materialBase].base *
        ARM5E.lab.enchantment.sizeMultiplier[capa.sizeMultiplier].mult;
      if (enchants.capacityMode == "sum") {
        enchants.totalCapa += capa.total;
      } else if (capa.total > enchants.totalCapa) {
        // Max mode
        enchants.totalCapa = capa.total;
      }
    }
    enchants.ASPECTS = ASPECTS;

    for (let a of enchants.aspects) {
      a.effects = ASPECTS[a.aspect].effects;
      if (a.attuned) {
        enchants.talisman = true;
        enchants.ui.talisman = "disabled";
        enchants.charged = false;
        enchants.minor = false;
      }
    }
    enchants.usedCapa = 0;

    if (enchants.effects.length > 1) {
      enchants.prepared = true;
    }
    let idx = 0;
    for (let e of enchants.effects) {
      e.details = `${spellTechniqueLabel(e.system)} - ${spellFormLabel(e.system)}`;
      e.system.level = computeLevel(e.system, "enchantment");
      if (e.system.hidden && !context.isGM) {
        enchants.usedCapa = "??";
      } else {
        enchants.usedCapa += Math.ceil(e.system.level / 10);
      }
      e.prefix = `system.enchantments.effects.${idx}.`;

      e.visibility = context.ui.sections.visibility.enchantments[idx];
      idx++;
    }

    if (enchants.prepared) {
      enchants.charged = false;
      enchants.ui.charged = "disabled";
      enchants.minor = false;
      enchants.ui.minor = "disabled";
    }

    if (enchants.talisman) {
      enchants.charged = false;
      enchants.ui.charged = "disabled";
      enchants.minor = false;
      enchants.ui.minor = "disabled";
    }

    if (enchants.charged) {
      enchants.prepared = false;
      enchants.ui.prepared = "disabled";
      enchants.talisman = false;
      enchants.ui.talisman = "disabled";
      enchants.ui.attuned = "disabled";
    }
  }

  async _updateObject(event, formData) {
    const expanded = expandObject(formData);
    const source = this.sheet.object.toObject();

    const aspects = expanded?.system?.enchantments?.aspects;
    let options = {};
    if (aspects) {
      expanded.system.enchantments.aspects = mergeObject(
        source.system.enchantments.aspects,
        aspects,
        { recursive: true }
      );
    }
    const enchants = expanded?.system?.enchantments?.effects;
    if (enchants) {
      expanded.system.enchantments.effects = mergeObject(
        source.system.enchantments.effects,
        enchants,
        { recursive: true }
      );
    }
    const bonuses = expanded?.system?.enchantments?.bonuses;
    if (bonuses) {
      expanded.system.enchantments.bonuses = mergeObject(
        source.system.enchantments.bonuses,
        bonuses,
        { recursive: true }
      );
    }

    const effects = expanded?.system?.enchantments?.effects;
    if (effects) {
      expanded.system.enchantments.effects = mergeObject(
        source.system.enchantments.effects,
        effects,
        { recursive: true }
      );
    }

    return expanded;
  }

  addListeners(html) {
    // Everything below here is only needed if the sheet is editable
    if (!this.sheet.options.editable) return;
    html.find(".appraise").click(async () => {
      if (this.item.system.enchantments == null) {
        const updateData = {};
        updateData["system.state"] = "appraised";
        updateData["system.enchantments"] = new EchantmentExtension();
        await this.item.update(updateData);
      }
    });

    html.find(".advanced-req").click(async (evt) => {
      let effect = this.item.system.enchantments.effects[evt.currentTarget.dataset.index];
      let update = await ArM5eItemMagicSheet.PickRequisites(
        effect.system,
        evt.currentTarget.dataset.flavor
      );

      if (update)
        this.sheet.submit({
          preventClose: true,
          updateData: { [`system.enchantments.effects.${evt.currentTarget.dataset.index}`]: update }
        });
    });

    html.find(".aspect-change").change(async (e) => {
      const dataset = getDataset(e);
      let aspects = this.item.system.enchantments.aspects;
      let aspect = e.currentTarget.selectedOptions[0].value;
      const effect = Object.keys(ASPECTS[aspect].effects)[0];
      aspects[Number(dataset.index)].aspect = aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus = ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects = ASPECTS[aspect].effects;
      this.sheet.submit({
        preventClose: true,
        updateData: { "system.enchantments.aspects": aspects }
      });
    });
    html.find(".effect-change").change(async (e) => {
      const dataset = getDataset(e);
      let aspects = this.item.system.enchantments.aspects;
      const effect = e.currentTarget.selectedOptions[0].value;
      const aspect = aspects[Number(dataset.index)].aspect;
      aspects[Number(dataset.index)].effect = effect;
      aspects[Number(dataset.index)].bonus = ASPECTS[aspect].effects[effect].bonus;
      aspects[Number(dataset.index)].effects = ASPECTS[aspect].effects;
      this.sheet.submit({
        preventClose: true,
        updateData: { "system.enchantments.aspects": aspects }
      });
    });

    html.find(".attribute-create").click(async (e) => {
      let capacities = this.sheet.item.system.enchantments.capacities;
      capacities.push({ sizeMultiplier: "tiny", materialBase: "base1", desc: "" });
      await this.item.update({ "system.enchantments.capacities": capacities });
    });

    html.find(".attribute-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let capacities = this.sheet.item.system.enchantments.capacities;
        capacities.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.capacities": capacities });
      }
    });

    html.find(".aspect-create").click(async (e) => {
      let aspects = this.item.system.enchantments.aspects;
      const first = Object.keys(ASPECTS)[0];
      const firstEffect = Object.keys(ASPECTS[first].effects)[0];
      aspects.push({
        aspect: first,
        effect: firstEffect,
        bonus: ASPECTS[first].effects[firstEffect].bonus
      });
      await this.item.update({ "system.enchantments.aspects": aspects });
    });

    html.find(".aspect-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let aspects = this.sheet.item.system.enchantments.aspects;
        aspects.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.aspects": aspects });
      }
    });
    html.find(".bonus-create").click(async (e) => {
      let bonuses = this.item.system.enchantments.bonuses;
      bonuses.push({
        name: "Generic",
        type: "labTotal",
        value: 1
      });
      await this.item.update({ "system.enchantments.bonuses": bonuses });
    });

    html.find(".bonus-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let bonuses = this.sheet.item.system.enchantments.bonuses;
        bonuses.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.bonuses": bonuses });
      }
    });

    html.find(".enchantment-create").click(async (e) => {
      let effects = this.item.system.enchantments.effects;
      effects.push({ name: "My enchantment", system: new EnchantmentSchema() });
      await this.item.update({ "system.enchantments.effects": effects });
    });

    html.find(".enchant-effect-show").click(async (e) => {
      const dataset = getDataset(e);
      let effects = this.item.system.enchantments.effects;
      const effect = effects[dataset.index];
      const item = await Item.create(
        {
          name: effect.name,
          type: "enchantment",
          img: effect.img,
          ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
          editable: false,
          system: effect.system,
          [`flags.${CONFIG.ARM5E.SYSTEM_ID}.readonly`]: "true"
        },
        { temporary: true }
      );
      item.sheet.render(true);
    });

    html.find(".enchant-effect-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let effects = this.sheet.item.system.enchantments.effects;
        effects.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.effects": effects });
      }
    });
  }

  async addEnchantment(enchantment) {
    const effects = this.item.system.enchantments.effects;

    const newEffect = {
      name: enchantment.name,
      img: enchantment.img,
      system: foundry.utils.deepClone(enchantment.system)
    };
    newEffect.system.state = "enchanted";
    effects.push(newEffect);
    await this.item.update({ "system.state": "enchanted", "system.enchantments.effects": effects });
  }
}
