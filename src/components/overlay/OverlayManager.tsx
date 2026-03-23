import { useOverlay } from "../../store/overlay";
import { Profile } from "./Profile";
import { QuestBoard } from "./QuestBoard";
import { QuestLog } from "./QuestLog";
import { FriendsList } from "./FriendsList";
import { SkillLedger } from "./SkillLedger";
import { Settings } from "./Settings";
import { Feedback } from "../secondary/Feedback";

import { QuestPage } from "../secondary/QuestPage";
import { useQuestStore } from "../../store/quest";
import { useMemo } from "react";
import { AddQuestOverlay } from "../secondary/AddQuest";
import { Shop } from "../secondary/Shop";

export function OverlayManager(){
  const activeOverlay = useOverlay((s)=>s.activeOverlay);
  const openQuestPages = useOverlay((s) => s.openQuestPages);
  const openQuest = useOverlay((s) => s.openQuest)
  const bringToFront = useOverlay((s) => s.bringToFront);
  const moveQuest = useOverlay((s) => s.moveQuest);
  const closeQuest = useOverlay((s) => s.closeQuest);
  const quests = useQuestStore((s) => s.quests);
  const openQuests = useMemo(() => {
    return openQuestPages
    .map((page) => {
      const quest = quests.find((q) => q.id === page.id);
      if (!quest) return null;
      return { page, quest };
    })
    .filter(
      (v): v is { page: typeof openQuestPages[number]; quest: typeof quests[number] } => 
        v !== null
    );
  }, [openQuestPages, quests]);

  switch (activeOverlay) {
    case "profile":
      return <Profile />
    case "shop":
      return <Shop />
    case "quests":
      return (
        <>
          <QuestBoard quests={quests} onSelect={openQuest} />

          {openQuests.map(({ page, quest }) => (
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
    case "addQuest":
      return <AddQuestOverlay />
    case "logs":
      return <QuestLog />
    case "friends":
      return <FriendsList />
    case "skills":
      return <SkillLedger />
    case "settings":
      return <Settings />
    case "feedback":
      return <Feedback />
    default:
      return null
  }
}