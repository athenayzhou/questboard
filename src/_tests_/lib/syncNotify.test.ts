import { describe, it, expect, vi, beforeEach } from "vitest";
import { notifyDebouncedSyncFailure } from "../../lib/syncNotify";
import { showToast } from "../../utils/toast";

vi.mock("../../utils/toast", () => ({
  showToast: vi.fn(),
}));

describe("notifyDebouncedSyncFailure", () => {
  beforeEach(() => {
    vi.mocked(showToast).mockClear();
  });

  it("shows only one toast when called twice in quick succession", () => {
    notifyDebouncedSyncFailure();
    notifyDebouncedSyncFailure();
    expect(showToast).toHaveBeenCalledTimes(1);
  });
});
