import { ARM5E } from "../config.js";

export async function getAbilityFromCompendium(key, option = "") {
  const ref = game.settings.get(ARM5E.SYSTEM_ID, "compendiaRef");

  let res = await getAbilityInternal(ref, key, option);
  if (!res) {
    if (game.settings.get(ARM5E.SYSTEM_ID, "notifyMissingRef") == "true") {
      ui.notifications.info(`Unknown ability key (${key}) in ${ref} compendium`);
    }
    res = await getAbilityInternal(ARM5E.REF_MODULE_ID, key, option);
  }
  return res;
}

async function getAbilityInternal(moduleRef, key, option = "") {
  let abilitiesPack = game.packs.get(`${moduleRef}.abilities`);

  if (abilitiesPack == undefined) return undefined;

  if (!abilitiesPack.indexFields.has("system.key")) {
    await abilitiesPack.getIndex({ fields: ["system.key", "system.option"] });
  }
  let res = abilitiesPack.index.find((i) => i.system.key == key && i.system.option == option);
  if (res) {
    return await fromUuid(res.uuid);
  }
  return null;
}

export async function getItemFromCompendium(compendium, indexkey) {
  const ref = game.settings.get(ARM5E.SYSTEM_ID, "compendiaRef");

  let res = await getItemInternal(ref, compendium, indexkey);
  if (!res) {
    if (game.settings.get(ARM5E.SYSTEM_ID, "notifyMissingRef") == "true") {
      ui.notifications.info(`Unknown item key (${indexkey}) in ${ref} compendium`);
    }
    res = await getItemInternal(ARM5E.REF_MODULE_ID, indexkey);
  }
  return res;
}

async function getItemInternal(moduleRef, compendium, indexkey) {
  let pack = game.packs.get(`${moduleRef}.${compendium}`);

  if (pack == undefined) return undefined;

  if (!pack.indexFields.has("system.indexKey")) {
    await pack.getIndex({ fields: ["system.indexKey"] });
  }
  let res = pack.index.find((i) => i.system.indexKey == indexkey);
  if (res) {
    return await fromUuid(res.uuid);
  }
  return null;
}
