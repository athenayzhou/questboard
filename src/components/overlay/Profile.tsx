import { useOverlay } from "../../store/overlay";
import {
  useMemo,
  useReducer,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  type MouseEvent,
  type FocusEvent,
} from "react";
import type { PlayerData } from "../../types/player";
import type { EquipSlot, SystemItem } from "../../types/system";
import { SYSTEM_ITEMS_BY_ID, getItemIconUrl } from "../../data/systemItems";
import { SYSTEM_TITLES } from "../../data/systemTitles";
import { SYSTEM_BADGES } from "../../data/systemBadges";
import { createPortal } from "react-dom";
import { usePlayerStore } from "../../store/player";
import { IconX, IconPencil } from "../ui/icons";
type Action =
  | { type: "EQUIP_ITEM"; slot: EquipSlot; itemId: string }
  | { type: "UNEQUIP_ITEM"; slot: EquipSlot }
  | { type: "SET_ACTIVE_TITLE"; titleId: string }
  | { type: "SET_ACTIVE_BADGE"; badgeId: string }
  | { type: "SET_PROFILE_NAME"; name: string }
  | { type: "UPDATE_PLAYER"; player: PlayerData };

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
    case "SET_PROFILE_NAME": {
      const next = action.name.trim();
      if (!next || next === state.profile.name) return state;
      return {
        ...state,
        profile: { ...state.profile, name: next },
      };
    }
    case "UPDATE_PLAYER":
      return structuredClone(action.player);
    default:
      return state;
  }
}

const EQUIP_SLOTS: EquipSlot[] = ["head", "body", "accessory", "weapon"];

export function Profile(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const openOverlay = useOverlay((s) => s.openOverlay);
  const loadedPlayer = usePlayerStore(s => s.player);
  const setPlayerGlobal = usePlayerStore(s => s.setPlayer);
  const [player, dispatch] = useReducer(
    playerReducer, 
    loadedPlayer,
    p => structuredClone(p));
  const [hoveredSlot, setHoveredSlot] = useState<EquipSlot | null>(null);
  const [inventoryTip, setInventoryTip] = useState<{
    id: string;
    x: number;
    y: number;
    name: string;
    description?: string;
  } | null>(null);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(loadedPlayer.profile.name);

  /** Small nudge so the tooltip sits just beside the cursor (not overlapping it). */
  const INV_TIP_OFFSET_X = 4;
  const INV_TIP_OFFSET_Y = 4;

  const equipSlotsRef = useRef<HTMLElement>(null);
  const [equipStackHeightPx, setEquipStackHeightPx] = useState(220);

  useLayoutEffect(() => {
    const el = equipSlotsRef.current;
    if (!el) return;
    const update = () => {
      setEquipStackHeightPx(Math.ceil(el.getBoundingClientRect().height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [player.equipment.equipped]);

  function updateInventoryTipFromEvent(
    itemId: string,
    e: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: { name: string; description?: string }
  ) {
    if ("clientX" in e.nativeEvent && e.nativeEvent instanceof globalThis.MouseEvent) {
      const ev = e.nativeEvent;
      setInventoryTip({
        id: itemId,
        x: ev.clientX + INV_TIP_OFFSET_X,
        y: ev.clientY + INV_TIP_OFFSET_Y,
        name: item.name,
        description: item.description,
      });
    } else {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      setInventoryTip({
        id: itemId,
        x: r.right + INV_TIP_OFFSET_X,
        y: r.bottom + INV_TIP_OFFSET_Y,
        name: item.name,
        description: item.description,
      });
    }
  }

  useEffect(() => {
    dispatch({ type: "UPDATE_PLAYER", player: loadedPlayer });
  }, [loadedPlayer]);

  useEffect(() => {
    if (!nameEditing) {
      setNameDraft(loadedPlayer.profile.name);
    }
  }, [loadedPlayer.profile.name, nameEditing]);

  const isDefaultDisplayName =
    player.profile.name.trim().toLowerCase() === "player";

  const equippedItems = useMemo(() => {
    const result: Partial<Record<EquipSlot, SystemItem>> = {};
    EQUIP_SLOTS.forEach(slot => {
      const itemId = player.equipment.equipped[slot];
      if(itemId && SYSTEM_ITEMS_BY_ID[itemId]) {
        result[slot] = SYSTEM_ITEMS_BY_ID[itemId];
      }
    });
    return result;
  }, [player.equipment.equipped]);

  const inventoryItems = useMemo(() => {
    return Object.keys(player.inventory.items)
      .map(id => {
        const systemItem = SYSTEM_ITEMS_BY_ID[id];
        if(!systemItem) return null;
        return {
          ...systemItem,
          ...player.inventory.items[id]
        };
      })
      .filter((item): item is SystemItem & { quantity: number } => Boolean(item))
  }, [player.inventory.items]);
  const unlockedTitles = useMemo(
    () =>
      player.achievements.unlockedTitles.map((id) => SYSTEM_TITLES[id] ?? { id, display: id }),
    [player.achievements.unlockedTitles]
  );
  const unlockedBadges = useMemo(
    () =>
      player.achievements.unlockedBadges
        .map((id) => SYSTEM_BADGES[id])
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
    const systemItem = SYSTEM_ITEMS_BY_ID[itemId];
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

  function commitNameEdit() {
    const next = nameDraft.trim();
    if (!next) return;
    dispatch({ type: "SET_PROFILE_NAME", name: next });
    setNameEditing(false);
  }

  function cancelNameEdit() {
    setNameDraft(player.profile.name);
    setNameEditing(false);
  }

  return(
    <div className="overlay profile-overlay">
      <div className="header profile-header">
        <h1>profile</h1>
        <div className="header-actions">
          <button
            type="button"
            className="close profile-btn"
            onClick={closeOverlay}
            aria-label="Close profile"
            title="Close"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>
      <div className="character-information">
      <div className="character-panel">
        <div className="player-figure">
        <div className="player-identity">
          <div className="player-name-row">
            {nameEditing ? (
              <>
                <label className="visually-hidden" htmlFor="profile-display-name">
                  display name
                </label>
                <input
                  id="profile-display-name"
                  className="profile-name-input"
                  name="display-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitNameEdit();
                    if (e.key === "Escape") cancelNameEdit();
                  }}
                  maxLength={48}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="done"
                />
                <div className="profile-name-edit-actions">
                  <button
                    type="button"
                    className="profile-name-btn profile-name-btn--primary"
                    onClick={commitNameEdit}
                  >
                    save
                  </button>
                  <button
                    type="button"
                    className="profile-name-btn"
                    onClick={cancelNameEdit}
                  >
                    cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="player-name">{player.profile.name}</h2>
                <button
                  type="button"
                  className="profile-name-edit-btn"
                  onClick={() => {
                    setNameDraft(player.profile.name);
                    setNameEditing(true);
                  }}
                  aria-label="Edit display name"
                  title="Edit name"
                >
                  <IconPencil size={18} className="profile-name-edit-icon" />
                </button>
              </>
            )}
          </div>
          <div className="player-achievements">
          {activeTitle && (
            <span className="active-title">{activeTitle.display.toLowerCase()}</span>
          )}
          {activeBadge && (
            <div className="active-badge">
              <div className="active-badge-icon">{activeBadge.icon}</div>
            </div>
          )}
          </div>
        </div>
        <div className="player-preview">
          <section ref={equipSlotsRef} className="equip-slots">
            {EQUIP_SLOTS.map((slot) => {
              const item = equippedItems[slot];
              return (
                <div
                  key={slot}
                  className={`equip-slot ${
                    item ? "filled" : hoveredSlot === slot ? "targeted" : ""
                  }`}
                  onClick={() => {
                    if (item) {
                      dispatch({ type: "UNEQUIP_ITEM", slot });
                    }
                  }}
                >
                  <div className="equip-slot-image">
                    {item && (
                      <img
                        src={getItemIconUrl(item.id)}
                        alt={item.name}
                        className="equip-slot-img"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </section>
          <div
            className="character-slot"
            style={{
              height: equipStackHeightPx,
              maxHeight: equipStackHeightPx,
            }}
          >
            <div className="character-image">
              {player.profile.character ? (
                <img
                  src={player.profile.character}
                  alt="character"
                  className="character-img"
                />
              ) : null}
            </div>
          </div>
        </div>
        </div>
        <div className="player-currency">
          <span>coins: {player.currencies.coins}</span>
          <span>gems: {player.currencies.gems}</span>
        </div>
      </div>

      <div className="item-panel">
        <section>
          <h3>inventory</h3>
          <div id="inventory" className="grid">
            {inventoryItems.length === 0 ? (
              <p className="profile-panel-empty">
                nothing here yet — visit the <strong>shop</strong> or complete
                quests to earn equipment
              </p>
            ) : null}
            {inventoryItems.map((item) => {
              const isEquipped = player.equipment.equipped[item.slot] === item.id;
              return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isEquipped}
                className={`item ${isEquipped ? "equipped" : ""}`}
                onClick={() => {
                  if (isEquipped) {
                    dispatch({ type: "UNEQUIP_ITEM", slot: item.slot });
                  } else {
                    equipItem(item.id);
                  }
                }}
                onMouseEnter={(e) => {
                  setHoveredSlot(item.slot);
                  updateInventoryTipFromEvent(item.id, e, item);
                }}
                onMouseMove={(e) => {
                  setInventoryTip({
                    id: item.id,
                    x: e.clientX + INV_TIP_OFFSET_X,
                    y: e.clientY + INV_TIP_OFFSET_Y,
                    name: item.name,
                    description: item.description,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredSlot(null);
                  setInventoryTip((t) => (t?.id === item.id ? null : t));
                }}
                onFocus={(e) => updateInventoryTipFromEvent(item.id, e, item)}
                onBlur={() =>
                  setInventoryTip((t) => (t?.id === item.id ? null : t))
                }
              >
                <div className="item-image">
                  <img
                    src={getItemIconUrl(item.id)}
                    alt={item.name}
                    className="item-icon"
                  />
                </div>
              </button>
            );
            })}
          </div>
        </section>
        <section>
          <h3>achievements</h3>
          <div className="subsection">
            <h4>titles</h4>
            <div className="title-section">
              {unlockedTitles.length === 0 ? (
                <p className="profile-panel-empty">
                  no titles yet — earn them from masteries and milestones
                </p>
              ) : null}
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
              {unlockedBadges.length === 0 ? (
                <p className="profile-panel-empty">
                  no badges yet — keep questing to unlock flair
                </p>
              ) : null}
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

        
        <div className="profile-actions">
          <button
            type="button"
            className="shop-btn"
            onClick={() => openOverlay("shop")}
          >
            shop
          </button>
          <button id="save-profile" onClick={saveProfile}>save changes</button>
        </div>
      </div>
      </div>
      {inventoryTip &&
        createPortal(
          <div
            className="item-tooltip item-tooltip--cursor"
            role="tooltip"
            style={{ left: inventoryTip.x, top: inventoryTip.y }}
          >
            <div className="item-tooltip-name">{inventoryTip.name}</div>
            {inventoryTip.description && (
              <div className="item-tooltip-desc">{inventoryTip.description}</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}