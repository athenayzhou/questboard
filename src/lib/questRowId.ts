import { createHash } from "crypto";

const UUID_HEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Postgres `quests.id` is `uuid`. Client quests may use string ids (e.g.
 * `seasonal-spring-cleaning-1774062207117` from {@link SystemQuestGenerator}).
 * Row id must be a UUID; the original id stays in the JSON `data` column.
 */
export function stableUuidFromSeed(namespace: string, seed: string): string {
  const hash = createHash("sha256")
    .update(`${namespace}:${seed}`)
    .digest();
  const b = Buffer.alloc(16);
  hash.copy(b, 0, 0, 16);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = b.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function questRowIdFromClientId(clientId: string): string {
  const id = clientId.trim();
  if (UUID_HEX.test(id)) return id.toLowerCase();
  return stableUuidFromSeed("questboard:quest", id);
}
