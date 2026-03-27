export type SharedBoard = {
  id: string;
  name: string;
  createdAt: number;
  memberNames?: Record<string, string>;
}