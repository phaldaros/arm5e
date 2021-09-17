export const ARM5E = {};

/**
 * The set of metadata used within the sytem that will
 * probably not change
 * @type {Object}
 */
 ARM5E.MODULE_ID = 'arm5e';

 ARM5E.houses = {
  "n-a": { "label": "N/A", "dtype": "String" },
  "bjo": { "label": "Bjornaer", "dtype": "String" },
  "bon": { "label": "Bonisagus", "dtype": "String" },
  "cri": { "label": "Criamon", "dtype": "String" },
  "exm": { "label": "Ex Miscellanea", "dtype": "String" },
  "fla": { "label": "Flambeau", "dtype": "String" },
  "gen": { "label": "Generic Magus", "dtype": "String" },
  "gue": { "label": "Guernicus", "dtype": "String" },
  "jer": { "label": "Jerbiton", "dtype": "String" },
  "mer": { "label": "Mercere", "dtype": "String" },
  "mta": { "label": "Merinita", "dtype": "String" },
  "tre": { "label": "Tremere", "dtype": "String" },
  "tyt": { "label": "Tytalus", "dtype": "String" },
  "ver": { "label": "Verditius", "dtype": "String" }
};

ARM5E.impacts = {
  "free": {"label": "arm5e.sheet.free","dtype": "String","cost": 0 },
  "major": {"label": "arm5e.sheet.major","dtype": "String","cost": 3 },
  "minor": {"label": "arm5e.sheet.minor","dtype": "String","cost": 1 }
};

ARM5E.seasons = {
  "spring": {"label": "arm5e.sheet.spring" },
  "summer": {"label": "arm5e.sheet.summer" },
  "autumn": {"label": "arm5e.sheet.autumn" },
  "winter": {"label": "arm5e.sheet.winter" }
};

 ARM5E.arts = {
  "cr": {"label": "Creo","dtype": "String" },
  "in": {"label": "Intellego","dtype": "String" },
  "mu": {"label": "Muto","dtype": "String" },
  "pe": {"label": "Perdo","dtype": "String" },
  "re": {"label": "Rego","dtype": "String" },
  "an": {"label": "Animal","dtype": "String" },
  "au": {"label": "Auram","dtype": "String" },
  "aq": {"label": "Aquam","dtype": "String" },
  "co": {"label": "Corpus","dtype": "String" },
  "he": {"label": "Herbam","dtype": "String" },
  "ig": {"label": "Ignem","dtype": "String" },
  "im": {"label": "Imaginem","dtype": "String" },
  "me": {"label": "Mentem","dtype": "String" },
  "te": {"label": "Terram","dtype": "String" },
  "vi": {"label": "Vim","dtype": "String" }
};

ARM5E.techniques = {
  "cr": {"label": "Creo","dtype": "String" },
  "in": {"label": "Intellego","dtype": "String" },
  "mu": {"label": "Muto","dtype": "String" },
  "pe": {"label": "Perdo","dtype": "String" },
  "re": {"label": "Rego","dtype": "String" }
};

ARM5E.forms = {
    "an": {"label": "Animal","dtype": "String", "baseSize" : "arm5e.sheet.target.size.an"},
    "aq": {"label": "Aquam","dtype": "String", "baseSize" : "arm5e.sheet.target.size.aq" },
    "au": {"label": "Auram","dtype": "String", "baseSize" : "arm5e.sheet.target.size.au" },
    "co": {"label": "Corpus","dtype": "String", "baseSize" : "arm5e.sheet.target.size.co" },
    "he": {"label": "Herbam","dtype": "String", "baseSize" : "arm5e.sheet.target.size.he" },
    "ig": {"label": "Ignem","dtype": "String", "baseSize" : "arm5e.sheet.target.size.ig" },
    "im": {"label": "Imaginem","dtype": "String", "baseSize" : "arm5e.sheet.target.size.im" },
    "me": {"label": "Mentem","dtype": "String", "baseSize" : "arm5e.sheet.target.size.me" },
    "te": {"label": "Terram","dtype": "String", "baseSize" : "arm5e.sheet.target.size.te" },
    "vi": {"label": "Vim","dtype": "String", "baseSize" : "arm5e.sheet.target.size.vi" }
};


ARM5E.durations =  {
  "moment" : {"label": "arm5e.config.durations.moment","dtype": "String", "impact" : 0 },
  "conc" : {"label": "arm5e.config.durations.conc","dtype": "String", "impact" : 1 },
  "diam":{"label": "arm5e.config.durations.diam","dtype": "String", "impact" : 1 },
  "sun":{"label": "arm5e.config.durations.sun","dtype": "String", "impact" : 2 },
  "ring":{"label": "arm5e.config.durations.ring","dtype": "String", "impact" : 2 },
  "moon" :{"label": "arm5e.config.durations.moon","dtype": "String" , "impact" : 3},
  "fire":{"label": "arm5e.config.durations.fire","dtype": "String", "impact" : 3 },
  "bargain":{"label": "arm5e.config.durations.bargain","dtype": "String", "impact" : 3 },
  "year" :{"label": "arm5e.config.durations.year","dtype": "String", "impact" : 4 },
  "condition" : {"label": "arm5e.config.durations.condition","dtype": "String", "impact" : 4 },
  "year+1" : {"label": "arm5e.config.durations.year+1","dtype": "String", "impact" : 4 }
};

ARM5E.ranges = {
  "personal" : {"label": "arm5e.config.ranges.personal","dtype": "String", "impact" : 0 },
  "touch": {"label": "arm5e.config.ranges.touch","dtype": "String", "impact" : 1 },
  "eye": {"label": "arm5e.config.ranges.eye","dtype": "String", "impact" : 1 },
  "voice": {"label": "arm5e.config.ranges.voice","dtype": "String", "impact" : 2 },
  "road": {"label": "arm5e.config.ranges.road","dtype": "String", "impact" : 2 },
  "sight": {"label": "arm5e.config.ranges.sight","dtype": "String", "impact" : 3 },
  "arc" : {"label": "arm5e.config.ranges.arc","dtype": "String", "impact" : 4 }
};

ARM5E.targets = {
  "ind" : {"label": "arm5e.config.targets.ind","dtype": "String", "impact" : 0 },
  "circle" : {"label": "arm5e.config.targets.circle","dtype": "String", "impact" : 0 },
  "part":{"label": "arm5e.config.targets.part","dtype": "String", "impact" : 1 },
  "group":{"label": "arm5e.config.targets.group","dtype": "String", "impact" : 2 },
  "room" :{"label": "arm5e.config.targets.room","dtype": "String", "impact" : 2 },
  "struct" :{"label": "arm5e.config.targets.struct","dtype": "String", "impact" :3 },
  "bound" : {"label": "arm5e.config.targets.bound","dtype": "String", "impact" : 4 },
  "taste" : {"label": "arm5e.config.targets.taste","dtype": "String", "impact" : 0 },
  "touch" : {"label": "arm5e.config.targets.touch","dtype": "String", "impact" : 1 },
  "smell" : {"label": "arm5e.config.targets.smell","dtype": "String", "impact" : 2 },
  "hearing" : {"label": "arm5e.config.targets.hearing","dtype": "String", "impact" : 3 },
  "sight" : {"label": "arm5e.config.targets.sight","dtype": "String", "impact" : 4 }
};