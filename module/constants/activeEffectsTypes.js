// Rule: all subtypes of a given type must have a different "key" value or it becomes impossible to edit them properly
export default {
  none: {
    category: "magic",
    type: "none",
    label: "arm5e.sheet.activeEffect.types.nullEffect",
    subtypes: {
      none: {
        label: "arm5e.sheet.activeEffect.types.nullEffect",
        key: "",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM
      }
    }
  },
  spellcasting: {
    category: "magic",
    type: "spellcasting",
    label: "arm5e.sheet.activeEffect.type.spellcasting",
    subtypes: {
      voice: {
        label: "arm5e.sheet.magic.voice",
        key: "data.bonuses.arts.voice",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      gestures: {
        label: "arm5e.sheet.magic.gestures",
        key: "data.bonuses.arts.spellcasting",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      aura: {
        label: "arm5e.sheet.magic.aura",
        key: "data.bonuses.arts.spellcasting",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  penetration: {
    category: "magic",
    type: "penetration",
    label: "arm5e.skill.arcane.penetration",
    subtypes: {
      bonus: {
        label: "arm5e.sheet.activeEffect.bonuses.penetration",
        key: "data.bonuses.arts.penetration",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  art: {
    category: "magic",
    type: "art",
    label: "arm5e.sheet.arts",
    subtypes: {
      cr: { label: "Creo", key: "data.arts.techniques.cr.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      in: { label: "Intellego", key: "data.arts.techniques.in.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      mu: { label: "Muto", key: "data.arts.techniques.mu.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      pe: { label: "Perdo", key: "data.arts.techniques.pe.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      re: { label: "Rego", key: "data.arts.techniques.re.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      an: { label: "Animal", key: "data.arts.forms.an.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      aq: { label: "Aquam", key: "data.arts.forms.aq.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      au: { label: "Auram", key: "data.arts.forms.au.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      co: { label: "Corpus", key: "data.arts.forms.co.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      he: { label: "Herbam", key: "data.arts.forms.he.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      ig: { label: "Ignem", key: "data.arts.forms.ig.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      im: { label: "Imaginem", key: "data.arts.forms.im.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      me: { label: "Mentem", key: "data.arts.forms.me.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      te: { label: "Terram", key: "data.arts.forms.te.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 },
      vi: { label: "Vim", key: "data.arts.forms.vi.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, default: 3 }
    }
  },

  affinity: {
    category: "magic",
    type: "artAffinity",
    label: "arm5e.sheet.activeEffect.types.arts.affinity",
    subtypes: {
      cr: {
        label: "Creo",
        key: "data.arts.techniques.cr.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      in: {
        label: "Intellego",
        key: "data.arts.techniques.in.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      mu: {
        label: "Muto",
        key: "data.arts.techniques.mu.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      pe: {
        label: "Perdo",
        key: "data.arts.techniques.pe.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      re: {
        label: "Rego",
        key: "data.arts.techniques.re.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      an: {
        label: "Animal",
        key: "data.arts.forms.an.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      aq: { label: "Aquam", key: "data.arts.forms.aq.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, default: 1.5 },
      au: { label: "Auram", key: "data.arts.forms.au.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, default: 1.5 },
      co: {
        label: "Corpus",
        key: "data.arts.forms.co.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      he: {
        label: "Herbam",
        key: "data.arts.forms.he.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      ig: { label: "Ignem", key: "data.arts.forms.ig.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, default: 1.5 },
      im: {
        label: "Imaginem",
        key: "data.arts.forms.im.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      me: {
        label: "Mentem",
        key: "data.arts.forms.me.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      te: {
        label: "Terram",
        key: "data.arts.forms.te.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
        default: 1.5
      },
      vi: { label: "Vim", key: "data.arts.forms.vi.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, default: 1.5 }
    }
  },

  vitals: {
    category: "traits",
    type: "vitals",
    label: "arm5e.sheet.activeEffect.types.vitals",
    subtypes: {
      size: {
        label: "arm5e.sheet.size",
        key: "data.vitals.siz.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      soak: {
        label: "arm5e.sheet.soak",
        key: "data.bonuses.traits.soak",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 3
      },
      aging: {
        label: "arm5e.sheet.aging",
        key: "data.bonuses.traits.aging",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  characteristics: {
    category: "traits",
    type: "characteristics",
    label: "arm5e.sheet.activeEffect.types.characteristics",
    subtypes: {
      int: {
        label: "arm5e.sheet.intelligence",
        key: "data.characteristics.int.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      per: {
        label: "arm5e.sheet.perception",
        key: "data.characteristics.per.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      str: {
        label: "arm5e.sheet.strength",
        key: "data.characteristics.str.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      sta: {
        label: "arm5e.sheet.stamina",
        key: "data.characteristics.sta.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      pre: {
        label: "arm5e.sheet.presence",
        key: "data.characteristics.pre.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      com: {
        label: "arm5e.sheet.communication",
        key: "data.characteristics.com.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      dex: {
        label: "arm5e.sheet.dexterity",
        key: "data.characteristics.dex.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      qik: {
        label: "arm5e.sheet.quickness",
        key: "data.characteristics.qik.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  fatigue: {
    category: "traits",
    type: "fatigue",
    label: "arm5e.sheet.activeEffect.types.fatigue",
    subtypes: {
      winded: {
        label: "arm5e.sheet.winded",
        key: "data.fatigue.winded.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      weary: {
        label: "arm5e.sheet.weary",
        key: "data.fatigue.weary.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      tired: {
        label: "arm5e.sheet.tired",
        key: "data.fatigue.tired.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      dazed: {
        label: "arm5e.sheet.dazed",
        key: "data.fatigue.dazed.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      windedLevel: {
        label: "arm5e.sheet.windedLvl",
        key: "data.fatigue.winded.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      wearyLevel: {
        label: "arm5e.sheet.wearyLvl",
        key: "data.fatigue.weary.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      tiredLevel: {
        label: "arm5e.sheet.tiredLvl",
        key: "data.fatigue.tired.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      dazedLevel: {
        label: "arm5e.sheet.dazedLvl",
        key: "data.fatigue.dazed.amount",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  wounds: {
    category: "traits",
    type: "wounds",
    label: "arm5e.sheet.activeEffect.types.wounds",
    subtypes: {
      light: {
        label: "arm5e.sheet.light",
        key: "data.wounds.light.penalty.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      medium: {
        label: "arm5e.sheet.medium",
        key: "data.wounds.medium.penalty.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      heavy: {
        label: "arm5e.sheet.heavy",
        key: "data.wounds.heavy.penalty.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      }
    }
  },
  bonusGeneralAbility: {
    category: "abilities",
    type: "bonusGeneralAbility",
    label: "arm5e.sheet.activeEffect.types.generalAbilitiesBonus",
    subtypes: {
      animalHandling: {
        label: "arm5e.skill.general.animalHandling",
        key: "data.bonuses.skills.animalHandling.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      areaLore: {
        label: "arm5e.skill.general.areaLore",
        key: "data.bonuses.skills.areaLore_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "areaName"
      },
      athletics: {
        label: "arm5e.skill.general.athletics",
        key: "data.bonuses.skills.athletics.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      awareness: {
        label: "arm5e.skill.general.awareness",
        key: "data.bonuses.skills.awareness.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      bargain: {
        label: "arm5e.skill.general.bargain",
        key: "data.bonuses.skills.bargain.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      brawl: {
        label: "arm5e.skill.general.brawl",
        key: "data.bonuses.skills.brawl.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      carouse: {
        label: "arm5e.skill.general.carouse",
        key: "data.bonuses.skills.carouse.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      charm: {
        label: "arm5e.skill.general.charm",
        key: "data.bonuses.skills.charm.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      concentration: {
        label: "arm5e.skill.general.concentration",
        key: "data.bonuses.skills.concentration.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      craft: {
        label: "arm5e.skill.general.craft",
        key: "data.bonuses.skills.craft_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "craftName"
      },
      etiquette: {
        label: "arm5e.skill.general.etiquette",
        key: "data.bonuses.skills.etiquette.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      folkKen: {
        label: "arm5e.skill.general.folkKen",
        key: "data.bonuses.skills.folkKen.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      guile: {
        label: "arm5e.skill.general.guile",
        key: "data.bonuses.skills.guile.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      hunt: {
        label: "arm5e.skill.general.hunt",
        key: "data.bonuses.skills.hunt.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      intrigue: {
        label: "arm5e.skill.general.intrigue",
        key: "data.bonuses.skills.intrigue.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      leadership: {
        label: "arm5e.skill.general.leadership",
        key: "data.bonuses.skills.leadership.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      legerdemain: {
        label: "arm5e.skill.general.legerdemain",
        key: "data.bonuses.skills.legerdemain.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      livingLanguage: {
        label: "arm5e.skill.general.livingLanguage",
        key: "data.bonuses.skills.livingLanguage_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "languageName"
      },
      music: {
        label: "arm5e.skill.general.music",
        key: "data.bonuses.skills.music.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      organizationLore: {
        label: "arm5e.skill.general.organizationLore",
        key: "data.bonuses.skills.organizationLore_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "organizationName"
      },
      profession: {
        label: "arm5e.skill.general.profession",
        key: "data.bonuses.skills.profession_#OPTION#.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "professionName"
      },
      ride: {
        label: "arm5e.skill.general.ride",
        key: "data.bonuses.skills.ride.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      stealth: {
        label: "arm5e.skill.general.stealth",
        key: "data.bonuses.skills.stealth.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      survival: {
        label: "arm5e.skill.general.survival",
        key: "data.bonuses.skills.survival.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      swim: {
        label: "arm5e.skill.general.swim",
        key: "data.bonuses.skills.swim.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      teaching: {
        label: "arm5e.skill.general.teaching",
        key: "data.bonuses.skills.teaching.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      }
    }
  },
  bonusArcaneAbility: {
    category: "abilities",
    type: "bonusArcaneAbility",
    label: "arm5e.sheet.activeEffect.types.arcaneAbilitiesBonus",
    subtypes: {
      hermeticCode: {
        label: "arm5e.skill.arcane.hermeticCode",
        key: "data.bonuses.skills.hermeticCode.bonus",
        mode: 2,
        default: 2
      },
      dominionLore: {
        label: "arm5e.skill.arcane.dominionLore",
        key: "data.bonuses.skills.dominionLore.bonus",
        mode: 2,
        default: 2
      },
      faerieLore: {
        label: "arm5e.skill.arcane.faerieLore",
        key: "data.bonuses.skills.faerieLore.bonus",
        mode: 2,
        default: 2
      },
      finesse: {
        label: "arm5e.skill.arcane.finesse",
        key: "data.bonuses.skills.finesse.bonus",
        mode: 2,
        default: 2
      },
      infernalLore: {
        label: "arm5e.skill.arcane.infernalLore",
        key: "data.bonuses.skills.infernalLore.bonus",
        mode: 2,
        default: 2
      },
      magicLore: {
        label: "arm5e.skill.arcane.magicLore",
        key: "data.bonuses.skills.magicLore.bonus",
        mode: 2,
        default: 2
      },
      magicTheory: {
        label: "arm5e.skill.arcane.magicTheory",
        key: "data.bonuses.skills.magicTheory.bonus",
        mode: 2,
        default: 2
      },
      parma: {
        label: "arm5e.skill.arcane.parma",
        key: "data.bonuses.skills.parma.bonus",
        mode: 2,
        default: 2
      },
      penetration: {
        label: "arm5e.skill.arcane.penetration",
        key: "data.bonuses.skills.penetration.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusAcademicAbility: {
    category: "abilities",
    type: "bonusAcademicAbility",
    label: "arm5e.sheet.activeEffect.types.academicAbilitiesBonus",
    subtypes: {
      artesLib: {
        label: "arm5e.skill.academic.artesLib",
        key: "data.bonuses.skills.artesLib.bonus",
        mode: 2,
        default: 2
      },
      civilCanonLaw: {
        label: "arm5e.skill.academic.civilCanonLaw",
        key: "data.bonuses.skills.civilCanonLaw.bonus",
        mode: 2,
        default: 2
      },
      commonLaw: {
        label: "arm5e.skill.academic.commonLaw",
        key: "data.bonuses.skills.commonLaw.bonus",
        mode: 2,
        default: 2
      },
      deadLanguage: {
        label: "arm5e.skill.academic.deadLanguage",
        key: "data.bonuses.skills.deadLanguage_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "languageName"
      },
      medicine: {
        label: "arm5e.skill.academic.medicine",
        key: "data.bonuses.skills.medicine.bonus",
        mode: 2,
        default: 2
      },
      philosophy: {
        label: "arm5e.skill.academic.philosophy",
        key: "data.bonuses.skills.philosophy.bonus",
        mode: 2,
        default: 2
      },
      theology: {
        label: "arm5e.skill.academic.theology",
        key: "data.bonuses.skills.theology.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusMartialAbility: {
    category: "abilities",
    type: "bonusMartialAbility",
    label: "arm5e.sheet.activeEffect.types.martialAbilitiesBonus",
    subtypes: {
      bows: {
        label: "arm5e.skill.martial.bows",
        key: "data.bonuses.skills.bows.bonus",
        mode: 2,
        default: 2
      },
      singleWeapon: {
        label: "arm5e.skill.martial.singleWeapon",
        key: "data.bonuses.skills.singleWeapon.bonus",
        mode: 2,
        default: 2
      },
      greatWeapon: {
        label: "arm5e.skill.martial.greatWeapon",
        key: "data.bonuses.skills.greatWeapon.bonus",
        mode: 2,
        default: 2
      },
      trownWeapon: {
        label: "arm5e.skill.martial.trownWeapon",
        key: "data.bonuses.skills.trownWeapon.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  bonusMysteryAbility: {
    category: "abilities",
    type: "bonusMysteryAbility",
    label: "arm5e.sheet.activeEffect.types.mysteryAbilitiesBonus",
    subtypes: {
      enigma: {
        label: "arm5e.skill.mystery.enigma",
        key: "data.bonuses.skills.enigma.bonus",
        mode: 2,
        default: 2
      },
      faerieMagic: {
        label: "arm5e.skill.mystery.faerieMagic",
        key: "data.bonuses.skills.faerieMagic.bonus",
        mode: 2,
        default: 2
      },
      heartbeast: {
        label: "arm5e.skill.mystery.heartbeast",
        key: "data.bonuses.skills.heartbeast.bonus",
        mode: 2,
        default: 2
      },
      verditiusMagic: {
        label: "arm5e.skill.mystery.verditiusMagic",
        key: "data.bonuses.skills.verditiusMagic.bonus",
        mode: 2,
        default: 2
      },
      cult: {
        label: "arm5e.skill.mystery.cult",
        key: "data.bonuses.skills.cult_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "cultName"
      }
    }
  },
  bonusSupernaturalAbility: {
    category: "abilities",
    type: "bonusSupernaturalAbility",
    label: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesBonus",
    subtypes: {
      animalKen: {
        label: "arm5e.skill.supernatural.animalKen",
        key: "data.bonuses.skills.animalKen.bonus",
        mode: 2,
        default: 2
      },
      dowsing: {
        label: "arm5e.skill.supernatural.dowsing",
        key: "data.bonuses.skills.dowsing.bonus",
        mode: 2,
        default: 2
      },
      enchantingMusic: {
        label: "arm5e.skill.supernatural.enchantingMusic",
        key: "data.bonuses.skills.enchantingMusic.bonus",
        mode: 2,
        default: 2
      },
      entrancement: {
        label: "arm5e.skill.supernatural.entrancement",
        key: "data.bonuses.skills.entrancement.bonus",
        mode: 2,
        default: 2
      },
      magicSensitivity: {
        label: "arm5e.skill.supernatural.magicSensitivity",
        key: "data.bonuses.skills.magicSensitivity.bonus",
        mode: 2,
        default: 2
      },
      premonitions: {
        label: "arm5e.skill.supernatural.premonitions",
        key: "data.bonuses.skills.premonitions.bonus",
        mode: 2,
        default: 2
      },
      secondSight: {
        label: "arm5e.skill.supernatural.secondSight",
        key: "data.bonuses.skills.secondSight.bonus",
        mode: 2,
        default: 2
      },
      senseHolyAndUnholy: {
        label: "arm5e.skill.supernatural.senseHolyAndUnholy",
        key: "data.bonuses.skills.senseHolyAndUnholy.bonus",
        mode: 2,
        default: 2
      },
      shapeshifter: {
        label: "arm5e.skill.supernatural.shapeshifter",
        key: "data.bonuses.skills.shapeshifter.bonus",
        mode: 2,
        default: 2
      },
      supernatural: {
        label: "arm5e.skill.supernatural.generic",
        key: "data.bonuses.skills.supernatural_#OPTION#.bonus",
        mode: 2,
        default: 2,
        option: "supernaturalAbilityName"
      },
      wildernessSense: {
        label: "arm5e.skill.supernatural.wildernessSense",
        key: "data.bonuses.skills.wildernessSense.bonus",
        mode: 2,
        default: 2
      }
    }
  },
  affinityGeneralAbility: {
    category: "abilities",
    type: "affinityGeneralAbility",
    label: "arm5e.sheet.activeEffect.types.generalAbilitiesAffinity",
    subtypes: {
      animalHandling: {
        label: "arm5e.skill.general.animalHandling",
        key: "data.bonuses.skills.animalHandling.xpCoeff",
        mode: 1,
        default: 1.5
      },
      areaLore: {
        label: "arm5e.skill.general.areaLore",
        key: "data.bonuses.skills.areaLore_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "areaName"
      },
      athletics: {
        label: "arm5e.skill.general.athletics",
        key: "data.bonuses.skills.athletics.xpCoeff",
        mode: 1,
        default: 1.5
      },
      awareness: {
        label: "arm5e.skill.general.awareness",
        key: "data.bonuses.skills.awareness.xpCoeff",
        mode: 1,
        default: 1.5
      },
      bargain: {
        label: "arm5e.skill.general.bargain",
        key: "data.bonuses.skills.bargain.xpCoeff",
        mode: 1,
        default: 1.5
      },
      brawl: {
        label: "arm5e.skill.general.brawl",
        key: "data.bonuses.skills.brawl.xpCoeff",
        mode: 1,
        default: 1.5
      },
      carouse: {
        label: "arm5e.skill.general.carouse",
        key: "data.bonuses.skills.carouse.xpCoeff",
        mode: 1,
        default: 1.5
      },
      charm: {
        label: "arm5e.skill.general.charm",
        key: "data.bonuses.skills.charm.xpCoeff",
        mode: 1,
        default: 1.5
      },
      concentration: {
        label: "arm5e.skill.general.concentration",
        key: "data.bonuses.skills.concentration.xpCoeff",
        mode: 1,
        default: 1.5
      },
      craft: {
        label: "arm5e.skill.general.craft",
        key: "data.bonuses.skills.craft_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "craftName"
      },
      etiquette: {
        label: "arm5e.skill.general.etiquette",
        key: "data.bonuses.skills.etiquette.xpCoeff",
        mode: 1,
        default: 1.5
      },
      folkKen: {
        label: "arm5e.skill.general.folkKen",
        key: "data.bonuses.skills.folkKen.xpCoeff",
        mode: 1,
        default: 1.5
      },
      guile: {
        label: "arm5e.skill.general.guile",
        key: "data.bonuses.skills.guile.xpCoeff",
        mode: 1,
        default: 1.5
      },
      hunt: {
        label: "arm5e.skill.general.hunt",
        key: "data.bonuses.skills.hunt.xpCoeff",
        mode: 1,
        default: 1.5
      },
      intrigue: {
        label: "arm5e.skill.general.intrigue",
        key: "data.bonuses.skills.intrigue.xpCoeff",
        mode: 1,
        default: 1.5
      },
      leadership: {
        label: "arm5e.skill.general.leadership",
        key: "data.bonuses.skills.leadership.xpCoeff",
        mode: 1,
        default: 1.5
      },
      legerdemain: {
        label: "arm5e.skill.general.legerdemain",
        key: "data.bonuses.skills.legerdemain.xpCoeff",
        mode: 1,
        default: 1.5
      },
      livingLanguage: {
        label: "arm5e.skill.general.livingLanguage",
        key: "data.bonuses.skills.livingLanguage_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "languageName"
      },
      music: {
        label: "arm5e.skill.general.music",
        key: "data.bonuses.skills.music.xpCoeff",
        mode: 1,
        default: 1.5
      },
      organizationLore: {
        label: "arm5e.skill.general.organizationLore",
        key: "data.bonuses.skills.organizationLore_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "orgName"
      },
      profession: {
        label: "arm5e.skill.general.profession",
        key: "data.bonuses.skills.profession_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "professionName"
      },
      ride: {
        label: "arm5e.skill.general.ride",
        key: "data.bonuses.skills.ride.xpCoeff",
        mode: 1,
        default: 1.5
      },
      stealth: {
        label: "arm5e.skill.general.stealth",
        key: "data.bonuses.skills.stealth.xpCoeff",
        mode: 1,
        default: 1.5
      },
      survival: {
        label: "arm5e.skill.general.survival",
        key: "data.bonuses.skills.survival.xpCoeff",
        mode: 1,
        default: 1.5
      },
      swim: {
        label: "arm5e.skill.general.swim",
        key: "data.bonuses.skills.swim.xpCoeff",
        mode: 1,
        default: 1.5
      },
      teaching: {
        label: "arm5e.skill.general.teaching",
        key: "data.bonuses.skills.teaching.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityArcaneAbility: {
    category: "abilities",
    type: "affinityArcaneAbility",
    label: "arm5e.sheet.activeEffect.types.arcaneAbilitiesAffinity",
    subtypes: {
      hermeticCode: {
        label: "arm5e.skill.arcane.hermeticCode",
        key: "data.bonuses.skills.hermeticCode.xpCoeff",
        mode: 1,
        default: 1.5
      },
      dominionLore: {
        label: "arm5e.skill.arcane.dominionLore",
        key: "data.bonuses.skills.dominionLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      faerieLore: {
        label: "arm5e.skill.arcane.faerieLore",
        key: "data.bonuses.skills.faerieLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      finesse: {
        label: "arm5e.skill.arcane.finesse",
        key: "data.bonuses.skills.finesse.xpCoeff",
        mode: 1,
        default: 1.5
      },
      infernalLore: {
        label: "arm5e.skill.arcane.infernalLore",
        key: "data.bonuses.skills.infernalLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      magicLore: {
        label: "arm5e.skill.arcane.magicLore",
        key: "data.bonuses.skills.magicLore.xpCoeff",
        mode: 1,
        default: 1.5
      },
      magicTheory: {
        label: "arm5e.skill.arcane.magicTheory",
        key: "data.bonuses.skills.magicTheory.xpCoeff",
        mode: 1,
        default: 1.5
      },
      parma: {
        label: "arm5e.skill.arcane.parma",
        key: "data.bonuses.skills.parma.xpCoeff",
        mode: 1,
        default: 1.5
      },
      penetration: {
        label: "arm5e.skill.arcane.penetration",
        key: "data.bonuses.skills.penetration.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityAcademicAbility: {
    category: "abilities",
    type: "affinityAcademicAbility",
    label: "arm5e.sheet.activeEffect.types.academicAbilitiesAffinity",
    subtypes: {
      artesLib: {
        label: "arm5e.skill.academic.artesLib",
        key: "data.bonuses.skills.artesLib.xpCoeff",
        mode: 1,
        default: 1.5
      },
      civilCanonLaw: {
        label: "arm5e.skill.academic.civilCanonLaw",
        key: "data.bonuses.skills.civilCanonLaw.xpCoeff",
        mode: 1,
        default: 1.5
      },
      commonLaw: {
        label: "arm5e.skill.academic.commonLaw",
        key: "data.bonuses.skills.commonLaw.xpCoeff",
        mode: 1,
        default: 1.5
      },
      deadLanguage: {
        label: "arm5e.skill.academic.deadLanguage",
        key: "data.bonuses.skills.deadLanguage_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "languageName"
      },
      medicine: {
        label: "arm5e.skill.academic.medicine",
        key: "data.bonuses.skills.medicine.xpCoeff",
        mode: 1,
        default: 1.5
      },
      philosophy: {
        label: "arm5e.skill.academic.philosophy",
        key: "data.bonuses.skills.philosophy.xpCoeff",
        mode: 1,
        default: 1.5
      },
      theology: {
        label: "arm5e.skill.academic.theology",
        key: "data.bonuses.skills.theology.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityMartialAbility: {
    category: "abilities",
    type: "affinityMartialAbility",
    label: "arm5e.sheet.activeEffect.types.martialAbilitiesAffinity",
    subtypes: {
      bows: {
        label: "arm5e.skill.martial.bows",
        key: "data.bonuses.skills.bows.xpCoeff",
        mode: 1,
        default: 1.5
      },
      singleWeapon: {
        label: "arm5e.skill.martial.singleWeapon",
        key: "data.bonuses.skills.singleWeapon.xpCoeff",
        mode: 1,
        default: 1.5
      },
      greatWeapon: {
        label: "arm5e.skill.martial.greatWeapon",
        key: "data.bonuses.skills.greatWeapon.xpCoeff",
        mode: 1,
        default: 1.5
      },
      trownWeapon: {
        label: "arm5e.skill.martial.trownWeapon",
        key: "data.bonuses.skills.trownWeapon.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },
  affinityMysteryAbility: {
    category: "abilities",
    type: "affinityMysteryAbility",
    label: "arm5e.sheet.activeEffect.types.mysteryAbilitiesAffinity",
    subtypes: {
      enigma: {
        label: "arm5e.skill.mystery.enigma",
        key: "data.bonuses.skills.enigma.xpCoeff",
        mode: 1,
        default: 1.5
      },
      faerieMagic: {
        label: "arm5e.skill.mystery.faerieMagic",
        key: "data.bonuses.skills.faerieMagic.xpCoeff",
        mode: 1,
        default: 1.5
      },
      heartbeast: {
        label: "arm5e.skill.mystery.heartbeast",
        key: "data.bonuses.skills.heartbeast.xpCoeff",
        mode: 1,
        default: 1.5
      },
      verditiusMagic: {
        label: "arm5e.skill.mystery.verditiusMagic",
        key: "data.bonuses.skills.verditiusMagic.xpCoeff",
        mode: 1,
        default: 1.5
      },
      cult: {
        label: "arm5e.skill.mystery.cult",
        key: "data.bonuses.skills.cult_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "cultName"
      }
    }
  },
  affinitySupernaturalAbility: {
    category: "abilities",
    type: "affinitySupernaturalAbility",
    label: "arm5e.sheet.activeEffect.types.supernaturalAbilitiesAffinity",
    subtypes: {
      animalKen: {
        label: "arm5e.skill.supernatural.animalKen",
        key: "data.bonuses.skills.animalKen.xpCoeff",
        mode: 1,
        default: 1.5
      },
      dowsing: {
        label: "arm5e.skill.supernatural.dowsing",
        key: "data.bonuses.skills.dowsing.xpCoeff",
        mode: 1,
        default: 1.5
      },
      enchantingMusic: {
        label: "arm5e.skill.supernatural.enchantingMusic",
        key: "data.bonuses.skills.enchantingMusic.xpCoeff",
        mode: 1,
        default: 1.5
      },
      entrancement: {
        label: "arm5e.skill.supernatural.entrancement",
        key: "data.bonuses.skills.entrancement.xpCoeff",
        mode: 1,
        default: 1.5
      },
      magicSensitivity: {
        label: "arm5e.skill.supernatural.magicSensitivity",
        key: "data.bonuses.skills.magicSensitivity.xpCoeff",
        mode: 1,
        default: 1.5
      },
      premonitions: {
        label: "arm5e.skill.supernatural.premonitions",
        key: "data.bonuses.skills.premonitions.xpCoeff",
        mode: 1,
        default: 1.5
      },
      secondSight: {
        label: "arm5e.skill.supernatural.secondSight",
        key: "data.bonuses.skills.secondSight.xpCoeff",
        mode: 1,
        default: 1.5
      },
      senseHolyAndUnholy: {
        label: "arm5e.skill.supernatural.senseHolyAndUnholy",
        key: "data.bonuses.skills.senseHolyAndUnholy.xpCoeff",
        mode: 1,
        default: 1.5
      },
      shapeshifter: {
        label: "arm5e.skill.supernatural.shapeshifter",
        key: "data.bonuses.skills.shapeshifter.xpCoeff",
        mode: 1,
        default: 1.5
      },
      supernatural: {
        label: "arm5e.skill.supernatural.generic",
        key: "data.bonuses.skills.supernatural_#OPTION#.xpCoeff",
        mode: 1,
        default: 1.5,
        option: "supernaturalAbilityName"
      },
      wildernessSense: {
        label: "arm5e.skill.supernatural.wildernessSense",
        key: "data.bonuses.skills.wildernessSense.xpCoeff",
        mode: 1,
        default: 1.5
      }
    }
  },

  laboratory: {
    category: "laboratory",
    type: "laboratory",
    label: "arm5e.sheet.activeEffect.types.laboratory",
    subtypes: {
      size: {
        label: "arm5e.sheet.size",
        key: "data.size.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      generalQuality: {
        label: "arm5e.sheet.generalQuality",
        key: "data.generalQuality.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      safety: {
        label: "arm5e.sheet.safety",
        key: "data.safety.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      health: {
        label: "arm5e.sheet.health",
        key: "data.health.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      refinement: {
        label: "arm5e.sheet.refinement",
        key: "data.refinement.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      upkeep: {
        label: "arm5e.sheet.upkeep",
        key: "data.upkeep.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      warping: {
        label: "arm5e.sheet.warping",
        key: "data.warping.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      },
      aesthetics: {
        label: "arm5e.sheet.aesthetics",
        key: "data.aesthetics.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 1
      }
    }
  }

  // strength: {
  //   category: "traits",
  //   type: "strength",
  //   label: "arm5e.sheet.strength",
  //   key: "data.characteristics.str.value"
  // }
};
