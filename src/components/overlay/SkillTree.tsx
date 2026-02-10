import { useState, useEffect } from "react";
import { useOverlay } from "./overlay";

import { buildTree } from "../../utils/skill/tree/buildTree";
import { loadTree } from "../../utils/skill/tree/persistence";

import type { Skill, Candidate, SkillNode, Tree } from "../../types/skills";

// import { skillNodes, skillEdges } from "../../dev/data/TEST_TREE";

import { skillStore, candidateStore } from "../../store/bundledStores";
import { DEFAULT } from "../../utils/constants";


export function SkillTree(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const [tree, setTree] = useState<Tree>(loadTree() || { nodes: [], edges: [] });

  useEffect(() => {
    const skills = skillStore.getAll();
    const candidates = candidateStore.getAll();

    const nodes: SkillNode[] = [
      ...skills.map(skillToNode),
      ...candidates.map(candidateToNode),
    ];

    const updatedTree = buildTree(nodes);
    setTree(updatedTree);
  }, []);

  function skillToNode(skill: Skill): SkillNode {
    return {
      id: skill.id,
      name: skill.name,
      verb: skill.verb,
      object: skill.objects[0],
      proficiency: skill.xp,
      confidence: skill.confidence,
      firstSeenAt: skill.firstSeenAt,
    }
  }
  function candidateToNode(candidate: Candidate): SkillNode {
    return {
      id: candidate.id,
      name: DEFAULT.SKILL_NAME,
      verb: candidate.verb,
      object: candidate.objects[0],
      proficiency: candidate.xp,
      confidence: candidate.confidence,
      firstSeenAt: candidate.firstSeenAt,
    }
  }

  const center = { x: 500, y: 225};
  const radius = 200;

  type PositionedNode = SkillNode & { x: number; y:number };
  const allNodes: PositionedNode[] = tree.nodes.map(n => ({
    ...n, 
    x:0,
    y: 0,
  }));

  allNodes.forEach((n, i) => {
    const angle = (i / allNodes.length) * Math.PI * 2;
    n.x = center.x + radius * Math.cos(angle);
    n.y = center.y + radius * Math.sin(angle);
  });

  return(
    <div className="overlay skill-overlay">
      <div className="header skill-header">
        <h2>skill tree</h2>
        <div className="header-actions">
          <button className="close skill-btn" onClick={closeOverlay}>close</button>
        </div>
      </div>

      <svg width="100%" height="80%">
        <rect width="100%" height="100%" fill="#ccc" />
        {/* <circle cx="50%" cy="50%" r={10} fill={"red"} onClick={()=>console.log(tree)}/> 
        <circle cx={500} cy={225} r={10} fill={"black"} />  */}
        {tree.edges.map(e => {
          const from = allNodes.find(n => n.id === e.from);
          const to = allNodes.find(n => n.id === e.to);
          if(!from || !to) return null;
          return(
            <line
              key={`${e.from}-${e.to}`}
              x1={from.x ?? center.x}
              y1={from.y ?? center.y}
              x2={to.x ?? center.x}
              y2={to.y ?? center.y}
              stroke = "gray"
              strokeWidth={2 * e.strength}
            />
          );
        })}
        {allNodes.map(n => (
          <g key={n.id}>
            <circle
              cx={n.x}
              cy={n.y}
              r={10}
              fill={tree.nodes.includes(n) ? "blue" : "lightblue"}
              opacity={tree.nodes.includes(n) ? 1 : 0.5}
            />
            <text x={n.x + 12} y={n.y + 4}>{n.name}</text>
            </g>
        ))}
      </svg>
    </div>
  )
}