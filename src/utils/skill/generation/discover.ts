import type { Cluster } from "../../../types/skills";
import type { CandidateStore } from "../../../store/candidate";
import { evaluateReadiness } from "../analysis/threshold";
import { CLUSTER } from "../../constants";
import { devLog } from "../../../dev/devLogs";
import { useSkillStore } from "../../../store/skill";

export function discover(
  clusters: Cluster[],
  candidateStore: CandidateStore,
) {
  const getByKey = useSkillStore.getState().getByKey;
  const gated = clusters.filter(
    (c) =>
      c.count >= CLUSTER.MIN_SIZE &&
      c.confidence >= CLUSTER.THRESHOLD &&
      !getByKey(c.key)
  );
  for (const cluster of gated) {
    devLog('skill-gen', `discovered potential candidate among clusters! cluster ${cluster.key} passes size (${cluster.count} > ${CLUSTER.MIN_SIZE}) and confidence check (${cluster.confidence} > ${CLUSTER.THRESHOLD})`);
    const candidate = candidateStore.add(cluster);
    candidate.state = evaluateReadiness(candidate, cluster.confidence);
    candidateStore.save(candidate);
    const clusterKeys = candidate.clusters.map(c => c.key);
    devLog('skill-gen', `new candidate {${candidate.verb}} with [${candidate.objects.join(", ")}] from clusters [${clusterKeys.join(", ")}](count: ${candidate.clusters.length}). state: ${candidate.state}, readiness: ${candidate.readiness}`);
  }
}