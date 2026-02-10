import type { Cluster } from "../../../types/skills";
import { EvidenceStore } from "../../../store/evidence";
import { ClusterStore } from "../../../store/cluster";

export function aggregate(
  xp: number,
  evidenceStore: EvidenceStore,
  clusterStore: ClusterStore,
): Cluster[] {
  const evidence = evidenceStore.getAll();
  for (const e of evidence) {
    clusterStore.add(e, xp);
  }
  return clusterStore.getAll();
}