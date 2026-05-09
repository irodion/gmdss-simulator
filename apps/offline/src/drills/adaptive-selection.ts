/**
 * Adaptive practice queue: turn the unified event log into challenge picks.
 *
 * Pipeline (per call):
 *   1. Derive Leitner box per atom from the event log.
 *   2. Bucket atoms: weak (boxes 1–2), review (3–4), fresh (0 + 5).
 *   3. Allocate quotas 60/30/10 (with redistribution when a bucket is empty).
 *   4. Weighted-sample within each bucket (lower box → higher weight).
 *   5. Apply spacing rule: an atom appears at most twice, and the second
 *      occurrence is only allowed if it sits in box 1.
 *   6. Materialize per-mode (weighted callsigns / forced abbreviation / etc.).
 *
 * Procedures are special: a session is a single scenario, not a count of
 * challenges. selectAdaptiveChallenges returns [] for procedures and a
 * separate pickAdaptiveScenario lives in scripts/adaptive-scenarios.ts.
 */

import { ABBREVIATIONS, type AbbreviationEntry } from "./abbreviations.ts";
import { buildChallengeWithDirection } from "./abbreviation-mode.ts";
import { atomUniverse } from "./atom-universe.ts";
import {
  CALLSIGN_CHARS,
  createPhoneticChallenge,
  generateNumberChallenges,
  randomInt,
  type DrillChallenge,
  type DrillType,
  type NumberFormat,
} from "./drill-types.ts";
import { boxFor, deriveAllBoxes, type Box } from "./leitner.ts";
import {
  listenAtomId,
  parseAbbreviationAtomId,
  parseNumberAtomId,
  phoneticAtomId,
  type LearningEvent,
} from "./learning-events.ts";
import { spokenForm } from "./reverse-mode.ts";

// ---------- Bucket allocation ----------

interface BucketCounts {
  readonly weak: number;
  readonly review: number;
  readonly fresh: number;
}

interface BucketedAtoms {
  readonly weak: readonly { atomId: string; box: Box }[];
  readonly review: readonly { atomId: string; box: Box }[];
  readonly fresh: readonly { atomId: string; box: Box }[];
}

function bucketAtoms(universe: readonly string[], boxes: ReadonlyMap<string, Box>): BucketedAtoms {
  const weak: { atomId: string; box: Box }[] = [];
  const review: { atomId: string; box: Box }[] = [];
  const fresh: { atomId: string; box: Box }[] = [];
  for (const atomId of universe) {
    const box = boxFor(boxes, atomId);
    if (box === 1 || box === 2) weak.push({ atomId, box });
    else if (box === 3 || box === 4) review.push({ atomId, box });
    else fresh.push({ atomId, box });
  }
  return { weak, review, fresh };
}

/**
 * Quota allocation with fallback. Targets 60/30/10. When a bucket is empty
 * we redistribute to the next priority in the order weak → review → fresh
 * → weak (loop), so weak items get any spillover first.
 *
 * @internal exported only for direct unit-testing of the bucket math.
 */
export function allocateQuotas(buckets: BucketedAtoms, count: number): BucketCounts {
  const sizes = {
    weak: buckets.weak.length,
    review: buckets.review.length,
    fresh: buckets.fresh.length,
  };

  if (count <= 0) return { weak: 0, review: 0, fresh: 0 };

  let weakTarget = Math.round(count * 0.6);
  let reviewTarget = Math.round(count * 0.3);
  let freshTarget = count - weakTarget - reviewTarget;
  if (freshTarget < 0) {
    // Rounding collision (rare). Steal from review first.
    reviewTarget += freshTarget;
    freshTarget = 0;
  }

  const allocated = { weak: 0, review: 0, fresh: 0 };
  let remaining = count;

  const desired = { weak: weakTarget, review: reviewTarget, fresh: freshTarget };
  for (const key of ["weak", "review", "fresh"] as const) {
    const take = Math.min(desired[key], sizes[key]);
    allocated[key] = take;
    remaining -= take;
  }

  if (remaining > 0) {
    const order: (keyof BucketCounts)[] = ["weak", "review", "fresh"];
    let progressed = true;
    while (remaining > 0 && progressed) {
      progressed = false;
      for (const key of order) {
        if (remaining <= 0) break;
        const headroom = sizes[key] - allocated[key];
        if (headroom > 0) {
          allocated[key] += 1;
          remaining -= 1;
          progressed = true;
        }
      }
    }
  }

  return allocated;
}

// ---------- Weighted sampling ----------

function weightForBox(box: Box): number {
  // Lower box → higher weight. Box 0 (new) sits in fresh and uses weight 4
  // (higher than box 5's weight 1) so cold-start bias toward exposing new
  // atoms before re-drilling already-mastered ones.
  if (box === 0) return 4;
  return Math.max(1, 6 - box);
}

/**
 * Letter-level weights for the weighted-callsign synthesizer. More sharply
 * differentiated than `weightForBox` because per-character sampling needs a
 * stronger bias to make seeded weak letters dominate the generated text
 * even when the universe is large (36 letters/digits). Used only for the
 * phonetic and listen modes.
 */
function letterWeightForBox(box: Box): number {
  switch (box) {
    case 0:
      return 2;
    case 1:
      return 12;
    case 2:
      return 6;
    case 3:
      return 3;
    case 4:
      return 2;
    case 5:
      return 1;
  }
}

/**
 * Pick one atom from the full universe with box-weighted probability.
 * Used to top up the picks list when count exceeds what without-replacement
 * sampling can produce — most relevant for Numbers (4-atom universe) where
 * a 10-question session would otherwise silently end after 4 challenges.
 */
function pickWeightedFromUniverse(
  universe: readonly string[],
  boxes: ReadonlyMap<string, Box>,
): string | null {
  if (universe.length === 0) return null;
  let total = 0;
  for (const atomId of universe) total += weightForBox(boxFor(boxes, atomId));
  let dart = Math.random() * total;
  for (const atomId of universe) {
    dart -= weightForBox(boxFor(boxes, atomId));
    if (dart <= 0) return atomId;
  }
  return universe[universe.length - 1] ?? null;
}

function sampleWeighted(
  candidates: readonly { atomId: string; box: Box }[],
  count: number,
): string[] {
  if (count <= 0 || candidates.length === 0) return [];
  const pool = candidates.map((c) => ({ ...c, weight: weightForBox(c.box) }));
  const out: string[] = [];
  const target = Math.min(count, pool.length);
  for (let i = 0; i < target; i++) {
    const totalWeight = pool.reduce((sum, c) => sum + c.weight, 0);
    let dart = Math.random() * totalWeight;
    let pickIndex = 0;
    for (let j = 0; j < pool.length; j++) {
      dart -= pool[j]!.weight;
      if (dart <= 0) {
        pickIndex = j;
        break;
      }
    }
    out.push(pool[pickIndex]!.atomId);
    pool.splice(pickIndex, 1);
  }
  return out;
}

// ---------- Public preview ----------

export interface QueuePreviewCounts {
  readonly weak: number;
  readonly review: number;
  readonly fresh: number;
}

export function previewQueue(
  mode: DrillType,
  count: number,
  events: readonly LearningEvent[],
): QueuePreviewCounts {
  const universe = atomUniverse(mode);
  if (universe.length === 0) return { weak: 0, review: 0, fresh: 0 };
  const boxes = deriveAllBoxes(events);
  const buckets = bucketAtoms(universe, boxes);
  return allocateQuotas(buckets, count);
}

// ---------- Public selection ----------

export function selectAdaptiveChallenges(
  mode: DrillType,
  count: number,
  events: readonly LearningEvent[],
): DrillChallenge[] {
  const universe = atomUniverse(mode);
  if (universe.length === 0) return [];

  const boxes = deriveAllBoxes(events);
  const buckets = bucketAtoms(universe, boxes);
  const quotas = allocateQuotas(buckets, count);

  const picksWithBox: { atomId: string; box: Box }[] = [];
  for (const bucket of [
    { atoms: buckets.weak, take: quotas.weak },
    { atoms: buckets.review, take: quotas.review },
    { atoms: buckets.fresh, take: quotas.fresh },
  ] as const) {
    for (const ev of sampleWeighted(bucket.atoms, bucket.take)) {
      picksWithBox.push({ atomId: ev, box: boxFor(boxes, ev) });
    }
  }

  // Spacing rule: at most 2 occurrences of any atom, second only if box 1.
  // The current algorithm samples without replacement within bucket, so the
  // only way to get a duplicate is across buckets — which can't happen given
  // an atom belongs to exactly one bucket. The rule is enforced here for
  // future-proofing (e.g. if we later sample with replacement to honor a
  // larger count than the universe).
  const counts = new Map<string, number>();
  const filtered: typeof picksWithBox = [];
  for (const pick of picksWithBox) {
    const seen = counts.get(pick.atomId) ?? 0;
    if (seen >= 2) continue;
    if (seen >= 1 && pick.box !== 1) continue;
    counts.set(pick.atomId, seen + 1);
    filtered.push(pick);
  }

  const atomIds = filtered.map((p) => p.atomId);

  // Fill pass: when the universe is smaller than `count` (e.g. Numbers has
  // only 4 atoms), without-replacement sampling can't honor the requested
  // session length. Top up with box-weighted picks from the full universe
  // so a 10-question Numbers session yields 10 challenges, biased toward
  // weak formats but with repeats allowed.
  while (atomIds.length < count) {
    const filler = pickWeightedFromUniverse(universe, boxes);
    if (!filler) break;
    atomIds.push(filler);
  }

  return materialize(mode, atomIds, boxes);
}

// ---------- Per-mode materializers ----------

function materialize(
  mode: DrillType,
  atomIds: readonly string[],
  boxes: ReadonlyMap<string, Box>,
): DrillChallenge[] {
  switch (mode) {
    case "phonetic":
      return materializePhonetic(atomIds, boxes);
    case "reverse":
      return materializeListen(atomIds, boxes);
    case "number-pronunciation":
      return materializeNumbers(atomIds);
    case "abbreviation":
      return materializeAbbreviations(atomIds);
  }
}

/**
 * Build a 4–6 char callsign whose letter distribution favors the given
 * weight map. Skips vessel names entirely — the fixed adjective×noun pool
 * can't be biased by single-letter weights without producing nonsense.
 */
function weightedCallsign(weights: ReadonlyMap<string, number>): string {
  const len = 4 + randomInt(3);
  const pool: string[] = [];
  for (const ch of CALLSIGN_CHARS) {
    const reps = Math.max(1, weights.get(ch) ?? 1);
    for (let i = 0; i < reps; i++) pool.push(ch);
  }
  let result = "";
  for (let i = 0; i < len; i++) {
    result += pool[randomInt(pool.length)]!;
  }
  return result;
}

/**
 * Build per-letter weights from box state. Lower box → higher weight, so
 * weak letters dominate the synthesized callsigns regardless of how many
 * times they were sampled into the picks list. The picks list dictates how
 * many callsigns to generate; the box-derived weight map dictates which
 * letters fill them.
 */
function letterWeightsFromBoxes(
  atomIdFor: (letter: string) => string,
  boxes: ReadonlyMap<string, Box>,
): Map<string, number> {
  const weights = new Map<string, number>();
  for (const ch of CALLSIGN_CHARS) {
    const box = boxes.get(atomIdFor(ch)) ?? 0;
    weights.set(ch, letterWeightForBox(box));
  }
  return weights;
}

/** Generate `count` unique callsigns using the given letter-weight distribution. */
function generateUniqueCallsigns(weights: ReadonlyMap<string, number>, count: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let text = "";
    for (let attempt = 0; attempt < 30; attempt++) {
      text = weightedCallsign(weights);
      if (!seen.has(text)) break;
    }
    seen.add(text);
    out.push(text);
  }
  return out;
}

function materializePhonetic(
  atomIds: readonly string[],
  boxes: ReadonlyMap<string, Box>,
): DrillChallenge[] {
  if (atomIds.length === 0) return [];
  const weights = letterWeightsFromBoxes(phoneticAtomId, boxes);
  return generateUniqueCallsigns(weights, atomIds.length).map((text, i) =>
    createPhoneticChallenge(text, `phonetic-${i}`),
  );
}

function materializeListen(
  atomIds: readonly string[],
  boxes: ReadonlyMap<string, Box>,
): DrillChallenge[] {
  if (atomIds.length === 0) return [];
  const weights = letterWeightsFromBoxes(listenAtomId, boxes);
  return generateUniqueCallsigns(weights, atomIds.length).map((text, i) => {
    const spoken = spokenForm(text);
    return {
      id: `reverse-${i}`,
      type: "reverse",
      prompt: "Listen and type the letters/digits you hear.",
      expectedAnswer: text,
      hint: spoken,
      spoken,
    };
  });
}

function materializeNumbers(atomIds: readonly string[]): DrillChallenge[] {
  const formats: NumberFormat[] = [];
  for (const id of atomIds) {
    const format = parseNumberAtomId(id);
    if (format) formats.push(format);
  }
  return generateNumberChallenges(formats.length, formats);
}

const ABBREVIATION_LOOKUP: ReadonlyMap<string, AbbreviationEntry> = new Map(
  ABBREVIATIONS.map((entry) => [entry.abbr, entry]),
);

function materializeAbbreviations(atomIds: readonly string[]): DrillChallenge[] {
  const challenges: DrillChallenge[] = [];
  for (let i = 0; i < atomIds.length; i++) {
    const parsed = parseAbbreviationAtomId(atomIds[i]!);
    if (!parsed) continue;
    const entry = ABBREVIATION_LOOKUP.get(parsed.abbr);
    if (!entry) continue;
    challenges.push(buildChallengeWithDirection(entry, parsed.direction, i));
  }
  return challenges;
}
