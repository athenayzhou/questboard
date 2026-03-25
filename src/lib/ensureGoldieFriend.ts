import { useFriendsStore } from "@/store/friends";
import {
  SYSTEM_FRIEND_GOLDIE,
  GOLDIE_FRIEND_ID,
} from "@/data/systemFriends";

export function ensureGoldieFriend(): void {
  const friends = useFriendsStore.getState().friends;
  const rest = friends.filter((f) => f.id !== GOLDIE_FRIEND_ID);
  useFriendsStore.getState().hydrate([
    { ...SYSTEM_FRIEND_GOLDIE, status: "online" },
    ...rest,
  ]);
}
