import { ArM5eItemSheet } from "./item-sheet.js";
import { log } from "../tools.js";
import { ARM5E } from "../config.js";
import { ArM5eItem } from "./item.js";
import { ARM5E_DEFAULT_ICONS } from "../constants/ui.js";
import { PickRequisites } from "../helpers/magic.js";
/**
 * Extend the basic ArM5eItemSheet with some very simple modifications
 * @extends {ArM5eItemSheet}
 */
export class ArM5eItemMagicSheet extends ArM5eItemSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "spell-design"
        }
      ],
      submitOnClose: true
    });
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the item object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    let context = await super.getData();
    context.system.localizedDesc = ArM5eItem.GetEffectAttributesLabel(this.item);
    context = await ArM5eItemMagicSheet.GetFilteredMagicalAttributes(context);

    if (context.flags && context.flags[CONFIG.ARM5E.SYSTEM_ID]?.readonly === "true") {
      context.noEdit = "readonly";
      context.noSelect = "disabled";
      context.locked = true;
    }

    // If settings were too restrictive, allow existing Items to keep their value.
    switch (this.item.type) {
      case "laboratoryText":
        if (this.item.system.type === "raw") {
          break;
        }
      case "spell":
      case "enchantment":
      case "magicItem":
      case "magicalEffect":
        context.ranges[context.system.range.value] =
          CONFIG.ARM5E.magic.ranges[context.system.range.value];
        context.targets[context.system.target.value] =
          CONFIG.ARM5E.magic.targets[context.system.target.value];
        context.durations[context.system.duration.value] =
          CONFIG.ARM5E.magic.durations[context.system.duration.value];
        break;
      default:
        break;
    }

    return context;
  }

  static async GetFilteredMagicalAttributes(data) {
    const filterBooks = Object.fromEntries(
      Object.entries(await game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter")).filter(
        ([key, f]) => f.value === true
      )
    );
    // Filter to only the values configured in settings
    data.ranges = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.magic.ranges).filter(([key, val]) => {
        return val.source in filterBooks;
      })
    );

    data.targets = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.magic.targets).filter(([key, val]) => {
        return val.source in filterBooks;
      })
    );

    data.durations = Object.fromEntries(
      Object.entries(CONFIG.ARM5E.magic.durations).filter(([key, val]) => {
        return val.source in filterBooks;
      })
    );
    return data;
  }

  static async GetFilteredAspects() {
    const filterBooks = Object.fromEntries(
      Object.entries(await game.settings.get(CONFIG.ARM5E.SYSTEM_ID, "sourcebookFilter")).filter(
        ([key, f]) => f.value === true
      )
    );
    return Object.fromEntries(
      Object.entries(CONFIG.ARM5E.ASPECTS).filter(([key, val]) => {
        return val.src in filterBooks;
      })
    );
  }

  /* -------------------------------------------- */

  // /** @override */
  // setPosition(options = {}) {
  //     const position = super.setPosition(options);
  //     const sheetBody = this.element.find(".sheet-body");
  //     const bodyHeight = position.height - 380;
  //     sheetBody.css("height", bodyHeight);
  //     return position;
  // }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;
    html.find(".advanced-req").click(async (evt) => {
      let update = await PickRequisites(this.item.system, evt.currentTarget.dataset.flavor);
      if (update) await this.item.update(update);
    });

    html.find(".select-form").change(async (evt) => {
      evt.preventDefault();

      if (CONFIG.ARM5E.ItemDataModels[this.item.type]?.getIcon) {
        let currentDefIcon = CONFIG.ARM5E.ItemDataModels[this.item.type].getIcon(this.item);
        // if the current img is the default icon of the previous value, allow change
        if (
          this.item.img === currentDefIcon ||
          this.item.img === ARM5E_DEFAULT_ICONS.MONO[this.item.type] ||
          this.item.img === ARM5E_DEFAULT_ICONS.COLOR[this.item.type] ||
          this.item.img === "icons/svg/mystery-man.svg" ||
          this.item.img === "icons/svg/item-bag.svg"
        ) {
          await this.item.update({
            img: CONFIG.ARM5E.ItemDataModels[this.item.type].getIcon(this.item, evt.target.value),
            "system.form.value": evt.target.value
          });
        }
      }
      // }
    });
  }
}
