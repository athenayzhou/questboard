import type { Quest } from "../../../types/quest";
import type { Evidence, Cluster } from "../../../types/skills";
import { calculateConfidence } from "../analysis/confidence";
import { xpToLevel, calculateXP, applyXP } from "../analysis/experience";

// import { getCoEdges } from "./cooccurence";
// import { getTransitions } from "./transitions";

export class ClusterStore {
  private clusters = new Map<string, Cluster>();

  getAll(): Cluster[] {
    return [...this.clusters.values()];
  }

  add(e: Evidence, xp: number): Cluster {
    const key = `${e.verb}:${e.object}`;
    const existing = this.clusters.get(key);
    if(existing) {
      return this.update(existing, e, xp);
    } else {
      return this.create(e, xp);
    }
  }

  private create(e: Evidence, xp: number): Cluster {
    const cluster: Cluster = {
      key: `${e.verb}:${e.object}`,
      verb: e.verb,
      object: e.object,
      count: 1,
      totalTime: e.timespent,
      xp,
      level: xpToLevel(xp),
      confidence: 0,
      firstSeenAt: e.timestamp,
      lastSeenAt: e.timestamp,
      origin: [e.origin],
    }
    cluster.confidence = calculateConfidence(cluster);
    this.clusters.set(cluster.key, cluster);
    return cluster;
  }

  private update(cluster: Cluster, e: Evidence, xp: number): Cluster {
    cluster.count += 1;
    cluster.totalTime += e.timespent;
    applyXP(cluster, xp);
    cluster.level = xpToLevel(cluster.xp);
    cluster.lastSeenAt = Math.max(cluster.lastSeenAt, e.timestamp)
    cluster.origin.push(e.origin);
    cluster.confidence = calculateConfidence(cluster);
    return cluster;
  }

  clear(){
    this.clusters.clear();
  }
}



// export function getClusters(evidence: Cluster[]): Cluster[] {
//   const coEdges = getCoEdges();
//   const transitions = getTransitions(2);

//   const clustersMap = new Map<string, Set<string>>();
//   coEdges.forEach(edge => {
//     if(edge.weight < CLUSTERING.MIN_SIZE) return;
//     if(!clustersMap.has(edge.a)) clustersMap.set(edge.a, new Set([edge.a]));
//     if(!clustersMap.has(edge.b)) clustersMap.set(edge.b, new Set([edge.b]));
    
//     clustersMap.get(edge.a)!.add(edge.b);
//     clustersMap.get(edge.b)!.add(edge.a);
//   })
//   transitions.forEach(t => {
//     const keyA = t.from;
//     const keyB = t.to;
//     if(clustersMap.has(keyA) || clustersMap.has(keyB)){
//       const targetKey = clustersMap.has(keyA) ? keyA : keyB;
//       if(!clustersMap.has(targetKey)) clustersMap.set(targetKey, new Set([targetKey]));
//       clustersMap.get(targetKey)!.add(keyA);
//       clustersMap.get(targetKey)!.add(keyB);
//     }
//   });

//   const clusterSets = [...clustersMap.values()];
//   const merged: Set<Set<string>> = new Set();
//   while (clusterSets.length) {
//     let current = clusterSets.shift()!;
//     let mergedFlag = true;

//     while (mergedFlag) {
//       mergedFlag = false;
//       for (let i=0; i<clusterSets.length; i++){
//         const other = clusterSets[i];
//         const intersection = new Set([...current].filter(x => other.has(x)));
//         if(intersection.size > 0) {
//           current = new Set([...current, ...other]);
//           clusterSets.splice(i, 1);
//           mergedFlag = true;
//           break;
//         }
//       }
//     }
//     merged.add(current);
//   }

//   const finalClusters: Cluster[] = [];
//   Array.from(merged).forEach((clusterSet, index) => {
//     const ids = [...clusterSet];
//     const mergedCluster = {
//       hash: `cluster-${index}`,
//       verbs: [] as string[],
//       objects: [] as string[],
//       contexts: [] as string[],
//       evidenceIds: [] as string[],
//       questTitles: [] as string[],
//       confidence: 0,
//     };

//     ids.forEach(id => {
//       const c = evidence.find(e => e.evidenceIds.includes(id));
//       if(!c) return;

//       mergedCluster.verbs.push(...c.verbs.filter(v => !mergedCluster.verbs.includes(v)));
//       mergedCluster.objects.push(...c.objects.filter(o => !mergedCluster.objects.includes(o)));
//       mergedCluster.contexts.push(...c.contexts.filter(ctx => !mergedCluster.contexts.includes(ctx)));
//       mergedCluster.evidenceIds.push(...c.evidenceIds.filter(eid => !mergedCluster.evidenceIds.includes(eid)));
//       mergedCluster.questTitles.push(...(c.questTitles ?? []).filter(qt => !mergedCluster.questTitles.includes(qt)));
//       mergedCluster.confidence += c.confidence;
//     });

//     finalClusters.push(mergedCluster);
//   });

//   return finalClusters.filter(c => c.evidenceIds.length >=(CLUSTERING.THRESHOLD ?? 1));
// }

// export function hashCluster(cluster: Cluster): string {
//   const verbs = [...new Set(cluster.verbs)].sort();
//   const objects = [...new Set(cluster.objects)].sort();
//   const contexts = [...new Set(cluster.contexts ?? [])].sort();
//   let hash = 0;
//   const string = JSON.stringify({ verbs, objects, contexts });
//   for (let i=0; i<string.length; i++){
//     hash = (hash << 5) - hash + string.charCodeAt(i);
//     hash |= 0;
//   }
//   return Math.abs(hash).toString(36);
// }