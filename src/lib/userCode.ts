import { randomBytes } from "crypto";
import { query } from "./db";
const PREFIX = "QB-";

export function generateUserCode(): string {
  return `${PREFIX}${randomBytes(4).toString("hex").toUpperCase()}`;
}

export { normalizeUserCodeInput } from "@/utils/format/code";

export async function assignUserCodeIfMissing(testerId: string): Promise<string> {
  const cur = await query<{ user_code: string | null }>(
    `select user_code from testers where id = $1`,
    [testerId],
  );
  if (cur.rows[0]?.user_code) return cur.rows[0].user_code;

  for (let attempt = 0; attempt < 12; attempt++) {
    const code = generateUserCode();
    try {
      const upd = await query<{ user_code: string }>(
        `
        update testers
        set user_code = $1
        where id = $2 and user_code is null
        returning user_code
        `,
        [code, testerId],
      );
      if (upd.rows[0]?.user_code) return upd.rows[0].user_code;
      const again = await query<{ user_code: string | null }>(
        `select user_code from testers where id = $1`,
        [testerId],
      );
      if (again.rows[0]?.user_code) return again.rows[0].user_code;
    } catch (e: unknown) {
      if ((e as { code?: string }).code !== "23505") throw e;
    }
  }
  throw new Error("assignUserCodeIfMissing: could not assign unique code");
}
