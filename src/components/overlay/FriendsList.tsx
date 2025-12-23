import { useOverlay } from "../../types/overlay";

export function FriendsList(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  return(
    <div className="overlay">
      <button onClick={closeOverlay}>close</button>
      <h2>friends list</h2>
    </div>
  )
}