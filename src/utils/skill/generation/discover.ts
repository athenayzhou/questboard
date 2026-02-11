import type { Cluster } from "../../../types/skills";
import type { CandidateStore } from "../../../store/candidate";
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