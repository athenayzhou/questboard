import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useMasteryStore } from "../../store/mastery";
import { showToast } from "../../utils/toast";
import { scheduleMasteryEligibilityCheck } from "../../lib/masteryGrant";

vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

describe("scheduleMasteryEligibilityCheck", () => {
  const sampleMastery = {
    id: "m-new",
    verb: "run",
    name: "run mastery",
    title: "master of run",
    earnedAt: 1,
    skillIds: ["s1"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useMasteryStore.setState({ masteries: [] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs grantMastery once per microtask and toasts a single mastery", async () => {
    const spy = vi
      .spyOn(useMasteryStore.getState(), "grantMastery")
      .mockReturnValue([sampleMastery]);

    scheduleMasteryEligibilityCheck();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(
      "success",
      "mastery earned: run mastery",
    );
  });

  it("coalesces multiple schedules in the same synchronous turn", async () => {
    const spy = vi
      .spyOn(useMasteryStore.getState(), "grantMastery")
      .mockReturnValue([]);

    scheduleMasteryEligibilityCheck();
    scheduleMasteryEligibilityCheck();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("does not toast when nothing granted", async () => {
    vi.spyOn(useMasteryStore.getState(), "grantMastery").mockReturnValue([]);

    scheduleMasteryEligibilityCheck();
    await Promise.resolve();

    expect(showToast).not.toHaveBeenCalled();
  });
});
