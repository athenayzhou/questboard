import type { Cluster, Evidence } from "../../../types/skills";
import { ClusterStore } from "../../../store/cluster";

/**
 * Add the given evidence to clusters (only these items are processed; no full-store scan).
 * Use the evidence from the current quest so we don't re-process and re-log all historical evidence.
 */
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