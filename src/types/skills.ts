export type Evidence = {
  id: string;
  verb: string;
  object?: string;
  context?: string;
  timestamp: number;
  count: number;
  totalTime: number;
}

export type EvidenceCluster = {
  verbs: string[];
  objects: string[];
  contexts: string[];
  evidenceIds: string[];
}

export type Cluster = EvidenceCluster & {
  hash: string;
}

export type Candidate = {
  id: string;
  verbs: string[];
  objects: string[];
  contexts: string[];
  evidenceCount: number;
  confidence: number;
  firstSeenAt: number;
  lastSeenAt: number;
  state: "latent" | "ready" | "named" | "decayed";
  dismissedUntil?: number;
  suggestedNames?: string[];
}

export type Skill = {
  id: string;
  name: string;
  verbs: string[];
  objects: string[];
  contexts: string[];
  proficiency: number;
  xp: number;
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