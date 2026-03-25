# Dev tooling

## Default profile & friend (all environments)

After bootstrap, every session gets:

- **Profile character image:** `/donna.png` (see `DEFAULT_CHARACTER_IMAGE` in `src/lib/defaultUserData.ts` / `normalizeUserData`).
- **Friend:** **goldie** (`QB-11111111`) is ensured first in the friends list (`ensureGoldieFriend` in `src/lib/ensureGoldieFriend.ts`). UI preview uses `src/data/builtinFriendGoldie.ts`.

**Mastery** is granted by gameplay rules only. Earned masteries are not removed when skills decay.

Other dev-only UI/logging lives in `devLogs.ts` and `dev.css`.
