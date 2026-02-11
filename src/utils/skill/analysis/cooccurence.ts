import { getSkillKeyFromEvent, getSkillKeyFromLedger, getSkillLedger } from "../../../store/skillLedger";
import { XPEventStoreInstance } from "../../../store/xpEvent";
import { COOCCURENCE_WINDOW } from "../../constants";

type Cooccurence = {
  id: string;
  name: string;
  count: number;
}

export function getSkillCooccurence(skillKey: string): Cooccurence[]{
  const events = XPEventStoreInstance.getAll();
  const sessions: Record< string, Set<string>> = {};
  
  for(const e of events){
    const bucket = Math.floor(e.timestamp / COOCCURENCE_WINDOW);
    if(!sessions[bucket]) sessions[bucket] = new Set();
    const key = getSkillKeyFromEvent(e);
    if(key) sessions[bucket].add(key);
  }

  const cooccurenceMap: Record<string, number> = {};
  for(const skillSet of Object.values(sessions)){
    if(!skillSet.has(skillKey)) continue;
    for (const key of skillSet) {
      if(key === skillKey) continue;
      cooccurenceMap[key] = (cooccurenceMap[key] ?? 0) + 1;
    }
  }

  const ledger = getSkillLedger();
  return Object.entries(cooccurenceMap)
    .map(([key, count]) => {
      const skill = ledger.find(s => getSkillKeyFromLedger(s) === key);
      return skill 
        ? { id: key, name: skill.name, count } 
        : null;
    })
    .filter(Boolean) as Cooccurence[];
}