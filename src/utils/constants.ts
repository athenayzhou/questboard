export const MS = {
  SECOND: 1000,
  MINUTE: 60_00,
  HOUR: 3_600_000,
  DAY: 86_400_000,
  WEEK: 604_800_000,
}

export const DEFAULT = {
  SKILL_NAME: "emerging skill",
  OBJECT_NAME: "practice",
  EFFORT: 10 * MS.MINUTE,
  DAY: 1000 * 60 * 60 * 24,
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

export const CLUSTERING = {
  MIN_SIZE: 3,
  THRESHOLD: 0.2,
}

export const CONFIDENCE = {
  EMERGENT_THRESHOLD: 0.3,
  READY_THRESHOLD: 0.6,
  GROWING_THRESHOLD: 0.75,
  STRONG_THRESHOLD: 0.85,
  MASTERY_THRESHOLD: 1.2,
  CURVE_RATE: 0.12,
}

export const PROFICIENCY = {
  BASELINE: 0.15,
  MAX: 1,
  EFFORT_DIVISOR: 20,
}

export const LEVELS = [0, 10, 30, 70, 150];

export const DIFFICULTY_EFFORT = {
  easy: 5,
  medium: 15,
  hard: 30,
}

export const DECAY = {
  CLUSTER_DECAY_RATE: 0.02,
  CLUSTER_REMOVAL_THRESHOLD: 0.01,

  CANDIDATE_DECAY_RATE: 0.01,
  CANDIDATE_REMOVAL_THRESHOLD: 0.05,
  CANDIDATE_REMOVAL_DAYS: 30,

  DORMANT_THRESHOLD_DAYS: 14,
  DECAY_RATE_ACTIVE: 0.001,
  DECAY_RATE_DORMANT: 0.005,
  MIN_XP_BEFORE_DECAY: 10,
  
  DECAY_CHECK_INTERVAL: MS.DAY,
}

export const NUMOF_SKILLS = 3; 

export const COOCCURENCE_WINDOW = 1000 * 60 * 30;