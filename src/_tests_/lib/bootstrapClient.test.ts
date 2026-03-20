import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  fetchBootstrapOnce,
  BootstrapNetworkError,
} from "../../lib/bootstrapClient";
import { useQuestStore } from "../../store/quest";
import { usePlayerStore } from "../../store/player";
import { useSkillStore } from "../../store/skill";
import { useXPEventStore } from "../../store/xpEvent";

describe("fetchBootstrapOnce", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    useQuestStore.setState({ quests: [] });
    useSkillStore.setState({ skills: {} });
    useXPEventStore.setState({ events: [] });
    globalThis.fetch = vi.fn() as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns unauthorized when API returns 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false }), { status: 401 }),
    );
    await expect(fetchBootstrapOnce()).resolves.toBe("unauthorized");
  });

  it("returns ready and hydrates stores on success", async () => {
    const payload = {
      ok: true,
      data: {
        player: usePlayerStore.getState().player,
        quests: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            title: "t",
            description: "",
            difficulty: "easy" as const,
            status: "available" as const,
            createdAt: Date.now(),
            pinned: false,
          },
        ],
        skills: {},
        xpEvents: [],
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    await expect(fetchBootstrapOnce()).resolves.toBe("ready");
    expect(useQuestStore.getState().quests).toHaveLength(1);
    expect(useQuestStore.getState().quests[0].title).toBe("t");
  });

  it("returns error on malformed JSON body", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("not json", { status: 200 }),
    );
    await expect(fetchBootstrapOnce()).resolves.toBe("error");
  });

  it("throws BootstrapNetworkError when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError("offline"));
    await expect(fetchBootstrapOnce()).rejects.toBeInstanceOf(
      BootstrapNetworkError,
    );
  });
});
