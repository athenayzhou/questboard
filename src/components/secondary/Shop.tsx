import { useOverlay } from "../../store/overlay";
import { useState, useEffect } from "react";
import { usePlayerStore } from "../../store/player";
import { useShopStore } from "../../store/shop";
import { getSystemItemById, getItemIconUrl } from "../../data/systemItems";
import { showToast } from "../../utils/toast";
import { createPortal } from "react-dom";

function descriptionForShop(text: string): string {
  return text.replace(/\.\s*$/, "").trim();
}

export function Shop() {
  const openOverlay = useOverlay((s) => s.openOverlay);
  const loadedPlayer = usePlayerStore((s) => s.player);
  const shopItems = useShopStore((s) => s.getAll());
  const purchase = useShopStore((s) => s.purchase);

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = usePlayerStore.subscribe(() => forceUpdate((n) => n + 1));
    return unsubscribe;
  }, []);

  function handlePurchase(shopItemId: string){
    const result = purchase(shopItemId);
    if(result.ok){
      showToast("success", "purchase successful!");
    } else {
      const messages = {
        not_found: "item not found",
        insufficient_funds: "not enough currency",
        missing_mastery: "missing required mastery",
      };
      showToast('error', messages[result.reason]);
    }
  }

  const portalTarget = document.body;
  if (!portalTarget) return null;

  return createPortal(
    <>
      <div
        className="overlay-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) openOverlay("profile");
        }}
      />
      <div className="overlay shop-overlay">
        <div className="header shop-header">
          <h1>shop</h1>
          <div className="header-actions shop-header-actions">
            <div className="player-currency shop-header-currency">
              <span>coins: {loadedPlayer.currencies.coins}</span>
              <span>gems: {loadedPlayer.currencies.gems}</span>
            </div>
            <button
              className="close shop-btn"
              onClick={() => openOverlay("profile")}
            >
              x
            </button>
          </div>
        </div>
        <div className="shop-content">
          {shopItems.length === 0 ? (
            <p>no items available</p>
          ) : (
            <div className="shop-grid">
              {shopItems.map((shopItem) => {
                const systemItem = getSystemItemById(shopItem.itemId);
                const itemName = systemItem?.name ?? shopItem.itemId;
                const balance = loadedPlayer.currencies[shopItem.currency];
                const canAfford = balance >= shopItem.price;
                return (
                  <div key={shopItem.id} className="shop-item">
                    {systemItem && (
                      <div className="shop-item-image">
                        <img src={getItemIconUrl(systemItem.id)} alt={itemName} />
                      </div>
                    )}
                    <div className="shop-item-name">{itemName}</div>
                    {systemItem?.description && (
                      <div className="shop-item-description">
                        {descriptionForShop(systemItem.description)}
                      </div>
                    )}
                    <div className="shop-item-price">
                      {shopItem.price} {shopItem.currency}{" "}
                    </div>
                    {shopItem.requiredMasteryVerb && (
                      <div className="shop-item-requirement">
                        requires mastery: {shopItem.requiredMasteryVerb}
                      </div>
                    )}
                    <button
                      className="shop-buy-btn"
                      disabled={!canAfford}
                      onClick={() => handlePurchase(shopItem.id)}
                    >
                      {canAfford ? "buy" : "can't afford"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>,
    portalTarget,
  );
}