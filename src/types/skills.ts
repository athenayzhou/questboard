export type Evidence = {
  id: string;
  verb: string;
  object: string;
  // context?: string;
  origin: string;
  timespent: number;
  timestamp: number;
}

export type Cluster = {
  key: string;
  verb: string;
  object: string;
  // context?: string;
  count: number;
  origin: string[];
  confidence: number;
}

export type Candidate = {
  id: string;
  key: string;
  verb: string;
  objects: string[]
  clusters: Cluster[],
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
  // contexts: string[];
  confidence: number,
  // proficiency: number;
  // xp: number;
  createdAt: number;
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