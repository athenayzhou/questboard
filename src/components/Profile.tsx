import { useOverlay } from "../types/overlay";

export function Profile(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  return(
    <div className="overlay">
      <button onClick={closeOverlay}>close</button>
      <h2>profile</h2>
    </div>
  )
}