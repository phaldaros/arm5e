const VOICE = 'voice';
const GESTURES = 'gestures';

const DEFAULT_VOICE = 'FIRM';
const DEFAULT_GESTURES = 'BOLD';

const VOICE_AND_GESTURES_VALUES = {
    VOICE: {
        LOUD: 1,
        FIRM: 0,
        QUIET: -5,
        NONE: -10,
    },
    GESTURES: {
        EXAGGERATED: 1,
        BOLD: 0,
        SUBTLE: -5,
        NONE: -10,
    }
}

const VOICE_AND_GESTURES_ICONS = {
    VOICE: 'icons/skills/trades/music-singing-voice-blue.webp',
    GESTURES: 'icons/skills/social/wave-halt-stop.webp'
}

export {
    DEFAULT_VOICE,
    DEFAULT_GESTURES,
    GESTURES,
    VOICE,
    VOICE_AND_GESTURES_VALUES,
    VOICE_AND_GESTURES_ICONS
}