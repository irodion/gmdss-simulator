import { useCallback, useState } from "react";
import { readBoolPref, writeBoolPref } from "./local-pref.ts";

const STORAGE_KEY = "gmdss-offline:procedures:tts-enabled";

export function useTtsEnabled(): readonly [boolean, (next: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => readBoolPref(STORAGE_KEY, false));

  const update = useCallback(
    (next: boolean) => {
      if (next === enabled) return;
      writeBoolPref(STORAGE_KEY, next);
      setEnabled(next);
    },
    [enabled],
  );

  return [enabled, update] as const;
}
