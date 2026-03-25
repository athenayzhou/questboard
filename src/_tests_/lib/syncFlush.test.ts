import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { flushAllServerSyncs } from "../../lib/syncFlush";
import { useQuestStore } from "../../store/quest";
import { useSkillStore } from "../../store/skill";
import { useXPEventStore } from "../../store/xpEvent";
import { showToast } from "../../utils/toast";

vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

describe("flushAllServerSyncs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );
    useQuestStore.setState({ quests: [] });
    useSkillStore.setState({ skills: {} });
    useXPEventStore.setState({ events: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("returns true when all five PUTs succeed", async () => {
    await expect(flushAllServerSyncs()).resolves.toBe(true);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(5);
    expect(showToast).toHaveBeenCalledWith(
      "success",
      "saved to server",
    );
  });

  it("returns false and reports error if a PUT fails", async () => {
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        n += 1;
        if (n === 2) {
          return Promise.resolve(new Response("fail", { status: 500 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
      }),
    );

    await expect(flushAllServerSyncs()).resolves.toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("failed"),
      expect.any(Object),
    );
  });

  it("skips error toast when suppressErrorToast is true", async () => {
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        n += 1;
        if (n === 1) {
          return Promise.resolve(new Response("fail", { status: 500 }));
        }
        return Promise.resolve(
          new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
      }),
    );

    await expect(
      flushAllServerSyncs({ suppressErrorToast: true }),
    ).resolves.toBe(false);
    expect(showToast).not.toHaveBeenCalledWith(
      "error",
      expect.stringContaining("failed"),
      expect.any(Object),
    );
  });
});
