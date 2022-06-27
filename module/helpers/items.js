const TYPE_OF_ROLL = {
  ABILITY: "ability",
  SPELL: "spell",
  MAGIC: "magicalEffect",
  SPONT: "spont",
  WEAPON: "weapon"
};

function getDatasetForAbility(item) {
  if (item?.data?.type !== TYPE_OF_ROLL.ABILITY) return {};

  return {
    roll: TYPE_OF_ROLL.ABILITY,
    ability: item.data._id,
    defaultcharacteristicforability: item.data.data.defaultChaAb,
    name: name
  };
}

function getDatasetForWeapon(item) {
  if (item?.data?.type !== TYPE_OF_ROLL.WEAPON) return {};
  if (!item.data.data.equiped) {
    ui.notifications.info(game.i18n.localize("arm5e.sheet.notEquipedWeapon"));
    return {};
  }
  return {
    roll: "combat",
    name: game.i18n.localize("arm5e.sheet.attack"),
    option1: item.actor.data.data.characteristics.dex.value,
    txtoption1: game.i18n.localize("arm5e.sheet.dexterity"),
    option2: item.actor.data.data.combat.ability,
    txtoption2: game.i18n.localize("arm5e.sheet.ability"),
    option3: item.actor.data.data.combat.atk,
    txtoption3: game.i18n.localize("arm5e.sheet.attack")
  };
}

function getDatasetForSpell(item, noCheck) {
  if (!noCheck && item?.data?.type !== TYPE_OF_ROLL.SPELL) return {};

  return {
    roll: TYPE_OF_ROLL.SPELL,
    id: item.data._id,
    technique: item.data.data.technique.value,
    mform: item.data.data.form.value,
    bonus: item.data.data.bonus,
    bonus2: item.data.data.mastery,
    bonusActiveEffects: item.actor.data.data.bonuses.arts.spellcasting,
    name: item.data.name
  };
}

function getDatasetForMagic(item) {
  if (item?.data?.type !== TYPE_OF_ROLL.MAGIC) return {};
  return {
    ...getDatasetForSpell(item, true),
    divide: 2
  };
}

function prepareDatasetByTypeOfItem(item) {
  return {
    ...getDatasetForAbility(item),
    ...getDatasetForWeapon(item),
    ...getDatasetForSpell(item),
    ...getDatasetForMagic(item)
  };
}

export { prepareDatasetByTypeOfItem };
