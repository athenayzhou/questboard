import { Html } from "@react-three/drei";
import { usePlayerStore } from "../store/player";
import { SYSTEM_TITLES } from "../data/systemTitles";
import { SYSTEM_BADGES } from "../data/systemBadges";

type NameProps = {
  position?: [number, number, number]
}

export default function Name({
  position = [0, 1.5, 0],
} : NameProps){
  const name = usePlayerStore(s => s.player.profile.name);
  const activeTitle = usePlayerStore(s => s.player.achievements.activeTitle);
  const activeBadge = usePlayerStore(s => s.player.achievements.activeBadge);

  const htmlPortal = document.getElementById("html-layer");
  if (!htmlPortal) return null;


  const playerTitle = activeTitle
    ? SYSTEM_TITLES[activeTitle]
    : null;
  const playerBadge = activeBadge
    ? SYSTEM_BADGES[activeBadge]
    : null;

  return(
    <Html 
    position={position}
    transform
    className="name" 
    wrapperClass="name-wrapper"
    portal={{ current: htmlPortal }}
    center
    >
      <div className="name-container">
        <div className="name-container-top">
        <div className="name-text">{name}</div>
        {playerBadge && (
          <div 
            className="name-badge"
            title={playerBadge.display}
          >{playerBadge.icon ?? playerBadge.display[0]}</div>
        )}
        </div>
        {playerTitle && (
          <div className="name-title">{playerTitle.display}</div>
        )}
      </div>
    </Html>
  )
}