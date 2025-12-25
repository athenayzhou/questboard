import type { Quest } from "../types/quest";
import { tokenize, normalize } from "./text";

export type CompletedQuest = Extract<
  Quest,
  { status: "completed" | "failed" }
>

export type QuestGroup = {
  id: string,
  key: string,
  title: string,
  tokens: string[],
  quests: CompletedQuest[]
}

function similarity(a: string[], b: string[]) {
  const setA = new Set(a);
  const setB = new Set(b);

  const intersection = [...setA].filter(x => setB.has(x))
  const union = new Set([...a, ...b])

  return intersection.length / union.size
}

export function group(
  quests: CompletedQuest[]
) : QuestGroup[] {
  
  const groups: QuestGroup[] = []

  quests.forEach((quest) => {
    const tokens = tokenize(quest.title);

    let matchedGroup = groups.find(group => 
      similarity(tokens, group.tokens) > 0.5
    )

    if(!matchedGroup) {
      matchedGroup = {
        id: crypto.randomUUID(),
        key: normalize(quest.title),
        title: quest.title,
        tokens,
        quests:[],
      }
      groups.push(matchedGroup)
    }

    matchedGroup.quests.push(quest);
  })

  return groups
}

export function getGroupSummary(group: QuestGroup) {
  const sorted = [...group.quests].sort(
    (a, b) => b.completedAt - a.completedAt
  )

  const latest = sorted[0];

  const tags = Array.from(
    new Set(group.quests.flatMap(q => q.category ?? []))
  )

  return {
    title: group.key,
    tags,
    latestStatus: latest.status,
    latestDate: latest.completedAt,
  }
}

export function getLatest(
  quests: QuestGroup["quests"]
) {
  return [...quests].sort(
    (a, b) => b.completedAt - a.completedAt
  )[0]
}