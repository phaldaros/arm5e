import { ArM5eItemSheet } from "../item-sheet.js";
import { getDataset, log } from "../../tools.js";
import { ARM5E } from "../../config.js";
import { ArM5eItem } from "../item.js";
import { getConfirmation } from "../../constants/ui.js";
import { ArM5eActorSheet } from "../../actor/actor-sheet.js";
import { SHAPES } from "../../constants/shapes-materials.js";
/**
 */
export class ArM5eItemEnchantmentSheet {
  constructor(sheet) {
    this.sheet = sheet;
    this.item = sheet.item;
  }

  async getData(context) {
    const enchants = context.system.enchantments;
    enchants.totalCapa = 0;
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
    enchants.SHAPES = SHAPES;

    for (let shape of enchants.shapes) {
      shape.effects = SHAPES[shape.shape].map((e) => {
        return { name: e.effect, bonus: e.bonus };
      });
    }
    enchants.visibility = { capacity: "hide", shape: "hide", material: "hide", enchant: "hide" };
  }

  addListeners(html) {
    html.find(".appraise").click(async () => {
      if (this.item.system.enchantments == null) {
        const updateData = {};
        updateData["system.state"] = "appraised";
        updateData["system.enchantments"] = new EchantmentExtension();
        await this.item.update(updateData);
      }
    });

    html.find(".attribute-create").click(async (e) => {
      let capacities = this.sheet.item.system.enchantments.capacities;
      capacities.add({ sizeMultiplier: "tiny", materialBase: "base1", desc: "" });
      await this.item.update({ "system.enchantments.capacities": Array.from(capacities) });
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
        let capacities = Array.from(this.sheet.item.system.enchantments.capacities);
        capacities.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.capacities": capacities });
      }
    });

    html.find(".shape-create").click(async (e) => {
      let shapes = this.item.system.enchantments.shapes;
      const first = Object.keys(SHAPES)[0];
      shapes.add({ shape: first, effect: SHAPES[first].effect, bonus: SHAPES[first].bonus });
      await this.item.update({ "system.enchantments.shapes": Array.from(shapes) });
    });

    html.find(".shape-delete").click(async (e) => {
      const question = game.i18n.localize("arm5e.dialog.delete-question");
      let confirm = await getConfirmation(
        this.item.name,
        question,
        ArM5eActorSheet.getFlavor(this.item.actor?.type)
      );
      if (confirm) {
        const dataset = getDataset(e);
        let shapes = Array.from(this.sheet.item.system.enchantments.shapes);
        shapes.splice(dataset.index, 1);
        await this.sheet.item.update({ "system.enchantments.shapes": shapes });
      }
    });

    html.find(".enchant-item").click(async (ev) => {
      const category = $(ev.currentTarget).data("item");
      const persist = $(ev.currentTarget).data("persist");
      let enchant = this.item.getFlag(ARM5E.SYSTEM_ID, "enchant");
      let classes = document.getElementById(category).classList;
      if (enchant) {
        if (classes.contains("hide")) {
          enchant.visibility[persist] = "";
          await this.item.setFlag(ARM5E.SYSTEM_ID, "planning", enchant);
        } else {
          enchant.visibility[persist] = "hide";
          await this.item.setFlag(ARM5E.SYSTEM_ID, "planning", enchant);
        }
      }
      classes.toggle("hide");
    });
  }
}
