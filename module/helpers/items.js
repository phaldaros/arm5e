const TYPE_OF_ROLL = {
    ABILITY: 'ability',
    SPELL: 'spell',
    MAGIC: 'magicalEffect',
    SPONT: 'spont'
}

function getDatasetForAbility(item) {
    if(item?.data?.type !== TYPE_OF_ROLL.ABILITY) return {}

    return {
        roll: TYPE_OF_ROLL.ABILITY,
        ability: item.data._id,
        defaultcharacteristicforability: item.data.data.defaultChaAb,
        name: name,
    }
}

function getDatasetForSpell(item, noCheck) {
    if(!noCheck && item?.data?.type !== TYPE_OF_ROLL.SPELL) return {}

    return {
        roll: TYPE_OF_ROLL.SPELL,
        id: item.data._id,
        technique: item.data.data.technique.value,
        mform: item.data.data.form.value,
        bonus: item.data.data.bonus,
        bonus2: item.data.data.mastery,
        bonusActiveEffects: item.actor.data.data.bonuses.arts.spellCasting,
        name: item.data.name,
    }
}

function getDatasetForMagic(item) {
    if(item?.data?.type !== TYPE_OF_ROLL.MAGIC) return {}
    return {
        ...getDatasetForSpell(item, true),
        divide: 2
    }
}

function prepareDatasetByTypeOfItem(item) {
    return {
        ...getDatasetForAbility(item),
        ...getDatasetForSpell(item),
        ...getDatasetForMagic(item),
    }
}

export {
    prepareDatasetByTypeOfItem,
}