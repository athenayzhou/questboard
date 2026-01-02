import type { Cluster, Candidate } from "../../../types/skills";
import type { CandidateStore } from "../store/candidate";
import { evaluateReadiness } from "../analysis/confidence";
import { suggestNames } from "../analysis/name";

export function discover(
  clusters: Cluster[], 
  candidateStore: CandidateStore,
) : Candidate[] {
  const discovered: Candidate[] = [];
  
  for(const cluster of clusters) {
    const candidate = candidateStore.add(cluster);

    candidate.state = evaluateReadiness(candidate);

    if(candidate.state !== "ready"){
      candidateStore.save(candidate);
      continue;
    }
    
    if(candidate.state === "ready" && candidate.suggestedNames.length === 0){
      candidate.suggestedNames = suggestNames(candidate);
      discovered.push(candidate);
    }
    candidateStore.save(candidate);
  }
  return discovered;
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