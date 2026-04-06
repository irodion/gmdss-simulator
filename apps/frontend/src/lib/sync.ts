import { clearPendingAction, getPendingActions } from "./offline-db.ts";

const API_BASE = import.meta.env["VITE_API_URL"] ?? "";

let syncInProgress = false;

export async function syncPendingActions(): Promise<void> {
  if (syncInProgress) return;
  syncInProgress = true;
  try {
    const actions = await getPendingActions();

    for (const action of actions) {
      try {
        const res = await fetch(`${API_BASE}${action.path}`, {
          method: action.method,
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (res.ok) {
          await clearPendingAction(action.id);
        } else if (res.status >= 500) {
          // Server error — stop and retry later
          break;
        }
        // 4xx errors (auth expired, validation) — skip this action but continue
        // to avoid blocking the queue. The action stays for manual review.
      } catch {
        // Network failure — stop and retry when back online
        break;
      }
    }
  } finally {
    syncInProgress = false;
  }
}

export function startSyncListener(): () => void {
  // Run an initial sync pass for actions queued in a previous session
  void syncPendingActions();

  const handler = () => {
    void syncPendingActions();
  };
  window.addEventListener("online", handler);
  return () => {
    window.removeEventListener("online", handler);
  };
}
