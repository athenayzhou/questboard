import { useOverlay } from "../types/overlay";
import { Profile } from "./Profile";
import { QuestBoard } from "./QuestBoard";
import { FriendsList } from "./FriendsList";
import { SkillTree } from "./SkillTree";
import { Settings } from "./Settings";

export function OverlayManager(){
  const activeOverlay = useOverlay((s)=>s.activeOverlay);

  switch (activeOverlay) {
    case "profile":
      return <Profile />
    case "quests":
      return <QuestBoard />
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