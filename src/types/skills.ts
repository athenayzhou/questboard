export type Evidence = {
  id: string;
  verb: string;
  object: string;
  origin: string;
  timespent: number;
  timestamp: number;
}

export type Cluster = {
  key: string;
  verb: string;
  object: string;
  count: number;
  totalTime: number;
  xp: number;
  confidence: number;
  lastSeenAt: number;
  firstSeenAt: number;
  origin: string[];
}

export type Candidate = {
  id: string;
  key: string;
  verb: string;
  objects: string[]
  clusters: Cluster[],
  xp: number,
  readiness: number;
  origin: string[];
  firstSeenAt: number;
  lastSeenAt: number;
  state: "latent" | "emergent" | "ready" | "decayed";
  // readyAt?: number;
  // namingOfferedAt?: number;
}

export type Skill = {
  id: string;
  key: string;
  name: string;
  verb: string;
  objects: string[];
  xp: number;
  proficiency: number;
  firstSeenAt: number;
  lastSeenAt: number;

  lastDecayAt: number;
  isDormant: boolean;
  dormantAt?: number;
}

export type XPEvent = {
  id: string;
  amount: number;
  source: "quest" | "habit" | "manual";
  sourceId: string;
  skillId?: string;
  name?: string;
  timestamp: number;
}

export type SkillLedgerEntry = {
  id: string;
  skillId: string | null;
  name: string;
  xp: number;
  level: number;
  lastSeenAt: number;
  isDormant: boolean;
}

export type Progress = {
  level: number;
  xp: number;
  xpMax: number;
  progress: number;
}

export type Mastery = {
  id: string;
  verb: string;
  name: string;
  title: string;
  earnedAt: number;
  skillIds: string[];
}