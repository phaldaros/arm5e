export const companionData = {
  biography: "Character biography, notes, &c.",
  characteristics: {
    int: { value: -2, aging: 1 },
    per: { value: -1, aging: 0 },
    str: { value: 2, aging: 0 },
    sta: { value: 3, aging: 0 },
    pre: { value: 0, aging: 0 },
    com: { value: 1, aging: 0 },
    dex: { value: 5, aging: 0 },
    qik: { value: 4, aging: 2 }
  },
  description: {
    born: { value: "1200" },
    apprentice: { value: "10" },
    birthname: { value: "" },
    birthplace: { value: "Aix" },
    nationality: { value: "Roman" },
    religion: { value: "Roman pantheon" },
    height: { value: "175" },
    weight: { value: "" },
    gender: { value: "male" },
    hair: { value: "blond" },
    eyes: { value: "grey" },
    title: { value: "Knight" },
    handed: { value: "left" }
  },
  reputation: {
    rep1: { label: "Dead", type: "awda", score: 1 }
  },
  stances: {
    voiceStance: "firm",
    voice: {
      loud: 1,
      firm: 0,
      quiet: -5,
      silent: -10
    },
    gesturesStance: "bold",
    gestures: {
      exaggerated: 1,
      bold: 0,
      subtle: -2,
      motionless: -5
    }
  }
};

export const languageSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "com",
  speciality: "slang",
  xp: 75,
  key: "livingLanguage",
  option: "Gaelic"
};

export const readingSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "int",
  speciality: "latin",
  xp: 75,
  key: "artesLiberales"
};

export const combatSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "dex",
  speciality: "sword",
  xp: 55,
  key: "singleWeapon",
  option: ""
};
export const heavyCombatSkill = {
  description: "",
  source: "ArM5",
  page: 66,
  defaultChaAb: "dex",
  speciality: "sword",
  xp: 55,
  key: "greatWeapon",
  option: ""
};
export const penetrationSkill = {
  description: "",
  source: "ArM5",
  page: 62,
  defaultChaAb: "sta",
  speciality: "Creo",
  xp: 55,
  key: "penetration",
  option: ""
};

export const armorItem = {
  description:
    '<p>&nbsp;</p>\n<div class="page" title="Page 176">\n<div class="section">\n<div class="layoutArea">\n<div class="column">\n<p>Using very thick leather, or hardening leather by wax impregnation or baking, makes a better material for deflecting crushing damage.<span style="font-size: 9.000000pt; font-family: \'Weiss\'; color: rgb(6.313300%, 8.863500%, 10.356300%);">&nbsp;</span></p>\n</div>\n</div>\n</div>\n</div>\n<p>Partial armor covers the vital areas only, and generally consists of a hauberk (a short- sleeved armored coat that extends down to the knee), perhaps a coif to protect the head and neck, and often an open-faced helmet.</p>',
  source: "custom",
  page: 0,
  cost: {
    value: "inexp",
    label: "Cost"
  },
  quantity: 1,
  load: 6,
  prot: 2,
  full: false,
  equipped: true
};

export const magicalEffect1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "cr"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "ig"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "voice"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 2,
  baseEffectDescription: "Blabla",
  applyFocus: false
};

export const magicalEffect2 = {
  description: "All req",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: true,
    in: true,
    mu: false,
    pe: true,
    re: true
  },
  form: {
    value: "vi"
  },
  "form-req": {
    an: true,
    aq: true,
    au: true,
    co: true,
    he: true,
    ig: true,
    im: true,
    me: true,
    te: true,
    vi: false
  },
  range: {
    value: "voice"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 1,
  baseEffectDescription: "Blabla",
  applyFocus: false
};

export const magicalEffect3 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "co"
  },
  "form-req": {
    an: true,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "voice"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 1,
  complexity: 1,
  enhancingRequisite: 1,
  general: false,
  levelOffset: 0,
  baseLevel: 2,
  baseEffectDescription: "Blabla",
  applyFocus: true
};

export const weaponItem = {
  description: "A weapon",
  source: "custom",
  page: 0,
  cost: {
    value: "inexp",
    label: "Cost"
  },
  weaponExpert: true,
  horse: false,
  init: 2,
  atk: 3,
  dfn: 3,
  dam: 2,
  str: -1,
  range: 0,
  load: 2,
  equipped: true,
  ability: "singleWeapon"
};
export const spellData1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "im"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 4,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 4,
  bonusDesc: "Talisman",
  xp: 30,
  masteryAbilities: ""
};

export const spellData2 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "co"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 0,
  complexity: 0,
  enhancingRequisite: 2,
  general: false,
  levelOffset: 0,
  baseLevel: 10,
  baseEffectDescription: "",
  applyFocus: true,
  ritual: false,
  bonus: 3,
  bonusDesc: "Talisman",
  xp: 30,
  masteryAbilities: ""
};
export const spellData3 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "mu"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "vi"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "sun"
  },
  target: {
    value: "ind"
  },
  targetSize: 3,
  complexity: 4,
  enhancingRequisite: 0,
  general: true,
  levelOffset: 3,
  baseLevel: 4,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 3,
  bonusDesc: "Talisman",
  xp: 30,
  masteryAbilities: ""
};
export const magusData = {
  biography: "Character biography, notes, &c.",
  characteristics: {
    int: { value: 4, aging: 1 },
    per: { value: 2, aging: 0 },
    str: { value: 0, aging: 0 },
    sta: { value: 3, aging: 0 },
    pre: { value: 1, aging: 0 },
    com: { value: -1, aging: 0 },
    dex: { value: -2, aging: 0 },
    qik: { value: -3, aging: 2 }
  },
  description: {
    born: { value: "1200" },
    apprentice: { value: "10" },
    birthname: { value: "" },
    birthplace: { value: "Aix" },
    nationality: { value: "Roman" },
    religion: { value: "Christian" },
    height: { value: "175" },
    weight: { value: "" },
    gender: { value: "male" },
    hair: { value: "black" },
    eyes: { value: "grey" },
    title: { value: "Magus" },
    handed: { value: "right" }
  },
  arts: {
    techniques: {
      cr: {
        xp: 15
      },
      in: {
        xp: 6
      },
      mu: {
        xp: 187
      },
      pe: {
        xp: 0
      },
      re: {
        xp: 23
      }
    },
    forms: {
      an: {
        xp: 21
      },
      aq: {
        xp: 20
      },
      au: {
        xp: 10
      },
      co: {
        xp: 120
      },
      he: {
        xp: 0
      },
      ig: {
        xp: 30
      },
      im: {
        xp: 30
      },
      me: {
        xp: 30
      },
      te: {
        xp: 30
      },
      vi: {
        xp: 6
      }
    }
  },
  stances: {
    voiceStance: "firm",
    voice: {
      loud: 1,
      firm: 0,
      quiet: -5,
      silent: -10
    },
    gesturesStance: "bold",
    gestures: {
      exaggerated: 1,
      bold: 0,
      subtle: -2,
      motionless: -5
    }
  }
};

export const spell1 = {
  description: "",
  source: "custom",
  page: 0,
  technique: {
    value: "cr"
  },
  "technique-req": {
    cr: false,
    in: false,
    mu: false,
    pe: false,
    re: false
  },
  form: {
    value: "ig"
  },
  "form-req": {
    an: false,
    aq: false,
    au: false,
    co: false,
    he: false,
    ig: false,
    im: false,
    me: false,
    te: false,
    vi: false
  },
  range: {
    value: "personal"
  },
  duration: {
    value: "moment"
  },
  target: {
    value: "room"
  },
  targetSize: 3,
  complexity: 1,
  enhancingRequisite: 0,
  general: false,
  levelOffset: 0,
  baseLevel: 10,
  baseEffectDescription: "",
  applyFocus: false,
  ritual: false,
  bonus: 0,
  bonusDesc: "",
  xp: 0,
  masteryAbilities: ""
};
