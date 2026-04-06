# GMDSS VHF Radio Simulator — Design Document

> **Version:** 0.3 draft (post-review)
> **Date:** 2026-04-05
> **Status:** Pre-PRD design exploration
> **License:** AGPLv3

---

## Table of Contents

1. [Vision and Problem Statement](#1-vision-and-problem-statement)
2. [Target Users and Context](#2-target-users-and-context)
3. [Product Concept](#3-product-concept)
4. [Application Architecture](#4-application-architecture)
5. [Learning Pathway and Lesson Design](#5-learning-pathway-and-lesson-design)
6. [VHF Radio Simulator — Core Feature](#6-vhf-radio-simulator--core-feature)
7. [AI Communication Engine](#7-ai-communication-engine)
8. [Practice Scenarios Catalog](#8-practice-scenarios-catalog)
9. [User Accounts and Progress System](#9-user-accounts-and-progress-system)
10. [Design Language and UX](#10-design-language-and-ux)
11. [Technical Stack and Infrastructure](#11-technical-stack-and-infrastructure)
12. [Internationalization Strategy](#12-internationalization-strategy)
13. [Licensing, Privacy, and Compliance](#13-licensing-privacy-and-compliance)
14. [Risks and Open Questions](#14-risks-and-open-questions)
15. [Appendix A: Scenario Scripts](#appendix-a-scenario-scripts)
16. [Appendix B: Asset Catalog Summary](#appendix-b-asset-catalog-summary)

---

## 1. Vision and Problem Statement

### The Problem

Students pursuing the **Restricted Operator Certificate (ROC)** for GMDSS face a critical gap between theory and practice. Classroom instruction covers radio regulations, channel usage, and distress procedures — but actual radio practice is limited to expensive hardware simulators available only during scheduled lab sessions. Students cannot practice at home, on their phones, or on board vessels during downtime.

The consequence: students memorize procedures but struggle with the **real-time pressure** of spoken radio communication — correct phraseology, proper sequence, confident delivery under time constraints.

### The Vision

**GMDSS Simulator** is an open-source Progressive Web App that takes ROC students from foundational theory through to realistic, AI-powered VHF radio practice — anywhere, on any device, at any time.

The application serves as a **digital companion within a maritime school's curriculum**, not a standalone course replacement. It augments instructor-led training by providing:

- Structured theory modules that students complete at their own pace
- Interactive drills that build procedural fluency before touching a radio
- A **half-duplex VHF radio simulator** where an AI engine plays the role of coast stations, port control, other vessels, and SAR coordination — responding to the student's spoken transmissions with evaluated, protocol-correct replies

### Core Principles

| Principle | Meaning |
|---|---|
| **Radio-first** | The simulator is the star. Theory exists to prepare students for the simulator. |
| **Internationally portable** | Not tied to one country's channel plan or exam system. Jurisdiction profiles make it adaptable. |
| **School-integrated** | Designed as a service within a training institution — user accounts, progress tracking, instructor dashboards. |
| **Offline-capable, online-enhanced** | Theory and drills work offline. The radio simulator requires connectivity for AI voice interaction. No offline simulator in Phase 1. |
| **Open source** | AGPLv3 license. Schools and contributors can inspect, modify, and self-host. |

---

## 2. Target Users and Context

### Primary User: ROC Student

- Enrolled in a maritime training institution's ROC course
- Needs to pass both written theory exam and practical radio assessment
- May be a career mariner, recreational boater, or yacht crew
- English proficiency varies (maritime English is the working standard, but many students are non-native speakers)
- Uses a smartphone, tablet, or laptop — often with limited connectivity at sea

### Secondary User: Instructor

- Assigns modules and monitors student progress
- May customize scenario parameters (vessel names, positions, distress types)
- Uses the app's progress dashboard to identify students needing extra practice before practical exams

### Usage Context

- **In classroom**: Instructor projects scenarios; students follow along or practice individually
- **At home/dormitory**: Students work through theory modules and attempt drills
- **On board vessels**: Students practice during downtime (offline theory; online simulator when connectivity allows)
- **Before exams**: Intensive simulator practice with increasing difficulty

### ROC Scope (What We Cover)

The ROC covers Sea Areas A1 and A2 — primarily VHF and MF/DSC. Our application focuses on:

| Topic | Depth |
|---|---|
| VHF radio operation | Full — channel selection, controls, procedures |
| VHF DSC (Digital Selective Calling) | Full — alerts, categories, MMSI, Ch.70 |
| Distress/Urgency/Safety voice procedures | Full — MAYDAY, PAN PAN, SECURITE |
| MMSI structure and usage | Full — decoding, validation, types |
| SAR equipment theory | Conceptual — EPIRB, SART, radar reflectors, GPS, PLBs |
| SAR procedures and coordination | Conceptual — on-scene communications, search patterns |
| Radio Regulations basics | Covered — priority, watchkeeping, log keeping, false alerts |
| MF DSC | Awareness only (not simulated) |
| HF/Inmarsat/NBDP | Out of scope (GOC territory) |

---

## 3. Product Concept

### The Learning Flywheel

```
    ┌──────────────┐
    │   THEORY     │  Read, watch, understand
    │   Modules    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   DRILLS     │  Interactive exercises, quizzes
    │   & Quizzes  │  build procedural memory
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │  SIMULATOR   │  Speak into the radio, AI responds
    │  Practice    │  half-duplex, scored, with feedback
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │   REVIEW     │  After-action transcript, rubric,
    │   & Repeat   │  targeted drills for weak areas
    └──────┘───────┘
           │
           └──────────► back to THEORY or DRILLS for gaps
```

Progression is **gated but not delayed**. The document's "radio-first" principle means students should hear and speak on the simulated radio as early as possible. To balance this with the need for foundational knowledge:

- **After Module 1** (VHF Fundamentals): Students unlock **Guided Voice Drills** — short, heavily scaffolded exercises where the student reads a script aloud on the radio panel, hears their radio-processed voice, and gets basic feedback. No AI conversation yet — just phonetic alphabet practice, short calls, and channel-change sequences. This reduces mic anxiety early.
- **After Module 2** (MMSI & DSC): Students unlock **Simulator Tier 1** — simple, single-exchange AI scenarios (radio check, channel change, position report).
- **After Module 3** (Procedures): Students unlock **Simulator Tiers 2–3** — distress/urgency/safety scenarios with branching.
- **After Module 4** (SAR Equipment): Students unlock **Simulator Tier 4** — exam-mode scenarios.

This means students touch the radio panel by the end of their first week, not after completing all theory.

### Feature Summary

| Feature | Offline | Online | MVP |
|---|---|---|---|
| Theory modules (text, images, diagrams) | ✓ | ✓ | ✓ |
| Channel explorer with jurisdiction profiles | ✓ | ✓ | ✓ |
| MMSI decoder and DSC builder | ✓ | ✓ | ✓ |
| Script builder (MAYDAY/PAN PAN/SECURITE) | ✓ | ✓ | ✓ |
| Quizzes and drills | ✓ | ✓ | ✓ |
| VHF Radio simulator (AI half-duplex) | — | ✓ | ✓ |
| After-action review with transcript | — | ✓ | ✓ |
| SAR equipment theory modules | ✓ | ✓ | ✓ |
| Progress tracking and dashboard | ✓ (local) | ✓ (synced) | ✓ |
| Instructor dashboard | — | ✓ | v2 |
| Exam practice mode (timed) | ✓ | ✓ | v2 |
| Multilingual UI | — | — | v2 |

---

## 4. Application Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (PWA)                          │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Theory  │  │ Drills & │  │   VHF Radio Simulator  │ │
│  │ Modules │  │ Quizzes  │  │                        │ │
│  │         │  │          │  │  ┌──────┐  ┌────────┐  │ │
│  │ (offline│  │ (offline)│  │  │Radio │  │Web     │  │ │
│  │  ready) │  │          │  │  │Panel │  │Audio   │  │ │
│  │         │  │          │  │  │(SVG) │  │API     │  │ │
│  └─────────┘  └──────────┘  │  └──────┘  └───┬────┘  │ │
│                             │                │       │ │
│  ┌──────────────────────┐   │  PTT ──► mic ──┘       │ │
│  │ Service Worker        │   │                        │ │
│  │ (Workbox)            │   └───────────┬────────────┘ │
│  │ - app shell cache    │               │              │
│  │ - lesson data cache  │               │ WebSocket    │
│  │ - media cache        │               │              │
│  └──────────────────────┘               │              │
│                                         │              │
│  ┌──────────────────────┐               │              │
│  │ IndexedDB            │               │              │
│  │ - user progress      │               │              │
│  │ - offline lessons    │               │              │
│  │ - attempt history    │               │              │
│  └──────────────────────┘               │              │
└─────────────────────────────────────────┼──────────────┘
                                          │
                              HTTPS / WSS │
                                          │
┌─────────────────────────────────────────┼──────────────┐
│                    SERVER                               │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Service │  │ Sim Engine   │  │ Progress     │  │
│  │ (login/2FA)  │  │              │  │ Sync API     │  │
│  │              │  │ STT ──►      │  │              │  │
│  └──────────────┘  │ Evaluate ──► │  └──────────────┘  │
│                    │ LLM ──►      │                    │
│  ┌──────────────┐  │ TTS ──►      │  ┌──────────────┐  │
│  │ Content API  │  │ Audio out    │  │ PostgreSQL   │  │
│  │ (lessons,    │  └──────────────┘  │ (users,      │  │
│  │  scenarios)  │                    │  progress,   │  │
│  └──────────────┘                    │  attempts)   │  │
│                                      └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Offline Strategy

| Resource | Cache Strategy | Update |
|---|---|---|
| App shell (HTML/CSS/JS) | Precache (Workbox) | On deploy, SW update |
| Theory lesson content | Cache-first, versioned | Background sync |
| Audio SFX (static, squelch) | Precache | Rarely changes |
| Quiz question banks | Cache-first, versioned | Background sync |
| Scenario definitions | Network-first | Needs freshness |
| User progress | IndexedDB + sync | Bidirectional sync when online |

---

## 5. Learning Pathway and Lesson Design

The curriculum is organized into **5 modules**, gated sequentially. Each module contains **lessons**, each lesson contains **theory pages**, **interactive exercises**, and a **checkpoint quiz**. Passing the checkpoint (≥70%) unlocks the next module.

### Module 1: VHF Radio Fundamentals

**Goal:** Student understands VHF radio controls, channel system, and basic operating discipline.

| Lesson | Content | Exercise Type |
|---|---|---|
| 1.1 What is VHF Maritime Radio? | Radio wave basics, range, line-of-sight, antenna height effect | Diagram labeling |
| 1.2 The VHF Radio Panel | Controls: power, volume, squelch, channel selector, dual watch, Hi/Lo power, PTT | Interactive radio panel (click each control to learn) |
| 1.3 VHF Channel System | Channel categories: distress/calling (Ch.16), DSC (Ch.70), port operations, ship-to-ship, bridge-to-bridge, SAR | Channel Explorer tool with jurisdiction filter |
| 1.4 Basic Call Procedure | How to make a call: call on Ch.16, identify, request channel shift, move to working channel | Sequencing drill — reorder the steps |
| 1.5 Radio Discipline | Brevity, clarity, listening before transmitting, phonetic alphabet, prowords (OVER, OUT, ROGER, etc.) | Phonetic alphabet quiz, proword matching |
| 1.6 Watchkeeping Obligations | Ch.16 watch, DSC watch on Ch.70, when to monitor, log keeping | Multiple choice quiz |

**Checkpoint quiz:** 20 questions, ≥70% to proceed.

### Module 2: MMSI and Digital Selective Calling

**Goal:** Student can decode MMSIs, understand DSC categories, and construct DSC calls.

| Lesson | Content | Exercise Type |
|---|---|---|
| 2.1 What is an MMSI? | 9-digit structure, MID codes, ship/coast/group/SAR aircraft formats | MMSI Decoder interactive tool |
| 2.2 DSC Overview | What DSC does, Ch.70, how DSC relates to voice, alert categories | Concept matching |
| 2.3 DSC Distress Alert | Structure: nature of distress codes, position, time, subsequent comms channel | DSC Builder — fill fields, preview alert |
| 2.4 DSC Urgency, Safety, Routine | Non-distress DSC: when to use each, working channel designation | Scenario classification drill |
| 2.5 False Alerts and Cancellation | How false alerts happen, cancellation procedure, consequences | Case study quiz |
| 2.6 DSC → Voice Workflow | After DSC alert: switch to Ch.16 (distress) or designated channel, begin voice procedure | Sequencing drill |

**Checkpoint quiz:** 20 questions, ≥70% to proceed.

### Module 3: Distress, Urgency, Safety, and Medical Procedures

**Goal:** Student can produce correct voice messages for all priority categories and understands the DSC→voice flow.

| Lesson | Content | Exercise Type |
|---|---|---|
| 3.1 Communication Priority | Distress > Urgency > Safety > Routine; silence procedures (SEELONCE MAYDAY, PRUDONCE, SEELONCE FEENEE) | Priority ordering drill |
| 3.2 MAYDAY — Distress Call | Full MAYDAY structure: MAYDAY×3, THIS IS, vessel ID, MMSI, position, nature, assistance, persons, additional info | **Script Builder** — fill fields → generate script → practice reading aloud |
| 3.3 MAYDAY RELAY | When and how to relay a distress call for another vessel | Scenario decision tree |
| 3.4 PAN PAN — Urgency | Structure, when to use (medical, mechanical failure, overdue vessel), examples | Script Builder variant |
| 3.5 SECURITE — Safety | Navigational warnings, meteorological warnings, structure | Script Builder variant |
| 3.6 Medical Communications | MEDICO concept, requesting medical advice by radio, information to prepare (patient details, symptoms, vitals) | Checklist builder exercise |
| 3.7 Responding to Distress | Acknowledging MAYDAY, offering assistance, on-scene coordination basics | Response construction drill |

**Checkpoint quiz:** 25 questions, ≥70% to proceed.

### Module 4: SAR Equipment and Procedures

**Goal:** Student understands the purpose, operation, and limitations of SAR equipment carried on GMDSS vessels.

| Lesson | Content | Exercise Type |
|---|---|---|
| 4.1 EPIRB (Emergency Position Indicating Radio Beacon) | 406 MHz satellite alerting, registration, manual vs automatic activation, battery life, testing, COSPAS-SARSAT system | Diagram labeling, quiz |
| 4.2 SART (Search and Rescue Transponder) | 9 GHz radar transponder, how it appears on radar (12 dots), range, battery life, testing | Radar display recognition exercise |
| 4.3 Radar Reflectors | Passive vs active, mounting, limitations | Concept quiz |
| 4.4 GPS and Position Reporting | GPS basics for mariners, how position feeds into DSC alerts and EPIRB, lat/long format, accuracy | Position entry drill (convert formats) |
| 4.5 Personal Locator Beacons (PLBs) | Difference from EPIRB, registration, when to use | Comparison table exercise |
| 4.6 SAR Coordination Overview | MRCC, on-scene commander, communication flow during SAR, search patterns (awareness level) | Flowchart completion |
| 4.7 Pyrotechnics and Visual Signals | Flare types, SOLAS requirements (awareness), when to use | Recognition quiz |

**Checkpoint quiz:** 20 questions, ≥70% to proceed.

### Guided Voice Drills (Unlocked after Module 1)

**Goal:** Build mic confidence and radio muscle memory before AI interaction.

These are **not AI-driven conversations**. The student uses the radio panel to:

| Drill | What Happens |
|---|---|
| **Phonetic Alphabet Readback** | Panel displays a word/callsign; student spells it phonetically into the mic; STT checks accuracy. |
| **Script Reading** | Panel displays a complete radio script; student reads it aloud with PTT; system checks pacing and completeness. |
| **Channel Selection + Short Call** | Drill says "Call port control on channel 12"; student selects channel, presses PTT, speaks the opening line. |
| **Number Pronunciation** | Panel displays a position (lat/long); student reads it using proper maritime number pronunciation. |

These drills require online (STT), but use **deterministic rubrics only** — no LLM needed. They serve as a warm-up track that runs alongside Modules 2–4.

### Module 5: Radio Simulator (Tiered unlock — see Section 3)

**Goal:** Student applies all knowledge in realistic, AI-driven radio communication scenarios with scoring and feedback.

Tier unlock schedule:
- **Tier 1** (foundation): after Module 2
- **Tiers 2–3** (priority comms, complex): after Module 3
- **Tier 4** (exam simulation): after Module 4

No traditional lessons — the student is dropped into scenarios of increasing difficulty. Detailed in [Section 6](#6-vhf-radio-simulator--core-feature) and [Section 8](#8-practice-scenarios-catalog).

---

## 6. VHF Radio Simulator — Core Feature

### Concept

The simulator presents a **realistic VHF radio panel** on screen. The student interacts with it as they would a real radio: selecting channels, adjusting squelch, pressing PTT to speak. An AI engine plays the roles of other stations — coast guard, port control, nearby vessels — responding to the student's transmissions in proper marine radio protocol.

Communication is **half-duplex**, matching real VHF radio behavior: only one party transmits at a time. The student presses and holds PTT to speak; when they release, the AI processes their transmission, evaluates it, generates a contextually appropriate response, and plays it back through the "radio" with realistic audio effects.

### Simulator Architecture: Five Layers

The simulator is NOT a monolithic feature. It is composed of five sharply separated layers, each with clear responsibilities. This separation ensures the radio panel works reliably even when AI is slow or fails, and that scoring is deterministic and auditable.

```
┌─────────────────────────────────────────────────────────┐
│  Layer 5: UI Shell                                       │
│  React components: RadioPanel, PttButton, DscControls,   │
│  ChannelControl, ScenarioBriefing, TranscriptView        │
│  Subscribes to domain/session state, dispatches commands  │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Transport / AI Adapters                        │
│  WebSocket session transport, STT adapter, LLM adapter,  │
│  TTS adapter. Swappable per provider. Converts audio     │
│  into remote requests, returns structured results.        │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Audio Engine                                   │
│  Owns AudioContext, mic capture, monitoring, noise/       │
│  squelch mix, radio DSP chain, playback queue.           │
│  Panel emits intent ("TX started"), audio engine acts.    │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Session Engine (Scenario + Rubric)             │
│  Owns scenario progression, state machine, branching     │
│  rules, rubric definitions, jurisdiction-aware scoring.  │
│  Deterministic — no AI model calls in this layer.        │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Radio Domain                                   │
│  Pure TypeScript state model for the device itself.      │
│  Channel, power, squelch, dual-watch, TX/RX, DSC form.  │
│  No React, no audio, no sockets. Just radio state.       │
└─────────────────────────────────────────────────────────┘
```

**Why this matters:**
- **Layer 1** (radio-domain) is testable in isolation. Channel changes, DSC flows, and PTT state transitions are pure functions.
- **Layer 2** (session-engine) is the source of truth for what the student should do and whether they did it correctly. It uses versioned scenario definitions and rubric rules — not LLM judgment — for scoring. The LLM is used only to generate natural-language responses, never to decide pass/fail.
- **Layer 3** (audio-engine) is independent of the radio panel UI. PTT starts capture; release ends it. The audio engine never knows about scenarios or scoring.
- **Layer 4** (transport) is swappable: cloud AI providers, self-hosted models, or mock adapters for testing.
- **Layer 5** (ui-shell) is purely presentational. It never directly manages audio, sockets, or scoring.

**The biggest architectural mistake to avoid:** coupling the panel directly to the AI pipeline. `PttButton.tsx` should never start sockets, build prompts, or manage playback. The panel says "user transmitted on channel 16 with this DSC state active." The session engine decides what that means.

#### Layer 1: Radio Domain Model

```typescript
// channel-types.ts — jurisdiction-aware channel model
interface ChannelDefinition {
  id: string;                // e.g., "16", "06", "70", "M" (for simplex/duplex variants)
  number: number;            // numeric part: 16, 6, 70
  suffix?: string;           // regional suffix if any (e.g., "A" for US duplex variants)
  frequency: {
    ship: number;            // ship TX frequency in MHz
    coast?: number;          // coast TX frequency (if duplex); undefined = simplex
  };
  purpose: string;           // human-readable: "Distress, safety, calling"
  type: 'voice' | 'dsc_only';
  txAllowed: boolean;        // false for Ch.70 (DSC only) and receive-only channels
  maxPower?: 'low';          // if restricted to 1W (e.g., some bridge-to-bridge channels)
}

// radio-machine.ts — pure state, no side effects
interface RadioState {
  power: boolean;
  channel: ChannelDefinition;   // full channel object, not bare number
  volume: number;               // 0–10
  squelch: number;              // 0–10
  dualWatch: boolean;
  dualWatchChannel: ChannelDefinition;
  txPower: 'high' | 'low';     // 25W / 1W
  txState: 'idle' | 'transmitting';
  rxState: 'idle' | 'receiving';
  dscFormState: DscFormState | null;
  micPermission: 'granted' | 'denied' | 'prompt';
  jurisdictionProfile: string;  // active jurisdiction ID
}

type RadioCommand =
  | { type: 'SET_CHANNEL'; channelId: string }  // looks up from jurisdiction profile
  | { type: 'PRESS_PTT' }
  | { type: 'RELEASE_PTT' }
  | { type: 'TOGGLE_DUAL_WATCH' }
  | { type: 'SET_SQUELCH'; level: number }
  | { type: 'SET_VOLUME'; level: number }
  | { type: 'TOGGLE_POWER' }
  | { type: 'SUBMIT_DSC_ALERT'; payload: DscAlertPayload }
  | { type: 'CANCEL_DSC_ALERT' };
```

**Phase 1 scope:** A single "international" jurisdiction profile with the standard ITU channel plan. The `ChannelDefinition` model supports future regional variants (US suffixes like "22A", UK-specific port ops assignments) without changing the radio domain interface. The `txAllowed` field enforces Ch.70 voice guard at the domain level.

All channel changes, DSC auto-switches, and TX/RX state transitions are logged as **domain events** so the session engine can use them for scoring.

#### Layer 2: Session Engine

The session engine is a **deterministic state machine** with versioned scenario definitions:

```typescript
// scenario-machine.ts
interface ScenarioDefinition {
  id: string;
  version: string;                    // semantic versioning for auditability
  jurisdiction: string;               // which channel/procedure rules apply
  briefing: ScenarioBriefing;
  personas: StationPersona[];
  steps: ScenarioStep[];              // ordered expected flow
  rubric: ScoringRubric;              // versioned, deterministic
  branchingRules: BranchRule[];       // "if student does X, go to step Y"
}

interface ScenarioStep {
  id: string;
  actor: 'student' | string;         // string = persona ID
  expectedAction: ExpectedAction;     // channel, message type, required fields
  requiredChannel?: number;
  requiredFields?: RequiredField[];   // deterministic slot checks
  timeoutSeconds?: number;
  onTimeout: 'hint' | 'fail' | 'prompt';
  fallbackResponse?: string;          // pre-scripted response if LLM fails
  nextStep: string | BranchRule[];
}

interface ScoringRubric {
  version: string;                    // rubric version tracked per attempt
  dimensions: RubricDimension[];
  passingScore: number;
  fieldChecks: FieldCheck[];          // deterministic regex/pattern rules
}
```

**Key principle:** The session engine decides pass/fail using deterministic field checks and rules. The LLM's role is limited to:
1. Generating natural-language station responses (voice acting)
2. Providing qualitative feedback text (advisory, not scored)
3. Handling unexpected student deviations gracefully (improv within bounds)

The session engine never calls an AI model for scoring decisions.

### Radio Panel UI

The panel uses a **hybrid rendering approach**: a static SVG/CSS faceplate for the visual shell, with real DOM controls for knobs, buttons, dialogs, and status indicators layered on top. This gives accessibility, keyboard support, testability, and mobile-friendly hit targets while keeping the realistic look.

**Do NOT build the entire panel as one interactive SVG.** Full SVG-only implementations become painful with focus states, pointer capture, ARIA labels, and responsive hit targets.

```
┌─────────────────────────────────────────────────────────┐
│                   GMDSS VHF SIMULATOR                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │         ╔═══════════════════════╗                │    │
│  │         ║   CH 16   156.800    ║                │    │
│  │         ║   DUAL WATCH: --     ║                │    │
│  │         ║   PWR: 25W    SQL: 4 ║                │    │
│  │         ╚═══════════════════════╝                │    │
│  │                                                 │    │
│  │    [VOL ◎]    [SQL ◎]    [CH ◎]                │    │
│  │                                                 │    │
│  │  [16/9] [DUAL] [H/L] [▲ CH ▼]                 │    │
│  │                                                 │    │
│  │  ┌─────────────────────────────┐                │    │
│  │  │      DSC CONTROLS          │                │    │
│  │  │  [🔒 DISTRESS] (lift      │                │    │
│  │  │   cover, then hold 5s)    │                │    │
│  │  │  [CALL]  [MENU]  [ENT]    │                │    │
│  │  │  [MMSI: 211239680]         │                │    │
│  │  └─────────────────────────────┘                │    │
│  │                                                 │    │
│  │                   ┌───────────────────┐         │    │
│  │                   │                   │         │    │
│  │                   │   ● PTT (HOLD)   │ ← right │    │
│  │                   │                   │         │    │
│  │                   └───────────────────┘         │    │
│  │                                                 │    │
│  │  Signal: ▮▮▮▯▯  TX: ○  RX: ○                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ SCENARIO: Distress — Fire on board              │    │
│  │ Briefing: You are M/V Blue Duck. You discover   │    │
│  │ fire in the engine room. Send DSC distress       │    │
│  │ alert and follow up with voice MAYDAY on Ch.16.  │    │
│  │                                                  │    │
│  │ Your vessel: M/V BLUE DUCK                       │    │
│  │ Callsign: 5BCD2  MMSI: 211239680                │    │
│  │ Position: 36°08'N 005°21'W                       │    │
│  │ Persons on board: 12                             │    │
│  │ Time UTC: 14:35                                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [HINT]  [SCRIPT REFERENCE]  [PAUSE]  [RESTART]        │
└─────────────────────────────────────────────────────────┘
```

### Radio Panel Controls

| Control | Behavior |
|---|---|
| **Channel selector knob** | Rotary knob or ▲/▼ buttons. Channels 1–88 + special assignments. Display updates with channel number and frequency. |
| **Volume knob** | Controls playback volume of incoming transmissions and radio noise. |
| **Squelch knob** | Controls the noise gate threshold. Higher squelch = less background noise but may miss weak signals. In simulator: affects ambient static level. |
| **PTT button** | Hold to transmit. While held: mic is active, TX indicator lights, outgoing audio is captured. On release: transmission is sent to AI engine. |
| **16/9 button** | Tap = jump to Ch.16 (distress/calling). Long-press = jump to Ch.9 (alternate calling). Matches real ICOM/Standard Horizon behavior. |
| **Dual Watch** | Monitor Ch.16 while on a working channel. When active, "DUAL WATCH" shows on display. |
| **H/L (High/Low power)** | Toggle 25W / 1W. Visual only in simulator (affects range in advanced scenarios). |
| **DSC Distress button** | Protected by a simulated spring-loaded flip cover (user must tap to lift cover first). Then hold for 5 seconds to send DSC distress alert. If nature of distress was pre-selected via DSC menu, that nature is included; otherwise "undesignated" is sent. Auto-sends on Ch.70, then auto-switches to Ch.16 for voice follow-up. Alert auto-repeats every 3.5–4.5 minutes (randomized per ITU-R M.493) until acknowledged or cancelled. |
| **Ch.70 voice guard** | If student selects Ch.70 and presses PTT, transmission is blocked. Display shows "CH 70 — DSC ONLY — CANNOT TRANSMIT VOICE." This matches real radio behavior and is a scoring-relevant error. |
| **DSC CALL / MENU / ENT** | Navigate DSC menus for urgency/safety/routine calls. Simplified menu system. |
| **Signal strength indicator** | Visual only — shows "signal strength" of incoming transmissions (controlled by scenario engine). |
| **TX / RX indicators** | LED-style dots that light during transmit / receive. |

### Audio Processing Chain

All audio is processed through the **Web Audio API** to create realistic radio ambiance:

```
OUTGOING (student → AI):
  Microphone
    → GainNode (input level)
    → MediaRecorder (clean capture for STT — NO effects)
    → simultaneously →
    → BiquadFilter (bandpass 300–3400 Hz)
    → DynamicsCompressor (radio AGC simulation)
    → destination (student hears their own "radio voice" in monitor)

INCOMING (AI → student):
  TTS Audio Source
    → BiquadFilter (bandpass 300–3400 Hz)
    → WaveShaperNode (mild distortion/clipping)
    → DynamicsCompressor (aggressive ratio 12:1)
    → GainNode (signal strength based on scenario)
    → mix with →
    → White noise generator (filtered, level based on squelch)
    → Destination (speakers/headphones)

AMBIENT:
  Static noise loop (CC0 asset)
    → BiquadFilter (shaped to HF band)
    → GainNode (level = inverse of squelch setting)
    → Destination (always playing when radio is "on")
```

**Key design decision:** The clean mic track (before effects) is what gets sent to STT. The student hears a radio-processed version of their own voice for immersion, but the AI evaluates the clean audio for accurate transcription.

### Simulator State Machine

```
┌─────────┐    scenario     ┌──────────┐
│  IDLE   │ ──loaded───►    │ BRIEFING │
└─────────┘                 └────┬─────┘
                                 │ student clicks "Start"
                                 ▼
                           ┌──────────┐
                    ┌─────►│ STANDBY  │◄────────────────┐
                    │      │ (listen) │                  │
                    │      └────┬─────┘                  │
                    │           │                        │
                    │     PTT pressed                    │
                    │           │                        │
                    │           ▼                        │
                    │    ┌─────────────┐                 │
                    │    │ TRANSMITTING│                 │
                    │    │ (mic active)│                 │
                    │    └──────┬──────┘                 │
                    │           │                        │
                    │     PTT released                   │
                    │           │                        │
                    │           ▼                        │
                    │    ┌─────────────┐                 │
                    │    │ PROCESSING  │                 │
                    │    │ STT→Eval→   │                 │
                    │    │ LLM→TTS     │                 │
                    │    └──────┬──────┘                 │
                    │           │                        │
                    │           ▼                        │
                    │    ┌─────────────┐                 │
                    │    │ RECEIVING   │                 │
                    │    │ (AI voice   │                 │
                    │    │  playing)   │                 │
                    │    └──────┬──────┘                 │
                    │           │                        │
                    │     audio ends                     │
                    │           │                        │
                    │           ▼                        │
                    │    ┌─────────────┐   scenario      │
                    └────┤ EVALUATE    │──complete──►┌───┴──────┐
                         │ (next step?)│            │ DEBRIEF  │
                         └─────────────┘            └──────────┘
```

### DSC Simulation Flow

For scenarios involving DSC:

**Path A — Enhanced distress (time permits):**
1. Student opens DSC menu → selects nature of distress (fire, flooding, collision, etc.)
2. Position auto-fills from scenario GPS (or manual entry if GPS unavailable)
3. Student taps the distress button flip cover to lift it
4. Student holds distress button for 5 seconds (countdown animation + tone)
5. Alert transmits on Ch.70 with selected nature + position + MMSI
6. Radio auto-switches to Ch.16 for voice follow-up
7. Alert auto-repeats every 3.5–4.5 minutes until acknowledged or cancelled
8. Student must now make the voice MAYDAY call immediately (do not wait for DSC acknowledgment)

**Path B — Quick distress (no time to pre-select):**
1. Student taps the distress button flip cover to lift it
2. Student holds distress button for 5 seconds
3. Alert transmits as "undesignated distress" with GPS position
4. Same auto-switch and auto-repeat as Path A
5. Student must now make the voice MAYDAY call

**Both paths are valid.** Path A scores higher on the "completeness" dimension. Path B is realistic for genuine emergencies. The session engine accepts either.

**DSC acknowledgment rule:** Ships must NOT send DSC distress acknowledgments — only coast stations do. In response scenarios, if a student attempts to send a DSC acknowledgment to a distress alert (instead of responding by voice on Ch.16), the session engine flags this as a procedural error.

**Ch.70 voice guard:** If the student selects Ch.70 and presses PTT, transmission is blocked. Display shows "CH 70 — DSC ONLY." This is scored as a channel error.

---

## 7. AI Communication Engine

### Architecture: Half-Duplex Voice Loop

The AI engine operates in a **listen → think → speak** cycle, matching real radio half-duplex behavior:

```
Student speaks (PTT held)
       │
       ▼
┌──────────────┐
│ 1. CAPTURE   │  Clean audio recorded via MediaRecorder
│              │  (PCM 16-bit, 24kHz mono)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 2. TRANSCRIBE│  STT model transcribes student speech
│    (STT)     │  → plain text transcript
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 3. EVALUATE  │  Scoring engine checks transcript against:
│              │  - Required fields (position, vessel ID, etc.)
│              │  - Correct prowords and sequence
│              │  - Appropriate channel usage
│              │  - Protocol compliance
│              │  → structured score + feedback object
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 4. RESPOND   │  LLM generates contextual response as
│    (LLM)     │  the "other station" (coast guard, port
│              │  control, vessel) following marine protocol
│              │  → text of response transmission
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 5. VOCALIZE  │  TTS converts response to audio
│    (TTS)     │  → raw audio stream
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ 6. PLAY      │  Audio processed through radio DSP chain
│   (Radio FX) │  and played to student
└──────────────┘
```

### Station Personas

The AI can play multiple roles within a single scenario. Each role has a distinct **system prompt** and **TTS voice ID**:

| Persona | Role | Voice Character | Example Callsign |
|---|---|---|---|
| **Coast Guard / MRCC** | Responds to distress, coordinates SAR | Authoritative, calm, measured pace | "Rescue Coordination Centre" |
| **Port Control / VTS** | Manages vessel traffic, port entry | Professional, brisk | "Gibraltar Port Control" |
| **Another Vessel** | Ship-to-ship, distress relay, assistance offers | Varies (accent, pace) | "Motor Vessel NORDIC STAR" |
| **Coast Station** | Routine calls, link calls, weather | Neutral, procedural | "Olympia Radio" |
| **Fishing Vessel** | Informal but correct, safety messages | Casual tone | "Fishing Vessel MARIA" |

**System prompt structure for each persona:**

```
You are {station_name}, callsign {callsign}, MMSI {mmsi}.
You are a {role_description} operating on VHF marine radio.

RULES:
- Respond ONLY using standard marine radiotelephone protocol (IMO SMCP).
- Use correct prowords: OVER (expecting reply), OUT (end), ROGER (understood),
  SAY AGAIN (repeat), CORRECTION (error fix).
- Use the NATO/ITU phonetic alphabet for spelling.
- Keep transmissions concise — this is radio, not conversation.
- Match the communication priority: distress > urgency > safety > routine.
- If the student makes a protocol error, respond as a real station would
  (request clarification, correct channel, etc.) — do not break character.

SCENARIO CONTEXT:
{scenario_specific_context}

CURRENT STATE:
{current_scenario_state_and_history}
```

### Evaluation and Scoring

Each student transmission is scored on multiple dimensions:

| Dimension | Weight | What's Checked |
|---|---|---|
| **Required fields** | 30% | Are all mandatory fields present? (vessel name, callsign/MMSI, position, nature of distress, assistance needed, persons on board) |
| **Correct prowords** | 20% | Correct signal word (MAYDAY/PAN PAN/SECURITE), correct use of THIS IS, OVER, OUT |
| **Sequence** | 20% | Fields in correct order per standard message structure |
| **Channel correctness** | 15% | On the right channel for this type of communication |
| **Clarity and completeness** | 15% | Advisory only — not scored. LLM provides qualitative feedback on pacing, hesitation, and extraneous chatter, but this dimension does NOT affect the numeric grade. It appears in the after-action review as coaching text. |

**Scoring is fully deterministic.** There is no "hybrid" approach. The LLM is never in the scoring loop.

- **All graded dimensions** (required fields, prowords, sequence, channel) are scored by the **rubric engine** (Layer 2) using regex/pattern matching on the transcript. Same transcript + same rubric version = same score, every time.
- **"Clarity and completeness"** is an **advisory-only dimension** — the LLM generates qualitative feedback text (e.g., "You hesitated before stating the nature of distress"), but this text has no numeric weight and does not affect pass/fail.

The rubric engine returns structured JSON:

```json
{
  "overall_score": 85,
  "dimensions": {
    "required_fields": { "score": 90, "missing": ["persons_on_board"], "deterministic": true },
    "prowords": { "score": 100, "notes": "", "deterministic": true },
    "sequence": { "score": 80, "notes": "Position given before vessel ID", "deterministic": true },
    "channel": { "score": 100, "notes": "", "deterministic": true }
  },
  "advisory": {
    "clarity_feedback": "Good pacing overall. You hesitated before nature of distress — practice that transition.",
    "source": "llm",
    "not_scored": true
  },
  "transcript": "MAYDAY MAYDAY MAYDAY this is motor vessel Blue Duck...",
  "expected_template": "MAYDAY MAYDAY MAYDAY, THIS IS {vessel} {vessel} {vessel}...",
  "next_action": "await_acknowledgement"
}
```

### Latency Budget

Target: **under 3 seconds** from PTT release to AI audio playback start. This is acceptable because real radio has natural pauses between transmissions.

| Step | Target | Approach |
|---|---|---|
| Audio upload | 200ms | WebSocket streaming (see capture note below) |
| STT | 500ms | Streaming transcription (start before audio ends) |
| Evaluation | 300ms | Deterministic checks + cached rubrics |
| LLM response | 800ms | Streaming tokens, short responses |
| TTS | 500ms | Streaming TTS, start playback on first chunk |
| Radio DSP | ~0ms | Real-time Web Audio processing |
| **Total** | **~2.3s** | Pipelined, not sequential where possible |

**Important:** 2.3s is a best-case target. Real-world conditions (mobile networks, school Wi-Fi, AI provider load) will regularly exceed this.

**Audio capture note:** `MediaRecorder` does NOT guarantee low-latency PCM streaming — it produces encoded chunks (often WebM/Opus) with timing variance. For the latency budget above to work:
- **Phase 1:** Use `MediaRecorder` with `timeslice` parameter to get frequent small chunks. Accept that encoding is opaque (WebM/Opus). Send chunks as-is to server; server decodes before STT. This is simpler but adds ~100–200ms of encoding/buffering overhead.
- **Phase 1 upgrade path:** If latency is unacceptable, switch to `AudioWorkletNode`-based capture that produces raw PCM Float32 frames directly from the audio graph. This bypasses MediaRecorder entirely but requires more implementation effort.
- The `tx-capture.ts` module in Layer 3 should abstract this behind an interface so the capture backend can be swapped without touching the rest of the pipeline.

### Degraded and Failed Turn Handling

The simulator must not feel "broken" when latency spikes or the AI pipeline fails. Explicit UX for each degraded state:

| Condition | UX Behavior |
|---|---|
| **Normal turn (< 3s)** | Brief radio silence after PTT release, then AI voice plays. Feels natural — real radio has pauses. |
| **Slow turn (3–6s)** | After 2s of silence, show subtle "processing..." indicator on the radio display (not a spinner — a blinking RX dot). Background static continues. |
| **Very slow turn (6–10s)** | Display message: "Weak signal — standby." Student can re-transmit (PTT again) or wait. See turn ID handling below. |
| **Timeout (> 10s)** | Display: "No response from station." Session engine offers: retry transmission, skip to next step (with score penalty), or pause scenario. |
| **STT failure** | "Transmission not received — say again." Student re-transmits. After 2 consecutive failures: offer typed input fallback for this turn only. |
| **LLM failure** | Session engine falls back to a **pre-scripted response** from the scenario definition (every step should have a `fallbackResponse` field). Score that turn using deterministic rubric only. |
| **TTS failure** | Display AI response as text on screen: "COAST STATION RESPONDS: [text]." Student reads it and proceeds. |
| **Full connectivity loss mid-scenario** | Pause scenario. Display: "Connection lost — scenario paused. Your progress is saved." Resume when online. |

The fallback chain priority: **streaming AI > degraded AI > pre-scripted response > text display > pause**. The scenario should never silently hang.

**Turn ID and stale-response handling:** Every student transmission is assigned a monotonically increasing `turn_id` by the session engine. When a student retransmits (e.g., during a slow turn), the new transmission gets a new `turn_id` and the previous turn is marked `cancelled`. If the server returns a response for a cancelled `turn_id`, the client discards it. This prevents:
- Transcript attaching AI response to the wrong student turn
- Score from a stale evaluation overwriting a fresh one
- Two AI responses playing back-to-back after a retry

The WebSocket protocol includes `turn_id` in every message (both directions). The session engine only advances scenario state for the **latest active turn**.

### Offline and Degraded Connectivity

**Phase 1: Simulator is online-only.** The AI voice loop (STT → Evaluate → LLM → TTS) requires server connectivity. When offline:

- The radio panel is accessible but shows a clear "offline — simulator unavailable" state
- Students are redirected to theory modules, drills, quizzes, and the Script Builder (all offline-capable)
- Guided Voice Drills are also unavailable offline (they need STT)
- Previous attempt transcripts and scores are cached in IndexedDB and viewable offline

**Future phase consideration:** A deterministic offline mode could be built using:
- Pre-scripted scenario responses (no LLM) bundled as content packs
- Local rubric engine for scoring typed input
- Browser SpeechRecognition API as a best-effort STT fallback (unreliable but non-zero value)

This is explicitly **not promised for Phase 1** to avoid shipping a broken experience. The offline story for Phase 1 is: theory, drills, quizzes, and review — not simulation.

---

## 8. Practice Scenarios Catalog

Scenarios are organized by **difficulty tier** and **communication type**. Each scenario defines:

- **Briefing**: situation description and vessel details
- **Station personas**: who the AI plays
- **Expected flow**: sequence of transmissions and actions
- **Scoring rubric**: what constitutes a passing performance
- **Branching**: how the AI adapts if the student deviates

### Tier 1: Foundation (Unlock after Module 2 checkpoint)

Simple, single-exchange scenarios with clear instructions.

| # | Scenario | Type | Description | Key Skills Tested |
|---|---|---|---|---|
| 1.1 | **Radio Check** | Routine | Call coast station for a radio check on the appropriate calling/working channel (jurisdiction-dependent; e.g., Ch.09 in US waters, designated working channel elsewhere). **Not on Ch.16** — Ch.16 is reserved for distress/safety/calling only; routine radio checks should use the jurisdiction's designated channel. | Basic call procedure, prowords, correct channel selection |
| 1.2 | **Channel Change** | Routine | Call another vessel on Ch.16, request shift to Ch.06 for ship-to-ship communication. | Call + shift procedure, working channel selection |
| 1.3 | **Port Entry Call** | Routine | Contact port control on designated port ops channel, request entry instructions. | Correct channel, vessel identification, listening |
| 1.4 | **Position Report** | Routine | Report position to coast station in correct lat/long format using phonetic numbers. | Number pronunciation, position format, phonetic alphabet |
| 1.5 | **Navigational Warning Reception** | Safety | Receive a SECURITE broadcast; acknowledge and take note. | Listening comprehension, recognizing safety traffic |

### Tier 2: Priority Communications (Unlock after 80% on Tier 1)

Distress, urgency, and safety origination and response scenarios.

| # | Scenario | Type | Description | Key Skills Tested |
|---|---|---|---|---|
| 2.1 | **MAYDAY — Fire on Board** | Distress | DSC distress alert (nature: fire) → voice MAYDAY on Ch.16 with all required fields. Coast Guard acknowledges. | DSC→voice flow, complete MAYDAY, all fields |
| 2.2 | **MAYDAY — Flooding/Sinking** | Distress | Vessel taking on water. DSC + voice. Must include "require immediate assistance" and "preparing to abandon." | Urgency in delivery, abandon ship context |
| 2.3 | **MAYDAY — Collision** | Distress | Struck by another vessel. Must report both vessels, position, damage assessment. | Multi-vessel situation, complete reporting |
| 2.4 | **PAN PAN — Engine Failure** | Urgency | Loss of propulsion in shipping lane. No immediate danger but urgency. DSC urgency + voice PAN PAN. | Correct category selection (urgency not distress), complete message |
| 2.5 | **PAN PAN — Medical Emergency** | Urgency | Crew member with chest pain. Request MEDICO advice. Must prepare patient details. | Medical communications, MEDICO procedure, patient info |
| 2.6 | **SECURITE — Hazard to Navigation** | Safety | Spotted unlit wreck/container. Broadcast SECURITE on Ch.16 with position and description. | Safety broadcast format, position reporting |
| 2.7 | **MAYDAY Acknowledgment** | Distress (response) | Hear another vessel's MAYDAY. Acknowledge correctly and offer assistance. | Listening, correct acknowledgment format, appropriate response |
| 2.8 | **MAYDAY RELAY** | Distress (relay) | Witness a vessel in distress that cannot transmit. Relay their MAYDAY. | Relay format, third-party reporting |

### Tier 3: Complex Scenarios (Unlock after 80% on Tier 2)

Multi-step scenarios with branching, unexpected events, and role-switching.

| # | Scenario | Type | Description | Key Skills Tested |
|---|---|---|---|---|
| 3.1 | **Full SAR Scenario** | Distress + SAR | Send MAYDAY, receive acknowledgment, communicate with SAR helicopter, provide updates as situation develops. | Extended communication, multiple parties, updates |
| 3.2 | **False Alert Cancellation** | DSC procedure | Accidentally trigger DSC distress alert. Must cancel correctly on Ch.16 and via DSC. | False alert procedure, immediate action |
| 3.3 | **Distress During Routine Call** | Priority shift | Mid-routine call with port control, hear MAYDAY from another vessel. Must cease routine traffic, respond to distress. | Priority recognition, immediate response, SEELONCE |
| 3.4 | **Multiple Vessel Coordination** | SAR | Coordinate with two other vessels during SAR. Relay instructions from MRCC. | Multi-party communication, relay accuracy |
| 3.5 | **Deteriorating Situation** | Distress escalation | PAN PAN (engine failure) → situation worsens → upgrade to MAYDAY (taking on water). | Situation reassessment, priority escalation |
| 3.6 | **Port Approach with Traffic** | Routine + Safety | Enter busy port: contact VTS, receive traffic info, respond to SECURITE about channel obstruction, navigate to berth. | Multi-step routine ops, listening, situation awareness |
| 3.7 | **Night/Poor Visibility Encounter** | Safety | Encounter vessel in restricted visibility. Exchange identity and intentions on bridge-to-bridge channel. | Bridge-to-bridge protocol, COLREGS awareness |
| 3.8 | **MEDICO with Evacuation** | Urgency → Distress | Request medical advice → patient worsens → request helicopter evacuation. | Medical comms, escalation, helicopter coordination |

### Tier 4: Exam Simulation (Unlock after 80% on Tier 3)

Timed, unguided scenarios that mirror practical exam conditions.

| # | Scenario | Type | Description |
|---|---|---|---|
| 4.1 | **Exam: Random Distress** | Distress | Random distress scenario. No hints. Timed. Must achieve ≥80%. |
| 4.2 | **Exam: Random Urgency/Safety** | Urgency/Safety | Random urgency or safety scenario. No hints. Timed. |
| 4.3 | **Exam: Mixed Traffic** | Mixed | Multiple communications in sequence. Must prioritize correctly. |
| 4.4 | **Exam: Full Voyage** | All types | Complete a short simulated voyage with routine, safety, and one emergency event. |

---

## 9. User Accounts and Progress System

### Authentication

The application is deployed as a service by maritime training schools. Each school instance has its own user base.

| Feature | Implementation |
|---|---|
| **Registration** | School admin creates accounts or provides registration codes |
| **Login** | Email/password |
| **2FA** | TOTP-based (Google Authenticator, etc.) — recommended but configurable per school |
| **Session** | JWT with refresh tokens; sessions persist across devices |
| **Password reset** | Email-based secure reset flow |

### Progress Model

```
Student Progress
├── Module 1: VHF Fundamentals
│   ├── Lesson 1.1–1.6: completed ✓
│   ├── Checkpoint Quiz: 85% ✓ (2026-04-02)
│   └── Status: PASSED
├── Guided Voice Drills ← UNLOCKED (after Module 1)
│   ├── Phonetic Alphabet: 92% ✓
│   ├── Script Reading: 78% ✓
│   ├── Channel Select + Call: in progress
│   └── Status: IN PROGRESS
├── Module 2: MMSI & DSC
│   ├── Lesson 2.1: completed ✓
│   ├── Lesson 2.2: in progress (60%)
│   └── Status: IN PROGRESS
├── Module 3: Procedures — LOCKED
├── Module 4: SAR Equipment — LOCKED
└── Simulator
    ├── Tier 1: LOCKED (unlocks after Module 2)
    ├── Tier 2–3: LOCKED (unlocks after Module 3)
    ├── Tier 4: LOCKED (unlocks after Module 4)
    ├── Best scores: {}
    └── Total practice time: 0h
```

### Data Stored Per Simulator Attempt

Every attempt record must be **fully auditable** — an instructor or QA reviewer should be able to reconstruct exactly how a score was produced, with what tools, and under what rules.

| Field | Purpose |
|---|---|
| `attempt_id` | Unique identifier |
| `user_id` | Student |
| `scenario_id` | Which scenario |
| `scenario_version` | Semantic version of the scenario definition used |
| `rubric_version` | Semantic version of the scoring rubric applied |
| `jurisdiction_profile` | Which jurisdiction's channel/procedure rules were active |
| `started_at` / `ended_at` | Timestamps |
| `transcript_log` | Full conversation transcript (student + AI, time-stamped, per-turn) |
| `score_breakdown` | Per-dimension scores (JSON) — from deterministic rubric, not LLM |
| `overall_score` | Numeric grade |
| `field_check_results` | Per-field pass/fail from deterministic slot checking (JSON) |
| `feedback` | AI-generated qualitative feedback text (advisory, not scored) |
| `stt_provider` | STT model/provider used (e.g., "openai/gpt-4o-mini-transcribe") |
| `stt_confidence` | Per-turn STT confidence scores where available |
| `llm_provider` | LLM model/provider used for response generation |
| `llm_prompt_hash` | Hash of the system prompt used (for reproducibility) |
| `tts_provider` | TTS provider used |
| `fallback_turns` | Which turns used pre-scripted fallback instead of AI (if any) |

**Note:** Audio is never stored. Transcripts are always retained for graded attempts (mandatory for auditability).

**Why this level of detail:** When an instructor disputes a score, or when curriculum QA reviews scoring quality, they need to know: "Was this scored by rubric v2.1 under international jurisdiction, with Whisper transcription at 0.87 confidence?" Without provenance, scores are not trustworthy for professional training.

### Instructor Dashboard (v2)

- View per-student progress across all modules
- See class-wide analytics (common weak areas, average scores per scenario)
- Assign specific scenarios to specific students
- Export progress reports
- Manage student accounts

---

## 10. Design Language and UX

### Visual Identity

| Attribute | Choice | Rationale |
|---|---|---|
| **Color palette** | Dark navy (#0A1628) + ocean blue (#1E3A5F) + safety orange (#FF6B35) + white | Maritime professional feel; high contrast; orange for warnings/distress matches real safety equipment |
| **Typography** | System font stack for UI; monospace for radio displays and transcripts | Performance (no font loading); monospace evokes technical/radio equipment |
| **Icon set** | Tabler Icons (MIT) | Clean, consistent, large coverage, permissive license |
| **Radio panel** | SVG/CSS hybrid faceplate with DOM controls — dark gray/black panel, green/amber LCD display, textured knobs | Students need to recognize controls that map to real hardware |
| **Simplified mode** | A compact, accessibility-first panel layout that preserves all radio state and rules but uses standard form controls (dropdowns, buttons, text fields) instead of skeuomorphic knobs. Same session engine, same scoring. Available as a toggle or auto-detected from screen reader / reduced-motion preferences. | Not all students benefit from visual realism; mobile small screens may need it |
| **Tone** | Professional, concise, no gamification gimmicks | This is professional training, not a game. Progress indicators yes; stars/badges no. |

### Layout

**Mobile (portrait):**
```
┌──────────────┐
│  Header      │
│  (scenario)  │
├──────────────┤
│              │
│  Radio Panel │
│  (scrollable │
│   if needed) │
│              │
│  ┌────────┐  │
│  │  PTT   │  │ ← always visible, large touch target
│  └────────┘  │
├──────────────┤
│ ▶ Transcript │ ← expandable panel
├──────────────┤
│ ☰ Learn  📻  │
│   Drill  Sim │ ← bottom nav
└──────────────┘
```

**Desktop:**
```
┌────────┬──────────────────────────────────┬───────────┐
│        │                                  │           │
│  Nav   │         Radio Panel              │ Scenario  │
│  Rail  │         (centered, 1:1 scale)    │ Briefing  │
│        │                                  │           │
│ Learn  │  ┌──────────────────────────┐    │ Vessel:   │
│ Drill  │  │    LCD / Controls        │    │ Position: │
│ Sim    │  │    PTT                   │    │ Task:     │
│ Ref    │  └──────────────────────────┘    │           │
│ Profile│                                  │ Transcript│
│        │                                  │ & Score   │
└────────┴──────────────────────────────────┴───────────┘
```

### Key UX Patterns

| Pattern | Detail |
|---|---|
| **Gated progression** | Modules unlock sequentially. Guided Voice Drills unlock after Module 1. Simulator Tier 1 unlocks after Module 2. Tiers 2–3 after Module 3. Tier 4 after Module 4. Tiers within simulator unlock at 80% completion of previous tier. |
| **Hint system** | In Tiers 1–3, student can request a hint (shows expected next transmission). Costs 10% score penalty. Tier 4 (exam mode): no hints. |
| **Script reference** | Collapsible panel showing the message template (e.g., MAYDAY structure). Always available in Tiers 1–2; hidden in Tier 3+. |
| **After-action review** | After each scenario: full transcript (student vs AI), per-transmission scores, overall grade, targeted feedback, "retry" and "practice weak area" buttons. |
| **Offline indicator** | Persistent chip showing connection status. Simulator and voice drills disabled when offline; student redirected to theory, quizzes, script builder, and previous attempt review. |
| **Audio permission flow** | On first simulator entry: explain why mic is needed → request permission → test audio levels → proceed. Never request mic during theory modules. |
| **Keyboard shortcuts** | Space = PTT (desktop), Enter = send DSC, Esc = cancel/back. Documented in help overlay. |

---

## 11. Technical Stack and Infrastructure

### Frontend

| Technology | Purpose |
|---|---|
| **TypeScript** | Type safety across the codebase |
| **React** | Component framework (large ecosystem, strong PWA tooling) |
| **Vite+ (`vp`)** | Unified toolchain: dev server, build (Rolldown), lint (Oxlint), format (Oxfmt), type-check (tsgo), test (Vitest). Single CLI. |
| **Workbox** | Service worker generation and caching strategies (via `vite-plugin-pwa`) |
| **IndexedDB (via idb)** | Offline data storage |
| **XState or custom reducer** | State machine for radio domain and session engine |
| **Web Audio API** | Radio audio processing chain (Layer 3) |
| **SVG + DOM hybrid** | Radio panel faceplate (SVG) with real DOM controls overlaid |
| **Tabler Icons** | Icon system |
| **Radix UI Primitives** | Accessible base components (dialogs, toggles, sliders) |
| **Custom `RotaryKnob`** | Rotary knob controls for channel/volume/squelch (CSS radial-gradient + pointer events + atan2) |
| **use-long-press** | Long-press hook for DSC distress button 5s hold (MIT) |
| **i18next** | Internationalization framework (ready for multilingual) |
| **Vite+** (`vp` CLI) | Unified toolchain — replaces separate Vite, ESLint, Prettier, tsc configs. Uses Oxlint (50–100x faster), Oxfmt (30x faster), tsgo. See [viteplus.dev](https://viteplus.dev). |
| **Vitest (via `vp test`)** | Unit and integration test runner (built into Vite+) |
| **React Testing Library** | Component testing |
| **Playwright** | End-to-end browser tests |

### Frontend Source Structure (5-Layer Architecture)

```
src/
  features/radio/
    domain/                    # Layer 1: Radio Domain
      radio-machine.ts         # Pure state model, no side effects
      radio-types.ts           # RadioState, RadioCommand, DscFormState
      radio-commands.ts        # Command creators
      radio-selectors.ts       # Derived state (frequency from channel, etc.)

    session/                   # Layer 2: Session Engine
      scenario-machine.ts      # Scenario state machine (deterministic)
      rubric-engine.ts         # Scoring rules, field checks, pass/fail
      jurisdiction-rules.ts    # Channel plans, procedure variants per region
      scenario-types.ts        # ScenarioDefinition, ScenarioStep, ScoringRubric

    audio/                     # Layer 3: Audio Engine
      audio-engine.ts          # AudioContext lifecycle, routing
      tx-capture.ts            # Mic capture (MediaRecorder or AudioWorklet)
      radio-effects.ts         # Bandpass, compression, noise, squelch DSP
      playback-queue.ts        # Incoming audio playback with FX

    transport/                 # Layer 4: AI Adapters
      sim-socket.ts            # WebSocket session management
      stt-adapter.ts           # STT provider abstraction
      llm-adapter.ts           # LLM provider abstraction
      tts-adapter.ts           # TTS provider abstraction

    ui/                        # Layer 5: UI Shell
      RadioPanel.tsx           # Main panel container (SVG faceplate + DOM)
      RadioDisplay.tsx         # LCD display component
      ChannelControl.tsx       # Channel selector knob/buttons
      VolumeKnob.tsx           # Volume rotary control
      SquelchKnob.tsx          # Squelch rotary control
      PttButton.tsx            # Push-to-talk (pointer capture + keyboard)
      DscControls.tsx          # DSC menu, distress button, forms
      SignalIndicators.tsx     # TX/RX LEDs, signal strength meter
      ScenarioBriefing.tsx     # Scenario info panel
      TranscriptView.tsx       # Live/post transcript display
      DebriefPanel.tsx         # After-action review
```

**Implementation phasing:**
0. Vite+ toolchain + CI pipeline + quality gates (Week 1 — before any feature code)
1. Ship deterministic radio panel with channel/PTT/DSC state and no AI
2. Add audio engine with local loopback and radio FX
3. Add session engine with scripted scenario responses and deterministic scoring
4. Add remote STT/LLM/TTS behind adapters
5. Add skeuomorphic polish after the interaction model is stable

Every phase requires: `vp check` zero errors, `vp test --coverage` ≥85%, Playwright E2E green.

### Backend

| Technology | Purpose |
|---|---|
| **Node.js + Fastify** | API server (lightweight, fast) |
| **PostgreSQL** | User accounts, progress, attempt history |
| **Redis** | Session management, rate limiting |
| **WebSocket (ws or Socket.IO)** | Real-time audio streaming for simulator |

### AI Services

| Service | Provider Options | Purpose |
|---|---|---|
| **STT** | **Primary: faster-whisper `base.en`** (142MB, CPU-only, sub-1s, 5.2% WER, free). Cloud fallback: Groq Whisper API (~free, sub-500ms) or OpenAI `gpt-4o-mini-transcribe` ($0.003/min) | Transcribe student speech. Use `initial_prompt` with maritime vocabulary (MAYDAY, phonetic alphabet, lat/long) for accuracy boost. |
| **LLM** | Claude API (Anthropic), OpenAI GPT-4o, or self-hosted (Llama 3) | Generate station responses + qualitative feedback |
| **TTS** | **Primary: Piper TTS** (15–65MB per voice, CPU-only, 30–80ms first chunk, 20+ EN voices, MIT). Cloud fallback: OpenAI tts-1 (6 voices, $15/1M chars) | Voice the AI station responses. 5 voices mapped to 5 station personas. Radio DSP post-processing applied client-side. |

**Self-hosting note:** The recommended stack (faster-whisper + Llama + Piper) is fully open-source and runs on a 4-core CPU with 8GB RAM — no GPU required. This is the default configuration for AGPLv3 school deployments. Cloud APIs are optional fallbacks behind the adapter pattern.

**Minimum self-hosted hardware:**
- CPU: 4-core (x86_64 or ARM64)
- RAM: 8 GB
- Disk: 500 MB (faster-whisper base.en + 3 Piper voices)
- GPU: not required
- Voice processing latency: STT ~1s + TTS ~80ms ≈ 1.1s

### Infrastructure

Three deployment contexts: local dev, dev/QA/staging, and production. No hybrid production option — schools either self-host everything or use cloud everything.

```
Option A: Self-Hosted (default, recommended)
┌─────────────────────────────────────────────────┐
│  Single server (4-core, 8GB RAM, no GPU)        │
│                                                  │
│  ┌───────┐  ┌──────────────────────────────┐    │
│  │ Caddy │──│  API + WebSocket (Fastify)   │    │
│  │ HTTPS │  │                              │    │
│  │ + PWA │  │  ┌────────┐  ┌───────────┐  │    │
│  │ static│  │  │ faster │  │ Piper TTS │  │    │
│  └───────┘  │  │ whisper│  │ (5 voices)│  │    │
│             │  └────────┘  └───────────┘  │    │
│             └──────────────────────────────┘    │
│  ┌──────────────┐  ┌───────┐  ┌──────────┐    │
│  │ PostgreSQL   │  │ Redis │  │ Llama 3  │    │
│  └──────────────┘  └───────┘  └──────────┘    │
│                                                  │
│  Cost: $0 (own hardware) or $4-6/mo (VPS)       │
│  Privacy: all data stays on server              │
└─────────────────────────────────────────────────┘

Option B: Cloud-Managed (~$5/month)
┌──────────────────┐  ┌─────────────────────────┐
│ Cloudflare Pages │  │ Railway ($5/mo)          │
│ (PWA static)     │  │                          │
│ Free, global CDN │  │ API + WebSocket          │
│ Auto HTTPS       │  │ PostgreSQL (built-in)    │
│                  │  │ Redis (built-in)         │
└──────────────────┘  └────────────┬────────────┘
                                   │
                      ┌────────────┴────────────┐
                      │ Cloud AI APIs            │
                      │ STT: Groq (free tier)    │
                      │ LLM: Anthropic/OpenAI    │
                      │ TTS: OpenAI tts-1        │
                      └─────────────────────────┘

Cost: ~$5/mo (Railway) + AI API usage
Privacy: audio ephemeral, transcripts on Railway

Option B alt: Cloud — Fly.io ($0)
┌──────────────────┐  ┌─────────────────────────┐
│ Cloudflare Pages │  │ Fly.io (free: 3 VMs)    │
│ (PWA static)     │  │ API + WebSocket          │
└──────────────────┘  └─────────────────────────┘
┌──────────────────┐  ┌─────────────────────────┐
│ Neon (free)      │  │ Upstash (free)           │
│ PostgreSQL 500MB │  │ Redis 10K cmds/day       │
└──────────────────┘  └─────────────────────────┘
Cost: $0 base + AI API usage
Tradeoff: 4 platforms to manage vs Railway's 1

Development & QA: Railway
┌─────────────────────────────────────────────────┐
│ Railway (~$5/mo Hobby plan)                      │
│                                                   │
│  PR Preview Environments (auto per pull request) │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ API +    │  │ Postgres │  │ Redis    │       │
│  │ preview  │  │ (isolated)│  │(isolated)│       │
│  └──────────┘  └──────────┘  └──────────┘       │
│                                                   │
│  Dev → Staging → Production environment promotion│
└─────────────────────────────────────────────────┘
```

### Docker Compose (self-hosted)

**Production:** Single `docker compose up` deploys everything, including auto-HTTPS via Caddy.
**Local dev:** `docker compose -f docker-compose.dev.yml up` starts backend services; frontend runs via `vp dev` with HMR and API proxy.
**Dev/QA:** Railway auto-deploys PR preview environments from GitHub — same services, isolated per PR.

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [api]

  api:
    build: ./api
    environment:
      DATABASE_URL: postgres://gmdss:gmdss@postgres:5432/gmdss
      REDIS_URL: redis://redis:6379
      AI_PROVIDER: local
      LOCAL_STT_URL: http://stt:8000
      LOCAL_TTS_URL: http://tts:5002
    depends_on: [postgres, redis, stt, tts]

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: gmdss
      POSTGRES_PASSWORD: gmdss
      POSTGRES_DB: gmdss
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine

  stt:
    image: fedirz/faster-whisper-server
    environment:
      WHISPER__MODEL: base.en
      WHISPER__DEVICE: cpu

  tts:
    image: rhasspy/piper
    volumes: ["./piper-voices:/data"]

volumes:
  pgdata:
  caddy_data:
```

**Caddyfile** (auto-HTTPS with Let's Encrypt):
```
gmdss.school.example {
    # Serve PWA static files
    handle /api/* {
        reverse_proxy api:4000
    }
    handle /ws/* {
        reverse_proxy api:4000
    }
    handle {
        root * /srv/frontend
        try_files {path} /index.html
        file_server
    }
}
```

### Cloud-Managed Deployment (Option B)

For schools without server infrastructure:

| Component | Platform | Cost | Setup |
|---|---|---|---|
| **Frontend (PWA)** | Cloudflare Pages | Free (unlimited bandwidth) | Connect GitHub repo → auto-deploys on push |
| **Backend + DB + Redis** | Railway | ~$5/month (Hobby plan) | Connect GitHub repo → add PostgreSQL + Redis services → auto-deploys |
| **STT** | Groq Whisper API | Free tier (generous) | Set `GROQ_API_KEY` env var |
| **LLM** | Anthropic Claude or OpenAI | Pay-per-use (~$0.01/scenario) | Set API key env var |
| **TTS** | OpenAI tts-1 | ~$0.001/message | Set `OPENAI_API_KEY` env var |

**Total: ~$5/month base + ~$5–15/month AI API usage** for a 50-student school.

Railway provides: WebSocket support, built-in PostgreSQL and Redis, git-push deploys, one dashboard, one invoice. A non-technical school admin can manage this.

volumes:
  pgdata:
```

---

## 12. Internationalization Strategy

### Phase 1 (MVP): English with i18n scaffolding

- All UI strings extracted to i18next resource files from day one
- Content (lessons, scenarios) stored in a locale-aware structure:
  ```
  content/
    en/
      modules/
      scenarios/
    es/  (future)
    fr/  (future)
  ```
- Radio procedures remain in **English** (international maritime standard) even when UI is translated
- Jurisdiction profiles handle channel variations (US, UK, EU, Asia-Pacific)

### Phase 2 (v2+): Multilingual UI

- Translate UI chrome (navigation, buttons, instructions, feedback)
- Theory content translated per locale
- Scenario briefings translated; **radio communication stays in English** (this is how real maritime radio works internationally)
- STT must handle accented English — model selection should favor accent-robust options

### Jurisdiction Profiles

```json
{
  "jurisdiction_id": "international",
  "label": "International (default)",
  "channel_plan": {
    "16": { "purpose": "Distress, safety, calling", "type": "voice" },
    "70": { "purpose": "DSC", "type": "dsc_only" },
    "06": { "purpose": "Ship-to-ship safety", "type": "voice" },
    "13": { "purpose": "Bridge-to-bridge navigation safety", "type": "voice" },
    "67": { "purpose": "Small craft safety (some regions)", "type": "voice" }
  },
  "calling_channel": 16,
  "dsc_channel": 70,
  "notes": "Regional supplements may assign additional channels for port operations"
}
```

Schools can create custom profiles for their region's specific channel assignments.

---

## 13. Licensing, Privacy, and Compliance

### Code License: AGPLv3

- All application source code under GNU Affero General Public License v3
- Schools running modified versions must make source available to their users
- Compatible with MIT/ISC/Apache dependencies (Radix, Tabler, use-long-press, etc.)
- Content (lessons, scenarios) may be licensed separately (e.g., CC BY-SA 4.0) to allow broader reuse

### Privacy

| Concern | Policy |
|---|---|
| **Voice recordings** | Processed ephemerally. Audio is transcribed and immediately discarded — never stored. |
| **Transcripts** | Text transcripts are **always retained** for graded simulator attempts. This is required for score auditability, instructor review, and offline review. Transcripts are not PII — they contain radio procedure text, not personal information. Students consent to transcript retention when they use the simulator (disclaimer on first use). GDPR deletion requests delete the user account and all associated attempt records including transcripts. |
| **Personal data** | Name, email, progress data stored in school's database. No data shared with third parties beyond AI API calls (which are ephemeral). |
| **AI API calls** | Audio sent to STT provider is subject to their data policy. Self-hosted option eliminates third-party data exposure. |
| **GDPR compliance** | Data export and deletion endpoints. Consent for AI processing. School is data controller; app provider is processor. |
| **Cookies** | Session cookies only; no tracking or analytics cookies. |

### Content Licensing

| Content Source | License | Usage |
|---|---|---|
| FCC VHF channel chart | US Public Domain | Channel data reference |
| USCG NAVCEN procedures | US Public Domain | Procedure templates (paraphrased) |
| ITU-R recommendations (M.493, M.585) | All rights reserved | Reference only — rules implemented in code, not text copied |
| IMO SMCP | Copyrighted | Paraphrased in original content; not embedded verbatim |
| Freesound CC0 audio | CC0 | Radio SFX (static, squelch, beeps) |
| Tabler Icons | MIT | UI icons |
| All original content | CC BY-SA 4.0 (proposed) | Lessons, scenarios, scripts |

---

## 14. Risks and Open Questions

### Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **AI latency too high** | Poor simulator experience | Pipeline streaming; accept 2–3s pause as "radio delay"; local AI option |
| **STT accuracy with accented English** | Unfair scoring for non-native speakers | Use accent-robust models; tolerance in scoring; allow typed fallback |
| **Web Audio API mobile inconsistencies** | Broken audio on some devices | iOS AudioContext.resume() handling; extensive device testing |
| **PWA install adoption** | Students use browser-only, miss offline benefits | Prominent install prompts; instructor guidance |
| **API costs at scale** | Unsustainable for free service | Self-hosted AI option; batched processing; cost monitoring per school |

### Content Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Copyright restrictions on IMO/ITU sources** | Cannot embed authoritative text | Paraphrase everything; cite as references; generate original content |
| **Regional channel variations** | Wrong information for some students | Jurisdiction profiles; clear labeling; "international default" baseline |
| **Procedure variations between administrations** | Scoring penalizes valid regional practice | Flexible scoring rubrics; configurable "required fields" per jurisdiction |

### Resolved Decisions

| Question | Decision | Phase |
|---|---|---|
| MF DSC support | **No.** VHF DSC only. MF is out of scope entirely. | — |
| Custom scenario authoring (instructor editor) | **Not Phase 1.** JSON/YAML file editing is sufficient. In-app editor is a future phase. | Phase 2+ |
| Multiplayer mode (student-to-student practice) | **Not Phase 1.** Valuable but deferred. AI personas are the primary interaction model. | Phase 2+ |
| Physical lab hardware integration | **No.** PC/mobile PWA only. No hardware simulator sync. | — |
| Completion certificates | **No formal certificates.** May add progress badges (e.g., "Tier 2 Complete") as lightweight motivation. Not official credentials. | Phase 1 (optional) |
| AI provider strategy | **Adapter pattern from day one.** All STT/LLM/TTS behind swappable adapters. No single-provider lock-in. | Phase 1 |

### Open Questions

No open questions remain. All decisions resolved.

---

## Appendix A: Scenario Scripts

### Example: Scenario 2.1 — MAYDAY (Fire on Board)

**Briefing:**
> You are the radio operator on M/V BLUE DUCK (callsign 5BCD2, MMSI 211239680).
> You are at position 36°08'N 005°21'W, 12 nautical miles south of Gibraltar.
> A fire has broken out in the engine room. The crew cannot contain it.
> There are 12 persons on board.
> Send a DSC distress alert and follow up with a voice MAYDAY on Channel 16.

**Expected flow:**

| Step | Actor | Action | Channel |
|---|---|---|---|
| 1 | Student | Send DSC distress alert (nature: fire, position: GPS auto, subsequent comms: Ch.16) | Ch.70 |
| 2 | System | DSC alert transmitted animation + switch to Ch.16 | Ch.70 → Ch.16 |
| 3 | Student | Voice MAYDAY call | Ch.16 |
| 4 | AI (MRCC) | Acknowledge MAYDAY, request additional info | Ch.16 |
| 5 | Student | Provide additional info (confirm persons, describe fire, abandoning?) | Ch.16 |
| 6 | AI (MRCC) | Confirm SAR assets dispatched, impose SEELONCE MAYDAY | Ch.16 |
| 7 | Student | Acknowledge | Ch.16 |

**Expected MAYDAY script (template):**
```
MAYDAY MAYDAY MAYDAY
THIS IS
Motor Vessel BLUE DUCK BLUE DUCK BLUE DUCK
Callsign Five Bravo Charlie Delta Two
MMSI Two One One Two Three Nine Six Eight Zero
MAYDAY Motor Vessel BLUE DUCK
My position is Three Six Degrees Zero Eight Minutes North
Zero Zero Five Degrees Two One Minutes West
I am on fire in the engine room, fire is not contained
I require immediate assistance, fire fighting and rescue
Twelve persons on board
OVER
```

**Scoring rubric for Step 3:**
- MAYDAY spoken 3 times: **required**
- THIS IS present: **required**
- Vessel name spoken 3 times: **required**
- Callsign or MMSI: **required** (at least one)
- Position: **required** (lat/long or bearing/distance from known point)
- Nature of distress (fire): **required**
- Assistance required: **required**
- Persons on board: **required**
- OVER at end: **expected**

**AI response if student passes (Step 4):**
```
MAYDAY
Motor Vessel BLUE DUCK, THIS IS
Tarifa Rescue Coordination Centre
RECEIVED MAYDAY
Confirm twelve persons on board
What is the state of the fire
Are you preparing to abandon
OVER
```

**AI response if student misses critical fields:**
```
Motor Vessel BLUE DUCK, THIS IS
Tarifa Rescue Coordination Centre
RECEIVED your MAYDAY
SAY AGAIN your position
SAY AGAIN number of persons on board
OVER
```

### Example: Scenario 1.1 — Radio Check

**Briefing:**
> You are M/V NORDIC STAR (callsign PHQR, MMSI 244650123).
> Perform a radio check with the nearest coast station.
> Use the appropriate working/calling channel for your jurisdiction (not Channel 16 — that is reserved for distress, safety, and calling only).
> Your jurisdiction profile indicates Channel 09 as the appropriate channel for radio checks.

**Expected flow:**

| Step | Actor | Action | Channel |
|---|---|---|---|
| 1 | Student | Select correct channel for radio check (Ch.09 or jurisdiction-designated) | Ch.09 |
| 2 | Student | Call coast station for radio check | Ch.09 |
| 3 | AI (Coast Station) | Respond with signal report | Ch.09 |
| 4 | Student | Acknowledge and close | Ch.09 |

**Scoring note:** If student attempts radio check on Ch.16, the session engine flags a **channel selection error** and the AI (as coast station) responds: "NORDIC STAR, this is Valencia Radio. Channel one six is for distress and safety. Switch to channel zero nine for radio check. OVER." This is a teaching moment, not an automatic fail — but costs points on the channel correctness dimension.

**Expected script (Step 2):**
```
Valencia Radio Valencia Radio Valencia Radio
THIS IS
Motor Vessel NORDIC STAR NORDIC STAR NORDIC STAR
Callsign Papa Hotel Quebec Romeo
Radio check on channel zero nine
OVER
```

**AI response (Step 3):**
```
Motor Vessel NORDIC STAR THIS IS
Valencia Radio
Reading you loud and clear on channel zero nine
OVER
```

**Expected response (Step 4):**
```
Valencia Radio THIS IS NORDIC STAR
Thank you
OUT
```

---

## Appendix B: Asset Catalog Summary

Detailed in `docs/deep-research-report.md`. Key MVP assets:

| Asset | License | Use |
|---|---|---|
| FCC Marine VHF Channels PDF | US Public Domain | Channel data |
| USCG NAVCEN MAYDAY procedure | US Public Domain | Procedure reference |
| Freesound "continuous static.wav" | CC0 | Background radio noise |
| Freesound "Radio Sign Off / Squelch" | CC0 | PTT release sound |
| Freesound "Walkie Talkie Beep" | CC0 | Alert/call cue |
| Tabler Icons | MIT | UI icons |
| Radix UI Primitives | MIT | Accessible base components |
| use-long-press | MIT | Distress button 5s hold detection |
| wavesurfer.js | BSD-3 | Audio playback review |

---

*This document is intended as a foundation for a formal PRD. It should be reviewed with maritime training instructors, ROC examiners, and the development team before finalizing scope and priorities.*
