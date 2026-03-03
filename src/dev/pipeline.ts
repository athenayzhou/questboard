// import type { Evidence, Cluster, Candidate } from "../types/skills";

// export function evidenceFromQuest(evidence: Evidence[], questId: string, ) {
//   return evidence.filter(e => e.origin === `quest: ${questId}`);
// }

// export function clusterFromEvidence(clusters: Cluster[], evidence: Evidence[], ) {
//   const keys = new Set(
//     evidence.map(e => `${e.verb}:${e.object}`)
//   );
//   return clusters.filter(c => keys.has(c.key));
// }

// export function candidateFromCluster( candidates: Candidate[], clusters: Cluster[]){
//   const keys = new Set(clusters.map(c => c.key));
//   return candidates.find(c => c.clusters.some(cl => keys.has(cl.key)));
// }