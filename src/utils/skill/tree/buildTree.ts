import type { Tree, SkillNode } from "../../../types/skills";
import { buildSkillEdges } from "./buildEdges";

export function buildSkillTree(skills: SkillNode[]): Tree {
  return {
    nodes: skills,
    edges: buildSkillEdges(skills),
  };
}