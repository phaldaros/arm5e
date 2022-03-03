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
        key: "data.bonuses.arts.spellcasting",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 0
      },
      gestures: {
        label: "arm5e.sheet.magic.gestures",
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
    label: "bonusGeneralAbility",
    subtypes: {
      animalHandling: {
        label: "arm5e.skill.general.animalHandling",
        key: "data.bonuses.skills.animalHandling.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2
      },
      areaLore: {
        label: "arm5e.skill.general.areaLore",
        key: "data.bonuses.skills.areaLore.bonus",
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
        key: "data.bonuses.skills.craft.bonus",
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
        key: "data.bonuses.skills.livingLanguage.bonus",
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
        key: "data.bonuses.skills.organizationLore.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        default: 2,
        option: "organizationName"
      },
      profession: {
        label: "arm5e.skill.general.profession",
        key: "data.bonuses.skills.profession.bonus",
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
  }

  // strength: {
  //   category: "traits",
  //   type: "strength",
  //   label: "arm5e.sheet.strength",
  //   key: "data.characteristics.str.value"
  // }
};
