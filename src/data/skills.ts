import type { SkillNode, SkillEdge } from "../types/skills";

export const skillNodes: SkillNode[] = [
  {
    id: "cook_food",
    name: "Cook Food",
    verb: "cook",
    object: "food",
    proficiency: 0.8,
    confidence: 1,
    discoveredAt: Date.now()
  },
  {
    id: "clean_room",
    name: "clean room",
    verb: "clean",
    object: "room",
    proficiency: 0.5,
    confidence: 0.9,
    discoveredAt: Date.now()
  },
  {
    id: "write_report",
    name: "write report",
    verb: "write",
    object: "report",
    proficiency: 0.6,
    confidence: 0.95,
    discoveredAt: Date.now()
  },

];

export const skillEdges: SkillEdge[] = [
  {
    from: "cook_food",
    to: "clean_room",
    strength: 0.2
  },
  {
    from: "cook_food",
    to: "write_report",
    strength: 0.5
  },
]