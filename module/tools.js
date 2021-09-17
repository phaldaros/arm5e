
import { ARM5E } from "./metadata.js";

export function log(force, ...args) {
    try {
      const isDebugging = game.modules.get('_dev-mode')?.api?.getPackageDebugValue(ARM5E.MODULE_ID);
  
      if (force || isDebugging) {
        console.log(ARM5E.MODULE_ID, '|', ...args);
      }
    } catch (e) {
        console.log(e);
    }
}