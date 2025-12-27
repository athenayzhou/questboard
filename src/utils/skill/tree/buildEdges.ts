import type { SkillNode, SkillEdge } from "../../../types/skills";
import { getTransitionEdges } from "../analysis/transitions";
import { getCoEdges } from "../analysis/cooccurence";

export function buildSkillEdges(skills: SkillNode[]): SkillEdge[] {
  const edges = new Map<string, SkillEdge>();

  function addEdge(from: string, to: string, strength: number) {
    const key = `${from}->${to}`;
    const existing = edges.get(key);
    if(existing){
      existing.strength += strength;
    } else {
      edges.set(key, { from, to, strength });
    }
  }

  for(let i=0; i<skills.length; i++){
    for(let j=i+1; j<skills.length; j++) {
      const a = skills[i];
      const b = skills[j];

      //identity edges
      if(a.verb && a.verb === b.verb) addEdge(a.id, b.id, 0.3);
      if(a.object && a.object === b.object) addEdge(a.id, b.id, 0.3);

      //transition edges
      getTransitionEdges().forEach(t => {
        const from = skills.find(s => s.verb === t.from);
        const to = skills.find(s => s.verb === t.to);
        if(!from || !to) return;
        addEdge(from.id, to.id, Math.min(1, t.strength/5));
      })
      
      //co-occurence edges
      getCoEdges().forEach(e => {
        if(e.weight < 3) return;
        const a = skills.find(s => s.verb === e.a || s.object === e.a);
        const b = skills.find(s => s.verb === e.b || s.object === e.b);
        if (!a || !b || a.id === b.id) return;
        addEdge(a.id, b.id, Math.min(0.5, e.weight / 10));
      });
      
    }
  }

  return [...edges.values()].filter(e => e.strength > 0.2);
}