export type FriendStatus = "online" | "offline" | "idle";

export type Friend = {
  id: string;
  name: string;
  title?: string;
  status: FriendStatus;
  // avatar: string;
};