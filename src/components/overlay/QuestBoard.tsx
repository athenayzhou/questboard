import { useOverlay } from "../../types/overlay";

export function QuestBoard() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);

  return (
    <div className="overlay">
      <button onClick={closeOverlay}>close</button>
      <h2>quest board</h2>
    </div>
  )
}