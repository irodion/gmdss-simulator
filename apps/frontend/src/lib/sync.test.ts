import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import { syncPendingActions } from "./sync.ts";

vi.mock("./offline-db.ts", () => ({
  getPendingActions: vi.fn().mockResolvedValue([]),
  clearPendingAction: vi.fn(),
}));

import { getPendingActions, clearPendingAction } from "./offline-db.ts";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  vi.mocked(getPendingActions).mockResolvedValue([]);
});

describe("syncPendingActions", () => {
  test("does nothing when no pending actions", async () => {
    await syncPendingActions();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("replays pending actions and clears on success", async () => {
    vi.mocked(getPendingActions).mockResolvedValue([
      { id: "1", method: "POST", path: "/api/progress/lesson/1/complete", createdAt: Date.now() },
    ]);
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    await syncPendingActions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(clearPendingAction).toHaveBeenCalledWith("1");
  });

  test("stops on server error (5xx)", async () => {
    vi.mocked(getPendingActions).mockResolvedValue([
      { id: "1", method: "POST", path: "/api/test1", createdAt: Date.now() },
      { id: "2", method: "POST", path: "/api/test2", createdAt: Date.now() },
    ]);
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response);

    await syncPendingActions();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(clearPendingAction).not.toHaveBeenCalled();
  });
});
