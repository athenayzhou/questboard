import { useOverlay } from "./overlay";
import { Profile } from "./Profile";
import { QuestBoard } from "./QuestBoard";
import { QuestLog } from "./QuestLog";
import { FriendsList } from "./FriendsList";
import { SkillTree } from "./SkillTree";
import { Settings } from "./Settings";

import { QuestPage } from "../quest/QuestPage";
import { TEST_BOARD as quests } from "../../dev/data/TEST_BOARD";
import type { Quest } from "../../types/quest";

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