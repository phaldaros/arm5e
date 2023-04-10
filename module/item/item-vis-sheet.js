import { debug, log } from "../tools.js";
import { ArM5eItemSheet, ArM5eItemSheetNoDesc } from "./item-sheet.js";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class ArM5eItemVisSheet extends ArM5eItemSheetNoDesc {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["arm5e", "sheet", "item"],
      width: 654,
      height: 800
    });
  }

  /** @override */
  async getData() {
    const context = await super.getData();
    return context;
  }
}
