const TYPE_OF_ROLL = {
  ABILITY: "ability",
  SPELL: "spell",
  MAGIC: "magic",
  POWER: "power",
  SPONT: "spont",
  WEAPON: "weapon"
};

//TODO
function getDatasetForAbility(item) {
  if (item?.data?.type !== TYPE_OF_ROLL.ABILITY) return {};

  return {
    roll: TYPE_OF_ROLL.ABILITY,
    ability: item.data._id,
    defaultCharacteristic: item.data.data.defaultChaAb,
    name: name
  };
}

//TODO
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

//TODO
function getDatasetForSpell(item, noCheck) {
  if (!noCheck && item?.data?.type !== TYPE_OF_ROLL.SPELL) return {};

  return {
    roll: TYPE_OF_ROLL.SPELL,
    id: item.data._id,
    technique: item.data.data.technique.value,
    form: item.data.data.form.value,
    modifier: item.data.data.bonus,
    mastery: item.data.data.mastery,
    bonusActiveEffects: item.actor.data.data.bonuses.arts.spellcasting,
    name: item.name,
    img: item.img
  };
}

//TODO
function getDatasetForMagic(item) {
  if (item?.data?.type !== "magicalEffect") return {};
  return {
    roll: TYPE_OF_ROLL.MAGIC,
    id: item.data._id,
    technique: item.data.data.technique.value,
    form: item.data.data.form.value,
    modifier: item.data.data.bonus,
    bonusActiveEffects: item.actor.data.data.bonuses.arts.spellcasting,
    name: item.name,
    img: item.img,
    divide: 2
  };
}

//TODO
function getDatasetForPower(item) {
  if (item?.data?.type !== TYPE_OF_ROLL.POWER) return {};
  return {
    roll: TYPE_OF_ROLL.POWER,
    id: item.data._id,
    form: item.data.data.form,
    cost: item.data.data.cost,
    bonusActiveEffects: item.actor.data.data.bonuses.arts.spellcasting,
    name: item.name,
    img: item.img
  };
}

function prepareDatasetByTypeOfItem(item) {
  return {
    ...getDatasetForAbility(item),
    ...getDatasetForWeapon(item),
    ...getDatasetForSpell(item),
    ...getDatasetForMagic(item),
    ...getDatasetForPower(item)
  };
}

export { prepareDatasetByTypeOfItem };
