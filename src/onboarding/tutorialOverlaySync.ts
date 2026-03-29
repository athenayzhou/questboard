import type { OverlayType } from "@/store/overlay";
import type { SpotlightTarget } from "./tutorialTypes";
export function overlayForSpotlight(
  spot: SpotlightTarget | undefined,
): Exclude<OverlayType, null> | null {
  if (!spot) return null;
  if (spot.startsWith("board-") || spot.startsWith("qp-")) return "quests";
  if (spot.startsWith("addq-")) return "addQuest";
  if (spot.startsWith("entry-")) {
    return null;
  }
  if (spot === "profile-shop") return null;
  if (spot.startsWith("profile-")) return "profile";
  if (spot === "log-overlay") return null;
  if (spot === "log-browse-entry") return null;
  if (spot === "ledger-overlay") return "skills";
  if (spot === "ledger-skill-row") return "skills";
  if (spot === "close-shop") return "shop";
  if (spot === "inventory") return "profile";
  if (spot.startsWith("shop-")) return "shop";
  if (spot.startsWith("pinned-")) return null;
  return null;
}

export function boardTabForSpotlight(
  spot: SpotlightTarget | undefined,
): "available" | "accepted" | null {
  if (spot === "qp-pin") {
    return "accepted";
  }
  if (spot === "qp-accept") {
    return "available";
  }
  if (spot === "board-tab-accepted" || spot === "board-tutorial-card-accepted") {
    return "accepted";
  }
  if (spot === "board-tab-available" || spot === "board-tutorial-card-available") {
    return "available";
  }
  return null;
}
