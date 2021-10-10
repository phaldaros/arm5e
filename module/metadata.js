export const ARM5E = {};

/**
 * The set of metadata used within the sytem that will
 * probably not change
 * @type {Object}
 */
ARM5E.MODULE_ID = 'arm5e';

// default icons (TODO set them)

ARM5E.icons = {
    "DEFAULT_SPELL": "icons/svg/explosion.svg",
    "DEFAULT_WEAPON": "icons/svg/sword.svg",
    "DEFAULT_ARMOR": "icons/equipment/chest/breastplate-scale-grey.webp",
    "DEFAULT_BOOK": "icons/svg/book.svg",
    "DEFAULT_LABTEXT": "icons/commodities/materials/parchment-secrets.webp"
};

ARM5E.character = {};

ARM5E.character.charTypes = {
    "magus": {
        "label": "arm5e.sheet.magus",
        "dtype": "String"
    },
    "companion": {
        "label": "arm5e.sheet.companion",
        "dtype": "String"
    },
    "grog": {
        "label": "arm5e.sheet.grog",
        "dtype": "String"
    }
};



ARM5E.character.characteristics = {
    "int": {
        "label": "arm5e.sheet.intelligence",
        "short": "arm5e.sheet.int"
    },
    "per": {
        "label": "arm5e.sheet.perception",
        "short": "arm5e.sheet.per"
    },
    "str": {
        "label": "arm5e.sheet.strength",
        "short": "arm5e.sheet.str"
    },
    "sta": {
        "label": "arm5e.sheet.stamina",
        "short": "arm5e.sheet.sta"
    },
    "pre": {
        "label": "arm5e.sheet.presence",
        "short": "arm5e.sheet.pre"
    },
    "com": {
        "label": "arm5e.sheet.communication",
        "short": "arm5e.sheet.com"
    },
    "dex": {
        "label": "arm5e.sheet.dexterity",
        "short": "arm5e.sheet.dex"
    },
    "qik": {
        "label": "arm5e.sheet.quickness",
        "short": "arm5e.sheet.qik"
    }
};
ARM5E.character.houses = {
    "n-a": {
        "label": "N/A",
        "dtype": "String"
    },
    "bjo": {
        "label": "Bjornaer",
        "dtype": "String"
    },
    "bon": {
        "label": "Bonisagus",
        "dtype": "String"
    },
    "cri": {
        "label": "Criamon",
        "dtype": "String"
    },
    "exm": {
        "label": "Ex Miscellanea",
        "dtype": "String"
    },
    "fla": {
        "label": "Flambeau",
        "dtype": "String"
    },
    "gen": {
        "label": "Generic Magus",
        "dtype": "String"
    },
    "gue": {
        "label": "Guernicus",
        "dtype": "String"
    },
    "jer": {
        "label": "Jerbiton",
        "dtype": "String"
    },
    "mer": {
        "label": "Mercere",
        "dtype": "String"
    },
    "mta": {
        "label": "Merinita",
        "dtype": "String"
    },
    "tre": {
        "label": "Tremere",
        "dtype": "String"
    },
    "tyt": {
        "label": "Tytalus",
        "dtype": "String"
    },
    "ver": {
        "label": "Verditius",
        "dtype": "String"
    }
};
ARM5E.character.description = {
    "born": {
        "label": "arm5e.sheet.yearBorn"
    },
    "apprentice": {
        "label": "arm5e.sheet.apprenticeshipYears"
    },
    "birthname": {
        "label": "arm5e.sheet.birthName"
    },
    "birthplace": {
        "label": "arm5e.sheet.birthplace"
    },
    "nationality": {
        "label": "arm5e.sheet.nationality"
    },
    "religion": {
        "label": "arm5e.sheet.religion"
    },
    "height": {
        "label": "arm5e.sheet.height"
    },
    "weight": {
        "label": "arm5e.sheet.weight"
    },
    "gender": {
        "label": "arm5e.sheet.gender"
    },
    "hair": {
        "label": "arm5e.sheet.hair"
    },
    "eyes": {
        "label": "arm5e.sheet.eyes"
    },
    "title": {
        "label": "arm5e.sheet.profession"
    },
    "handed": {
        "label": "arm5e.sheet.handedness"
    }
};

ARM5E.character.virtueTypes = {
    "hermetic": {
        "label": "arm5e.sheet.hermetic"
    },
    "supernatural": {
        "label": "arm5e.sheet.supernatural"
    },
    "social": {
        "label": "arm5e.sheet.socialStatus"
    },
    "general": {
        "label": "arm5e.sheet.general"
    },
    "other": {
        "label": "arm5e.sheet.other"
    }
};

ARM5E.character.flawTypes = {
    "hermetic": {
        "label": "arm5e.sheet.hermetic"
    },
    "supernatural": {
        "label": "arm5e.sheet.supernatural"
    },
    "social": {
        "label": "arm5e.sheet.socialStatus"
    },
    "general": {
        "label": "arm5e.sheet.general"
    },
    "personality": {
        "label": "arm5e.sheet.personality"
    },
    "story": {
        "label": "arm5e.sheet.story"
    },
    "other": {
        "label": "arm5e.sheet.other"
    }
};

ARM5E.character.fatigueLevels = {
    "fresh": {
        "label": "arm5e.sheet.fresh",
        "time": null
    },
    "winded": {
        "label": "arm5e.sheet.winded",
        "time": "2 min."
    },
    "weary": {
        "label": "arm5e.sheet.weary",
        "time": "10 min."
    },
    "tired": {
        "label": "arm5e.sheet.tired",
        "time": "30 min."
    },
    "dazed": {
        "label": "arm5e.sheet.dazed",
        "time": "1 hr."
    },
    "unconscious": {
        "label": "arm5e.sheet.unconscious",
        "time": "2 hr."
    }
};


ARM5E.character.wounds = {
    "labels": {
        "number": "arm5e.sheet.number",
        "penalty": "arm5e.sheet.penalty",
        "notes": "arm5e.sheet.notes"
    },
    "light": {
        "label": "arm5e.sheet.light",
    },
    "medium": {
        "label": "arm5e.sheet.medium",
    },
    "heavy": {
        "label": "arm5e.sheet.heavy",
    },
    "incap": {
        "label": "arm5e.sheet.incap",
    },
    "dead": {
        "label": "arm5e.sheet.dead",
    }
};

ARM5E.character.vitals = {
    "siz": {
        "label": "arm5e.sheet.size",
    },
    "soa": {
        "label": "arm5e.sheet.soak",
    },
    "enc": {
        "label": "arm5e.sheet.encumbrance",
    }
};

ARM5E.character.combat = {};

ARM5E.npc = {};
ARM5E.npc.types = {
    "magusNPC": {
        "label": "arm5e.sheet.magus",
        "dtype": "String"
    },
    "mundane": {
        "label": "arm5e.sheet.mundane",
        "dtype": "String"
    },
    "entity": {
        "label": "arm5e.sheet.entity",
        "dtype": "String"
    }
};

ARM5E.familiar = {};
ARM5E.familiar.labels = {
    "size": {
        "label": "arm5e.sheet.size"
    },
    "might": {
        "label": "arm5e.sheet.might"
    },
    "soak": {
        "label": "arm5e.sheet.soak"
    },
    "fatigue": {
        "label": "arm5e.sheet.fatigue"
    },
    "initiative": {
        "label": "arm5e.sheet.initiative"
    },
    "attack": {
        "label": "arm5e.sheet.attack"
    },
    "defense": {
        "label": "arm5e.sheet.defense"
    },
    "damage": {
        "label": "arm5e.sheet.damage"
    }
};

ARM5E.covenant = {};
ARM5E.covenant.labels = {
    "library": "arm5e.sheet.library",
    "laboratoryTexts": "arm5e.sheet.laboratoryTexts",
    "vis": "arm5e.sheet.vis",
    "magicItems": "arm5e.sheet.magicItems",
    "specialists": "arm5e.sheet.specialists",
    "laboratories": "arm5e.sheet.laboratories",
    "money": "arm5e.sheet.money"
};
// influence is the impact the aura has on powers of magic, faery, divine and infernal respectively
ARM5E.realms = {
    "magic": {
        "label": "arm5e.sheet.realm.magical",
        "dtype": "String",
        "influence": [1, 0.5, 0, -1]
    },
    "faeric": {
        "label": "arm5e.sheet.realm.faeric",
        "dtype": "String",
        "influence": [0.5, 1, 0, -1]
    },
    "divine": {
        "label": "arm5e.sheet.realm.divine",
        "dtype": "String",
        "influence": [-3, -4, 1, -5]
    },
    "infernal": {
        "label": "arm5e.sheet.realm.infernal",
        "dtype": "String",
        "influence": [-1, -2, 0, 1]
    }

};

ARM5E.impacts = {
    "free": {
        "label": "arm5e.sheet.free",
        "dtype": "String",
        "cost": 0
    },
    "major": {
        "label": "arm5e.sheet.major",
        "dtype": "String",
        "cost": 3
    },
    "minor": {
        "label": "arm5e.sheet.minor",
        "dtype": "String",
        "cost": 1
    }
};

ARM5E.seasons = {
    "spring": {
        "label": "arm5e.sheet.spring"
    },
    "summer": {
        "label": "arm5e.sheet.summer"
    },
    "autumn": {
        "label": "arm5e.sheet.autumn"
    },
    "winter": {
        "label": "arm5e.sheet.winter"
    }
};

ARM5E.magic = {};
ARM5E.magic.arts = {
    "cr": {
        "label": "Creo",
        "short": "Cr",
        "dtype": "String"
    },
    "in": {
        "label": "Intellego",
        "short": "In",
        "dtype": "String"
    },
    "mu": {
        "label": "Muto",
        "short": "Mu",
        "dtype": "String"
    },
    "pe": {
        "label": "Perdo",
        "short": "Pe",
        "dtype": "String"
    },
    "re": {
        "label": "Rego",
        "short": "Re",
        "dtype": "String"
    },
    "an": {
        "label": "Animal",
        "short": "An",
        "dtype": "String"
    },
    "au": {
        "label": "Auram",
        "short": "Au",
        "dtype": "String"
    },
    "aq": {
        "label": "Aquam",
        "short": "Aq",
        "dtype": "String"
    },
    "co": {
        "label": "Corpus",
        "short": "Co",
        "dtype": "String"
    },
    "he": {
        "label": "Herbam",
        "short": "He",
        "dtype": "String"
    },
    "ig": {
        "label": "Ignem",
        "short": "Ig",
        "dtype": "String"
    },
    "im": {
        "label": "Imaginem",
        "short": "Im",
        "dtype": "String"
    },
    "me": {
        "label": "Mentem",
        "short": "Me",
        "dtype": "String"
    },
    "te": {
        "label": "Terram",
        "short": "Te",
        "dtype": "String"
    },
    "vi": {
        "label": "Vim",
        "short": "Vi",
        "dtype": "String"
    }
};

ARM5E.magic.techniques = {
    "cr": {
        "label": "Creo",
        "dtype": "String"
    },
    "in": {
        "label": "Intellego",
        "dtype": "String"
    },
    "mu": {
        "label": "Muto",
        "dtype": "String"
    },
    "pe": {
        "label": "Perdo",
        "dtype": "String"
    },
    "re": {
        "label": "Rego",
        "dtype": "String"
    }
};

ARM5E.magic.forms = {
    "an": {
        "label": "Animal",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.an"
    },
    "aq": {
        "label": "Aquam",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.aq"
    },
    "au": {
        "label": "Auram",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.au"
    },
    "co": {
        "label": "Corpus",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.co"
    },
    "he": {
        "label": "Herbam",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.he"
    },
    "ig": {
        "label": "Ignem",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.ig"
    },
    "im": {
        "label": "Imaginem",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.im"
    },
    "me": {
        "label": "Mentem",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.me"
    },
    "te": {
        "label": "Terram",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.te"
    },
    "vi": {
        "label": "Vim",
        "dtype": "String",
        "baseSize": "arm5e.sheet.target.size.vi"
    }
};

ARM5E.magic.shorts = {
    "duration": "arm5e.spell.duration.short",
    "target": "arm5e.spell.target.short",
    "range": "arm5e.spell.range.short"
}
ARM5E.magic.durations = {
    "moment": {
        "label": "arm5e.spell.durations.moment",
        "dtype": "String",
        "impact": 0
    },
    "conc": {
        "label": "arm5e.spell.durations.conc",
        "dtype": "String",
        "impact": 1
    },
    "diam": {
        "label": "arm5e.spell.durations.diam",
        "dtype": "String",
        "impact": 1
    },
    "sun": {
        "label": "arm5e.spell.durations.sun",
        "dtype": "String",
        "impact": 2
    },
    "ring": {
        "label": "arm5e.spell.durations.ring",
        "dtype": "String",
        "impact": 2
    },
    "moon": {
        "label": "arm5e.spell.durations.moon",
        "dtype": "String",
        "impact": 3
    },
    "fire": {
        "label": "arm5e.spell.durations.fire",
        "dtype": "String",
        "impact": 3
    },
    "bargain": {
        "label": "arm5e.spell.durations.bargain",
        "dtype": "String",
        "impact": 3
    },
    "year": {
        "label": "arm5e.spell.durations.year",
        "dtype": "String",
        "impact": 4
    },
    "condition": {
        "label": "arm5e.spell.durations.condition",
        "dtype": "String",
        "impact": 4
    },
    "year+1": {
        "label": "arm5e.spell.durations.year+1",
        "dtype": "String",
        "impact": 4
    }
};

ARM5E.magic.ranges = {
    "personal": {
        "label": "arm5e.spell.ranges.personal",
        "dtype": "String",
        "impact": 0
    },
    "touch": {
        "label": "arm5e.spell.ranges.touch",
        "dtype": "String",
        "impact": 1
    },
    "eye": {
        "label": "arm5e.spell.ranges.eye",
        "dtype": "String",
        "impact": 1
    },
    "voice": {
        "label": "arm5e.spell.ranges.voice",
        "dtype": "String",
        "impact": 2
    },
    "road": {
        "label": "arm5e.spell.ranges.road",
        "dtype": "String",
        "impact": 2
    },
    "sight": {
        "label": "arm5e.spell.ranges.sight",
        "dtype": "String",
        "impact": 3
    },
    "arc": {
        "label": "arm5e.spell.ranges.arc",
        "dtype": "String",
        "impact": 4
    }
};

ARM5E.magic.targets = {
    "ind": {
        "label": "arm5e.spell.targets.ind",
        "dtype": "String",
        "impact": 0
    },
    "circle": {
        "label": "arm5e.spell.targets.circle",
        "dtype": "String",
        "impact": 0
    },
    "part": {
        "label": "arm5e.spell.targets.part",
        "dtype": "String",
        "impact": 1
    },
    "group": {
        "label": "arm5e.spell.targets.group",
        "dtype": "String",
        "impact": 2
    },
    "room": {
        "label": "arm5e.spell.targets.room",
        "dtype": "String",
        "impact": 2
    },
    "struct": {
        "label": "arm5e.spell.targets.struct",
        "dtype": "String",
        "impact": 3
    },
    "bound": {
        "label": "arm5e.spell.targets.bound",
        "dtype": "String",
        "impact": 4
    },
    "taste": {
        "label": "arm5e.spell.targets.taste",
        "dtype": "String",
        "impact": 0
    },
    "touch": {
        "label": "arm5e.spell.targets.touch",
        "dtype": "String",
        "impact": 1
    },
    "smell": {
        "label": "arm5e.spell.targets.smell",
        "dtype": "String",
        "impact": 2
    },
    "hearing": {
        "label": "arm5e.spell.targets.hearing",
        "dtype": "String",
        "impact": 3
    },
    "sight": {
        "label": "arm5e.spell.targets.sight",
        "dtype": "String",
        "impact": 4
    }
};

ARM5E.item = {};

ARM5E.item.costs = {
    "n-a": {
        "label": "arm5e.sheet.n-a"
    },
    "inexp": {
        "label": "arm5e.sheet.inexpensive"
    },
    "std": {
        "label": "arm5e.sheet.standard"
    },
    "exp": {
        "label": "arm5e.sheet.expensive"
    }
};

ARM5E.BASE_MAGIC = {
    "an": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "aq": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "au": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "co": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "he": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "ig": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "im": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "me": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "te": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
    "vi": {
        cr: [],
        in: [],
        muto: [],
        perdo: [],
        rego: []
    },
};