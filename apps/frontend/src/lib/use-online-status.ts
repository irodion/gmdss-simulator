import { useSyncExternalStore } from "react";

import { API_BASE } from "./api-client.ts";

const HEALTH_URL = `${API_BASE}/api/health`;
const POLL_INTERVAL = 30_000;

let currentStatus = false;
let listenerCount = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

async function poll() {
  const next = await checkApi();
  if (next !== currentStatus) {
    currentStatus = next;
    notify();
  }
}

function onNetworkChange() {
  void poll();
}

function startPolling() {
  void poll();
  timer = setInterval(() => void poll(), POLL_INTERVAL);
  window.addEventListener("online", onNetworkChange);
  window.addEventListener("offline", onNetworkChange);
}

function stopPolling() {
  clearInterval(timer);
  timer = undefined;
  window.removeEventListener("online", onNetworkChange);
  window.removeEventListener("offline", onNetworkChange);
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  if (++listenerCount === 1) startPolling();
  return () => {
    listeners.delete(callback);
    if (--listenerCount === 0) stopPolling();
  };
}

function getSnapshot() {
  return currentStatus;
}

async function checkApi(): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch(HEALTH_URL, { method: "GET", cache: "no-store" });
    if (!res.ok) return false;
    const body = (await res.json()) as Record<string, unknown>;
    return body["status"] === "ok";
  } catch {
    return false;
  }
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
