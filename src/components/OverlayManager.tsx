import { useOverlay } from "../types/overlay";
import { Profile } from "./overlay/Profile";
import { QuestBoard } from "./overlay/QuestBoard";
import { QuestLog } from "./overlay/QuestLog";
import { FriendsList } from "./overlay/FriendsList";
import { SkillTree } from "./overlay/SkillTree";
import { Settings } from "./overlay/Settings";

import { QuestPage } from "./QuestPage";
import { quests } from "../data/quests";

export function OverlayManager(){
  const activeOverlay = useOverlay((s)=>s.activeOverlay);
  const selectedQuestId = useOverlay((s) => s.selectedQuestId);
  const selectQuest = useOverlay((s) => s.selectQuest);

  const selectedQuest = quests.find((q) => q.id === selectedQuestId) ?? null;

  switch (activeOverlay) {
    case "profile":
      return <Profile />
    case "log":
      return <QuestLog />
    case "quests":
      return (
        <>
          <QuestBoard quests={quests} onSelect={selectQuest} />
          {selectedQuest && (
            <QuestPage quest={selectedQuest} onClose={()=> selectQuest(null)} />
          )}
        </>
      )
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