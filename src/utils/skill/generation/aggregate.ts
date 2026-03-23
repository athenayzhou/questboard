import type { Cluster, Evidence } from "../../../types/skills";
import { ClusterStore } from "../../../store/cluster";

export function aggregate(
  xp: number,
  evidence: Evidence[],
  clusterStore: ClusterStore,
): Cluster[] {
  for (const e of evidence) {
    clusterStore.add(e, xp);
  }
  return clusterStore.getAll();
}