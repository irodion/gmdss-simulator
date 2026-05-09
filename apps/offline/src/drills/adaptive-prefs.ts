/**
 * Persisted preference for the Adaptive ↔ Free Practice toggle.
 * Default true (adaptive on). Backed by the shared boolean-pref adapter.
 */

import { readBoolPref, writeBoolPref } from "../lib/local-pref.ts";

const KEY = "roc-trainer:adaptive-enabled";

export function readAdaptivePreference(): boolean {
  return readBoolPref(KEY, true);
}

export function writeAdaptivePreference(enabled: boolean): void {
  writeBoolPref(KEY, enabled);
}
