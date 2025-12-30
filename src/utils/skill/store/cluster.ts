import type { Evidence, Cluster, Candidate } from "../../../types/skills";
// import { getCoEdges } from "./cooccurence";
// import { getTransitions } from "./transitions";
// import { CLUSTERING } from "../../constants";
// import { calculateConfidence } from "../analysis/confidence";

export class ClusterStore {
  private clusters = new Map<string, Cluster>();

  getAll(): Cluster[] {
    return [...this.clusters.values()];
  }

  cluster(evidence: Evidence[]) {
    this.clusters.clear();
    for(const e of evidence){
      const key = `${e.verb}:${e.object}`;
      const existing = this.clusters.get(key);
      if(!existing){
        this.clusters.set(key, {
          key,
          verb: e.verb,
          object: e.object,
          count: 1,
          origin: e.origin ? [e.origin] : [],
          confidence: 0,
        });
      } else {
        existing.count += 1;
        // if(e.origin && !existing.origin.includes(e.origin)){
          existing.origin.push(e.origin);
        // }
      }
    }
    for (const cluster of this.clusters.values()){
      cluster.confidence = this.compute(cluster);
    }
  }

  compute(cluster: Cluster): number {
    let confidence = 0;
    confidence += cluster.count * 0.1;
    // confidence += Math.min(cluster.totalTime / 300, 0.3);
    confidence += cluster.origin.length * 0.05;
    return Math.min(confidence, 1)
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