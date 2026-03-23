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
import type { UserData } from "../../types/user";
import type { EquipSlot, SystemItem } from "../../types/system";
import { SYSTEM_ITEMS_BY_ID, getItemIconUrl } from "../../data/systemItems";
import { SYSTEM_BADGES, getBadgeIconUrl } from "../../data/systemBadges";
import { createPortal } from "react-dom";
import { useUserStore } from "../../store/user";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";
import { showToast } from "@/utils/toast";
import { isReservedDisplayName, isUnsetDisplayName } from "@/lib/defaultUserData";
import { IconX, IconPencil } from "../ui/icons";
import { UserNamePlate } from "../NamePlate";
import {
  clamp01,
  slotPlacementForIndex,
} from "../../lib/userBadges";

type Action =
  | { type: "EQUIP_ITEM"; slot: EquipSlot; itemId: string }
  | { type: "UNEQUIP_ITEM"; slot: EquipSlot }
  | { type: "TOGGLE_DISPLAY_BADGE"; badgeId: string }
  | {
      type: "SET_BADGE_PLACEMENT";
      badgeId: string;
      x: number;
      y: number;
    }
  | { type: "SET_PROFILE_NAME"; name: string }
  | { type: "UPDATE_USER"; user: UserData };

function userReducer(state: UserData, action: Action): UserData {
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
    case "TOGGLE_DISPLAY_BADGE": {
      const b = action.badgeId;
      if (!state.badges.unlockedBadges.includes(b)) return state;
      const d = [...state.badges.displayedBadgeIds];
      const p = [...state.badges.badgePlacements];
      const idx = d.indexOf(b);
      if (idx >= 0) {
        d.splice(idx, 1);
        const nextP = p.filter((x) => x.id !== b);
        return {
          ...state,
          badges: {
            ...state.badges,
            displayedBadgeIds: d,
            badgePlacements: nextP,
          },
        };
      }
      const nextD = [...d, b];
      const nextP = [...p, slotPlacementForIndex(nextD.length - 1, b)];
      return {
        ...state,
        badges: {
          ...state.badges,
          displayedBadgeIds: nextD,
          badgePlacements: nextP,
        },
      };
    }
    case "SET_BADGE_PLACEMENT": {
      if (!state.badges.displayedBadgeIds.includes(action.badgeId)) {
        return state;
      }
      const p = state.badges.badgePlacements.map((pl) =>
        pl.id === action.badgeId
          ? { ...pl, x: clamp01(action.x), y: clamp01(action.y) }
          : pl,
      );
      return {
        ...state,
        badges: {
          ...state.badges,
          badgePlacements: p,
        },
      };
    }
    case "SET_PROFILE_NAME": {
      const next = action.name.trim();
      if (!next || next === state.profile.name) return state;
      return {
        ...state,
        profile: { ...state.profile, name: next },
      };
    }
    case "UPDATE_USER":
      return structuredClone(action.user);
    default:
      return state;
  }
}

const EQUIP_SLOTS: EquipSlot[] = ["head", "body", "accessory", "weapon"];

export function Profile(){
  const closeOverlay = useOverlay((s)=> s.closeOverlay);
  const openOverlay = useOverlay((s) => s.openOverlay);
  const loadedUser = useUserStore(s => s.user);
  const setUserGlobal = useUserStore(s => s.setUser);
  const [user, dispatch] = useReducer(
    userReducer, 
    loadedUser,
    p => structuredClone(p));
  const [hoveredSlot, setHoveredSlot] = useState<EquipSlot | null>(null);
  const [profileTooltip, setProfileTooltip] = useState<{
    id: string;
    x: number;
    y: number;
    name: string;
    description?: string;
  } | null>(null);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(loadedUser.profile.name);

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
  }, [user.equipment.equipped]);

  function updateProfileTooltipFromEvent(
    tipId: string,
    e: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLButtonElement>,
    item: { name: string; description?: string }
  ) {
    if ("clientX" in e.nativeEvent && e.nativeEvent instanceof globalThis.MouseEvent) {
      const ev = e.nativeEvent;
      setProfileTooltip({
        id: tipId,
        x: ev.clientX + INV_TIP_OFFSET_X,
        y: ev.clientY + INV_TIP_OFFSET_Y,
        name: item.name,
        description: item.description,
      });
    } else {
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      setProfileTooltip({
        id: tipId,
        x: r.right + INV_TIP_OFFSET_X,
        y: r.bottom + INV_TIP_OFFSET_Y,
        name: item.name,
        description: item.description,
      });
    }
  }

  useEffect(() => {
    dispatch({ type: "UPDATE_USER", user: loadedUser });
  }, [loadedUser]);

  useEffect(() => {
    if (!nameEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- keep draft aligned with loaded profile when not editing
      setNameDraft(loadedUser.profile.name);
    }
  }, [loadedUser.profile.name, nameEditing]);

  const isDefaultDisplayName = isUnsetDisplayName(user.profile.name);

  const autoOpenedDefaultNameRef = useRef(false);
  /* eslint-disable react-hooks/set-state-in-effect -- one-time open rename when name is still the default placeholder */
  useEffect(() => {
    if (!isDefaultDisplayName || autoOpenedDefaultNameRef.current) return;
    autoOpenedDefaultNameRef.current = true;
    setNameEditing(true);
    setNameDraft(loadedUser.profile.name);
  }, [isDefaultDisplayName, loadedUser.profile.name]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const equippedItems = useMemo(() => {
    const result: Partial<Record<EquipSlot, SystemItem>> = {};
    EQUIP_SLOTS.forEach(slot => {
      const itemId = user.equipment.equipped[slot];
      if(itemId && SYSTEM_ITEMS_BY_ID[itemId]) {
        result[slot] = SYSTEM_ITEMS_BY_ID[itemId];
      }
    });
    return result;
  }, [user.equipment.equipped]);

  const inventoryItems = useMemo(() => {
    return Object.keys(user.inventory.items)
      .map(id => {
        const systemItem = SYSTEM_ITEMS_BY_ID[id];
        if(!systemItem) return null;
        return {
          ...systemItem,
          ...user.inventory.items[id]
        };
      })
      .filter((item): item is SystemItem & { quantity: number } => Boolean(item))
  }, [user.inventory.items]);
  const unlockedBadges = useMemo(
    () =>
      user.badges.unlockedBadges
        .map((id) => SYSTEM_BADGES[id])
        .filter(Boolean),
    [user.badges.unlockedBadges]
  );

  const namePlatePlacements = useMemo(() => {
    const unlocked = new Set(user.badges.unlockedBadges);
    const shown = new Set(user.badges.displayedBadgeIds);
    return user.badges.badgePlacements.filter(
      (p) => unlocked.has(p.id) && shown.has(p.id),
    );
  }, [
    user.badges.badgePlacements,
    user.badges.displayedBadgeIds,
    user.badges.unlockedBadges,
  ]);

  const displayedBadgeSet = useMemo(
    () => new Set(user.badges.displayedBadgeIds),
    [user.badges.displayedBadgeIds],
  );

  function equipItem(itemId: string) {
    const systemItem = SYSTEM_ITEMS_BY_ID[itemId];
    if(!systemItem) return;
    if(!user.inventory.items[itemId]) return;
    const slot = systemItem.slot;
    dispatch({ type: "EQUIP_ITEM", slot, itemId });
  }
  function toggleDisplayBadge(badgeId: string) {
    dispatch({ type: "TOGGLE_DISPLAY_BADGE", badgeId });
  }

  function saveProfile(){
    setUserGlobal(user);
    tryCompleteTutorialSpotlight("profile-save");
  }

  function commitNameEdit() {
    const next = nameDraft.trim();
    if (!next) return;
    if (isReservedDisplayName(next)) {
      showToast(
        "warning",
        "name unavailable, choose a different name",
      );
      return;
    }
    dispatch({ type: "SET_PROFILE_NAME", name: next });
    setNameEditing(false);

    const sub = useTutorialStore.getState().currentSubquest;
    if (sub?.spotlight === "profile-display-name") {
      useTutorialStore.getState().markSubquestComplete(sub.id);
    }
  }

  function cancelNameEdit() {
    setNameDraft(user.profile.name);
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
          <div
            className="profile-name-plate-block"
            data-spotlight="profile-display-name"
          >
            <UserNamePlate
              userName={user.profile.name}
              nameSlot={
                nameEditing ? (
                  <div className="name-plate-name-edit">
                    <label
                      className="visually-hidden"
                      htmlFor="profile-display-name"
                    >
                      display name
                    </label>
                    <input
                      id="profile-display-name"
                      className="profile-name-input name-text"
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
                  </div>
                ) : (
                  <div className="name-plate-name-with-edit">
                    <span className="name-text name-plate-preview-name">
                      {user.profile.name}
                    </span>
                    <button
                      type="button"
                      className="profile-name-edit-btn"
                      onClick={() => {
                        setNameDraft(user.profile.name);
                        setNameEditing(true);
                      }}
                      aria-label="Edit display name"
                      title="Edit name"
                    >
                      <IconPencil
                        size={18}
                        className="profile-name-edit-icon"
                      />
                    </button>
                  </div>
                )
              }
              placements={namePlatePlacements}
              interactive
              onPlacementChange={(badgeId, x, y) =>
                dispatch({
                  type: "SET_BADGE_PLACEMENT",
                  badgeId,
                  x,
                  y,
                })
              }
              className="profile-name-plate"
            />
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
              {user.profile.character ? (
                <img
                  src={user.profile.character}
                  alt="character"
                  className="character-img"
                />
              ) : null}
            </div>
          </div>
        </div>
        </div>
        <div className="player-currency">
          <span>coins: {user.currencies.coins}</span>
          <span>gems: {user.currencies.gems}</span>
        </div>
      </div>

      <div className="item-panel">
        <section data-spotlight="inventory">
          <h3>inventory</h3>
          <div id="inventory" className="grid">
            {inventoryItems.length === 0 ? (
              <p className="profile-panel-empty">
                nothing here yet — visit the <strong>shop</strong> or complete
                quests to earn equipment
              </p>
            ) : null}
            {inventoryItems.map((item) => {
              const isEquipped = user.equipment.equipped[item.slot] === item.id;
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
                  updateProfileTooltipFromEvent(item.id, e, item);
                }}
                onMouseMove={(e) => {
                  setProfileTooltip({
                    id: item.id,
                    x: e.clientX + INV_TIP_OFFSET_X,
                    y: e.clientY + INV_TIP_OFFSET_Y,
                    name: item.name,
                    description: item.description,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredSlot(null);
                  setProfileTooltip((t) => (t?.id === item.id ? null : t));
                }}
                onFocus={(e) => updateProfileTooltipFromEvent(item.id, e, item)}
                onBlur={() =>
                  setProfileTooltip((t) => (t?.id === item.id ? null : t))
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
          <h3>badges</h3>
            <div className="badge-section" data-spotlight="profile-badges">
              {unlockedBadges.length === 0 ? (
                <p className="profile-panel-empty">
                  no badges yet — keep questing to unlock flair
                </p>
              ) : null}
              {unlockedBadges.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  className={`badge-card ${
                    displayedBadgeSet.has(badge.id) ? "active" : ""
                  }`}
                  onClick={() => toggleDisplayBadge(badge.id)}
                  aria-pressed={displayedBadgeSet.has(badge.id)}
                  aria-label={badge.display}
                  title=""
                  onMouseEnter={(e) =>
                    updateProfileTooltipFromEvent(badge.id, e, {
                      name: badge.display,
                      description: badge.description,
                    })
                  }
                  onMouseMove={(e) => {
                    setProfileTooltip({
                      id: badge.id,
                      x: e.clientX + INV_TIP_OFFSET_X,
                      y: e.clientY + INV_TIP_OFFSET_Y,
                      name: badge.display,
                      description: badge.description,
                    });
                  }}
                  onMouseLeave={() =>
                    setProfileTooltip((t) => (t?.id === badge.id ? null : t))
                  }
                  onFocus={(e) =>
                    updateProfileTooltipFromEvent(badge.id, e, {
                      name: badge.display,
                      description: badge.description,
                    })
                  }
                  onBlur={() =>
                    setProfileTooltip((t) => (t?.id === badge.id ? null : t))
                  }
                >
                  <img
                    src={getBadgeIconUrl(badge.id)}
                    alt=""
                    className="badge-card-img"
                    decoding="async"
                  />
                </button>
              ))}
            </div>
        </section>

        
        <div className="profile-actions">
          <button
            type="button"
            className="shop-btn"
            data-spotlight="profile-shop"
            onClick={() => openOverlay("shop")}
          >
            shop
          </button>
          <button
            type="button"
            id="save-profile"
            data-spotlight="profile-save"
            onClick={saveProfile}
          >
            save changes
          </button>
        </div>
      </div>
      </div>
      {profileTooltip &&
        createPortal(
          <div
            className="item-tooltip item-tooltip--cursor"
            role="tooltip"
            style={{ left: profileTooltip.x, top: profileTooltip.y }}
          >
            <div className="item-tooltip-name">{profileTooltip.name}</div>
            {profileTooltip.description && (
              <div className="item-tooltip-desc">{profileTooltip.description}</div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}