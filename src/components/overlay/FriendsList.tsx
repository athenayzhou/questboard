import { useOverlay } from "../../store/overlay";
import { useFriendsStore } from "../../store/friends";
import { IconUserPlus, IconX } from "../ui/icons";

export function FriendsList(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const friends = useFriendsStore((s) => s.friends);

  return(
    <div className="overlay friends-overlay">
      <div className="header friends-header">
        <h1>friends list</h1>
        <div className="header-actions">
          <button
            type="button"
            className="add-friend-btn"
            aria-label="Add friend"
            title="Add friend"
          >
            <IconUserPlus size={16} />
          </button>
          <button
            type="button"
            className="close friend-btn"
            onClick={closeOverlay}
            aria-label="Close friends list"
            title="Close"
          >
            <IconX size={18} />
          </button>
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