// ============================================================================
// IDE Magic Numbers & Constants
// ============================================================================

// Stage dimensions (Scratch coordinate system: x[-240, 240], y[-180, 180])
export const STAGE_WIDTH = 480;
export const STAGE_HEIGHT = 360;
export const STAGE_HALF_W = STAGE_WIDTH / 2; // 240 — right edge in Scratch coords
export const STAGE_HALF_H = STAGE_HEIGHT / 2; // 180 — top edge in Scratch coords

// Canvas display dimensions (pixels)
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 300;

// Costume canvas size (for generated default costumes)
export const COSTUME_CANVAS_SIZE = 200;

// Collision detection
export const COLLISION_THRESHOLD = 50; // px — approximate sprite collision radius

// Layer limits
export const MAX_LAYER = 100;
export const MIN_LAYER = -100;

// Sprite property ranges
export const MIN_SPRITE_SIZE = 1;
export const MAX_SPRITE_SIZE = 500;
export const DEFAULT_SPRITE_SIZE = 100;
export const DEFAULT_DIRECTION = 90;

// Tempo / music
export const MIN_TEMPO = 20; // BPM
export const MAX_TEMPO = 500; // BPM
export const DEFAULT_TEMPO = 60; // BPM
export const DEFAULT_VOLUME = 100; // percent

// Sound defaults
export const DEFAULT_SOUND_DURATION_MS = 500; // ms — fallback when audio source is missing

// Blockly loading
export const BLOCKLY_TIMEOUT_MS = 20000; // ms — total timeout across all CDNs

// Execution / polling
export const EVENT_POLL_INTERVAL_MS = 50; // ms — polling interval for wait-until / when-greater-than
export const EVENT_MAX_WAIT_MS = 30000; // ms — max wait for when-greater-than (30 s)
export const BROADCAST_AND_WAIT_DELAY_MS = 100; // ms — delay for broadcast-and-wait

// Auto-save
export const AUTOSAVE_INTERVAL_MS = 60000; // ms — save every 60 seconds

// Random position range for new sprites
export const SPRITE_RANDOM_POS_RANGE = 200; // px — random x/y within [-100, 100]

// Output panel
export const OUTPUT_PANEL_WIDTH = 550; // px
export const OUTPUT_PANEL_HEIGHT = 400; // px
