export const UI = {};

UI.STYLES = {
  FILTER_ACTIVE: 'style="text-shadow: 0 0 5px maroon"',
  STANDARD_ART: 'style="border: 0px; height: 40px;"',
  DEFICIENT_ART: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px darkslateblue"',
  PUISSANT_ART: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px blue"',
  AFINITY_ART: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px maroon"',
  COMBO_ART: 'style="border: 0px; height: 40px; box-shadow: 0 0 10px purple"',
  STANDARD_ABILITY: 'style="border: 0px; height: 40px;"',
  PUISSANT_ABILITY: 'style="box-shadow: 0 0 10px blue"',
  AFFINITY_ABILITY: 'style="box-shadow: 0 0 10px maroon"',
  COMBO_ABILITY: 'style="box-shadow: 0 0 10px purple"',
  CALENDAR_BUSY: "busy",
  CALENDAR_CURRENT: "current",
  CALENDAR_CONFLICT: "conflict"
};

export const ARM5E_DEFAULT_ICONS = {};

// default icons

ARM5E_DEFAULT_ICONS.MONO = {
  weapon: "icons/svg/sword.svg",
  armor: "icons/svg/statue.svg",
  spell: "icons/svg/explosion.svg",
  vis: "icons/svg/daze.svg",
  book: "icons/svg/book.svg",
  virtue: "systems/arm5e/assets/icons/upgraded-magic.svg",
  flaw: "systems/arm5e/assets/icons/base-magic.svg",
  ability: "icons/svg/aura.svg",
  abilityFamiliar: "icons/svg/aura.svg",
  diaryEntry: "icons/svg/sun.svg",
  power: "icons/svg/tower.svg",
  powerFamiliar: "icons/svg/tower.svg",
  speciality: "icons/svg/obelisk.svg",
  distinctive: "icons/svg/target.svg",
  sanctumRoom: "icons/svg/temple.svg",
  magicItem: "icons/svg/mage-shield.svg",
  personalityTrait: "icons/svg/aura.svg",
  reputation: "icons/svg/angel.svg",
  inhabitant: "icons/svg/city.svg",
  habitantMagi: "icons/svg/mountain.svg",
  habitantCompanion: "icons/svg/castle.svg",
  habitantSpecialists: "icons/svg/city.svg",
  habitantHabitants: "icons/svg/village.svg",
  habitantHorses: "icons/svg/bridge.svg",
  habitantLivestock: "icons/svg/windmill.svg",
  possessionsCovenant: "icons/svg/barrel.svg",
  visSourcesCovenant: "icons/svg/ruins.svg",
  visStockCovenant: "icons/svg/chest.svg",
  magicalEffect: "icons/svg/up.svg",
  baseEffect: "icons/svg/down.svg",
  calendarCovenant: "icons/svg/clockwork.svg",
  incomingSource: "icons/svg/regen.svg",
  laboratoryText: "systems/arm5e/assets/icons/journal-book.svg",
  magicCodex: "icons/commodities/materials/parchment-secrets.webp",
  covenant: "icons/svg/castle.svg",
  crucible: "icons/tools/laboratory/bowl-liquid-orange.webp",
  npc: "icons/svg/mystery-man-black.svg",
  laboratory: "icons/svg/tower.svg",
  enchantment: "icons/svg/daze.svg",
  labCovenant: "icons/svg/tower.svg"
};
ARM5E_DEFAULT_ICONS.COLOR = {
  weapon: "icons/weapons/swords/greatsword-crossguard-silver.webp",
  armor: "icons/equipment/chest/breastplate-scale-grey.webp",
  spell: "icons/magic/light/explosion-star-glow-blue-purple.webp",
  vis: "icons/magic/light/orbs-firefly-hand-yellow.webp",
  item: "icons/sundries/survival/rope-coiled-tan.webp",
  book: "icons/sundries/books/book-tooled-eye-gold-red.webp",
  virtue: "icons/magic/light/explosion-star-glow-silhouette.webp",
  flaw: "icons/magic/control/silhouette-hold-change-blue.webp",
  //"flaw": "icons/magic/unholy/silhouette-evil-horned-giant.webp",
  ability: "icons/skills/trades/woodcutting-logging-axe-stump.webp",
  abilityFamiliar: "icons/creatures/mammals/deer-antlers-glowing-blue.webp",
  diaryEntry: "icons/sundries/documents/document-sealed-signatures-red.webp",
  power: "icons/creatures/abilities/dragon-fire-breath-orange.webp",
  powerFamiliar: "icons/creatures/abilities/wolf-howl-moon-purple.webp",
  speciality: "icons/skills/trades/construction-carpentry-hammer.webp",
  distinctive: "icons/sundries/flags/banner-symbol-sun-gold-red.webp",
  magicItem: "icons/weapons/staves/staff-ornate-red.webp",
  personalityTrait: "icons/skills/social/intimidation-impressing.webp",
  reputation: "icons/skills/social/diplomacy-handshake.webp",
  habitantCompanion: "icons/environment/people/cleric-grey.webp",
  habitantSpecialists: "icons/environment/people/commoner.webp",
  habitantHabitants: "icons/environment/people/group.webp",
  habitantHorses: "icons/environment/creatures/horse-brown.webp",
  habitantLivestock: "icons/environment/creatures/horses.webp",
  possessionsCovenant: "icons/commodities/currency/coins-plain-pouch-gold.webp",
  visSourcesCovenant: "icons/environment/wilderness/arch-stone.webp",
  visStockCovenant: "icons/commodities/currency/coin-oval-rune-copper.webp",
  incomingSource: "icons/commodities/currency/coins-plain-pouch-gold.webp",
  laboratoryText: "icons/sundries/documents/blueprint-recipe-alchemical.webp",
  magicalEffect: "icons/sundries/documents/document-symbol-lightning-brown.webp",
  baseEffect: "icons/sundries/scrolls/scroll-symbol-eye-brown.webp",
  enchantment: "icons/magic/symbols/runes-etched-steel-blade.webp",
  labCovenant: "icons/tools/laboratory/vials-blue-pink.webp",
  // Actors
  covenant: "icons/environment/settlement/wizard-castle.webp",
  magicCodex: "icons/commodities/materials/parchment-secrets.webp",
  npc: "icons/svg/mystery-man-black.svg",
  laboratory: "icons/tools/laboratory/vials-blue-pink.webp",
  crucible: "icons/tools/laboratory/bowl-liquid-orange.webp"
};

export const ACTIVITIES_DEFAULT_ICONS = {
  MONO: {
    none: "systems/arm5e/assets/icons/activities/Diary.svg",
    inventSpell: "systems/arm5e/assets/icons/activities/InventSpell.svg",
    learnSpell: "systems/arm5e/assets/icons/activities/LearnSpell.svg",
    adventuring: "systems/arm5e/assets/icons/activities/Adventuring.svg",
    exposure: "systems/arm5e/assets/icons/activities/Exposure.svg",
    practice: "systems/arm5e/assets/icons/activities/Practice.svg",
    training: "systems/arm5e/assets/icons/activities/Training.svg",
    teaching: "systems/arm5e/assets/icons/activities/Teaching.svg",
    hermeticApp: "systems/arm5e/assets/icons/activities/Diary.svg",
    childhood: "systems/arm5e/assets/icons/activities/HermeticApp.svg",
    laterLife: "systems/arm5e/assets/icons/activities/LaterLife.svg",
    laterLifeMagi: "systems/arm5e/assets/icons/activities/LaterLifeMagi.svg",
    reading: "systems/arm5e/assets/icons/activities/Reading.svg",
    visExtraction: "systems/arm5e/assets/icons/activities/VisExtraction.svg",
    lab: "systems/arm5e/assets/icons/activities/Lab.svg",
    aging: "systems/arm5e/assets/icons/activities/Aging.svg",
    visStudy: "systems/arm5e/assets/icons/activities/VisStudy.svg",
    recovery: "systems/arm5e/assets/icons/recovery/healed.png"
  },
  COLOR: {
    none: "icons/sundries/documents/document-sealed-signatures-red.webp",
    inventSpell: "icons/sundries/documents/document-letter-blue.webp",
    learnSpell: "icons/sundries/documents/blueprint-recipe-magic.webp",
    adventuring: "icons/tools/navigation/map-marked-brown.webp",
    exposure: "icons/magic/perception/eye-tendrils-web-purple.webp",
    practice: "icons/environment/people/archer.webp",
    training: "icons/skills/movement/arrow-upward-blue.webp",
    teaching: "icons/skills/movement/arrows-up-trio-red.webp",
    hermeticApp: "icons/skills/trades/academics-investigation-study-blue.webp",
    childhood: "icons/magic/time/day-night-sunset-sunrise.webp",
    laterLife: "icons/magic/time/hourglass-brown-orange.webp",
    laterLifeMagi: "icons/magic/symbols/runes-star-blue.webp",
    reading: "icons/sundries/books/book-open-red.webp",
    visExtraction: "icons/skills/toxins/bottle-open-vapors-pink.webp",
    lab: "icons/tools/laboratory/vials-blue-pink.webp",
    aging: "icons/sundries/misc/hourglass-wood.webp",
    visStudy: "icons/skills/toxins/bottle-open-vapors-pink.webp",
    recovery: "icons/magic/life/cross-explosion-burst-green.webp"
  }
};

export const INHABITANTS_DEFAULT_ICONS = {
  MONO: {
    magi: "icons/svg/mountain.svg",
    companions: "icons/svg/castle.svg",
    grogs: "icons/svg/combat.svg",
    craftmen: "icons/svg/city.svg",
    specialists: "icons/svg/city.svg",
    dependants: "icons/svg/village.svg",
    servants: "icons/svg/village.svg",
    teamsters: "icons/svg/village.svg",
    horses: "icons/svg/bridge.svg",
    livestock: "icons/svg/windmill.svg"
  },
  COLOR: {
    magi: "icons/svg/mountain.svg",
    companions: "icons/svg/castle.svg",
    grogs: "icons/skills/melee/sword-shield-stylized-white.webp",
    craftmen: "icons/environment/people/commoner.webp",
    specialists: "icons/environment/people/commoner.webp",
    dependants: "icons/environment/people/group.webp",
    servants: "icons/environment/people/group.webp",
    teamsters: "icons/environment/people/group.webp",
    horses: "icons/environment/creatures/horse-brown.webp",
    livestock: "icons/environment/creatures/horses.webp"
  }
};

export const VIRTUESFLAWS_DEFAULT_ICONS = {
  MONO: {
    hermetic: "systems/arm5e/assets/icons/VF/hermetic.svg",
    supernatural: "systems/arm5e/assets/icons/VF/supernatural.svg",
    social: "systems/arm5e/assets/icons/VF/social.svg",
    generalVirtue: "systems/arm5e/assets/icons/VF/generalVirtue.svg",
    generalFlaw: "systems/arm5e/assets/icons/VF/generalFlaw.svg",
    personality: "systems/arm5e/assets/icons/VF/personality.svg",
    story: "systems/arm5e/assets/icons/VF/story.svg",
    child: "systems/arm5e/assets/icons/VF/child.svg",
    heroic: "systems/arm5e/assets/icons/VF/heroic.svg",
    tainted: "systems/arm5e/assets/icons/VF/tainted.svg"
  }
};

export const ABILITIES_DEFAULT_ICONS = {
  MONO: {
    animalHandling: "systems/arm5e/assets/icons/abilities/animalHandling.svg",
    areaLore: "systems/arm5e/assets/icons/abilities/areaLore.svg",
    athletics: "systems/arm5e/assets/icons/abilities/athletics.svg",
    awareness: "systems/arm5e/assets/icons/abilities/awareness.svg",
    bargain: "systems/arm5e/assets/icons/abilities/bargain.svg",
    brawl: "systems/arm5e/assets/icons/abilities/brawl.svg",
    carouse: "systems/arm5e/assets/icons/abilities/carouse.svg",
    charm: "systems/arm5e/assets/icons/abilities/charm.svg",
    chirurgy: "systems/arm5e/assets/icons/abilities/chirurgy.svg",
    concentration: "systems/arm5e/assets/icons/abilities/concentration.svg",
    craft: "systems/arm5e/assets/icons/abilities/craft.svg",
    etiquette: "systems/arm5e/assets/icons/abilities/etiquette.svg",
    folkKen: "systems/arm5e/assets/icons/abilities/folkKen.svg",
    guile: "systems/arm5e/assets/icons/abilities/guile.svg",
    hunt: "systems/arm5e/assets/icons/abilities/hunt.svg",
    intrigue: "systems/arm5e/assets/icons/abilities/intrigue.svg",
    leadership: "systems/arm5e/assets/icons/abilities/leadership.svg",
    legerdemain: "systems/arm5e/assets/icons/abilities/legerdemain.svg",
    livingLanguage: "systems/arm5e/assets/icons/abilities/livingLanguage.svg",
    music: "systems/arm5e/assets/icons/abilities/music.svg",
    organizationLore: "systems/arm5e/assets/icons/abilities/organizationLore.svg",
    profession: "systems/arm5e/assets/icons/abilities/profession.svg",
    ride: "systems/arm5e/assets/icons/abilities/ride.svg",
    stealth: "systems/arm5e/assets/icons/abilities/stealth.svg",
    survival: "systems/arm5e/assets/icons/abilities/survival.svg",
    swim: "systems/arm5e/assets/icons/abilities/swim.svg",
    teaching: "systems/arm5e/assets/icons/abilities/teaching.svg",
    artesLib: "systems/arm5e/assets/icons/abilities/artesLib.svg",
    law: "systems/arm5e/assets/icons/abilities/law.svg",
    deadLanguage: "systems/arm5e/assets/icons/abilities/deadLanguage.svg",
    medicine: "systems/arm5e/assets/icons/abilities/medicine.svg",
    philosophy: "systems/arm5e/assets/icons/abilities/philosophy.svg",
    theology: "systems/arm5e/assets/icons/abilities/theology.svg",
    hermeticCode: "systems/arm5e/assets/icons/abilities/hermeticCode.svg",
    dominionLore: "systems/arm5e/assets/icons/abilities/dominionLore.svg",
    faerieLore: "systems/arm5e/assets/icons/abilities/faerieLore.svg",
    finesse: "systems/arm5e/assets/icons/abilities/finesse.svg",
    infernalLore: "systems/arm5e/assets/icons/abilities/infernalLore.svg",
    magicLore: "systems/arm5e/assets/icons/abilities/magicLore.svg",
    magicTheory: "systems/arm5e/assets/icons/abilities/magicTheory.svg",
    parma: "systems/arm5e/assets/icons/abilities/parma.svg",
    penetration: "systems/arm5e/assets/icons/abilities/penetration.svg",
    martial: "systems/arm5e/assets/icons/abilities/martial.svg",
    bows: "systems/arm5e/assets/icons/abilities/bows.svg",
    singleWeapon: "systems/arm5e/assets/icons/abilities/singleWeapon.svg",
    greatWeapon: "systems/arm5e/assets/icons/abilities/greatWeapon.svg",
    trownWeapon: "systems/arm5e/assets/icons/abilities/trownWeapon.svg",
    animalKen: "systems/arm5e/assets/icons/abilities/animalKen.svg",
    dowsing: "systems/arm5e/assets/icons/abilities/dowsing.svg",
    enchantingMusic: "systems/arm5e/assets/icons/abilities/enchantingMusic.svg",
    entrancement: "systems/arm5e/assets/icons/abilities/entrancement.svg",
    magicSensitivity: "systems/arm5e/assets/icons/abilities/magicSensitivity.svg",
    premonitions: "systems/arm5e/assets/icons/abilities/premonitions.svg",
    secondSight: "systems/arm5e/assets/icons/abilities/secondSight.svg",
    senseHolyAndUnholy: "systems/arm5e/assets/icons/abilities/senseHolyAndUnholy.svg",
    shapeshifter: "systems/arm5e/assets/icons/abilities/shapeshifter.svg",
    wildernessSense: "systems/arm5e/assets/icons/abilities/wildernessSense.svg",
    enigma: "systems/arm5e/assets/icons/abilities/enigma.svg",
    faerieMagic: "systems/arm5e/assets/icons/abilities/faerieMagic.svg",
    heartbeast: "systems/arm5e/assets/icons/abilities/heartbeast.svg",
    verditiusMagic: "systems/arm5e/assets/icons/abilities/verditiusMagic.svg",
    cult: "systems/arm5e/assets/icons/abilities/cult.svg"
  }
};

export async function getConfirmation(title, question, flavor = "Neutral", info1, info2) {
  const dialogData = {
    question: question,
    flavor: flavor,
    info1: info1,
    info2: info2
  };
  const html = await renderTemplate(
    "systems/arm5e/templates/generic/confirmation.html",
    dialogData
  );
  return await new Promise((resolve) => {
    new Dialog(
      {
        title: title,
        content: html,
        buttons: {
          yes: {
            icon: "<i class='fas fa-check'></i>",
            label: game.i18n.localize("arm5e.dialog.button.yes"),
            callback: () => resolve(true)
          },
          no: {
            icon: "<i class='fas fa-times'></i>",
            label: game.i18n.localize("arm5e.dialog.button.no"),
            callback: () => resolve(false)
          }
        },
        default: "yes",
        close: () => resolve(false)
      },
      {
        jQuery: true,
        height: "150px",
        classes: ["arm5e-dialog", "dialog"]
      }
    ).render(true);
  });
}
