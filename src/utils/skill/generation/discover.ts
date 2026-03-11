import type { Cluster } from "../../../types/skills";
import type { CandidateStore } from "../../../store/candidate";
import { evaluateReadiness } from "../analysis/threshold";
import { CLUSTER } from "../../constants";

export function discover(
  clusters: Cluster[], 
  candidateStore: CandidateStore,
) {
  const gated = clusters.filter(c => c.count >= CLUSTER.MIN_SIZE && c.confidence >= CLUSTER.THRESHOLD)
  for(const cluster of gated) {
    const candidate = candidateStore.add(cluster);
    candidate.state = evaluateReadiness(candidate, cluster.confidence);
    candidateStore.save(candidate);
  }
}