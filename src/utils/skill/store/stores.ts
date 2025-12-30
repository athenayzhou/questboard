import { EvidenceStore } from "./evidence";
import { ClusterStore } from "./cluster";
import { CandidateStore } from "./candidate";
import { SkillStore } from "./skill";

export const evidenceStore = new EvidenceStore();
export const clusterStore = new ClusterStore();
export const candidateStore = new CandidateStore();
export const skillStore = new SkillStore();