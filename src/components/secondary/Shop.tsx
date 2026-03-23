/* eslint-disable @next/next/no-img-element */
import { useOverlay } from "../../store/overlay";
import { useState, useEffect, useMemo } from "react";
import { useUserStore } from "../../store/user";
import { useShopStore } from "../../store/shop";
import { useTutorialStore } from "@/onboarding/tutorialStore";
import { tryCompleteTutorialSpotlight } from "@/onboarding/tutorialProgress";
import type { ShopItem } from "../../types/shop";
import type { UserData } from "../../types/user";
import {
  STARTER_SHOP_ITEM_IDS,
  getSystemItemById,
  getItemIconUrl,
} from "../../data/systemItems";
import { showToast } from "../../utils/toast";
import { createPortal } from "react-dom";
import { IconX } from "../ui/icons";

function descriptionForShop(text: string): string {
  return text.replace(/\.\s*$/, "").trim();
}

type ShopItemCardProps = {
  shopItem: ShopItem;
  loadedUser: UserData;
  onPurchase: (id: string) => void;
  buyButtonSpotlight?: string;
};

function ShopItemCard({
  shopItem,
  loadedUser,
  onPurchase,
  buyButtonSpotlight,
}: ShopItemCardProps) {
  const systemItem = getSystemItemById(shopItem.itemId);
  const itemName = systemItem?.name ?? shopItem.itemId;
  const balance = loadedUser.currencies[shopItem.currency];
  const canAfford = balance >= shopItem.price;
  const alreadyOwned =
    (loadedUser.inventory.items[shopItem.itemId]?.quantity ?? 0) >= 1;
  const canBuy = canAfford && !alreadyOwned;

  return (
    <div className="shop-item">
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
      <div
        className={`shop-item-price${
          shopItem.currency === "gems" ? " shop-item-price--gems" : ""
        }`}
      >
        {shopItem.price} {shopItem.currency}
      </div>
      {shopItem.requiredMasteryVerb && (
        <div className="shop-item-requirement">
          requires mastery: {shopItem.requiredMasteryVerb}
        </div>
      )}
      <button
        type="button"
        className="shop-buy-btn"
        disabled={!canBuy}
        onClick={() => onPurchase(shopItem.id)}
        {...(buyButtonSpotlight
          ? { "data-spotlight": buyButtonSpotlight }
          : {})}
      >
        {alreadyOwned ? "owned" : canAfford ? "buy" : "can't afford"}
      </button>
    </div>
  );
}

export function Shop() {
  const openOverlay = useOverlay((s) => s.openOverlay);
  const loadedUser = useUserStore((s) => s.user);
  const shopItems = useShopStore((s) => s.getAll());
  const purchase = useShopStore((s) => s.purchase);
  const starterBuySpotlight = useTutorialStore(
    (s) => s.currentSubquest?.spotlight === "shop-starter-buy",
  );

  const starterIdSet = useMemo(
    () => new Set<string>(STARTER_SHOP_ITEM_IDS),
    [],
  );

  const { starterItems, coinItems, masteryItems, gemItems } = useMemo(() => {
    const starter: ShopItem[] = [];
    const coin: ShopItem[] = [];
    const mastery: ShopItem[] = [];
    const gem: ShopItem[] = [];
    for (const item of shopItems) {
      if (starterIdSet.has(item.id)) {
        starter.push(item);
        continue;
      }
      if (item.currency === "gems") {
        gem.push(item);
      } else if (item.requiredMasteryVerb) {
        mastery.push(item);
      } else {
        coin.push(item);
      }
    }
    return {
      starterItems: starter,
      coinItems: coin,
      masteryItems: mastery,
      gemItems: gem,
    };
  }, [shopItems, starterIdSet]);

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsubscribe = useUserStore.subscribe(() => forceUpdate((n) => n + 1));
    return unsubscribe;
  }, []);

  function handlePurchase(shopItemId: string){
    const result = purchase(shopItemId);
    if (result.ok) {
      showToast("success", "purchase successful!");
      tryCompleteTutorialSpotlight("shop-starter-buy");
    } else {
      const messages = {
        not_found: "item not found",
        insufficient_funds: "not enough currency",
        missing_mastery: "missing required mastery",
        already_owned: "you already own this item",
      };
      showToast("error", messages[result.reason]);
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
              <span>coins: {loadedUser.currencies.coins}</span>
              <span>gems: {loadedUser.currencies.gems}</span>
            </div>
            <button
              type="button"
              className="close shop-btn"
              data-spotlight="close-shop"
              onClick={() => openOverlay("profile")}
              aria-label="Close shop"
              title="Close"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>
        <div className="shop-content">
          {shopItems.length === 0 ? (
            <p>no items available</p>
          ) : (
            <div className="shop-sections">
              {(starterItems.length > 0 || coinItems.length > 0) && (
                <section
                  className="shop-section shop-section--coins"
                  aria-labelledby="shop-section-coins"
                >
                  <h2 id="shop-section-coins" className="shop-section-heading">
                    coins
                  </h2>
                  {starterItems.length > 0 && (
                    <div className="shop-grid shop-starter-row">
                      {starterItems.map((shopItem) => (
                        <ShopItemCard
                          key={shopItem.id}
                          shopItem={shopItem}
                          loadedUser={loadedUser}
                          onPurchase={handlePurchase}
                          buyButtonSpotlight={
                            starterBuySpotlight ? "shop-starter-buy" : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                  {coinItems.length > 0 && (
                    <div className="shop-grid">
                      {coinItems.map((shopItem) => (
                        <ShopItemCard
                          key={shopItem.id}
                          shopItem={shopItem}
                          loadedUser={loadedUser}
                          onPurchase={handlePurchase}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
              {masteryItems.length > 0 && (
                <section
                  className="shop-section shop-section--mastery"
                  aria-labelledby="shop-section-mastery"
                >
                  <h2 id="shop-section-mastery" className="shop-section-heading">
                    mastery unlocks
                  </h2>
                  <div className="shop-grid">
                    {masteryItems.map((shopItem) => (
                      <ShopItemCard
                        key={shopItem.id}
                        shopItem={shopItem}
                        loadedUser={loadedUser}
                        onPurchase={handlePurchase}
                      />
                    ))}
                  </div>
                </section>
              )}
              {gemItems.length > 0 && (
                <section
                  className="shop-section shop-section--gems"
                  aria-labelledby="shop-section-gems"
                >
                  <h2 id="shop-section-gems" className="shop-section-heading">
                    gems
                  </h2>
                  <div className="shop-grid">
                    {gemItems.map((shopItem) => (
                      <ShopItemCard
                        key={shopItem.id}
                        shopItem={shopItem}
                        loadedUser={loadedUser}
                        onPurchase={handlePurchase}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </>,
    portalTarget,
  );
}