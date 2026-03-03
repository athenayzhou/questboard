import { useXPEventStore } from "../../../store/xpEvent";
import { useSkillStore } from "../../../store/skill";
import { COOCCURENCE_WINDOW } from "../../constants";


type Cooccurence = {
  id: string;
  name: string;
  count: number;
}

export function getSkillCooccurence(skillKey: string): Cooccurence[]{
  const events = useXPEventStore.getState().events;
  const sessions: Record< string, Set<string>> = {};
  
  for(const e of events){
    const bucket = Math.floor(e.timestamp / COOCCURENCE_WINDOW);
    if(!sessions[bucket]) sessions[bucket] = new Set();
    if(e.skillId) sessions[bucket].add(e.skillId);
  }

  const cooccurenceMap: Record<string, number> = {};
  for(const skillSet of Object.values(sessions)){
    if(!skillSet.has(skillKey)) continue;
    for (const key of skillSet) {
      if(key === skillKey) continue;
      cooccurenceMap[key] = (cooccurenceMap[key] ?? 0) + 1;
    }
  }

  const skills = useSkillStore.getState().skills;
  return Object.entries(cooccurenceMap)
    .map(([key, count]) => {
      const skill = skills[key];
      return skill 
        ? { id: key, name: skill.name, count } 
        : null;
    })
    .filter(Boolean) as Cooccurence[];
}