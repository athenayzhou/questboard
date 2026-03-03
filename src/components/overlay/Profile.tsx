import { useOverlay } from "../../store/overlay";
import { useMemo, useReducer, useState } from "react";
import type { PlayerData, EquipSlot, SystemItem } from "../../types/profile";
import { TEST_SYSTEM_ITEMS as SystemItems, TEST_SYSTEM_TITLES as SystemTitles, TEST_SYSTEM_BADGES as SystemBadges } from "../../dev/data/TEST_SYSTEM";
import { RARITY_COLORS } from "../../utils/items";
import { usePlayerStore } from "../../store/player";

type Action =
  | { type: "EQUIP_ITEM"; slot: EquipSlot; itemId: string }
  | { type: "UNEQUIP_ITEM"; slot: EquipSlot }
  | { type: "SET_ACTIVE_TITLE"; titleId: string }
  | { type: "SET_ACTIVE_BADGE"; badgeId: string };

function playerReducer(state: PlayerData, action: Action): PlayerData {
  switch (action.type) {
    case "EQUIP_ITEM":
      if(state.equipment.equipped[action.slot] === action.itemId){
        return state;
      }
      return {
        ...state,
        equipment: {
          ...state.equipment,
          equipped: {
            ...state.equipment.equipped,
            [action.slot]: action.itemId
          }
        }
      };
    case "UNEQUIP_ITEM":
      if(state.equipment.equipped[action.slot]===null){
        return state;
      }
      return {
        ...state,
        equipment: {
          ...state.equipment,
          equipped: {
            ...state.equipment.equipped,
            [action.slot]: null
          }
        }
      };
    case "SET_ACTIVE_TITLE":
      if(!state.achievements.unlockedTitles.includes(action.titleId)){
        return state;
      }
      return {
        ...state,
        achievements: {
          ...state.achievements,
          activeTitle: action.titleId
        }
      };
    case "SET_ACTIVE_BADGE":
      if(!state.achievements.unlockedBadges.includes(action.badgeId)){
        return state;
      }
      return {
        ...state,
        achievements: {
          ...state.achievements,
          activeBadge: action.badgeId
        }
      };
    default:
      return state;
  }
}

const EQUIP_SLOTS: EquipSlot[] = ["head", "body", "accessory", "weapon"];

export function Profile(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const loadedPlayer = usePlayerStore(s => s.player);
  const setPlayerGlobal = usePlayerStore(s => s.setPlayer);
  const [player, dispatch] = useReducer(
    playerReducer, 
    loadedPlayer,
    p => structuredClone(p));
  const [hoveredSlot, setHoveredSlot] = useState<EquipSlot | null>(null);

  const equippedItems = useMemo(() => {
    const result: Partial<Record<EquipSlot, SystemItem>> = {};
    EQUIP_SLOTS.forEach(slot => {
      const itemId = player.equipment.equipped[slot];
      if(itemId && SystemItems[itemId]) {
        result[slot] = SystemItems[itemId];
      }
    });
    return result;
  }, [player.equipment.equipped]);

  const inventoryItems = useMemo(() => {
    return Object.keys(player.inventory.items)
      .map(id => {
        const systemItem = SystemItems[id];
        if(!systemItem) return null;
        return {
          ...systemItem,
          ...player.inventory.items[id]
        };
      })
      .filter((item): item is SystemItem & { quantity: number } => Boolean(item))
  }, [player.inventory.items]);
  const unlockedTitles = useMemo(() => 
    player.achievements.unlockedTitles
      .map(id => SystemTitles[id])
      .filter(Boolean),
    [player.achievements.unlockedTitles]
  );
  const unlockedBadges = useMemo(() => 
    player.achievements.unlockedBadges
      .map(id => SystemBadges[id])
      .filter(Boolean),
    [player.achievements.unlockedBadges]
  );

  const activeTitle = useMemo(
    () => unlockedTitles.find(t => t.id === player.achievements.activeTitle),
    [player.achievements.activeTitle, unlockedTitles]
  );
  const activeBadge = useMemo(
    () => unlockedBadges.find(b => b.id === player.achievements.activeBadge),
    [player.achievements.activeBadge, unlockedBadges]
  );

  function equipItem(itemId: string) {
    const systemItem = SystemItems[itemId];
    if(!systemItem) return;
    if(!player.inventory.items[itemId]) return;
    const slot = systemItem.slot;
    dispatch({ type: "EQUIP_ITEM", slot, itemId });
  }
  function setTitle(titleId: string){
    dispatch({
      type: "SET_ACTIVE_TITLE",
      titleId
    });
  }
  function setBadge(badgeId: string){
    dispatch({
      type: "SET_ACTIVE_BADGE",
      badgeId
    });
  }

  function saveProfile(){
    setPlayerGlobal(player);
  }

  return(
    <div className="overlay profile-overlay">
      <div className="header profile-header">
        <h1>profile</h1>
        <div className="header-actions">
          <button className="close profile-btn" onClick={closeOverlay}>close</button>
        </div>
      </div>
      <div className="character-information">
      <div className="character-panel">
        <div className="player-identity">
          <h2 className="player-name">{player.profile.name}</h2>
          <div className="player-achievements">
          {activeTitle && (
            <span className="active-title">{activeTitle.display}</span>
          )}
          {activeBadge && (
            <div className="active-badge">
              <div className="active-badge-icon">{activeBadge.icon}</div>
              <div className="active-badge-name">{activeBadge.display}</div>
            </div>
          )}
          </div>
        </div>
        <div className="player-preview">
          <section className="equip-slots">
            {EQUIP_SLOTS.map(slot => {
              const item = equippedItems[slot];
              return (
              <div key={slot} 
                className={`equip-slot ${
                    item ? "filled" :
                    hoveredSlot === slot ? "targeted" :
                    ""
                  }`}
                onClick={() => {
                  item && dispatch({ type: "UNEQUIP_ITEM", slot });
                }}
                >
                <div 
                  className={`equip-slot-image ${item ? item.rarity : "empty"}`}
                  style={{
                    backgroundColor: item ? RARITY_COLORS[item.rarity] : "#1f1f25"
                  }}
                />
                {/* {slot}: {equippedItems[slot]?.name ?? "-"} */}
              </div>
            )})}
          </section>
          <div className="character-slot">
            <div className="character-image">
              {/* <img src={player.profile.character} alt="character"/> */}
            </div>
          </div>
        </div>
      </div>

      <div className="item-panel">
        <section>
          <h3>inventory</h3>
          <div id="inventory" className="grid">
            {inventoryItems.map(item => (
              <button 
                key={item.id} 
                className={`item ${player.equipment.equipped[item.slot] === item.id ? "equipped" : ""}`}
                onClick={() => equipItem(item.id)}
                disabled={player.equipment.equipped[item.slot] === item.id}
                onMouseEnter={() => setHoveredSlot(item.slot)}
                onMouseLeave={() => setHoveredSlot(null)}
              >
                <div className="item-image"
                  style={{
                    backgroundColor: RARITY_COLORS[item.rarity] ?? "#444",
                    border: "none"
                  }}
                >
                  {/* <img src={item.icon} /> */}
                </div>
                <div className="item-name">{item.name}</div>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3>achievements</h3>
          <div className="subsection">
            <h4>titles</h4>
            <div className="title-section">
              {unlockedTitles.map(title => (
                <button 
                  key={title.id}
                  className={`title-banner ${activeTitle?.id === title.id ? "active" : ""}`}
                  onClick={() => setTitle(title.id)}
                  disabled={activeTitle?.id === title.id}
                >
                  <span className="title-text">{title.display}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="subsection">
            <h4>badges</h4>
            <div className="badge-section">
              {unlockedBadges.map(badge => (
                <button
                  key={badge.id}
                  className={`badge-card ${activeBadge?.id === badge.id ? "active" : ""}`}
                  onClick={() => setBadge(badge.id)}
                  disabled={activeBadge?.id === badge.id}
                >
                  <div className="badge-icon">{badge.icon}</div>
                  <div className="badge-name">{badge.display}</div>
                  </button>
              ))}
            </div>
          </div>
        </section>
        <button id="save-profile" onClick={saveProfile}>save changes</button>
      </div>
      </div>
    </div>
  )
}