import { throwIfUnauthorized } from "@/lib/sessionRecovery";

/**
 * Runs server-side reset hooks that can't be represented by normal blob sync.
 * Currently clears all friend relationships for the signed-in tester.
 */
export async function resetDataOnServer(): Promise<void> {
  const res = await fetch("/api/me/reset-data", {
    method: "POST",
    credentials: "include",
  });
  await throwIfUnauthorized(res);
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? `reset-data failed: ${res.status}`);
  }
}
