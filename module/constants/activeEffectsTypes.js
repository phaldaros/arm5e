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
      },
      aura: {
        label: "arm5e.sheet.magic.aura",
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
  }

  // strength: {
  //   category: "traits",
  //   type: "strength",
  //   label: "arm5e.sheet.strength",
  //   key: "data.characteristics.str.value"
  // }
};
