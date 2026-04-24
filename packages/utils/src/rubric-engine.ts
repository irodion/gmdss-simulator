import type { Turn } from "./scenario-types.ts";
import type {
  ChannelRules,
  FieldRule,
  ProwordRule,
  RubricDefinition,
  ScoreBreakdown,
  ScoringDimension,
  ScoringDimensionId,
  SequenceRules,
} from "./rubric-types.ts";

const WEIGHTS = {
  required_fields: 0.35,
  prowords: 0.25,
  sequence: 0.25,
  channel: 0.15,
} as const;

function emptyDimension(id: ScoringDimensionId, label: string): ScoringDimension {
  return {
    id,
    label,
    weight: WEIGHTS[id],
    score: 100,
    maxScore: 100,
    matchedItems: [],
    missingItems: [],
  };
}

function scoreRequiredFields(transcript: string, rules: readonly FieldRule[]): ScoringDimension {
  const required = rules.filter((r) => r.required);
  if (required.length === 0) {
    return emptyDimension("required_fields", "Required Fields");
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const rule of required) {
    // nosemgrep: detect-non-literal-regexp — patterns from trusted rubric JSON, not user input
    const found = rule.patterns.some((p) => new RegExp(p, "i").test(transcript));
    if (found) {
      matched.push(rule.label);
    } else {
      missing.push(rule.label);
    }
  }

  const score = Math.round((matched.length / required.length) * 100);

  return {
    id: "required_fields",
    label: "Required Fields",
    weight: WEIGHTS.required_fields,
    score,
    maxScore: 100,
    matchedItems: matched,
    missingItems: missing,
  };
}

// ── Prowords ──

function scoreProwords(transcript: string, rules: readonly ProwordRule[]): ScoringDimension {
  if (rules.length === 0) {
    return emptyDimension("prowords", "Prowords");
  }

  const matched: string[] = [];
  const missing: string[] = [];
  let totalPoints = 0;
  let earnedPoints = 0;

  for (const rule of rules) {
    totalPoints += 1;
    // nosemgrep: detect-non-literal-regexp
    const re = new RegExp(rule.pattern, "gi");
    const matches = transcript.match(re);
    const count = matches ? matches.length : 0;

    if (rule.expectedCount != null) {
      // Partial credit: got 2 of 3 expected = 0.67
      const ratio = Math.min(count / rule.expectedCount, 1);
      earnedPoints += ratio;
      if (ratio >= 1) {
        matched.push(rule.label);
      } else if (count > 0) {
        matched.push(`${rule.label} (${count}/${rule.expectedCount})`);
      } else {
        missing.push(rule.label);
      }
    } else {
      if (count > 0) {
        earnedPoints += 1;
        matched.push(rule.label);
      } else {
        missing.push(rule.label);
      }
    }
  }

  const score = Math.round((earnedPoints / totalPoints) * 100);

  return {
    id: "prowords",
    label: "Prowords",
    weight: WEIGHTS.prowords,
    score,
    maxScore: 100,
    matchedItems: matched,
    missingItems: missing,
  };
}

// ── Sequence ──

/**
 * Length of the longest increasing subsequence.
 * Used to measure how many fields appear in the correct relative order.
 */
function longestIncreasingSubsequenceLength(arr: number[]): number {
  if (arr.length === 0) return 0;
  // Patience sorting approach: O(n log n)
  const tails: number[] = [];
  for (const val of arr) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (tails[mid]! < val) lo = mid + 1;
      else hi = mid;
    }
    tails[lo] = val;
  }
  return tails.length;
}

function scoreSequence(
  transcript: string,
  rules: SequenceRules,
  fieldRules: readonly FieldRule[],
  prowordRules: readonly ProwordRule[],
): ScoringDimension {
  const order = rules.fieldOrder;
  if (order.length === 0) {
    return emptyDimension("sequence", "Sequence");
  }

  // Look up patterns from either requiredFields or prowordRules
  function getPatternsForId(id: string): string[] {
    const field = fieldRules.find((r) => r.id === id);
    if (field) return [...field.patterns];
    const proword = prowordRules.find((r) => r.id === id);
    if (proword) return [proword.pattern];
    return [];
  }

  const mappedOrder = order.filter((id) => getPatternsForId(id).length > 0);

  const positions: { fieldId: string; pos: number; orderIdx: number }[] = [];
  for (let orderIdx = 0; orderIdx < mappedOrder.length; orderIdx++) {
    const fieldId = mappedOrder[orderIdx]!;
    const patterns = getPatternsForId(fieldId);

    let earliestPos = -1;
    for (const p of patterns) {
      // nosemgrep: detect-non-literal-regexp
      const m = new RegExp(p, "i").exec(transcript);
      if (m && (earliestPos === -1 || m.index < earliestPos)) {
        earliestPos = m.index;
      }
    }
    if (earliestPos >= 0) {
      positions.push({ fieldId, pos: earliestPos, orderIdx });
    }
  }

  if (positions.length === 0) {
    return {
      id: "sequence",
      label: "Sequence",
      weight: WEIGHTS.sequence,
      score: 0,
      maxScore: 100,
      matchedItems: [],
      missingItems: mappedOrder.map((id) => {
        const field = fieldRules.find((r) => r.id === id);
        if (field) return field.label;
        const proword = prowordRules.find((r) => r.id === id);
        return proword ? proword.label : id;
      }),
    };
  }

  // Sort by position in transcript, then check order indices
  positions.sort((a, b) => a.pos - b.pos);
  const orderIndices = positions.map((p) => p.orderIdx);
  const lisLen = longestIncreasingSubsequenceLength(orderIndices);

  const matched = positions.map((p) => {
    const rule = fieldRules.find((r) => r.id === p.fieldId);
    return rule ? rule.label : p.fieldId;
  });

  const score = mappedOrder.length > 0 ? Math.round((lisLen / mappedOrder.length) * 100) : 100;

  return {
    id: "sequence",
    label: "Sequence",
    weight: WEIGHTS.sequence,
    score,
    maxScore: 100,
    matchedItems: matched,
    missingItems: [],
  };
}

// ── Channel ──

function scoreChannel(
  studentTurns: readonly Turn[],
  rules: ChannelRules,
  scenarioChannel: number,
  allowedChannels?: readonly number[],
): ScoringDimension {
  if (studentTurns.length === 0) {
    return {
      id: "channel",
      label: "Channel",
      weight: WEIGHTS.channel,
      score: 0,
      maxScore: 100,
      matchedItems: [],
      missingItems: ["No transmissions"],
    };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  let correctCount = 0;
  const isFirstStudentTurn = (turn: Turn) => turn.index === studentTurns[0]?.index;

  for (const turn of studentTurns) {
    if (rules.blockChannel70Voice && turn.channel === 70) {
      missing.push(`Turn ${turn.index}: voice on Ch.70 (DSC only)`);
      continue;
    }

    // First turn must be on the required (hailing) channel
    const validChannels = isFirstStudentTurn(turn)
      ? [scenarioChannel]
      : (allowedChannels ?? [scenarioChannel]);

    if (validChannels.includes(turn.channel)) {
      correctCount++;
      matched.push(`Turn ${turn.index}: Ch.${turn.channel}`);
    } else {
      missing.push(
        `Turn ${turn.index}: Ch.${turn.channel} (expected Ch.${validChannels.join("/")})`,
      );
    }
  }

  const score = Math.round((correctCount / studentTurns.length) * 100);

  return {
    id: "channel",
    label: "Channel",
    weight: WEIGHTS.channel,
    score,
    maxScore: 100,
    matchedItems: matched,
    missingItems: missing,
  };
}

// ── Template Resolution ──

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function callsignToSpacedRegex(value: string): string {
  return value.split("").map(escapeRegExp).join("\\s*");
}

/**
 * Replace `{{key}}` placeholders in rubric patterns with regex-safe values.
 * For `callsign` keys, inserts `\s*` between characters to tolerate STT spacing.
 */
export function resolveRubricTemplates(
  rubric: RubricDefinition,
  variables: Record<string, string>,
): RubricDefinition {
  const templateRe = /\{\{(\w+)\}\}/g;

  function resolvePattern(pattern: string): string {
    return pattern.replace(templateRe, (_, key: string) => {
      const value = variables[key];
      // Fail closed: an empty/missing value becomes a never-matching fragment
      // instead of "", which would make the surrounding regex match anything.
      if (value == null || value === "") return "(?!)";
      if (key === "callsign") return callsignToSpacedRegex(value);
      return escapeRegExp(value);
    });
  }

  return {
    ...rubric,
    requiredFields: rubric.requiredFields.map((field) => ({
      ...field,
      patterns: field.patterns.map(resolvePattern),
    })),
    prowordRules: rubric.prowordRules.map((rule) => ({
      ...rule,
      pattern: resolvePattern(rule.pattern),
    })),
  };
}

// ── Public API ──

/**
 * Score a transcript against a rubric definition.
 * Deterministic: same turns + same rubric = same score.
 */
export function scoreTranscript(
  turns: readonly Turn[],
  rubric: RubricDefinition,
  scenarioChannel: number,
  allowedChannels?: readonly number[],
): ScoreBreakdown {
  const studentTurns = turns.filter((t) => t.speaker === "student");
  const transcript = studentTurns.map((t) => t.text).join(" ");

  const dimensions: ScoringDimension[] = [
    scoreRequiredFields(transcript, rubric.requiredFields),
    scoreProwords(transcript, rubric.prowordRules),
    scoreSequence(transcript, rubric.sequenceRules, rubric.requiredFields, rubric.prowordRules),
    scoreChannel(studentTurns, rubric.channelRules, scenarioChannel, allowedChannels),
  ];

  const overall = Math.round(dimensions.reduce((sum, d) => sum + d.score * d.weight, 0));

  return {
    overall,
    dimensions,
    rubricVersion: rubric.version,
    timestamp: Date.now(),
  };
}
