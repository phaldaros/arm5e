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
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      gestures: {
        label: "arm5e.sheet.magic.gestures",
        key: "data.bonuses.arts.spellcasting",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      }
    }
  },
  penetration: {
    category: "magic",
    type: "penetration",
    label: "arm5e.skill.penetration",
    subtypes: {
      bonus: {
        label: "arm5e.sheet.activeEffect.bonuses.penetration",
        key: "data.bonuses.arts.penetration",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      }
    }
  },
  art: {
    category: "magic",
    type: "art",
    label: "arm5e.sheet.arts",
    subtypes: {
      cr: { label: "Creo", key: "data.arts.techniques.cr.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      in: { label: "Intellego", key: "data.arts.techniques.in.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      mu: { label: "Muto", key: "data.arts.techniques.mu.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      pe: { label: "Perdo", key: "data.arts.techniques.pe.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      re: { label: "Rego", key: "data.arts.techniques.re.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      an: { label: "Animal", key: "data.arts.forms.an.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      aq: { label: "Aquam", key: "data.arts.forms.aq.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      au: { label: "Auram", key: "data.arts.forms.au.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      co: { label: "Corpus", key: "data.arts.forms.co.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      he: { label: "Herbam", key: "data.arts.forms.he.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      ig: { label: "Ignem", key: "data.arts.forms.ig.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      im: { label: "Imaginem", key: "data.arts.forms.im.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      me: { label: "Mentem", key: "data.arts.forms.me.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      te: { label: "Terram", key: "data.arts.forms.te.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD },
      vi: { label: "Vim", key: "data.arts.forms.vi.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    }
  },

  affinity: {
    category: "magic",
    type: "artAffinity",
    label: "arm5e.sheet.activeEffect.types.arts.affinity",
    subtypes: {
      cr: { label: "Creo", key: "data.arts.techniques.cr.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      in: {
        label: "Intellego",
        key: "data.arts.techniques.in.xpCoeff",
        mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY
      },
      mu: { label: "Muto", key: "data.arts.techniques.mu.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      pe: { label: "Perdo", key: "data.arts.techniques.pe.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      re: { label: "Rego", key: "data.arts.techniques.re.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      an: { label: "Animal", key: "data.arts.forms.an.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      aq: { label: "Aquam", key: "data.arts.forms.aq.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      au: { label: "Auram", key: "data.arts.forms.au.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      co: { label: "Corpus", key: "data.arts.forms.co.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      he: { label: "Herbam", key: "data.arts.forms.he.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      ig: { label: "Ignem", key: "data.arts.forms.ig.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      im: { label: "Imaginem", key: "data.arts.forms.im.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      me: { label: "Mentem", key: "data.arts.forms.me.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      te: { label: "Terram", key: "data.arts.forms.te.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY },
      vi: { label: "Vim", key: "data.arts.forms.vi.xpCoeff", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY }
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
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      soak: {
        label: "arm5e.sheet.soak",
        key: "data.bonuses.traits.soak",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
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
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      per: {
        label: "arm5e.sheet.perception",
        key: "data.characteristics.per.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      str: {
        label: "arm5e.sheet.strength",
        key: "data.characteristics.str.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      sta: {
        label: "arm5e.sheet.stamina",
        key: "data.characteristics.sta.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      pre: {
        label: "arm5e.sheet.presence",
        key: "data.characteristics.pre.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      com: {
        label: "arm5e.sheet.communication",
        key: "data.characteristics.com.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      dex: {
        label: "arm5e.sheet.dexterity",
        key: "data.characteristics.dex.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      qik: {
        label: "arm5e.sheet.quickness",
        key: "data.characteristics.qik.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
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
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      tired: {
        label: "arm5e.sheet.tired",
        key: "data.fatigue.tired.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      dazed: {
        label: "arm5e.sheet.dazed",
        key: "data.fatigue.dazed.number",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
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
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      medium: {
        label: "arm5e.sheet.medium",
        key: "data.wounds.medium.penalty.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
      },
      heavy: {
        label: "arm5e.sheet.heavy",
        key: "data.wounds.heavy.penalty.value",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD
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
