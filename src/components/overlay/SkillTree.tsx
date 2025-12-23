import { useOverlay } from "../../types/overlay";

export function SkillTree(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  return(
    <div className="overlay">
      <button onClick={closeOverlay}>close</button>
      <h2>skill tree</h2>
    </div>
  )
}