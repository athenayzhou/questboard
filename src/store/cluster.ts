import type { Evidence, Cluster } from "../types/skills";
import { calculateConfidence } from "../utils/skill/analysis/threshold";
import { applyXP } from "../utils/skill/analysis/experience";
import { DECAY, DEFAULT, MS } from "../utils/constants";
import { devLog } from "../dev/devLogs";

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

export class ClusterStore {
  private clusters: Map<string, Cluster> = new Map();

  serialize(): [string, Cluster][] {
    return [...this.clusters];
  }

  hydrate(entries: unknown) {
    this.clusters = new Map(
      Array.isArray(entries) ? (entries as [string, Cluster][]) : [],
    );
  }

  getAll(): Cluster[] {
    return [...this.clusters.values()];
  }

  add(e: Evidence, xp: number): Cluster {
    const key = `${e.verb}:${e.object}`;
    const existing = this.clusters.get(key);
    const cluster = existing ? this.update(existing, e, xp) : this.create(e, xp);
    devLog(
      "skill-gen",
      `clustering VO pair {${cluster.verb}:${cluster.object}} with count: ${cluster.count}, confidence: ${cluster.confidence}, and total xp: ${cluster.xp}`,
    );
    return cluster;
  }

  decay(now: number) {
    const toRemove: string[] = [];
    this.clusters.forEach((cluster) => {
      const daysIdle = (now - cluster.lastSeenAt) / MS.DAY;
      if (daysIdle > DECAY.CLUSTER_DECAY_IDLE_DAYS) {
        const decayAmount = daysIdle * DECAY.CLUSTER_DECAY_RATE;
        cluster.confidence = Math.max(0, cluster.confidence - decayAmount);
        devLog(
          "decay",
          `cluster "${cluster.key}" decayed ⇒ -${decayAmount.toFixed(4)} decrease in confidence, confidence: ${cluster.confidence.toFixed(4)}, days idle: ${Math.floor(daysIdle)}, removal threshold: ${DECAY.CLUSTER_REMOVAL_THRESHOLD}`,
        );
        if (cluster.confidence < DECAY.CLUSTER_REMOVAL_THRESHOLD) {
          toRemove.push(cluster.key);
        }
      }
    });
    toRemove.forEach((key) => this.clusters.delete(key));
    touchExtension();
  }

  remove(key: string) {
    this.clusters.delete(key);
    touchExtension();
  }

  private create(e: Evidence, xp: number): Cluster {
    const timespent = e.timespent > 0 ? e.timespent : DEFAULT.EFFORT;
    const cluster: Cluster = {
      key: `${e.verb}:${e.object}`,
      verb: e.verb,
      object: e.object,
      count: 1,
      totalTime: timespent,
      xp,
      confidence: 0,
      firstSeenAt: e.timestamp,
      lastSeenAt: e.timestamp,
      origin: [e.origin],
    };
    cluster.confidence = calculateConfidence(cluster);
    this.clusters.set(cluster.key, cluster);
    touchExtension();
    return cluster;
  }

  private update(cluster: Cluster, e: Evidence, xp: number): Cluster {
    const timespent = e.timespent > 0 ? e.timespent : DEFAULT.EFFORT;
    cluster.count += 1;
    cluster.totalTime += timespent;
    applyXP(cluster, xp);
    cluster.lastSeenAt = Math.max(cluster.lastSeenAt, e.timestamp);
    cluster.origin.push(e.origin);
    cluster.confidence = calculateConfidence(cluster);
    touchExtension();
    return cluster;
  }

  clear() {
    this.clusters.clear();
    touchExtension();
  }
}
