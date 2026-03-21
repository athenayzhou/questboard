# Local dev helpers

## Friends list (dev-only seed)

In **`next dev`** (`NODE_ENV=development`), after bootstrap the client **hydrates the friends store** with **four friends**: **goldie**, **samuel**, **kith**, **rowan** (`DEV_SEED_FRIENDS` in `src/dev/friendsUiDemo.ts`). The same module supplies name-plate + activity preview for those ids.

## Skill ledger / mastery (dev-only seed)

After bootstrap, **`applyDevMasterySeed()`** merges **`RICH_DEV_SKILLS`** + **`RICH_DEV_MASTERIES`** from `src/dev/data/richDevSeedData.ts` (two paths: **cook**, **clean**) so you can open the skill overlay and exercise mastery UI. Verbs already present from the server are skipped.

- **Production** (`next build` / `next start`) and **tests** (`vitest`, `NODE_ENV=test`) **do not** apply this seed — only whatever is in the synced client-game blob from the server.
- **Not** part of Postgres `db:seed-beta` (extension `friends` there stays empty unless you add data).

## Database: seed a beta user (Postgres)

This creates a **new** `testers` row, a **new** `beta_invites` row (pre-assigned to that tester), and fills `player_states`, `quests`, `skills`, and `client_game_state` using **`src/dev/seed/buildDbBetaPayload.ts`** (rich quests/skills/player data from `richDevSeedData.ts`; **friends list in the extension blob starts empty**).

1. **`DATABASE_URL`** and **`INVITE_HMAC_SECRET`** (e.g. in `.env.local`).
2. Install deps (`pnpm install` / `npm install` so `tsx` is available).
3. Run:

   ```bash
   pnpm db:seed-beta
   # or: npm run db:seed-beta
   ```

4. Optional: custom invite string (must not already exist as a code hash):

   ```bash
   SEED_BETA_INVITE_CODE="MY-TEAM-SEED" pnpm db:seed-beta
   ```

5. Default code if unset: **`QUESTBOARD-BETA-SEED`**

6. Open the app, enter that invite code at the beta gate. Session creation reuses the pre-assigned tester and loads the seeded rows from bootstrap.

**Note:** The script aborts if an invite with the same `code_hash` already exists. For a clean slate you can use `scripts/reset-and-invite.cjs` (wipes all testers/invites/data) first—**that deletes everything**, not only the seed user.

Quest and skill IDs are **stable UUIDs** in `richDevSeedData.ts` (`RICH_DEV_QUEST_IDS`, `RICH_DEV_SKILL_IDS`) so `/api/me/quests` and `/api/me/skills` sync works after seeding.
