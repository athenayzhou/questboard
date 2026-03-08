import { useOverlay } from "../../store/overlay";

export function Settings(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  return (
    <div className="overlay settings-overlay">
      <div className="header settings-header">
        <h2>settings</h2>
        <div className="header-actions">
          <button className="close" onClick={closeOverlay}>close</button>
        </div>
      </div>
      <div className="settings-content">
      </div>
    </div>
  )
}