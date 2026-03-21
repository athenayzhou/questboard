export const APP = {
  VERSION: "0.0.0",
  DEV_NAME: "Athena",
} as const;

export const MS = {
  SECOND: 1000,
  MINUTE: 60_000,
  HOUR: 3_600_000,
  DAY: 86_400_000,
  WEEK: 604_800_000,
}

export const DEFAULT = {
  SKILL_NAME: "emerging skill",
  OBJECT_NAME: "practice",
  EFFORT: 10 * MS.MINUTE,
}

export const UI = {
  DRAG_THRESHOLD_PX: 6,
  QUEST_CARD_WIDTH: 180,
  QUEST_CARD_HEIGHT: 120,
  SPAWN_X_MAX: 72,
  SPAWN_Y_MIN: 5,
  SPAWN_Y_MAX: 62,
}

export const NAME = {
  TEMPLATES: [
  "{verb} {object}",
  "{verb}ing {object}",
  "{object} {verb}",
  "{adjective} {object}",
  "{verb} practice",
  "{object} development",
  "{object} design",
  ],
  ADJECTIVES: [
  "micro",
  "adaptive",
  "intentional",
  "iterative",
  "expressive",
  "systems",
  ]
}

export const VERB ={
  THRESHOLD: 3,
}

export const EVIDENCE = {
  MAX_WEIGHT: 0.15,
  MIN_WEIGHT: 0.01,
}

export const CLUSTER = {
  MIN_SIZE: 3,
  THRESHOLD: 0.7,
  CONFIDENCE_EFFORTDIVISOR: 30,
  CONFIDENCE_MAX: 1,
}

export const CANDIDATE = {
  MIN_SIZE: 3,
  EMERGENT_THRESHOLD: 0.3,
  LATENT_THRESHOLD: 0.15,
}

export const MAX_LEVEL = 50;
function buildLevelCurve(count: number): number[] {
  const arr: number[] = [0];
  for (let i = 1; i < count; i++) {
    arr.push(Math.round(10 * Math.pow(i, 1.5)));
  }
  return arr;
}
export const LEVELS = buildLevelCurve(MAX_LEVEL);


export const MASTERY = {
  DEPTH_XP: 1000,
  MIN_OBJECTS: 5,
  CONSISTENCY_WEEKS: 12,
  CONSISTENCY_ACTIVE_WEEKS: 6,
}



export const DIFFICULTY_EFFORT = {
  easy: 5,
  medium: 15,
  hard: 30,
}

export const DECAY = {
  CLUSTER_DECAY_IDLE_DAYS: 7,
  CLUSTER_DECAY_RATE: 0.02,
  CLUSTER_REMOVAL_THRESHOLD: 0.01,

  CANDIDATE_DECAY_IDLE_DAYS: 3,
  CANDIDATE_DECAY_RATE: 0.01,
  CANDIDATE_REMOVAL_THRESHOLD: 0.05,
  CANDIDATE_REMOVAL_DAYS: 30,

  DORMANT_THRESHOLD_DAYS: 14,
  SKILL_DECAY_IDLE_DAYS: 21,
  DECAY_RATE_ACTIVE: 0.0003,
  DECAY_RATE_DORMANT: 0.0015,
  MIN_XP_BEFORE_DECAY: 10,

  DECAY_CHECK_INTERVAL: MS.DAY,
}

export const NUMOF_SKILLS = 3; 

export const COOCCURENCE_WINDOW = 1000 * 60 * 30;

export const VALIDATION_RULES = {
  TITLE_MIN: 3,
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 1000,
  CATEGORY_MAX: 50,
  CATEGORY_MIN: 1
}

export const CURRENCY = {
  LEVELUP_REWARD: 10,
  /** `coins = clamp(floor(skillXP / QUEST_COINS_PER_XP), min, max)` — tied to {@link calculateXP}. */
  QUEST_COINS_PER_XP: 4,
  QUEST_COINS_MIN: 1,
  QUEST_COINS_MAX: 250,
} as const;