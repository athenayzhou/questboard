import { DEV_SEED_FRIENDS } from "@/dev/friendsUiDemo";
import { useFriendsStore } from "@/store/friends";

/**
 * Replaces the friends list with the dev roster (`DEV_SEED_FRIENDS`).
 * Only runs when `NODE_ENV === "development"` (`next dev`), not in production or `vitest`.
 */
export function applyDevFriendsSeed(): void {
  if (process.env.NODE_ENV !== "development") return;
  useFriendsStore.getState().hydrate(DEV_SEED_FRIENDS);
}
