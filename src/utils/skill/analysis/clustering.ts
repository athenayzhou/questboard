import type { Evidence, EvidenceCluster } from "../../../types/skills";
import { getCoEdges } from "./cooccurence";
import { getTransitions } from "./transitions";
import { CLUSTERING } from "../../constants";

export function getClusters() {
  const coEdges = getCoEdges();
  const transitions = getTransitions(2);
  const clusters: Map<string, Set<string>> = new Map()
  coEdges.forEach(edge => {
    if(edge.weight < CLUSTERING.MIN_SIZE) return
    if(!clusters.has(edge.a)){
      clusters.set(edge.a, new Set([edge.a]));
    }
    clusters.get(edge.a)!.add(edge.b);
  })
  transitions.forEach(t => {
    const keyA = t.from;
    const keyB = t.to;
    if(clusters.has(keyA) || clusters.has(keyB)){
      if(!clusters.has(keyA)){
        clusters.set(keyA, new Set([keyA]));
      }
      clusters.get(keyA)!.add(keyB);
    }
  });
  return [...clusters.values()].filter(c => c.size >= CLUSTERING.THRESHOLD);
}

export function clusterEvidence(
  evidence: Evidence[]
): EvidenceCluster[] {
  const clusters = new Map<string, EvidenceCluster>();

  evidence.forEach((e, i) => {
    const key = `${e.verb}:${e.object ?? ""}`;
    if (!clusters.has(key)){
      clusters.set(key, {
        verbs: [e.verb],
        objects: e.object ? [e.object] : [],
        contexts: e.context ? [e.context] : [],
        evidenceIds: [key + i],
      });
    } else {
      const cluster = clusters.get(key)!;
      cluster.evidenceIds.push(key + i);
    }
  });

  return [...clusters.values()]
}

export function hashCluster(cluster: EvidenceCluster): string {
  const verbs = [...new Set(cluster.verbs)].sort();
  const objects = [...new Set(cluster.objects)].sort();
  const contexts = [...new Set(cluster.contexts ?? [])].sort();

  let hash = 0;
  const string = JSON.stringify({ verbs, objects, contexts });
  for (let i=0; i<string.length; i++){
    hash = (hash << 5) - hash + string.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}