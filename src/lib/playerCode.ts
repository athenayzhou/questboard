import { randomBytes } from "crypto";
import { query } from "./db";
const PREFIX = "QB-";

export function generatePlayerCode(): string {
  return `${PREFIX}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export { normalizePlayerCodeInput } from "@/utils/format/code";

export async function assignPlayerCodeIfMissing(testerId: string): Promise<string> {
  const cur = await query<{ player_code: string | null }>(
    `select player_code from testers where id = $1`,
    [testerId],
  );
  if(cur.rows[0]?.player_code) return cur.rows[0].player_code;

  for(let attempt = 0; attempt < 12; attempt++) {
    const code = generatePlayerCode();
    try {
      const upd = await query<{ player_code: string }>(
        `
        update testers
        set player_code = $1
        where id = $2 and player_code is null
        returning player_code
        `,
        [code, testerId],
      );
      if(upd.rows[0]?.player_code) return upd.rows[0].player_code;
      const again = await query<{ player_code: string | null }>(
        `select player_code from testers where id = $1`,
        [testerId],
      );
      if(again.rows[0]?.player_code) return again.rows[0].player_code;
    } catch (e: unknown) {
      if((e as { code?: string }).code !== "23505") throw e;
    }
  }
  throw new Error("assignPlayerCodeIfMissing: could not assign unique code");
}