import { useOverlay } from "../types/overlay";

export function Settings(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  return(
    <div className="overlay">
      <button onClick={closeOverlay}>close</button>
      <h2>settings</h2>
    </div>
  )
}