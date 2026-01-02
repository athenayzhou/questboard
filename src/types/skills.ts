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
  level: number;
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
  level: number,
  confidence: number;
  origin: string[];
  firstSeenAt: number;
  lastSeenAt: number;
  state: "latent" | "emerging" | "ready" | "named" | "decayed";
  // dismissedUntil?: number;
  suggestedNames: string[];
}

export type Skill = {
  id: string;
  name: string;
  verb: string;
  objects: string[];
  xp: number;
  level: number;
  confidence: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

export type XPEvent = {
  id: string;
  amount: number;
  source: "quest" | "habit" | "manual";
  sourceId: string;
  timestamp: number;
}

export type Progress = {
  level: number;
  xp: number;
  xpMax: number;
  progress: number;
}

export type SkillNode = {
  id: string;
  name: string;
  verb: string;
  object: string;
  proficiency: number;
  confidence: number;
  discoveredAt: number;
}

export type SkillEdge = {
  from: string;
  to: string;
  strength: number;
}

export type Tree = {
  nodes: SkillNode[];
  edges: SkillEdge[];
}