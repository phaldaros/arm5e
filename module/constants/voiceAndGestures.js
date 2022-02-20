const VOICE = "voice";
const GESTURES = "gestures";

const DEFAULT_VOICE = "FIRM";
const DEFAULT_GESTURES = "BOLD";

// const VOICE_AND_GESTURES_VALUES = {
//   VOICE: {
//     LOUD: 1,
//     FIRM: 0,
//     QUIET: -5,
//     NONE: -10
//   },
//   GESTURES: {
//     EXAGGERATED: 1,
//     BOLD: 0,
//     SUBTLE: -2,
//     NONE: -5
//   }
// };

const VOICE_AND_GESTURES_VALUES = {
  voice: {
    LOUD: { value: 1, mnemonic: "arm5e.sheet.magic.voiceType.loud" },
    FIRM: { value: 0, mnemonic: "arm5e.sheet.magic.voiceType.firm" },
    QUIET: { value: -5, mnemonic: "arm5e.sheet.magic.voiceType.quiet" },
    NONE: { value: -10, mnemonic: "arm5e.sheet.magic.voiceType.none" }
  },
  gestures: {
    EXAGGERATED: { value: 1, mnemonic: "arm5e.sheet.magic.gesturesType.exaggerated" },
    BOLD: { value: 0, mnemonic: "arm5e.sheet.magic.gesturesType.bold" },
    SUBTLE: { value: -2, mnemonic: "arm5e.sheet.magic.gesturesType.subtle" },
    NONE: { value: -5, mnemonic: "arm5e.sheet.magic.gesturesType.none" }
  }
};

const VOICE_AND_GESTURES_ICONS = {
  voice: "icons/skills/trades/music-singing-voice-blue.webp",
  gestures: "icons/skills/social/wave-halt-stop.webp"
};

export { DEFAULT_VOICE, DEFAULT_GESTURES, GESTURES, VOICE, VOICE_AND_GESTURES_VALUES, VOICE_AND_GESTURES_ICONS };
