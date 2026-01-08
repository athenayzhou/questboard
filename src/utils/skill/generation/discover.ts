import type { Cluster } from "../../../types/skills";
import type { CandidateStore } from "../store/candidate";
import { evaluateReadiness } from "../analysis/confidence";

export function discover(
  clusters: Cluster[], 
  candidateStore: CandidateStore,
) {
  for(const cluster of clusters) {
    const candidate = candidateStore.add(cluster);
    candidate.state = evaluateReadiness(candidate);
    candidateStore.save(candidate);
  }
}

// function discoverSkill(candidate: Candidate[]): Candidate[]{
//   const ready = candidate.filter(
//     c => c.type === "specific" && c.state === "emerging"
//   );

//   const skillCandidate = new Map<string, Candidate[]>();
//   for (const c of ready) {
//     if(!skillCandidate.has(c.verb)){
//       skillCandidate.set(c.verb, []);
//     }
//     skillCandidate.get(c.verb)!.push(c);
//   }

//   const masteryCandidate: Candidate[] = [];
//   for (const [verb, clusters] of skillCandidate.entries()) {
//     const confidence = 
//   }
// }