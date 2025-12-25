import { useOverlay } from "../../types/overlay";
import { friends } from "../../data/friends";

export function FriendsList(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);

  return(
    <div className="overlay friends-overlay">
      <div className="header friends-header">
        <h1>friends list</h1>
        <div className="header-actions">
          <button className="add-friend-btn">+ friend</button>
          <button className="close friend-btn" onClick={closeOverlay}>close</button>
        </div>
      </div>

      <div className="friends-list">
        {friends.map((friend)=> (
          <div key={friend.id} className="friend-card">

            <div className="friend-info">
              <div className="friend-name">{friend.name}</div>
              {friend.title && (
                <div className="friend-title">{friend.title}</div>
              )}
            </div>

            {/* <img className="friend-avatar src={friend.avatar} alt={friend.name} /> */}
            <div className="friend-avatar-placeholder" />
            
            <div className="friend-status">
              <span className={`status-dot ${friend.status}`} />
              <span className="status-text">{friend.status}</span>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}