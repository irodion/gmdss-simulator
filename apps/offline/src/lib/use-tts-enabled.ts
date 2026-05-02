import { useCallback, useState } from "react";

const STORAGE_KEY = "gmdss-offline:procedures:tts-enabled";

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function writeStored(value: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
  } catch {
    // private mode / quota: silently ignore — runtime state still flips.
  }
}

export function useTtsEnabled(): readonly [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => readStored());

  const update = useCallback(
    (next: boolean) => {
      if (next === enabled) return;
      writeStored(next);
      setEnabled(next);
    },
    [enabled],
  );

  return [enabled, update] as const;
}
