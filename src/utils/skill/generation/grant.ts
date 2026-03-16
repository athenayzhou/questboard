import type { Skill, XPEvent, Mastery } from "../../../types/skills";
import { MS, MASTERY } from "../../constants";

export function getSkillsByVerb(skills: Skill[]): Map<string, Skill[]> {
  const byVerb = new Map<string, Skill[]>();
  for (const skill of skills){
    const v = skill.verb?.trim() || 'unknown';
    if(!byVerb.has(v)) byVerb.set(v, []);
    byVerb.get(v)!.push(skill);
  }
  return byVerb;
}

export function getTotalXPForVerb(skills: Skill[]): number {
  return skills.reduce((sum, s) => sum + s.xp, 0);
}
export function meetsDepthRequirement(skills: Skill[], minXP: number): boolean {
  return getTotalXPForVerb(skills) >= minXP;
}

export function getDistinctObjectCount(skills: Skill[]): number {
  const set= new Set<string>();
  for (const s of skills) {
    for(const obj of s.objects ?? []) {
      if (obj?.trim()) set.add(obj.trim().toLowerCase());
    }
  }
  return set.size;
}
export function meetsBreadthRequirement(skills: Skill[], minObjects: number): boolean {
  return getDistinctObjectCount(skills) >= minObjects;
}


function getStart(timestamp: number, now: number): number{
  const diff = now - timestamp;
  const weeksAgo = Math.floor(diff/MS.WEEK);
  return now - (weeksAgo + 1) * MS.WEEK;
}
export function getWeeksWithActivity(events: XPEvent[], now: number, windowWeeks: number): number {
  const start = new Set<number>();
  const windowStart = now - windowWeeks * MS.WEEK;
  for (const e of events){
    if(e.timestamp < windowStart) continue;
    start.add(getStart(e.timestamp, now));
  }
  return start.size;
}
export function meetsConsistencyRequirement(skillIds: string[], allEvents: XPEvent[], windowWeeks: number, minActiveWeeks: number, now: number = Date.now()): boolean {
  const skillIdSet = new Set(skillIds);
  const events = allEvents.filter((e) => e.skillId && skillIdSet.has(e.skillId));
  const activeWeeks = getWeeksWithActivity(events, now, windowWeeks);
  return activeWeeks >= minActiveWeeks;
}

export function getEligibleSkills(
  skills: Skill[], 
  allEvents: XPEvent[], 
  existingMasteries: Mastery[], 
  now: number = Date.now()
): { verb: string; skills: Skill[] }[] {
  const byVerb = getSkillsByVerb(skills);
  const existingVerbs = new Set(existingMasteries.map((m) => m.verb.toLowerCase().trim()));
  const result: { verb: string; skills: Skill[] }[] = [];

  for(const [verb, verbSkills] of byVerb){
    const verbNorm = verb.toLowerCase().trim();
    if(existingVerbs.has(verbNorm)) continue;

    if(verbSkills.length === 0) continue;

    const depthOk = meetsDepthRequirement(verbSkills, MASTERY.DEPTH_XP);
    const breadthOk = meetsBreadthRequirement(verbSkills, MASTERY.MIN_OBJECTS);
    const skillIds = verbSkills.map((s) => s.id);
    const consistencyOk = meetsConsistencyRequirement(
      skillIds,
      allEvents,
      MASTERY.CONSISTENCY_WEEKS,
      MASTERY.CONSISTENCY_ACTIVE_WEEKS,
      now
    );

    if(depthOk && breadthOk && consistencyOk){
      result.push({ verb, skills: verbSkills });
    }
  }
  return result;
}