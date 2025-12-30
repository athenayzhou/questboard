import type { Cluster } from "../../../types/skills";
import { EvidenceStore } from "../store/evidence";
import { ClusterStore } from "../store/cluster";

export function aggregate(
  evidenceStore: EvidenceStore,
  clusterStore: ClusterStore,
): Cluster[] {

  const evidence = evidenceStore.getAll();
  clusterStore.cluster(evidence);
  
  return clusterStore.getAll();
}