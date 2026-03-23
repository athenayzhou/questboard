import { createHash } from "crypto";


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

export function questRowIdFromClientId(clientId: string, testerId: string): string {
  const id = clientId.trim();
  return stableUuidFromSeed("questboard:quest:row", `${testerId}:${id}`);
}

export function skillRowIdFromClientId(clientId: string, testerId: string): string {
  const id = clientId.trim();
  return stableUuidFromSeed("questboard:skill:row", `${testerId}:${id}`);
}

export function xpEventRowIdFromClientId(clientId: string, testerId: string): string {
  const id = clientId.trim();
  return stableUuidFromSeed("questboard:xp_event:row", `${testerId}:${id}`);
}
