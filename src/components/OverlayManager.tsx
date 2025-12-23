import { useOverlay } from "../types/overlay";
import { Profile } from "./overlay/Profile";
import { QuestBoard } from "./overlay/QuestBoard";
import { FriendsList } from "./overlay/FriendsList";
import { SkillTree } from "./overlay/SkillTree";
import { Settings } from "./overlay/Settings";

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