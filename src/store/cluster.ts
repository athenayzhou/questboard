import type { Evidence, Cluster } from "../types/skills";
import { calculateConfidence } from "../utils/skill/analysis/threshold";
import { applyXP } from "../utils/skill/analysis/experience";
import { DECAY, MS } from "../utils/constants";

export class ClusterStore {
  private clusters: Map<string, Cluster> =(() => {
    try {
      const raw = localStorage.getItem("clusters");
      return raw ? new Map(JSON.parse(raw)) : new Map();
    } catch {
      return new Map();
    }
  })();

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

  decay(now: number){
    const toRemove: string[] = [];
    this.clusters.forEach(cluster => {
      const daysIdle = (now - cluster.lastSeenAt) / MS.DAY;
      if(daysIdle > 7){
        const decay = daysIdle * DECAY.CLUSTER_DECAY_RATE;
        cluster.confidence = Math.max(0, cluster.confidence - decay);
      
        if(cluster.confidence < DECAY.CLUSTER_REMOVAL_THRESHOLD){
          toRemove.push(cluster.key);
        }
      }
    });
    toRemove.forEach(key => this.clusters.delete(key));
    try {
      localStorage.setItem("clusters", JSON.stringify([...this.clusters]));
      // eslint-disable-next-line no-empty
    } catch {}
  }

  remove(key: string){
    this.clusters.delete(key);
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