import { useState, useEffect } from "react";
import { useOverlay } from "../../utils/overlay";

// import { detectSkills } from "../../utils/skill/generation/detection";
import { buildSkillTree } from "../../utils/skill/tree/buildTree";

import { EvidenceStore } from "../../utils/skill/store/evidence";
import { analyze } from "../../utils/skill/analysis/analyze";
import { getClusters } from "../../utils/skill/analysis/clustering";
// import { buildSkillEdges } from "../../utils/skillTree/buildEdges";
import { decaySkills } from "../../utils/skill/analysis/decay";
import { loadTree, saveTree } from "../../utils/skill/tree/persistence";

import type { Tree, SkillNode } from "../../types/skills";
// import { SkillEdge } from "../../types/skills";
import { tokenize } from "../../utils/text";
import { extractObjects, extractVerbs } from "../../utils/verb";

import { skillNodes, skillEdges } from "../../data/skills";

type Quest = { title: string; duration: number }

export function SkillTree(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  const [evidenceStore] = useState(() => new EvidenceStore());
  const [tree, setTree] = useState<Tree>(loadTree() || { nodes: [], edges: [] });
  const [candidates, setCandidates] = useState<SkillNode[]>([]);

  // useEffect(() => {
  //   const persisted = loadTree();
  //   const initialNodes = persisted ? [...persisted.nodes, ...skillNodes] : [...skillNodes];
  //   const initialEdges = persisted ? [...persisted.edges, ...skillEdges] : [...skillEdges];
  //   const initialTree: Tree = {
  //     nodes: initialNodes,
  //     edges: initialEdges,
  //   };
  //   setTree(initialTree);
  //   console.log(tree)
  // }, []);

  useEffect(() => {
    const initialTree: Tree = {
      nodes: skillNodes,
      edges: skillEdges,
    };
    setTree(initialTree);
    console.log(initialTree);
  }, []);

  function processQuest(quest: Quest){
    const tokens = tokenize(quest.title);
    const verbs = extractVerbs(tokens);
    const objects = extractObjects(tokens, verbs);
    verbs.forEach(v =>
      objects.forEach(o =>
        evidenceStore.updateEvidence(v, o, quest.duration)
      )
    );
    analyze(quest.title, quest.title, Date.now());

    const evidence = evidenceStore.getAll();
    // const { candidate: detectCandidates } = detectSkills(evidence, tree.nodes);
    const clusters = getClusters();
    const clusterCandidates = clusters.flatMap((c, i) => 
      [...c].map((key, j) => ({
        id: `cluster-${i}-${j}`,
        name: key,
        verb: key,
        object: "",
        proficiency: 0,
        confidence: 0.5,
        discoveredAt: Date.now(),
      }))
    );
    const allCandidates = [ ...clusterCandidates];
    setCandidates(allCandidates);

    const allNodes = [...tree.nodes, ...allCandidates]
    const decayedNodes = decaySkills(allNodes, Date.now());
    const updatedTree = buildSkillTree(decayedNodes);
    setTree(updatedTree);
    saveTree(updatedTree);
  }


  const center = { x: 500, y: 225};
  const radius = 200;

  type PositionedNode = SkillNode & { x: number; y:number };
  const allNodes: PositionedNode[] = [...tree.nodes, ...candidates].map(n => ({
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