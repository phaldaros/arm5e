import { log } from "../tools.js";
import { modifyAuraActiveEffectForAllTokensInScene } from "../helpers/aura.js";
/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Scene}
 */
export class ArM5eScene extends Scene {
  /**
   * Handle Scene activation workflow if the active state is changed to true
   * @param {boolean} active    Is the scene now active?
   * @protected
   */
  _onActivate(active) {
    log(false, `AURA_MANAGEMENT Scene activated: ${this.name}`);
    super._onActivate(active);

    if (active) {
      const aura = this.getFlag("world", "aura_" + this._id);
      const type = this.getFlag("world", "aura_type_" + this._id);
      if (aura && type) {
        modifyAuraActiveEffectForAllTokensInScene(this, aura, type);
      }
    }
  }
}
