import { openDB, type DBSchema, type IDBPDatabase } from "idb";

interface GmdssOfflineDB extends DBSchema {
  progress: {
    key: string;
    value: { id: string; data: unknown; updatedAt: number };
  };
  pendingActions: {
    key: string;
    value: { id: string; method: string; path: string; body?: unknown; createdAt: number };
  };
  content: {
    key: string;
    value: { id: string; data: unknown; updatedAt: number };
  };
  userProfile: {
    key: string;
    value: { id: string; email: string; name: string };
  };
}

let dbPromise: Promise<IDBPDatabase<GmdssOfflineDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<GmdssOfflineDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GmdssOfflineDB>("gmdss-offline", 1, {
      upgrade(db) {
        db.createObjectStore("progress", { keyPath: "id" });
        db.createObjectStore("pendingActions", { keyPath: "id" });
        db.createObjectStore("content", { keyPath: "id" });
        db.createObjectStore("userProfile", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function cacheContent(id: string, data: unknown): Promise<void> {
  const db = await getDb();
  await db.put("content", { id, data, updatedAt: Date.now() });
}

export async function getCachedContent(id: string): Promise<unknown> {
  const db = await getDb();
  const entry = await db.get("content", id);
  return entry?.data ?? null;
}

export async function cacheProgress(id: string, data: unknown): Promise<void> {
  const db = await getDb();
  await db.put("progress", { id, data, updatedAt: Date.now() });
}

export async function getCachedProgress(id: string): Promise<unknown> {
  const db = await getDb();
  const entry = await db.get("progress", id);
  return entry?.data ?? null;
}

export async function addPendingAction(
  method: string,
  path: string,
  body?: unknown,
): Promise<void> {
  const db = await getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.add("pendingActions", { id, method, path, body, createdAt: Date.now() });
}

export async function getPendingActions() {
  const db = await getDb();
  return db.getAll("pendingActions");
}

export async function clearPendingAction(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("pendingActions", id);
}
