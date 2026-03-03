import type { Evidence, Cluster } from "../types/skills";
import { calculateConfidence } from "../utils/skill/analysis/confidence";
import { applyXP } from "../utils/skill/analysis/experience";

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
    cluster.lastSeenAt = Math.max(cluster.lastSeenAt, e.timestamp)
    cluster.origin.push(e.origin);
    cluster.confidence = calculateConfidence(cluster);
    return cluster;
  }

  clear(){
    this.clusters.clear();
  }
}