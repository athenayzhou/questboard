import { getClusters } from "../analysis/clustering";
// import type { Skill, Candidate } from "../../../types/skills";

export function emergentSkill(){
  const clusters = getClusters();

  return clusters.map((cluster, i) => ({
    id: `emergent=${i}`,
    seedWords: [...cluster],
    confidence: Math.min(1, cluster.size / 5),
  })).filter(c => c.confidence >= 0.6)
}

// export function materializeSkill(
//   candidate: Candidate,
//   name: string,
// ): Skill {
//   return{
//     id:  `skill-${candidate.clusterHash}`,
//     name,
//     verbs: candidate.verbs,
//     objects: candidate.objects,
//     contexts: candidate.contexts,
//     proficiency: 0.15,
//     xp: 0,
//     createdAt: Date.now()
//   }
// }