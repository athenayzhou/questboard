import { useOverlay } from "../utils/overlay";
import { Profile } from "./overlay/Profile";
import { QuestBoard } from "./overlay/QuestBoard";
import { QuestLog } from "./overlay/QuestLog";
import { FriendsList } from "./overlay/FriendsList";
import { SkillTree } from "./overlay/SkillTree";
import { Settings } from "./overlay/Settings";

import { QuestPage } from "./quest/QuestPage";
import { quests } from "../data/quests";
import type { Quest } from "../types/quest";

export function OverlayManager(){
  const activeOverlay = useOverlay((s)=>s.activeOverlay);
  const openQuestPages = useOverlay((s) => s.openQuestPages);
  const openQuest = useOverlay((s) => s.openQuest)
  const bringToFront = useOverlay((s) => s.bringToFront);
  const moveQuest = useOverlay((s) => s.moveQuest);
  const closeQuest = useOverlay((s) => s.closeQuest);

  const openQuests = openQuestPages
    .map(p => {
      const quest = quests.find(q => q.id === p.id);
      if(!quest) return null;
      return { page: p, quest }
    })
    .filter((v): v is { page: typeof openQuestPages[number]; quest: Quest } => v !== null);

  switch (activeOverlay) {
    case "profile":
      return <Profile />
    case "quests":
      return (
        <>
          <QuestBoard quests={quests} onSelect={openQuest} />
          {openQuests.map(({page, quest}) => (
            <QuestPage 
              key={quest.id}
              quest={quest} 
              x={page.x}
              y={page.y}
              z={page.z}
              onFocus={() => bringToFront(quest.id)}
              onMove={(x, y) => moveQuest(quest.id, x, y)}
              onClose={()=> closeQuest(quest.id)}
            />
          ))}
        </>
      )
    case "logs":
      return <QuestLog />
    case "friends":
      return <FriendsList />
    case "skills":
      return <SkillTree />
    case "settings":
      return <Settings />
    default:
      return null
  }
}