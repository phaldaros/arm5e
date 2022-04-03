import { log } from "./tools.js";

export async function migration(originalVersion) {
  ui.notifications.info(
    `Applying ARM5E System Migration for version ${game.system.data.version}. Please be patient and do not close your game or shut down your server.`,
    {
      permanent: true
    }
  );

  console.log("Starting migration...");

  // Migrate World Actors
  for (let a of game.actors.contents) {
    try {
      if (a.data.type == "magus") {
        a.data.type = "player";
      }

      const updateData = migrateActorData(a.data);

      if (!isObjectEmpty(updateData)) {
        console.log(`Migrating Actor entity ${a.name}`);
        await a.update(updateData, {
          enforceTypes: false
        });
      }

      // const cleanData = cleanActorData(a.data)
      // if (!isObjectEmpty(cleanData)) {
      //     console.log(`Cleaning up Actor entity ${a.name}`);
      //     a.data.data = cleanData.data;
      // }
    } catch (err) {
      err.message = `Failed system migration for Actor ${a.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate World Items
  for (let i of game.items) {
    try {
      const updateData = migrateItemData(i.toObject());
      if (!foundry.utils.isObjectEmpty(updateData)) {
        console.log(`Migrating Item entity ${i.name}`);
        await i.update(updateData, {
          enforceTypes: false
        });
      }
      console.log(`Migrated Item entity ${i.name}`);

      // const cleanData = cleanItemData(i.data)
      // if (!isObjectEmpty(cleanData)) {
      //     console.log(`Cleaning up Item entity ${i.name}`);
      //     i.data.data = cleanData.data;
      // }
    } catch (err) {
      err.message = `Failed system migration for Item ${i.name}: ${err.message}`;
      console.error(err);
    }
  }

  // Migrate Actor Override Tokens
  for (let s of game.scenes) {
    try {
      const updateData = migrateSceneData(s.data);
      if (!foundry.utils.isObjectEmpty(updateData)) {
        console.log(`Migrating Scene entity ${s.name}`);
        await s.update(updateData, { enforceTypes: false });
        // If we do not do this, then synthetic token actors remain in cache
        // with the un-updated actorData.
        s.tokens.forEach((t) => (t._actor = null));
      }
    } catch (err) {
      err.message = `Failed system migration for Scene ${s.name}: ${err.message}`;
      console.error(err);
    }
  }

  // [DEV] Uncomment below to migrate system compendiums
  // for (let p of game.packs) {
  //   if (p.metadata.package !== "arm5e") continue;
  //   if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
  //   await migrateCompendium(p);
  // }

  // Migrate World Compendium Packs
  for (let p of game.packs) {
    if (p.metadata.package !== "world") continue;
    if (!["Actor", "Item", "Scene"].includes(p.documentName)) continue;
    await migrateCompendium(p);
  }

  // Set the migration as complete
  game.settings.set("arm5e", "systemMigrationVersion", game.system.data.version);
  ui.notifications.info(`Ars Magica 5e System Migration to version ${game.system.data.version} completed!`, {
    permanent: true
  });
}

/**
 * Apply migration rules to all Entities within a single Compendium pack
 * @param pack
 * @return {Promise}
 */
export const migrateCompendium = async function (pack) {
  const documentName = pack.documentName;
  if (!["Actor", "Item", "Scene"].includes(documentName)) return;

  // Unlock the pack for editing
  const wasLocked = pack.locked;
  await pack.configure({
    locked: false
  });

  // Begin by requesting server-side data model migration and get the migrated content
  await pack.migrate();
  const documents = await pack.getDocuments();

  // Iterate over compendium entries - applying fine-tuned migration functions
  for (let doc of documents) {
    let updateData = {};
    try {
      switch (documentName) {
        case "Actor":
          updateData = await migrateActorData(doc.toObject());
          break;
        case "Item":
          updateData = await migrateItemData(doc.toObject());
          break;
        case "Scene":
          updateData = migrateSceneData(doc.toObject());
          break;
      }

      // Save the entry, if data was changed
      if (foundry.utils.isObjectEmpty(updateData)) continue;
      await doc.update(updateData);
      console.log(`Migrated ${documentName} entity ${doc.name} in Compendium ${pack.collection}`);
    } catch (err) {
      // Handle migration failures
      err.message = `Failed arm5e system migration for entity ${doc.name} in pack ${pack.collection}: ${err.message}`;
      console.error(err);
    }
  }

  // Apply the original locked status for the pack
  await pack.configure({
    locked: wasLocked
  });
  console.log(`Migrated all ${documentName} entities from Compendium ${pack.collection}`);
};

/**
 * Migrate a single Scene document to incorporate changes to the data model of it's actor data overrides
 * Return an Object of updateData to be applied
 * @param {object} scene            The Scene data to Update
 * @param {object} [migrationData]  Additional data to perform the migration
 * @returns {object}                The updateData to apply
 */
export const migrateSceneData = function (scene, migrationData) {
  const tokens = scene.tokens.map((token) => {
    const t = token.toObject();
    const update = {};

    if (!t.actorId || t.actorLink) {
      t.actorData = {};
    } else if (!game.actors.has(t.actorId)) {
      t.actorId = null;
      t.actorData = {};
    } else if (!t.actorLink) {
      const actorData = duplicate(t.actorData);
      actorData.type = token.actor?.type;

      if (actorData.data) {
        actorData.data.charType = { value: token.actor?.data?.data?.charType?.value };
      }
      // else {
      //   actorData.data = { charType: { value: token.actor?.data?.data?.charType?.value } };
      // }
      const update = migrateActorData(actorData, migrationData);
      ["items", "effects"].forEach((embeddedName) => {
        if (!update[embeddedName]?.length) return;
        const updates = new Map(update[embeddedName].map((u) => [u._id, u]));
        t.actorData[embeddedName].forEach((original) => {
          const update = updates.get(original._id);
          if (update) mergeObject(original, update);
        });
        delete update[embeddedName];
      });

      mergeObject(t.actorData, update);
    }
    return t;
  });
  return { tokens };
};

/* -------------------------------------------- */
/*  Entity Type Migration Helpers               */
/* -------------------------------------------- */

/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actor    The actor data object to update
 * @return {Object}         The updateData to apply
 */
export const migrateActorData = function (actorData) {
  const updateData = {};

  //
  if (actorData.type == "laboratory") {
    // fix recursive problem with laboratory owner
    if (!(actorData.data.owner.value instanceof String)) {
      updateData["data.owner.value"] = "";
    }

    // Update data to official names
    if (actorData.data.salubrity) {
      updateData["data.health"] = actorData.data.salubrity;
      updateData["data.-=salubrity"] = null;
    }
    if (actorData.data.improvement) {
      updateData["data.refinement"] = actorData.data.improvement;
      updateData["data.-=improvement"] = null;
    }
    if (actorData.data.security) {
      updateData["data.safety"] = actorData.data.security;
      updateData["data.-=security"] = null;
    }
    if (actorData.data.maintenance) {
      updateData["data.upkeep"] = actorData.data.maintenance;
      updateData["data.-=maintenance"] = null;
    }

    return updateData;
  }

  updateData["data.version"] = "0.3";

  // token with barely anything to migrate
  if (actorData.data == undefined) {
    return updateData;
  }
  // convert after fixing typo dairy => diary
  if (actorData.data.dairyEntries) {
    updateData["data.diaryEntries"] = actorData.data.dairyEntries;
    updateData["data.-=dairyEntries"] = null;
  }

  // convert after fixing typo labarotary => laboratory
  if (actorData.data.version == "0.1") {
    if (actorData.data.labarotary) {
      updateData["data.laboratory"] = actorData.data.labarotary;
      updateData["data.-=labarotary"] = null;
    }
  }

  if (actorData.data.mightsFam) {
    updateData["data.powersFam"] = actorData.data.mightsFam;
    updateData["data.-=mightsFam"] = null;
  }

  if (actorData.data.mights) {
    updateData["data.powers"] = actorData.data.mights;
    updateData["data.-=mights"] = null;
  }

  if (actorData.data.soak) {
    updateData["data.vitals.soa.value"] = actorData.data.soak.value;
    updateData["data.-=soak"] = null;
  }

  if (actorData.data.size) {
    updateData["data.vitals.siz.value"] = actorData.data.size.value;
    updateData["data.-=size"] = null;
  }

  // remove redundant data
  if (actorData.data.houses != undefined) {
    updateData["data.-=houses"] = null;
  }

  // useless?
  // if (actorData.data.weapons === undefined) {
  //   updateData["data.weapons"] = [];
  // }
  // if (actorData.data.armor === undefined) {
  //   updateData["data.armor"] = [];
  // }
  // if (actorData.data.vis === undefined) {
  //   updateData["data.vis"] = [];
  // }
  // if (actorData.data.items === undefined) {
  //   updateData["data.items"] = [];
  // }
  // if (actorData.data.books === undefined) {
  //   updateData["data.books"] = [];
  // }
  // if (actorData.data.spells === undefined) {
  //   updateData["data.spells"] = [];
  // }

  if (actorData.type == "player" || actorData.type == "npc") {
    if (actorData.data?.roll != undefined) {
      updateData["data.roll.characteristic"] = "";
      updateData["data.roll.ability"] = "";
      updateData["data.roll.technique"] = "";
      updateData["data.roll.form"] = "";
      updateData["data.roll.total"] = "";
      updateData["data.roll.aura"] = 0;
      updateData["data.roll.rollLabel"] = "";
      updateData["data.roll.rollFormula"] = "";
    }
    if (actorData.data.decrepitude == undefined) {
      actorData.data.decrepitude = {};
    }

    // remove garbage stuff if it exists

    updateData["data.-=str"] = null;
    updateData["data.-=sta"] = null;
    updateData["data.-=int"] = null;
    updateData["data.-=per"] = null;
    updateData["data.-=dex"] = null;
    updateData["data.-=qik"] = null;
    updateData["data.-=cha"] = null;
    updateData["data.-=com"] = null;
  } else {
    updateData["data.-=roll"] = null;
  }

  if (actorData.type == "player" || actorData.type == "npc") {
    if (actorData.data.charType.value == "magus" || actorData.data.charType.value == "magusNPC") {
      if (actorData.data?.sanctum?.value === undefined) {
        let sanctum = {
          value: actorData.data.sanctum
        };
        updateData["data.sanctum"] = sanctum;
      }

      if (actorData.data?.laboratory != undefined) {
        updateData["data.laboratory.longevityRitual.labTotal"] = 0;
        updateData["data.laboratory.longevityRitual.modifier"] = 0;
        updateData["data.laboratory.longevityRitual.twilightScars"] = "";
      }

      if (actorData.data?.familiar?.characteristicsFam != undefined) {
        updateData["data.familiar.characteristicsFam.int"] = {
          value: actorData.data.familiar.characteristicsFam.int.value
        };
        updateData["data.familiar.characteristicsFam.per"] = {
          value: actorData.data.familiar.characteristicsFam.per.value
        };
        updateData["data.familiar.characteristicsFam.str"] = {
          value: actorData.data.familiar.characteristicsFam.str.value
        };
        updateData["data.familiar.characteristicsFam.sta"] = {
          value: actorData.data.familiar.characteristicsFam.sta.value
        };
        updateData["data.familiar.characteristicsFam.pre"] = {
          value: actorData.data.familiar.characteristicsFam.pre.value
        };
        updateData["data.familiar.characteristicsFam.com"] = {
          value: actorData.data.familiar.characteristicsFam.com.value
        };
        updateData["data.familiar.characteristicsFam.dex"] = {
          value: actorData.data.familiar.characteristicsFam.dex.value
        };
        updateData["data.familiar.characteristicsFam.qik"] = {
          value: actorData.data.familiar.characteristicsFam.qik.value
        };
      }
      //
      // migrate arts xp
      //
      if (actorData.data?.arts?.techniques != undefined) {
        for (const [key, technique] of Object.entries(actorData.data.arts.techniques)) {
          if (technique.experienceNextLevel != undefined) {
            // if the experience is equal or bigger than the xp for this score, use it as total xp
            let exp = (technique.score * (technique.score + 1)) / 2;
            if (technique.experience >= exp) {
              updateData["data.arts.techniques." + key + ".xp"] = technique.experience;
            } else if (technique.experience >= technique.score + 1) {
              // if the experience is bigger than the neeeded for next level, ignore it
              updateData["data.arts.techniques." + key + ".xp"] = exp;
            } else {
              // compute normally
              updateData["data.arts.techniques." + key + ".xp"] = exp + technique.experience;
            }

            // TODO: to be uncommented when we are sure the new system works
            // updateData["data.-=experience"] = null;
            // updateData["data.-=score"] = null;
            updateData["data.arts.techniques." + key + ".-=experienceNextLevel"] = null;
          }
        }
      }
      if (actorData.data?.arts?.forms != undefined) {
        for (const [key, form] of Object.entries(actorData.data.arts.forms)) {
          if (form.experienceNextLevel != undefined) {
            // if the experience is equal or bigger than the xp for this score, use it as total xp
            let exp = (form.score * (form.score + 1)) / 2;
            if (form.experience >= exp) {
              updateData["data.arts.forms." + key + ".xp"] = form.experience;
            } else if (form.experience >= form.score + 1) {
              // if the experience is bigger than the neeeded for next level, ignore it
              updateData["data.arts.forms." + key + ".xp"] = exp;
            } else {
              // compute normally
              updateData["data.arts.forms." + key + ".xp"] = exp + form.experience;
            }

            // TODO: to be uncommented when we are sure the new system works
            // updateData["data.forms." + key + ".-=experience"] = null;
            // updateData["data.forms." + key + "-=score"] = null;
            updateData["data.arts.forms." + key + ".-=experienceNextLevel"] = null;
          }
        }
      }
    }
  }

  if (actorData.type == "player" || actorData.type == "npc") {
    if (actorData.effects && actorData.effects.length > 0) {
      log(false, `Migrating effects of ${actorData.name}`);
      const effects = actorData.effects.reduce((arr, e) => {
        // Migrate effects
        const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
        let effectUpdate = migrateActiveEffectData(effectData);
        if (!isObjectEmpty(effectUpdate)) {
          // Update the effect
          effectUpdate._id = effectData._id;
          arr.push(expandObject(effectUpdate));
        }
        return arr;
      }, []);
      if (effects.length > 0) {
        log(false, effects);
        updateData.effects = effects;
      }
    }
  }
  // else {
  //   log(false, `Removing all effects of ${actorData.name}`);
  //   updateData.effects = [];
  // }

  // Migrate Owned Items
  if (!actorData.items) return updateData;

  const items = actorData.items.reduce((arr, i) => {
    // Migrate the Owned Item
    const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
    let itemUpdate = migrateItemData(itemData);

    // Update the Owned Item
    if (!isObjectEmpty(itemUpdate)) {
      itemUpdate._id = itemData._id;
      arr.push(expandObject(itemUpdate));
    }
    return arr;
  }, []);
  if (items.length > 0) updateData.items = items;

  return updateData;
};

export const migrateActiveEffectData = function (effectData) {
  let effectUpdate = {};
  // update flags

  // Update from 1.3.1
  if (effectData.flags.type != undefined) {
    effectUpdate["flags.arm5e.type"] = [effectData.flags.type];
    effectUpdate["flags.-=type"] = null;
  }
  if (effectData.flags.subtype != undefined) {
    effectUpdate["flags.arm5e.subtype"] = [effectData.flags.subtype];
    effectUpdate["flags.-=subtype"] = null;
  }
  if (effectData.flags.value != undefined) {
    effectUpdate["flags.arm5e.value"] = [effectData.flags.value];
    effectUpdate["flags.-=value"] = null;
  }

  // Fix mess active effect V1
  if (effectData.flags?.arm5e.type != undefined) {
    if (!(effectData.flags.arm5e.type instanceof Array)) {
      if (effectData.flags.arm5e.type === "spellCasting") {
        effectData.flags.arm5e.type = "spellcasting";
      }
      effectUpdate["flags.arm5e.type"] = [effectData.flags.arm5e.type];
    } else {
      let idx = 0;
      for (const name of effectData.flags.arm5e.type.values()) {
        if (name === "spellCasting") {
          effectUpdate["flags.arm5e.type." + idx] = "spellcasting";
        }
        idx++;
      }
    }
  }

  if (effectData.flags?.arm5e.subtype != undefined && !(effectData.flags.arm5e.subtype instanceof Array)) {
    effectUpdate["flags.arm5e.subtype"] = [effectData.flags.arm5e.subtype];
  }

  if (effectData.flags?.arm5e?.option == undefined) {
    let optionArray = Array(effectData.changes.length).fill(null);
    effectUpdate["flags.arm5e.option"] = optionArray;
  }

  return effectUpdate;
};

export const migrateItemData = function (itemData) {
  const updateData = {};
  updateData["data.version"] = "1.3.2";

  //
  // migrate abilities xp
  //
  if (itemData.type === "ability") {
    if (itemData.data.experienceNextLevel != undefined) {
      // if the experience is equal or bigger than the xp for this score, use it as total xp
      let exp = ((itemData.data.score * (itemData.data.score + 1)) / 2) * 5;
      if (itemData.data.experience >= exp) {
        updateData["data.xp"] = itemData.data.experience;
      } else if (itemData.data.experience >= (itemData.data.score + 1) * 5) {
        // if the experience is bigger than the neeeded for next level, ignore it
        updateData["data.xp"] = exp;
      } else {
        // compute normally
        updateData["data.xp"] = exp + itemData.data.experience;
      }
      // TODO: to be uncommentedm when we are sure the new system works
      // updateData["data.-=experience"] = null;
      // updateData["data.-=score"] = null;
      updateData["data.-=experienceNextLevel"] = null;

      // clean-up TODO: remove
      updateData["data.-=puissant"] = null;
      updateData["data.-=affinity"] = null;
    }

    // no key assigned to the ability, try to find one
    if (CONFIG.ARM5E.ALL_ABILITIES[itemData.data.key] == undefined || itemData.data.key == "") {
      log(true, `Trying to find key for ability ${itemData.name}`);
      let name = itemData.name.toLowerCase();
      // handle those pesky '*' at the end of restricted abilities
      if (name.endsWith("*")) {
        name = name.substring(0, name.length - 1);
      }

      // Special common cases
      if (game.i18n.localize("arm5e.skill.commonCases.native").toLowerCase() == name) {
        updateData["data.key"] = "livingLanguage";
        updateData["data.option"] = "nativeTongue";
        log(false, `Found key livingLanguage for ability  ${itemData.name}`);
      } else if (game.i18n.localize("arm5e.skill.commonCases.areaLore").toLowerCase() == name) {
        updateData["data.key"] = "areaLore";
        log(false, `Found key areaLore for ability  ${itemData.name}`);
      } else if (game.i18n.localize("arm5e.skill.commonCases.latin").toLowerCase() == name) {
        updateData["data.key"] = "deadLanguage";
        updateData["data.option"] = "Latin";
        log(false, `Found key latin for ability  ${itemData.name}`);
      } else if (game.i18n.localize("arm5e.skill.commonCases.hermesLore").toLowerCase() == name) {
        updateData["data.key"] = "organizationLore";
        updateData["data.option"] = "OrderOfHermes";
        log(false, `Found key hermesLore for ability  ${itemData.name}`);
      } else {
        for (const [key, value] of Object.entries(CONFIG.ARM5E.ALL_ABILITIES)) {
          if (game.i18n.localize(value.mnemonic).toLowerCase() == name) {
            updateData["data.key"] = key;
            log(false, `Found key ${key} for ability  ${itemData.name}`);
            break;
          }
        }
      }
      if (updateData["data.key"] == undefined) {
        log(true, `Unable to find a key for ability  ${itemData.name}`);
      }
    }
    if (itemData.data.option != undefined) {
      // keep only alphanum chars
      updateData["data.option"] = itemData.data.option.replace(/[^a-zA-Z0-9]/gi, "");
    }
  }

  if (_isMagicalItem(itemData)) {
    if (itemData.type != "baseEffect") {
      if (itemData.data.duration.value === undefined) {
        // console.log(`Guessing duration: ${itemData.data.duration}`);
        updateData["data.duration.value"] = _guessDuration(itemData.name, itemData.data.duration);
      }
      if (itemData.data.range.value === undefined) {
        // console.log(`Guessing range: ${itemData.data.range}`);
        updateData["data.range.value"] = _guessRange(itemData.name, itemData.data.range);
      }
      if (itemData.data.target.value === undefined) {
        // console.log(`Guessing target: ${itemData.data.target}`);
        updateData["data.target.value"] = _guessTarget(itemData.name, itemData.data.target);
      }
    }

    if (itemData.data.technique.value === "") {
      updateData["data.technique.value"] = "cr";
    }
    if (itemData.data.form.value === "") {
      updateData["data.form.value"] = "an";
    }
    // remove redundant data
    if (itemData.data.techniques != undefined) {
      updateData["data.-=techniques"] = null;
    }
    if (itemData.data.forms != undefined) {
      updateData["data.-=forms"] = null;
    }
    if (itemData.data["technique-requisites"] != undefined) {
      updateData["data.-=technique-requisites"] = null;
    }
    if (itemData.data["form-requisites"] != undefined) {
      updateData["data.-=form-requisites"] = null;
    }
    if (itemData.data["technique-requisite"] != undefined) {
      if (itemData.data["technique-requisite"].value != "n-a" && itemData.data["technique-requisite"].value != "") {
        updateData["data.technique-req." + itemData.data["technique-requisite"].value] = true;
      }
      updateData["data.-=technique-requisite"] = null;
    }

    if (itemData.data["form-requisite"] != undefined) {
      if (itemData.data["form-requisite"].value != "n-a" && itemData.data["form-requisite"].value != "") {
        updateData["data.form-req." + itemData.data["form-requisite"].value] = true;
      }
      updateData["data.-=form-requisite"] = null;
    }

    // temporary : removal of authorship in spell, it will only be present in lab texts
    if (itemData.type == "spell") {
      updateData["data.-=author"] = null;
      updateData["data.-=year"] = null;
      updateData["data.-=season"] = null;
      updateData["data.-=language"] = null;
    }
    // Fix type of Item
    if (itemData.type == "dairyEntry") {
      updateData["type"] = "diaryEntry";
    }
    if (itemData.type == "might") {
      updateData["type"] = "power";
    }
    if (itemData.type == "mightFamiliar") {
      updateData["type"] = "powerFamiliar";
    }
  }
  if (itemData.effects.length > 0) {
    log(false, `Migrating effects of ${itemData.name}`);
    const effects = itemData.effects.reduce((arr, e) => {
      // Migrate effects
      const effectData = e instanceof CONFIG.ActiveEffect.documentClass ? e.toObject() : e;
      let effectUpdate = migrateActiveEffectData(effectData);
      if (!isObjectEmpty(effectUpdate)) {
        // Update the effect
        effectUpdate._id = effectData._id;
        arr.push(expandObject(effectUpdate));
      }
      return arr;
    }, []);
    if (effects.length > 0) {
      updateData.effects = effects;
    }
  }
  // if (itemData.effects) {
  //   log(false, `Effects of items: ${itemData.effects}`);
  // }

  return updateData;
};

function _isMagicalItem(itemData) {
  switch (itemData.type) {
    case "spell":
    case "magicalEffect":
    case "enchantment":
    case "baseEffect":
      return true;
    case "laboratoryText": {
      return itemData.data.type === "spell";
    }
    default:
      return false;
  }
}

/**
 * Scrub an Actor's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} actorData    The data object for an Actor
 * @return {Object}             The scrubbed Actor data
 */
function cleanActorData(actorData) {
  // Scrub system data
  const model = game.system.model.Actor[actorData.type];
  actorData.data = filterObject(actorData.data, model);

  // Return the scrubbed data
  return actorData;
}

/**
 * Scrub an Item's system data, removing all keys which are not explicitly defined in the system template
 * @param {Object} itemData    The data object for an Item
 * @return {Object}             The scrubbed Item data
 */
function cleanItemData(itemData) {
  // Scrub system data
  const model = game.system.model.Item[itemData.type];
  itemData.data = filterObject(itemData.data, model);

  // Return the scrubbed data
  return itemData;
}

// Unfortunaltly, since the range was a free input field, it has to be guessed
function _guessRange(name, value) {
  switch (value.toLowerCase()) {
    case "personal":
    case "pers":
    case "per":
    case game.i18n.localize("arm5e.spell.ranges.personal"):
      return "personal";
    case "touch":
    case game.i18n.localize("arm5e.spell.ranges.touch"):
      return "touch";
    case "eye":
    case game.i18n.localize("arm5e.spell.ranges.eye"):
      return "eye";
    case "voice":
    case game.i18n.localize("arm5e.spell.ranges.voice"):
      return "voice";
    case "road":
    case game.i18n.localize("arm5e.spell.ranges.road"):
      return "road";
    case "sight":
    case game.i18n.localize("arm5e.spell.ranges.sight"):
      return "sight";
    case "arc":
    case "arcane connection":
    case game.i18n.localize("arm5e.spell.ranges.arc"):
      return "arc";
    case "special":
    case "spe":
    case "spec":
    case game.i18n.localize("arm5e.config.special"):
      return "special";
    default:
      ui.notifications.warn(
        `Warning: Unable to guess range \"${value}\" of ${name}, you will have to set it manually`,
        {
          permanent: false
        }
      );
      console.warn(`Range \"${value}\" of spell ${name} could not be guessed`);
      return "other";
  }
}

// Unfortunaltly, since the target was a free input field, it has to be guessed
function _guessTarget(name, value) {
  switch (value.toLowerCase().trim()) {
    case "individual":
    case "ind":
    case "indiv":
    case game.i18n.localize("arm5e.spell.ranges.ind"):
      return "ind";
    case "circle":
    case "cir":
    case game.i18n.localize("arm5e.spell.ranges.circle"):
      return "circle";
    case "part":
    case "par":
    case game.i18n.localize("arm5e.spell.ranges.part"):
      return "part";
    case "group":
    case "gro":
    case "grp":
    case game.i18n.localize("arm5e.spell.ranges.group"):
      return "group";
    case "room":
    case game.i18n.localize("arm5e.spell.ranges.room"):
      return "room";
    case "struct":
    case "str":
    case game.i18n.localize("arm5e.spell.ranges.struct"):
      return "struct";
    case "boundary":
    case "bound":
    case "bou":
    case game.i18n.localize("arm5e.spell.ranges.bound"):
      return "bound";
    case "taste":
    case "tas":
    case game.i18n.localize("arm5e.spell.ranges.taste"):
      return "taste";
    case "hearing":
    case "hea":
    case game.i18n.localize("arm5e.spell.ranges.hearing"):
      return "hearing";
    case "touch":
    case "tou":
    case game.i18n.localize("arm5e.spell.ranges.touch"):
      return "touch";
    case "smell":
    case "sme":
    case game.i18n.localize("arm5e.spell.ranges.smell"):
      return "smell";
    case "sight":
    case "sig":
    case game.i18n.localize("arm5e.spell.ranges.sight"):
      return "sight";
    case "special":
    case "spe":
    case "spec":
    case game.i18n.localize("arm5e.config.special"):
      return "special";
    default:
      ui.notifications.warn(
        `Warning: Unable to guess target \"${value}\" of ${name}, you will have to set it manually`,
        {
          permanent: false
        }
      );
      console.warn(`Target \"${value}\" of spell ${name} could not be guessed`);
      return "other";
  }
}

// Unfortunaltely, since the duration was a free input field, it has to be guessed
function _guessDuration(name, value) {
  switch (value.toLowerCase().trim()) {
    case "moment":
    case "momentary":
    case "mom":
    case game.i18n.localize("arm5e.spell.ranges.moment"):
      return "moment";
    case "diameter":
    case "dia":
    case "diam":
      return "diam";
    case "concentration":
    case game.i18n.localize("arm5e.spell.ranges.conc"):
      return "conc";
    case "sun":
    case game.i18n.localize("arm5e.spell.ranges.sun"):
      return "sun";
    case "ring":
    case game.i18n.localize("arm5e.spell.ranges.ring"):
      return "ring";
    case "moon":
    case game.i18n.localize("arm5e.spell.ranges.moon"):
      return "moon";
    case "fire":
    case game.i18n.localize("arm5e.spell.ranges.fire"):
      return "fire";
    case "bargain":
    case "barg":
    case game.i18n.localize("arm5e.spell.ranges.barg"):
      return "bargain";
    case "year":
    case game.i18n.localize("arm5e.spell.ranges.year"):
      return "year";
    case "condition":
    case "cond":
    case game.i18n.localize("arm5e.spell.ranges.condition"):
      return "condition";
    case "year+1":
    case game.i18n.localize("arm5e.spell.ranges.year+1"):
      return "year+1";
    case "special":
    case "spe":
    case "spec":
    case game.i18n.localize("arm5e.config.special"):
      return "special";
    default:
      ui.notifications.warn(
        `Warning: Unable to guess duration \"${value}\" of ${name}, you will have to set it manually`,
        {
          permanent: false
        }
      );
      console.warn(`Duration \"${value}\" of spell ${name} could not be guessed`);
      return "other";
  }
}
