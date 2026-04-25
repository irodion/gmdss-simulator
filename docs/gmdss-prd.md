# Product Requirements Document: GMDSS VHF Radio Simulator

> **Version:** 1.6
> **Date:** 2026-04-05
> **Status:** Draft
> **License:** AGPLv3 (code) / CC BY-SA 4.0 (content)

---

## 1. Executive Summary

**GMDSS Simulator** is an open-source Progressive Web App that helps students preparing for the Restricted Operator Certificate (ROC) bridge the gap between classroom radio theory and real-world VHF communication practice. The application combines structured learning modules with a realistic, AI-powered VHF radio simulator where students speak into a virtual radio and receive protocol-correct responses from AI-driven station personas (coast guard, port control, other vessels).

The product is designed as a **school-integrated training service** — not a standalone course replacement. Maritime training institutions deploy it for their students, who use it to study theory at their own pace and practice radio procedures through progressively challenging AI-driven scenarios. The simulator uses a half-duplex voice loop (student speaks → AI transcribes, evaluates, generates response, and voices it) that mirrors real VHF radio behavior.

The MVP delivers four theory modules (VHF fundamentals, MMSI/DSC, distress/urgency/safety procedures, SAR equipment), guided voice drills, and a four-tier AI radio simulator with 25 scenarios — from basic radio checks through full SAR coordination exercises. The application is internationally portable through jurisdiction profiles, English-first with multilingual scaffolding, and self-hostable under AGPLv3.

---

## 2. Mission

### Mission Statement

Empower maritime radio students to develop confident, correct VHF communication skills through AI-powered practice that is accessible anywhere, on any device, at any time.

### Core Principles

| #   | Principle                            | Meaning                                                                                                                      |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Radio-first**                      | The simulator is the star feature. Theory exists to prepare students for the simulator, not the other way around.            |
| 2   | **Internationally portable**         | Not tied to one country's exam or channel plan. Jurisdiction profiles make the app adaptable to any maritime administration. |
| 3   | **School-integrated**                | Designed as an institutional service with user accounts, progress tracking, and instructor visibility — not a consumer app.  |
| 4   | **Offline-capable, online-enhanced** | Theory, drills, and quizzes work offline. The AI radio simulator requires connectivity. Honest about what needs the network. |
| 5   | **Open source**                      | AGPLv3 code. Schools can inspect, modify, and self-host. AI providers are swappable. No vendor lock-in.                      |

---

## 3. Target Users

### Primary: ROC Student

| Attribute             | Detail                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Who**               | Student enrolled in a maritime training institution's ROC (Restricted Operator Certificate) course                                                                                                     |
| **Goal**              | Pass both the written theory exam and the practical radio assessment                                                                                                                                   |
| **Background**        | Career mariners, recreational boaters, yacht crew — varies widely                                                                                                                                      |
| **Technical comfort** | Comfortable with smartphones and web apps; not expected to be technical                                                                                                                                |
| **Language**          | English proficiency varies; maritime English is the working standard, but many students are non-native speakers                                                                                        |
| **Devices**           | Smartphone, tablet, or laptop — often with limited connectivity at sea or in training facilities                                                                                                       |
| **Pain points**       | Limited access to hardware radio simulators; memorizes procedures but struggles under real-time pressure; cannot practice at home; anxiety about speaking on the radio for the first time during exams |

### Secondary: Instructor

| Attribute       | Detail                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Who**         | Maritime radio training instructor at a school or academy                                                                                 |
| **Goal**        | Monitor student progress, identify weak areas, ensure students are exam-ready                                                             |
| **Needs**       | Dashboard showing per-student and class-wide progress; ability to assign specific scenarios; exportable progress reports                  |
| **Pain points** | Cannot easily track student practice outside scheduled lab sessions; difficult to identify which students need extra help before exam day |

### Usage Contexts

- **In classroom**: Instructor projects scenarios; students follow along or practice individually on their devices
- **At home/dormitory**: Students work through theory modules and attempt drills
- **On board vessels**: Students practice during downtime (offline theory; online simulator when connectivity allows)
- **Before exams**: Intensive simulator practice with increasing difficulty

---

## 4. MVP Scope

### In Scope (Phase 1)

**Core Learning:**

- ✅ Module 1: VHF Radio Fundamentals (6 lessons + checkpoint quiz)
- ✅ Module 2: MMSI and Digital Selective Calling (6 lessons + checkpoint quiz)
- ✅ Module 3: Distress, Urgency, Safety, and Medical Procedures (7 lessons + checkpoint quiz)
- ✅ Module 4: SAR Equipment and Procedures (7 lessons + checkpoint quiz)
- ✅ Guided Voice Drills (phonetic alphabet, script reading, channel selection — unlocked after Module 1)

**Interactive Tools:**

- ✅ Channel Explorer with jurisdiction profile filter
- ✅ MMSI Decoder interactive tool
- ✅ DSC Builder (distress/urgency/safety/routine)
- ✅ Script Builder (MAYDAY, PAN PAN, SECURITE, MEDICO)

**Simulator:**

- ✅ VHF radio panel UI (SVG/CSS hybrid faceplate with DOM controls)
- ✅ Half-duplex AI voice loop (STT → Evaluate → LLM → TTS)
- ✅ 5 station personas (MRCC, Port Control, Vessel, Coast Station, Fishing Vessel)
- ✅ 25 scenarios across 4 difficulty tiers
- ✅ Deterministic scoring via versioned rubrics (LLM generates responses, not scores)
- ✅ After-action review with transcript, per-dimension scores, and feedback
- ✅ Degraded/fallback UX for latency spikes and AI failures
- ✅ Simplified accessibility mode (standard form controls alternative to skeuomorphic panel)

**Technical:**

- ✅ PWA with offline support for theory/drills/quizzes (Workbox service worker)
- ✅ 5-layer frontend architecture (radio-domain, session-engine, audio-engine, transport/adapters, ui-shell)
- ✅ Web Audio API radio effects chain (bandpass, compression, noise, squelch)
- ✅ Swappable AI provider adapters (STT, LLM, TTS)
- ✅ i18n scaffolding (i18next, locale-aware content structure)
- ✅ Jurisdiction profiles (international default + customizable)

**Accounts & Infrastructure:**

- ✅ User accounts with email/password + optional TOTP 2FA
- ✅ Student progress tracking (module completion, quiz scores, simulator attempts)
- ✅ PostgreSQL database, Redis session management
- ✅ Docker Compose for self-hosted deployment
- ✅ Auditable attempt records (18 fields including provider versions, rubric versions, STT confidence)

### Out of Scope (Post-MVP / v2+)

- ❌ Instructor dashboard (class analytics, scenario assignment, progress reports)
- ❌ Custom scenario authoring (in-app editor for instructors)
- ❌ Multiplayer mode (student-to-student radio practice)
- ❌ Multilingual UI translations
- ❌ Offline simulator mode (typed or pre-scripted)
- ❌ Exam practice mode with timed constraints
- ❌ MF DSC simulation
- ❌ HF/Inmarsat/NBDP (GOC scope)
- ❌ Integration with physical lab hardware simulators (out of scope entirely — PC/mobile only)
- ❌ Formal completion certificates (may add lightweight progress badges like "Tier 2 Complete")

---

## 5. User Stories

### Student Stories

**US-1: Learn VHF channel system**

> As a ROC student, I want to explore VHF channels filtered by purpose and jurisdiction, so that I know which channel to use for each type of communication.
>
> _Example: Student selects "International" jurisdiction, filters for "Distress/Safety" channels, and sees Ch.16 and Ch.70 with explanations of their specific purposes and restrictions._

**US-2: Practice phonetic alphabet early**

> As a ROC student, I want to practice spelling callsigns and positions using the phonetic alphabet on the simulated radio, so that I build mic confidence before full scenarios.
>
> _Example: After completing Module 1, student opens Guided Voice Drills, sees "Spell: PHQR", presses PTT, says "Papa Hotel Quebec Romeo", and gets immediate feedback on accuracy._

**US-3: Build a MAYDAY script**

> As a ROC student, I want to fill in vessel details and generate a complete MAYDAY script, so that I can study and practice the correct message structure before speaking it live.
>
> _Example: Student enters vessel name "BLUE DUCK", position "36°08'N 005°21'W", nature "fire", persons "12" — the Script Builder generates the full MAYDAY text with correct prowords and field order._

**US-4: Practice distress scenario with AI**

> As a ROC student, I want to send a DSC distress alert and follow up with a voice MAYDAY call where a simulated coast guard station responds to me, so that I experience realistic radio pressure before my practical exam.
>
> _Example: Student loads "MAYDAY — Fire on Board" scenario, holds DSC Distress for 5 seconds, radio auto-switches to Ch.16, student presses PTT and delivers MAYDAY, AI coast guard acknowledges and asks follow-up questions._

**US-5: Review my performance**

> As a ROC student, I want to see a detailed transcript of my radio exchange with per-field scoring and specific feedback on what I missed, so that I know exactly what to improve.
>
> _Example: After-action review shows: overall 82%, "Required fields: 90% — missing: persons on board", "Sequence: 80% — position stated before vessel ID", with a "Retry" button._

**US-6: Study offline on board**

> As a ROC student on a vessel with limited connectivity, I want to review theory modules, take quizzes, and study my previous simulator transcripts offline, so that I can make progress during downtime at sea.
>
> _Example: Student opens the PWA offline, sees a chip saying "Offline — simulator unavailable", and continues working through Module 3 quizzes and reviewing their best MAYDAY attempt transcript._

**US-7: Progress through increasing difficulty**

> As a ROC student, I want the simulator to start with simple radio checks and gradually introduce complex multi-party distress scenarios, so that I build skills progressively without being overwhelmed.
>
> _Example: Student completes 4 of 5 Tier 1 scenarios (≥80%), which unlocks Tier 2 (distress/urgency/safety scenarios with DSC→voice flows and branching)._

### Technical Stories

**US-8: Self-host for data privacy**

> As a maritime school administrator, I want to deploy the entire application on our own server with local AI models, so that student voice data never leaves our network.
>
> _Example: Admin runs `docker compose up` with `AI_PROVIDER=local`, configuring faster-whisper for STT, Llama for LLM, and Piper for TTS — all on school hardware, no GPU required._

---

## 6. Core Architecture & Patterns

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (PWA)                          │
│                                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Theory  │  │ Drills & │  │   VHF Radio Simulator  │ │
│  │ Modules │  │ Quizzes  │  │                        │ │
│  │(offline)│  │(offline) │  │  5-Layer Architecture  │ │
│  └─────────┘  └──────────┘  └───────────┬────────────┘ │
│                                         │              │
│  ┌────────────────────┐                 │ WebSocket    │
│  │ Service Worker     │                 │              │
│  │ (Workbox)          │                 │              │
│  └────────────────────┘                 │              │
│  ┌────────────────────┐                 │              │
│  │ IndexedDB          │                 │              │
│  └────────────────────┘                 │              │
└─────────────────────────────────────────┼──────────────┘
                                          │ HTTPS / WSS
┌─────────────────────────────────────────┼──────────────┐
│                    SERVER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Auth Service │  │ Sim Engine   │  │ Progress     │  │
│  │ (login/2FA)  │  │ STT→Eval→   │  │ Sync API     │  │
│  │              │  │ LLM→TTS     │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐                    ┌──────────────┐  │
│  │ Content API  │                    │ PostgreSQL   │  │
│  └──────────────┘                    └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Simulator 5-Layer Architecture

The simulator's most critical architectural decision: **separate the deterministic radio/scenario logic from the AI layer.** The radio panel must work reliably even when AI is slow or fails. Scoring must be deterministic and auditable.

| Layer | Name                        | Responsibility                                                                                                                  | Dependencies                        |
| ----- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 1     | **Radio Domain**            | Pure TypeScript state model: channel, power, squelch, dual-watch, TX/RX, DSC form. No React, no audio, no sockets.              | None                                |
| 2     | **Session Engine**          | Scenario state machine, branching rules, deterministic rubric scoring, jurisdiction-aware rules. Source of truth for pass/fail. | Layer 1                             |
| 3     | **Audio Engine**            | AudioContext, mic capture, radio DSP chain (bandpass, compression, noise, squelch), playback.                                   | None (receives events from Layer 1) |
| 4     | **Transport / AI Adapters** | WebSocket session, swappable STT/LLM/TTS adapters. Converts audio to API calls, returns structured results.                     | External AI services                |
| 5     | **UI Shell**                | React components. Subscribes to state, dispatches commands. Purely presentational.                                              | Layers 1–4                          |

**Key constraint:** Layer 2 (session engine) never calls an AI model for scoring decisions. The LLM generates natural-language responses and qualitative feedback. All pass/fail scoring uses versioned deterministic rubrics.

### Directory Structure

```
src/
  features/radio/
    domain/                    # Layer 1: Radio Domain
      radio-machine.ts
      radio-types.ts
      radio-commands.ts
      radio-selectors.ts
    session/                   # Layer 2: Session Engine
      scenario-machine.ts
      rubric-engine.ts
      jurisdiction-rules.ts
      scenario-types.ts
    audio/                     # Layer 3: Audio Engine
      audio-engine.ts
      tx-capture.ts
      radio-effects.ts
      playback-queue.ts
    transport/                 # Layer 4: AI Adapters
      sim-socket.ts
      stt-adapter.ts
      llm-adapter.ts
      tts-adapter.ts
    ui/                        # Layer 5: UI Shell
      RadioPanel.tsx
      RadioDisplay.tsx
      ChannelControl.tsx
      VolumeKnob.tsx
      SquelchKnob.tsx
      PttButton.tsx
      DscControls.tsx
      SignalIndicators.tsx
      ScenarioBriefing.tsx
      TranscriptView.tsx
      DebriefPanel.tsx

  features/learning/
    modules/                   # Theory content renderer
    quizzes/                   # Quiz engine
    drills/                    # Guided voice drills
    tools/                     # Channel Explorer, MMSI Decoder, Script Builder

  features/auth/               # Login, registration, 2FA
  features/progress/           # Progress tracking, sync

  content/
    en/
      modules/                 # Lesson content (JSON/Markdown)
      scenarios/               # Scenario definitions (JSON)
      rubrics/                 # Scoring rubrics (JSON, versioned)
      jurisdictions/           # Channel plans per region (JSON)
```

### Key Design Patterns

- **State machine** (XState or custom reducer) for radio domain and scenario progression — impossible to represent invalid TX/RX/processing states
- **Adapter pattern** for all AI services — swap providers without touching business logic
- **Event sourcing** for radio interactions — all channel changes, PTT events, DSC actions logged as domain events for scoring and replay
- **Cache-first with versioned content** — theory and quiz content served from cache, updated in background
- **Separation of clean and effected audio** — mic captured clean for STT, processed through radio DSP for student monitoring

---

## 7. Tools/Features

### 7.1 Theory Modules

Four sequential modules with gated progression (≥70% checkpoint quiz to advance).

| Module                                 | Lessons                                                                                                            | Key Interactive Elements                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| **1. VHF Radio Fundamentals**          | 6 lessons: radio basics, panel controls, channel system, call procedure, radio discipline, watchkeeping            | Interactive radio panel tutorial, Channel Explorer, phonetic alphabet quiz, sequencing drills |
| **2. MMSI and DSC**                    | 6 lessons: MMSI structure, DSC overview, distress alerts, urgency/safety/routine, false alerts, DSC→voice workflow | MMSI Decoder tool, DSC Builder, scenario classification drills                                |
| **3. Distress/Urgency/Safety/Medical** | 7 lessons: priority, MAYDAY, MAYDAY RELAY, PAN PAN, SECURITE, MEDICO, responding to distress                       | Script Builder (MAYDAY/PAN PAN/SECURITE/MEDICO), response construction drills                 |
| **4. SAR Equipment**                   | 7 lessons: EPIRB, SART, radar reflectors, GPS, PLBs, SAR coordination, pyrotechnics                                | Diagram labeling, radar display recognition, position format drills                           |

### 7.2 Guided Voice Drills (Unlocked after Module 1)

Early radio exposure to reduce mic anxiety. Uses STT with deterministic rubrics — no LLM needed.

| Drill                          | Description                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Phonetic Alphabet Readback     | Display word/callsign → student spells phonetically → STT checks                                 |
| Script Reading                 | Display complete radio script → student reads aloud with PTT → system checks pacing/completeness |
| Channel Selection + Short Call | "Call port control on channel 12" → student selects channel, speaks opening line                 |
| Number Pronunciation           | Display lat/long position → student reads using maritime number pronunciation                    |

### 7.3 VHF Radio Simulator

**Radio Panel Controls:**

| Control                        | Behavior                                                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Channel selector (knob or ▲/▼) | Channels 1–88, display shows number + frequency                                                                                                                                                                                              |
| Volume knob                    | Controls incoming audio and noise volume                                                                                                                                                                                                     |
| Squelch knob                   | Noise gate threshold (affects ambient static level)                                                                                                                                                                                          |
| PTT button                     | Hold to transmit (pointer capture on touch, spacebar on desktop)                                                                                                                                                                             |
| 16/9 quick button              | Jump to Ch.16 or Ch.9                                                                                                                                                                                                                        |
| Dual Watch toggle              | Monitor Ch.16 while on working channel                                                                                                                                                                                                       |
| H/L power toggle               | 25W / 1W (visual in simulator)                                                                                                                                                                                                               |
| DSC DISTRESS (hold 5s)         | Protected by flip cover (tap to lift). Hold 5s to send alert. If nature pre-selected via menu, included; otherwise "undesignated." Auto-sends on Ch.70, auto-switches to Ch.16. Auto-repeats every 3.5–4.5 min until acknowledged/cancelled. |
| Ch.70 voice guard              | PTT blocked on Ch.70 — display shows "DSC ONLY." Scored as channel error.                                                                                                                                                                    |
| DSC CALL/MENU/ENT              | Navigate DSC menus for non-distress calls                                                                                                                                                                                                    |
| Signal strength meter          | Visual indicator (controlled by scenario)                                                                                                                                                                                                    |
| TX/RX LED indicators           | Light during transmit/receive                                                                                                                                                                                                                |

**Half-Duplex Voice Loop:**

```
Student presses PTT → mic captures clean audio
Student releases PTT → audio sent to server via WebSocket
  → STT transcribes speech
  → Session engine evaluates transcript (deterministic rubric)
  → LLM generates station response (persona-specific)
  → TTS converts response to audio
  → Audio streamed back with radio DSP effects
Student hears AI response through "radio"
```

**Audio Processing Chain:**

- Outgoing: clean capture for STT + bandpass/compression monitor for student
- Incoming: TTS → bandpass (300–3400 Hz) → distortion → compression (12:1) → noise mix → speakers
- Ambient: filtered static noise loop, level inverse to squelch setting

### 7.4 Scenario Tiers

| Tier                   | Unlock                      | Count | Type                                                                                                           | Hints                                                   |
| ---------------------- | --------------------------- | ----- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **1. Foundation**      | After Module 2              | 5     | Single-exchange routine (radio check, channel change, port entry, position report, SECURITE reception)         | Full hints + script reference                           |
| **2. Priority Comms**  | After Module 3 + 80% Tier 1 | 8     | Distress/urgency/safety origination and response (MAYDAY, PAN PAN, SECURITE, MAYDAY RELAY, acknowledgment)     | Hints with 10% penalty; script reference Tiers 1–2 only |
| **3. Complex**         | After Module 3 + 80% Tier 2 | 8     | Multi-step with branching (full SAR, false alert cancellation, priority escalation, multi-vessel coordination) | Hints with 10% penalty; no script reference             |
| **4. Exam Simulation** | After Module 4 + 80% Tier 3 | 4     | Timed, unguided, random scenarios mirroring practical exam conditions                                          | No hints, no reference                                  |

### 7.5 Station Personas

| Persona            | Role                                  | Voice Character               |
| ------------------ | ------------------------------------- | ----------------------------- |
| Coast Guard / MRCC | Distress response, SAR coordination   | Authoritative, calm, measured |
| Port Control / VTS | Vessel traffic, port entry            | Professional, brisk           |
| Another Vessel     | Ship-to-ship, assistance, relay       | Varies (accent, pace)         |
| Coast Station      | Routine calls, weather                | Neutral, procedural           |
| Fishing Vessel     | Safety messages, informal-but-correct | Casual tone                   |

### 7.6 Scoring System

**Five dimensions, deterministic rubric:**

| Dimension                 | Weight | What's Checked                                                                                                                                                                           |
| ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required fields           | 30%    | All mandatory fields present (vessel name, callsign/MMSI, position, nature, assistance, persons)                                                                                         |
| Correct prowords          | 20%    | Correct signal word (MAYDAY/PAN PAN/SECURITE), THIS IS, OVER, OUT                                                                                                                        |
| Sequence                  | 20%    | Fields in correct order per message structure                                                                                                                                            |
| Channel correctness       | 15%    | On the right channel for this communication type. Includes: no voice on Ch.70 (DSC only), no routine radio checks on Ch.16, correct working channel for scenario.                        |
| Clarity _(advisory only)_ | 0%     | **Not scored.** LLM provides qualitative feedback on pacing, hesitation, completeness. Appears in after-action review as coaching text. Zero numeric weight — does not affect pass/fail. |

**Scoring is fully deterministic.** All graded dimensions (required fields, prowords, sequence, channel) use regex/pattern matching on the transcript. Same transcript + same rubric = same score. The LLM is never in the scoring loop — it only generates station responses and advisory feedback text.

**Graded weight redistribution** (4 scored dimensions, totaling 100%): Required fields 35%, Prowords 25%, Sequence 25%, Channel 15%.

**Additional procedural rules enforced by session engine:**

- **DSC acknowledgment rule:** Ships must NOT send DSC distress acknowledgments — only coast stations. In response scenarios (Tier 2: 2.7), attempting a DSC ack instead of voice response on Ch.16 is flagged as a procedural error.
- **Ch.70 voice guard:** PTT is blocked on Ch.70. Attempting voice transmission is scored as a channel error.
- **Distress auto-repeat:** After DSC distress alert, the radio auto-repeats every 3.5–4.5 minutes. Student should begin voice MAYDAY immediately, not wait for DSC acknowledgment.

---

## 8. UI Design Specification (from Mockups)

> Reference mockups: `docs/mockups/`. The concept sketch is `ui-concept-radio-training-dashboard.svg`. The detailed component mockup is `gemini-ui-component.html`. Additional wireframes cover dashboard, desktop simulator, mobile simulator, and polished desktop views.

### 8.1 Application Shell — Three-Column Desktop Layout

Derived from all mockups consistently:

```
┌──────────────────────────────────────────────────────────────┐
│  TOP BAR                                                      │
│  [Brand: "GMDSS Simulator"] [Subtitle] ... [Online] [Ch 16]  │
├────┬─────────────────────────────────────────┬───────────────┤
│    │                                         │               │
│ S  │         MAIN PANEL                      │  SIDE COLUMN  │
│ I  │         (Radio Console +                │  (Briefing +  │
│ D  │          Feedback)                      │   Transcript  │
│ E  │                                         │   + Scoring)  │
│ B  │                                         │               │
│ A  │                                         │               │
│ R  │                                         │               │
│    │                                         │               │
└────┴─────────────────────────────────────────┴───────────────┘
```

**Implementation specs (from `gemini-ui-component.html`):**

| Element     | CSS Grid                                           | Sizing                                   |
| ----------- | -------------------------------------------------- | ---------------------------------------- |
| App shell   | `grid-template-columns: 88px minmax(0, 1fr) 312px` | `grid-template-rows: 65px 1fr`           |
| Top bar     | `grid-column: 1 / -1`                              | Height: 65px, border-bottom: 2px solid   |
| Sidebar     | 88px width, rounded (18px), vertical flex column   | Full height minus top bar                |
| Main panel  | Flexible center column                             | Houses console shell + feedback card     |
| Side column | 312px fixed width                                  | Briefing card + transcript card, stacked |

**Responsive breakpoint** (`max-width: 1180px`):

- Grid collapses to `78px 1fr`
- Side column moves below main panel: `grid-column: 1 / -1`, horizontal flex
- Briefing and transcript cards sit side-by-side

### 8.2 Sidebar Navigation

Consistent across all mockups — vertical icon-block navigation:

| Block      | Label        | Sub-label          | State                                           |
| ---------- | ------------ | ------------------ | ----------------------------------------------- |
| Logo       | "G"          | —                  | Orange gradient background, always visible      |
| Learn      | "Learn"      | "12/18" (progress) | Default: dark card                              |
| Drill      | "Drill"      | "08/10" (progress) | Default: dark card                              |
| **Sim**    | "Sim"        | "live mode"        | **Active state**: orange glow border, orange bg |
| Ref        | "Ref"        | "SMCP"             | Default: dark card                              |
| _(spacer)_ | —            | —                  | flex: 1                                         |
| Me         | Profile icon | "Me"               | Bottom of sidebar                               |

**Active state** (from detailed mockup): orange `box-shadow: 0 0 18px rgba(255, 142, 85, 0.35)` ring around the block.

**Implementation steps:**

- ✅ Create `NavSidebar` component with vertical flex layout
- ✅ Each nav block: 62px wide, 14px border-radius, inner shadow + gradient
- ✅ Active block gets orange ring via `::before` pseudo-element
- ✅ Progress counters (e.g., "12/18") pulled from user progress state
- ✅ Spacer element pushes profile block to bottom

### 8.3 Top Bar

| Element      | Position    | Details                                           |
| ------------ | ----------- | ------------------------------------------------- |
| Brand title  | Left        | "GMDSS Simulator" — 28–31px, bold, white          |
| Subtitle     | After title | "Live training mode / ROC practice" — 14px, muted |
| Status pills | Right       | Inline flex, pill-shaped (border-radius: 999px)   |

**Status pills** (from mockup):

- "Online" pill with green dot (`#57F04F`, `box-shadow: 0 0 12px rgba(87, 240, 79, 0.8)`)
- "Ch 16" pill showing current channel (updates with radio state)
- Optional "Hebrew UI" pill (locale indicator for multilingual readiness)

**Implementation steps:**

- ✅ Create `TopBar` component with flex `space-between`
- ✅ `StatusPill` sub-component: gradient bg, border, optional blinking indicator dot
- ✅ Channel pill subscribes to Layer 1 radio domain state

### 8.4 Radio Console (Main Panel)

The centerpiece. From `gemini-ui-component.html` — a **metal-framed console shell** containing the radio body.

**Console shell** (outer frame):

- Metallic gradient: `linear-gradient(135deg, #7d8188, #585c63 52%, #383c43)`
- Border: `1.2px solid #6a7078`
- Inner highlight: `::before` with `border: 1px solid rgba(255, 255, 255, 0.18)`
- Contains: console-top label, radio-body, feedback-card
- Physical details: **mic jack** protruding from right side (decorative `aria-hidden`)

**Radio body** (inner panel):

- Metallic gradient: `linear-gradient(135deg, #8b8e94, #666a70 12%, #50555b 48%, #2e333a)`
- Corner **screws** (4x): 16px circles with center dot — purely decorative
- Contains: screen-row, button-row, lower-zone (DSC + PTT)

**Implementation steps:**

- ✅ `ConsoleShell` component: outer metallic frame with CSS gradients
- ✅ `RadioBody` component: inner panel with screws, houses all controls
- ✅ Decorative mic jack element (right side, `aria-hidden="true"`)
- ✅ All decorative elements use `aria-hidden` for accessibility

### 8.5 LCD Display and Knobs (Screen Row)

Three-column grid: VOL knob — LCD — SQL knob.

**LCD Display:**

- Green gradient: `linear-gradient(180deg, #B6E0AA, #A7D798 55%, #95CA89)`
- Dot-matrix texture overlay via `radial-gradient` pattern (6px grid, 0.32 opacity)
- Rounded: 14px border-radius
- **Content lines:**
  - Main: `CH 16  156.800` — 27px monospace
  - Sub: `DUAL WATCH: OFF` — 14px monospace
  - Footer: `PWR 25W  SQL 04  GPS LOCK` — 14px monospace with GPS icon

**Rotary knobs (VOL/SQL):**

- 86px diameter, layered radial gradients for 3D metallic appearance
- Tick marks around circumference via `mask: repeating-conic-gradient`
- White indicator line showing current position
- Label below: "VOL" / "SQL" — 13px
- Scale marks: "0" and "100" at extremes

**Implementation steps:**

- ✅ `RadioDisplay` (LCD): CSS-only with gradient bg + dot-matrix overlay + monospace text
- ✅ LCD subscribes to Layer 1 radio state (channel, dual watch, power, squelch, GPS lock)
- ✅ `VolumeKnob` and `SquelchKnob`: custom `RotaryKnob` component (CSS radial-gradient + pointer events + atan2 rotation) with:
  - Radial gradient for 3D metallic look
  - Tick marks via CSS conic gradients
  - Indicator line rotation via CSS transform
  - Keyboard accessible (arrow keys change value)
- ✅ Screen row layout: `grid-template-columns: 122px 1fr 122px`

### 8.6 Button Row

Five equally-spaced control buttons in a grid:

| Button | Label    | Function                    |
| ------ | -------- | --------------------------- |
| 1      | `16 / 9` | Quick-jump to Ch.16 or Ch.9 |
| 2      | `DUAL`   | Toggle dual watch           |
| 3      | `H/L`    | Toggle high/low power       |
| 4      | `CH +`   | Channel up                  |
| 5      | `CH -`   | Channel down                |

**Button style** (from detailed mockup):

- Height: 49px, border-radius: 14px
- Gradient: `linear-gradient(180deg, #48505d, #2d333c 45%, #1a1f26)`
- Inset border: `1px solid rgba(83, 103, 125, 0.65)` via `::before`
- Subtle orange glow at bottom edge: `::after` pseudo-element

**Implementation steps:**

- ✅ `RadioButton` component: reusable for all 5 buttons
- ✅ CSS gradient + shadow + orange bottom glow via pseudo-elements
- ✅ Each button dispatches a Layer 1 radio command (e.g., `{ type: 'SET_CHANNEL', channel: 16 }`)
- ✅ `grid-template-columns: repeat(5, 1fr)`, gap: 12px

### 8.7 DSC Controls and PTT (Lower Zone)

Two-column layout: DSC box (left) + PTT button (right).

**DSC Box:**

- Dark recessed panel: `linear-gradient(135deg, #171b20, #0f1217)`, border-radius: 17px
- Title: "DSC CONTROLS" — 14px
- **DISTRESS button**: 165px wide, raised metallic frame with inset red panel
  - **Flip cover** (default closed): red semi-transparent overlay with "LIFT TO ACCESS" label. Tap to animate open (hinge rotation). Matches real radio spring-loaded flip cover.
  - Outer: `linear-gradient(180deg, #55595f, #474c53)`
  - Inner red: `linear-gradient(180deg, #8b5452, #734341)`
  - Label: "DISTRESS HOLD 5s" — 14px white (visible only when cover is open)
  - During hold: countdown overlay "5... 4... 3... 2... 1..." + progress ring animation + audible countdown tone
- **CALL / MENU buttons**: 74px each, same style as radio buttons but smaller (35px height)
- **Status line**: `MMSI 211239680  UTC 14:35  AUTO-SWITCH READY` — 11px monospace

**PTT Button:**

- 110px diameter circle
- Orange radial gradient: `radial-gradient(circle at 38% 28%, #f7b164, #d77a34 52%, #843a17)`
- Outer glow: `box-shadow: 0 0 30px rgba(255, 122, 53, 0.35)`
- Halo via `::before`: radial gradient extending 16px beyond button
- Inner label: "PTT" — 18px bold
- Sub-label: "PRESS AND HOLD" (hidden in compact layout)

**Implementation steps:**

- ✅ `DscControls` component: dark recessed panel containing distress + call/menu buttons
- ✅ `DistressFlipCover` component: simulated spring-loaded cover. Tap/click to lift (animation). Must be open before distress button is pressable.
- ✅ `DistressButton` component: 5-second hold detection via `use-long-press` hook (MIT), metallic frame + red inner panel
  - Only active when flip cover is open
  - Hold timer: visual feedback (countdown + progress ring during 5s hold + audible countdown tone)
  - If nature of distress was pre-selected via DSC menu, send enhanced alert; otherwise send "undesignated"
  - On complete: auto-transmit on Ch.70, auto-switch to Ch.16, start 3.5–4.5 min repeat timer
  - On complete: dispatch `SUBMIT_DSC_ALERT` command
  - Confirmation dialog before sending
- ✅ `PttButton` component: large circular orange button
  - Pointer capture on `pointerdown` (touch/mouse unified)
  - Keyboard: spacebar hold
  - States: idle (orange), active/transmitting (brighter + scale pulse), disabled (grayed)
  - On press: dispatch `PRESS_PTT` → Layer 3 starts capture
  - On release: dispatch `RELEASE_PTT` → Layer 3 stops capture, Layer 4 sends audio
- ✅ Lower zone layout: `grid-template-columns: 333px 1fr`

### 8.8 Feedback Card (Below Console)

Inline feedback during/after scenario, below the radio body within the console shell.

- Border-radius: 22px, dark background
- Title: "Live Feedback" — 16px bold
- **Scoring dimension chips**: "Required fields", "Prowords", "Sequence", "Channel", "Clarity"
  - Pill style: `border-radius: 999px`, blue-tinted gradient, 13px text
- **Feedback text**: "Prompting tip: after the MAYDAY call, be ready to restate position..." — 16px

**Implementation steps:**

- ✅ `FeedbackCard` component: displays after each student transmission
- ✅ Dimension chips highlight which areas were scored (color-code: green=pass, orange=partial, red=miss)
- ✅ Feedback text from Layer 2 session engine (deterministic) + Layer 4 LLM (qualitative)
- ✅ Updates in real-time as turns complete

### 8.9 Side Column — Scenario Briefing Card

Right panel, top card. From mockup: a framed card with inner inset panel.

**Briefing frame** (outer): metallic border, 10px padding
**Briefing inner**: dark bg with corner highlight (`clip-path: polygon` for top-right fold)

Content layout:

1. Title: "Scenario Briefing" — 17px bold
2. Category pill: "DISTRESS" — small rounded pill (28px height)
3. Scenario name: "Fire on Board" — 31px bold
4. Vessel info: "M/V BLUE DUCK / Callsign 5BCD2" — 15px muted
5. Detail rows: "Position 36°08'N / 005°21'W", "Persons on board 12" — 14px
6. Task label: "Task" — 13px muted
7. Task description: "Send a DSC distress alert, then deliver a complete voice MAYDAY on Ch 16." — 17px
8. "SCRIPT REFERENCE" button — pill-shaped, 13px

**Implementation steps:**

- ✅ `ScenarioBriefing` component: receives scenario definition from Layer 2
- ✅ Category pill color varies by type (red=distress, orange=urgency, blue=safety, gray=routine)
- ✅ Script reference button opens collapsible overlay showing message template
- ✅ All data populated from scenario JSON (vessel name, callsign, MMSI, position, POB, task)

### 8.10 Side Column — Transcript and Scoring Card

Right panel, bottom card. Live conversation log + scores.

**Chat bubbles:**

- **"YOU" bubble** (student): blue-tinted, border `#365b85`, left-aligned with bottom-left tail
  - Tag: "YOU" — green monospace (`#7ed38e`)
  - Text: transcript of student's transmission — 13px
- **"MRCC" bubble** (AI): amber-tinted, border `#a28058`, right-aligned with bottom-right tail
  - Tag: "MRCC" (or persona name) — amber monospace (`#e2c39b`)
  - Text: AI response — 13px

**Score display** (bottom of transcript card):

- Two-column grid: score gauge (left) + missing field indicator (right)
- **Score gauge**: semicircular arc, conic-gradient fill proportional to score
  - Score value: "82%" — 24px bold
- **Missing card**: "Missing field: POB count" — label 13px, value 24px

**Implementation steps:**

- ✅ `TranscriptView` component: scrollable list of `ChatBubble` components
- ✅ `ChatBubble`: variant prop for "student" (blue) vs persona name (amber), with CSS tail
- ✅ Bubbles append in real-time as turns complete
- ✅ `ScoreGauge` component: CSS conic-gradient semicircle, value overlay
- ✅ `MissingFieldCard`: highlights most critical gap for student to fix
- ✅ Full debrief view reuses these components with complete data

### 8.11 Mobile Layout (from `wireframe-03-simulator-mobile.svg`)

Portrait layout, single column, 430px viewport:

```
┌───────────────────┐
│ Top bar (Sim + Online) │
├───────────────────┤
│ Scenario Brief    │ ← compact: title + one-line task only
│ (132px height)    │
├───────────────────┤
│                   │
│ Radio Panel       │ ← full width, vertically stacked
│ LCD display       │
│ Button row        │ ← 4 buttons (CH- dropped or second row)
│ DSC + PTT         │ ← PTT: 52px radius (smaller than desktop)
│ Status bar        │
│ (430px height)    │
├───────────────────┤
│ Transcript        │ ← collapsed by default, expandable
│ (144px height)    │
├───────────────────┤
│ [Learn] [Drill] [Sim] [Ref] │ ← bottom tab bar (40px)
└───────────────────┘
```

**Key mobile differences from desktop:**

- No sidebar rail — replaced by bottom tab bar
- Scenario briefing collapses to compact header (title + task only)
- Knobs may use tap-to-increment instead of drag rotation
- PTT button: 44px radius (88px diameter, vs 110px desktop) — smaller but meets WCAG 44px minimum
- Transcript is collapsed by default with expandable drawer
- DSC controls may scroll horizontally if space is tight

**Implementation steps:**

- ✅ CSS `@media (max-width: 1180px)` breakpoint for tablet
- ✅ CSS `@media (max-width: 480px)` breakpoint for mobile
- ✅ Mobile: replace sidebar with `BottomTabBar` component
- ✅ Mobile: `ScenarioBriefing` renders compact variant (title + task only)
- ✅ Mobile: `TranscriptView` renders as expandable bottom drawer
- ✅ PTT scales down but maintains minimum 44px touch target (WCAG)
- ✅ Test `AudioContext.resume()` in iOS Safari touch handler

### 8.12 Dashboard View (from `wireframe-01-dashboard-desktop.svg`)

Landing page after login — not the simulator, but the entry point.

```
┌────┬──────────────────────────────┬──────────────┐
│    │ TODAY                         │ Quick Stats  │
│ S  │ ┌─────────┐ ┌─────────────┐  │ Score / time │
│ I  │ │Continue │ │Progress by  │  │ Next task    │
│ D  │ │Scenario │ │module       │  │              │
│ E  │ └─────────┘ └─────────────┘  ├──────────────┤
│ B  │                               │ Recent       │
│ A  │ CURRICULUM                    │ Attempts     │
│ R  │ ┌──────────────────────────┐  │ (transcript  │
│    │ │ Module 1: VHF basics     │  │  previews)   │
│    │ │ Module 2: MMSI/DSC       │  │              │
│    │ │ Module 3: Procedures     │  │              │
│    │ │ Simulator Tiers & Drills  │  │              │
│    │ └──────────────────────────┘  │              │
└────┴──────────────────────────────┴──────────────┘
```

**Implementation steps:**

- ✅ `DashboardPage` component with three zones: today, curriculum, stats
- ✅ "Continue Scenario" card: shows last in-progress or recommended next scenario
- ✅ Progress-by-module: horizontal progress bars or fraction indicators
- ✅ Curriculum list: module cards with lock/unlock state
- ✅ Quick stats sidebar: overall score trend, practice time, next recommended task
- ✅ Recent attempts: last 3–5 scenario attempts with score and link to review

### 8.13 Color System (from Mockups)

Extracted from `gemini-ui-component.html` CSS custom properties:

| Token                             | Value                             | Usage                         |
| --------------------------------- | --------------------------------- | ----------------------------- |
| `--bg-0`                          | `#0d1926`                         | Page background (dark)        |
| `--bg-1`                          | `#13202f`                         | Background gradient end       |
| `--bg-2`                          | `#1c2a3a`                         | Background gradient end       |
| `--frame`                         | `#10151b`                         | App shell frame               |
| `--frame-line`                    | `#2a435a`                         | Shell border                  |
| `--surface-dark`                  | `#161b22`                         | Recessed panel bg             |
| `--surface-panel`                 | `#1b1f27`                         | Panel bg                      |
| `--surface-card`                  | `#1b2027`                         | Card bg                       |
| `--steel-0` through `--steel-3`   | `#8e9197` → `#2f343b`             | Metallic gradients            |
| `--text`                          | `#eef2f5`                         | Primary text                  |
| `--text-soft`                     | `#aab5c0`                         | Secondary text                |
| `--text-dim`                      | `#7f8b97`                         | Muted text                    |
| `--lcd-0` / `--lcd-1` / `--lcd-2` | `#b6e0aa` / `#a7d798` / `#95ca89` | LCD green gradient            |
| `--lcd-text`                      | `#1b2c1b`                         | LCD text (dark green)         |
| `--orange-0`                      | `#d67a39`                         | PTT/accent primary            |
| `--orange-1`                      | `#b45d25`                         | PTT/accent dark               |
| `--success`                       | `#57f04f`                         | Online indicator, pass states |

**Implementation step:**

- ✅ Define all tokens as CSS custom properties in `:root` — single source of truth
- ✅ Simplified/accessibility mode overrides these with higher-contrast values

### 8.14 Component Inventory (Implementation Checklist)

Complete list of UI components to build, derived from all mockups:

**Shell Components:**

- ✅ `AppShell` — CSS Grid container (3-col desktop, 1-col mobile)
- ✅ `TopBar` — brand, subtitle, status pills
- ✅ `NavSidebar` — vertical nav blocks (desktop)
- ✅ `BottomTabBar` — horizontal tabs (mobile)
- ✅ `StatusPill` — reusable pill with optional indicator dot

**Radio Panel Components (Layer 5):**

- ✅ `ConsoleShell` — outer metallic frame with mic jack decoration
- ✅ `RadioBody` — inner panel with screws, houses all controls
- ✅ `RadioDisplay` — LCD with dot-matrix texture, monospace readout
- ✅ `VolumeKnob` — rotary knob with metallic gradient + tick marks
- ✅ `SquelchKnob` — same knob component, different label/binding
- ✅ `RadioButton` — reusable for 16/9, DUAL, H/L, CH+, CH-
- ✅ `DscControls` — recessed panel: DISTRESS + CALL + MENU + status line
- ✅ `DistressFlipCover` — animated spring-loaded flip cover (must lift before pressing)
- ✅ `DistressButton` — 5-second hold (via `use-long-press`) with countdown + progress feedback + red inner panel
- ✅ `PttButton` — large circular orange button with glow, pointer capture + keyboard
- ✅ `SignalIndicators` — TX/RX LED dots + signal strength meter

**Scenario & Feedback Components:**

- ✅ `ScenarioBriefing` — category pill, title, vessel info, task, script reference button
- ✅ `TranscriptView` — scrollable chat log
- ✅ `ChatBubble` — student (blue) / persona (amber) variants with CSS tails
- ✅ `FeedbackCard` — dimension chips + feedback text
- ✅ `ScoreGauge` — semicircular conic-gradient arc with value overlay
- ✅ `MissingFieldCard` — highlights critical gap
- ✅ `DebriefPanel` — full after-action review (combines transcript + scores + retry button)

**Dashboard Components:**

- ✅ `DashboardPage` — today + curriculum + stats layout
- ✅ `ContinueCard` — resume last scenario
- ✅ `ModuleCard` — module progress with lock/unlock state
- ✅ `ProgressBar` — fraction or bar indicator
- ✅ `RecentAttemptCard` — score preview + link to review

---

## 9. Technology Stack

### Frontend

| Technology                 | Version/Note      | Purpose                                                                                                                                                |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vite+** (`vp` CLI)       | Alpha (MIT)       | **Unified toolchain** — replaces separate Vite, Vitest, ESLint, Prettier, and tsc configs with a single CLI. See [viteplus.dev](https://viteplus.dev). |
| TypeScript                 | 5.x (strict mode) | Type safety — checked via `vp check` (tsgo under the hood)                                                                                             |
| React                      | 18+               | Component framework                                                                                                                                    |
| Workbox                    | 7+                | Service worker, caching strategies (via `vite-plugin-pwa`)                                                                                             |
| XState (or custom reducer) | 5+                | State machines for radio domain + session engine                                                                                                       |
| IndexedDB (via `idb`)      | —                 | Offline data storage (progress, cached lessons, simulator attempt transcripts for offline review)                                                      |
| Web Audio API              | Native            | Radio DSP chain                                                                                                                                        |
| i18next                    | —                 | i18n scaffolding                                                                                                                                       |
| Radix UI Primitives        | —                 | Accessible base components (MIT)                                                                                                                       |
| Tabler Icons               | —                 | Icon system (MIT)                                                                                                                                      |
| use-long-press             | —                 | Long-press hook for distress button (MIT)                                                                                                              |

### Vite+ Unified Toolchain

Vite+ (`vp`) consolidates the entire dev toolchain into a single CLI, replacing 5–6 separate tool configurations:

| `vp` command | What it replaces        | Engine                    | Speed gain                                |
| ------------ | ----------------------- | ------------------------- | ----------------------------------------- |
| `vp dev`     | `vite dev`              | Vite                      | Same                                      |
| `vp build`   | `vite build`            | Rolldown                  | ~40x faster than webpack                  |
| `vp check`   | ESLint + Prettier + tsc | **Oxlint + Oxfmt + tsgo** | Lint: 50–100x faster. Format: 30x faster. |
| `vp test`    | Vitest                  | Vitest                    | Same (Jest-compatible API)                |
| `vp install` | npm/pnpm install        | Detects package manager   | Same                                      |

**What this means for our project:**

- No `eslint.config.js`, `.prettierrc`, or Husky/lint-staged configs to maintain
- `vp check` runs format + lint + type-check in one command, enforced in CI
- `vp test --coverage` handles unit/integration tests with coverage thresholds
- 600+ Oxlint rules (ESLint-compatible), including TypeScript and React rules
- All Rust-based — CI pipelines run in seconds, not minutes

### Testing

| Technology                 | Purpose                                               |
| -------------------------- | ----------------------------------------------------- |
| **Vitest (via `vp test`)** | Unit and integration test runner (built into Vite+)   |
| **React Testing Library**  | Component testing — test behavior, not implementation |
| **Playwright**             | End-to-end tests (browser automation, cross-browser)  |

**Coverage requirements:**

- **Minimum threshold: 85%** across lines, branches, functions, and statements
- CI pipeline fails if coverage drops below 85%
- **Layer 1 (radio-domain) and Layer 2 (session-engine): 95%+** target — these are pure logic with zero excuses for low coverage
- **Layer 5 (ui-shell): 80%** minimum — component tests via React Testing Library
- Coverage reports generated on every PR and tracked over time

### Code Quality

All handled by Vite+ — no separate tool configs needed:

| Concern           | Tool                                 | Enforcement                                                   |
| ----------------- | ------------------------------------ | ------------------------------------------------------------- |
| **Linting**       | Oxlint (via `vp check`)              | 600+ rules, zero errors required. 50–100x faster than ESLint. |
| **Formatting**    | Oxfmt (via `vp check`)               | Deterministic formatting, 30x faster than Prettier.           |
| **Type checking** | tsgo (via `vp check`)                | TypeScript strict mode, `noUncheckedIndexedAccess: true`      |
| **Pre-commit**    | `vp check` in CI + optional git hook | Single command checks everything                              |

**CI pipeline (single unified check):**

- ✅ `vp check` passes (lint + format + type-check — one command, all Rust-speed)
- ✅ `vp test --coverage` passes with ≥85% coverage
- ✅ `playwright test` passes (E2E suite)

**Backend** uses the same `vp` toolchain.

### Backend

| Technology                  | Version/Note | Purpose                   |
| --------------------------- | ------------ | ------------------------- |
| Node.js                     | 20+ LTS      | Runtime                   |
| Fastify                     | 4+           | API server                |
| PostgreSQL                  | 16           | Users, progress, attempts |
| Redis                       | 7+           | Sessions, rate limiting   |
| WebSocket (ws or Socket.IO) | —            | Real-time audio streaming |

### AI Services (Swappable via Adapter Pattern)

| Service | Cloud Options                                                          | Self-Hosted Options                                                                             |
| ------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **STT** | Groq Whisper API (~free), OpenAI `gpt-4o-mini-transcribe` ($0.003/min) | **faster-whisper `base.en`** (142MB, CPU-only, sub-1s, free) — **recommended default**          |
| **LLM** | Claude API (Anthropic), OpenAI GPT-4o                                  | Llama 3 (local)                                                                                 |
| **TTS** | OpenAI tts-1 (6 voices, $15/1M chars)                                  | **Piper TTS** (15–65MB/voice, CPU-only, 30–80ms, 20+ EN voices, free) — **recommended default** |

### Key Dependencies (CC0/MIT/Apache/BSD)

| Dependency                                   | License          | Use                               |
| -------------------------------------------- | ---------------- | --------------------------------- |
| Freesound CC0 audio (static, squelch, beeps) | CC0              | Radio SFX                         |
| FCC VHF channel chart                        | US Public Domain | Channel data                      |
| USCG NAVCEN procedures                       | US Public Domain | Procedure reference               |
| Radix UI Primitives                          | MIT              | Accessible controls               |
| Tabler Icons                                 | MIT              | UI icons                          |
| use-long-press                               | MIT              | Distress button 5s hold detection |
| wavesurfer.js                                | BSD-3            | Audio playback review             |

---

## 10. Security & Configuration

### Authentication

| Feature        | Implementation                                                    |
| -------------- | ----------------------------------------------------------------- |
| Registration   | School admin creates accounts or provides registration codes      |
| Login          | Email/password                                                    |
| 2FA            | TOTP-based (Google Authenticator, etc.) — configurable per school |
| Sessions       | JWT with refresh tokens; persist across devices                   |
| Password reset | Email-based secure reset flow                                     |

### Configuration (Environment Variables)

```bash
# Core
DATABASE_URL=postgres://user:pass@host:5432/gmdss
REDIS_URL=redis://host:6379
JWT_SECRET=<secret>
APP_URL=https://gmdss.school.example

# AI Provider Selection (default: local / self-hosted)
AI_PROVIDER=local           # or "openai", "anthropic"
STT_PROVIDER=local          # or "openai", "groq"
TTS_PROVIDER=local          # or "openai"

# Self-hosted AI endpoints (Option A — default)
LOCAL_STT_URL=http://stt:8000       # faster-whisper server
LOCAL_STT_MODEL=base.en             # or small.en for higher accuracy
LOCAL_LLM_URL=http://llm:8080      # Llama 3 or similar
LOCAL_TTS_URL=http://tts:5002      # Piper TTS
LOCAL_TTS_VOICE=en_US-ryan-medium  # default Piper voice

# Cloud AI keys (Option B — only needed if STT/TTS/LLM_PROVIDER != local)
OPENAI_API_KEY=<key>                # for tts-1 and/or GPT
ANTHROPIC_API_KEY=<key>             # for Claude
GROQ_API_KEY=<key>                  # for Whisper STT (free tier)

# HTTPS (self-hosted only — Caddy handles this automatically)
DOMAIN=gmdss.school.example         # Caddy requests Let's Encrypt cert for this domain

# School Configuration
SCHOOL_NAME="Maritime Academy"
DEFAULT_JURISDICTION=international
REQUIRE_2FA=false
```

### Security Scope

**In scope:**

- ✅ HTTPS-only (required for mic access and PWA)
- ✅ JWT with rotation and refresh tokens
- ✅ TOTP 2FA
- ✅ Rate limiting on auth and AI endpoints
- ✅ Input validation on all API endpoints
- ✅ No raw SQL (parameterized queries only)
- ✅ Audio processed ephemerally — transcribed then discarded
- ✅ GDPR data export and deletion endpoints
- ✅ No tracking cookies, no analytics beacons
- ✅ API keys never exposed to client (all AI calls proxied through backend)

**Out of scope (Phase 1):**

- ❌ Role-based access control beyond student/admin
- ❌ Multi-tenant (one deployment per school in Phase 1)
- ❌ SSO/SAML integration
- ❌ Audit logging beyond attempt records

### Privacy Policy

| Data Type                 | Policy                                                                                                                                                                                                                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Voice recordings          | Ephemeral: transcribed and discarded immediately. Never stored.                                                                                                                                                                                                                                                  |
| Transcripts               | **Always retained** for graded simulator attempts. Required for score auditability, instructor review, and offline review. Transcripts contain radio procedure text, not PII. Students consent to retention via disclaimer on first simulator use. GDPR deletion removes all attempt data including transcripts. |
| Personal data             | Name, email, progress — stored in school's database only.                                                                                                                                                                                                                                                        |
| AI API calls              | Subject to provider's data policy. Self-hosted option eliminates third-party exposure.                                                                                                                                                                                                                           |
| School is data controller | App provider is data processor under GDPR.                                                                                                                                                                                                                                                                       |

### Deployment Environments

The project uses three distinct environments, each with its own deployment strategy:

#### Local Development

Every developer runs the full stack locally via Docker Compose — identical to the self-hosted production setup. This ensures dev/prod parity.

```
docker compose -f docker-compose.dev.yml up
```

Includes: Caddy (localhost HTTPS), API with hot-reload, PostgreSQL, Redis, faster-whisper, Piper TTS. Frontend runs via `vp dev` (Vite+ dev server with HMR) and proxies API calls to the Docker stack.

#### Dev / QA / Staging — Railway

**Railway** is used for development and QA because of its built-in PR preview environments:

| Feature                         | Why it matters for dev/QA                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PR preview environments**     | Every pull request gets its own isolated deployment with its own database, automatically. QA clicks the preview link, tests the feature, environment is torn down on merge. |
| **Dev/staging/prod separation** | Built-in environment management — no manual config                                                                                                                          |
| **Built-in PostgreSQL + Redis** | Each preview gets its own DB instance — no shared state between PRs                                                                                                         |
| **GitHub integration**          | Push to branch → auto-deploy in seconds                                                                                                                                     |
| **Cost**                        | ~$5/mo for Hobby plan — shared across the dev team                                                                                                                          |

This means: a developer opens a PR → Railway auto-deploys a preview → QA tests on real infrastructure → PR merges → preview torn down. Zero DevOps.

#### Production — Two Options

No hybrid — schools either self-host everything or use cloud everything. The adapter pattern lets them switch AI providers at any time without code changes.

| Option                       | Description                                                                                                                                                 | Cost                                                     | Best For                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **A: Self-hosted (default)** | Single `docker compose up`: Caddy (auto-HTTPS) + API + PostgreSQL + Redis + faster-whisper + Piper TTS + Llama. No GPU required. 4-core/8GB server.         | **$0** (own hardware) or **$4–6/mo** (VPS, e.g. Hetzner) | Most schools. Zero AI costs, full data sovereignty, all data on-premises.                                         |
| **B: Cloud — Railway**       | Frontend on **Cloudflare Pages** (free, unlimited BW). Backend + DB + Redis on **Railway** (~$5/mo). AI via cloud APIs.                                     | **~$5/mo base** + **$5–15/mo AI API** for 50 students    | Schools without server infrastructure. Same platform as dev/QA — promotes to production via Railway environments. |
| **B alt: Cloud — Fly.io**    | Frontend on **Cloudflare Pages**. Backend on **Fly.io** (free: 3 VMs, 256MB). DB on **Neon** (free: 500MB). Redis on **Upstash** (free). AI via cloud APIs. | **$0 base** + AI API usage                               | Budget-conscious schools willing to manage 4 platforms.                                                           |

**Self-hosted includes:**

- Caddy reverse proxy with automatic Let's Encrypt HTTPS (required for browser mic access)
- All AI models run locally — zero external API calls, zero ongoing costs
- PostgreSQL with volume persistence and backup-ready mount
- Single `docker compose up` to start everything

**Cloud (Railway) includes:**

- Cloudflare Pages: free global CDN, auto-HTTPS, connect GitHub → auto-deploy
- Railway: persistent WebSocket support, built-in PostgreSQL + Redis, one-platform simplicity
- Same platform used for dev/QA/staging — deploy to production via Railway environment promotion
- Cloud AI: Groq (STT, free tier), Anthropic/OpenAI (LLM), OpenAI tts-1 (TTS)

**Cloud (Fly.io) includes:**

- Cloudflare Pages for frontend (same as Railway option)
- Fly.io free tier: 3 shared-cpu VMs (256MB each) — sufficient for 50 students
- Neon free tier: 500MB PostgreSQL with auto-suspend (sub-second cold start)
- Upstash free tier: serverless Redis, 10K commands/day
- Tradeoff: 4 separate platforms to manage vs. Railway's single dashboard

#### Summary

| Context                        | Platform                                   | Why                                                           |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------------- |
| **Local dev**                  | Docker Compose                             | Full stack parity with self-hosted production                 |
| **Dev / QA / Staging**         | Railway                                    | PR preview environments, built-in DB per preview, zero DevOps |
| **Production (self-hosted)**   | Docker Compose + Caddy                     | Default. $0 cost, full sovereignty.                           |
| **Production (cloud, simple)** | Cloudflare Pages + Railway                 | ~$5/mo. Same platform as dev/QA. One dashboard.               |
| **Production (cloud, free)**   | Cloudflare Pages + Fly.io + Neon + Upstash | $0 but 4 platforms to manage.                                 |

---

## 11. API Specification

### Auth Endpoints

```
POST /api/auth/register          # Admin creates student account
POST /api/auth/login             # Email + password → JWT
POST /api/auth/refresh           # Refresh token → new JWT
POST /api/auth/2fa/setup         # Generate TOTP secret + QR
POST /api/auth/2fa/verify        # Verify TOTP code
POST /api/auth/password-reset    # Initiate reset
POST /api/auth/password-reset/confirm  # Confirm with token
```

### Content Endpoints

```
GET  /api/content/modules                  # List modules with lock status
GET  /api/content/modules/:id/lessons      # Lessons for a module
GET  /api/content/modules/:id/quiz         # Quiz questions
GET  /api/content/scenarios                 # Available scenarios (filtered by unlock status)
GET  /api/content/scenarios/:id            # Full scenario definition
GET  /api/content/jurisdictions            # Available jurisdiction profiles
GET  /api/content/jurisdictions/:id        # Channel plan + rules
```

### Progress Endpoints

```
GET  /api/progress                         # Full student progress tree
POST /api/progress/lesson/:id/complete     # Mark lesson complete
POST /api/progress/quiz/:id/submit         # Submit quiz answers → score
GET  /api/progress/attempts                # List simulator attempts
GET  /api/progress/attempts/:id            # Full attempt record with transcript
```

### Simulator WebSocket

```
WS /api/simulator/session

→ { type: "start_scenario", scenario_id: "2.1", jurisdiction: "international" }
← { type: "scenario_loaded", briefing: {...}, personas: [...] }

→ { type: "dsc_alert", payload: { nature: "fire", position: {...}, channel: 16 } }
← { type: "dsc_acknowledged", auto_switch_channel: 16 }

→ { type: "audio_chunk", turn_id: 1, data: <base64>, final: false }
→ { type: "audio_chunk", turn_id: 1, data: <base64>, final: true }  # PTT released
← { type: "processing", turn_id: 1 }
← { type: "evaluation", turn_id: 1, score: {...}, advisory: "..." }
← { type: "response_audio", turn_id: 1, data: <base64>, persona: "mrcc" }
← { type: "turn_complete", turn_id: 1, next_expected: {...} }

# If student retransmits during slow turn:
→ { type: "cancel_turn", turn_id: 1 }  # previous turn abandoned
→ { type: "audio_chunk", turn_id: 2, data: <base64>, final: false }
# Server discards any pending turn_id=1 responses

→ { type: "end_scenario" }
← { type: "debrief", overall_score: 82, transcript: [...], breakdown: {...} }
```

### Example: Submit Quiz

```json
// POST /api/progress/quiz/module-1-checkpoint/submit
{
  "answers": [
    { "question_id": "q1", "selected": "b" },
    { "question_id": "q2", "selected": "a" }
  ]
}

// Response
{
  "score": 85,
  "passed": true,
  "threshold": 70,
  "results": [
    { "question_id": "q1", "correct": true },
    { "question_id": "q2", "correct": false, "correct_answer": "c", "explanation": "..." }
  ],
  "unlocked": ["guided-voice-drills"]
}
```

### Example: Attempt Record

```json
// GET /api/progress/attempts/att_abc123
{
  "attempt_id": "att_abc123",
  "user_id": "usr_456",
  "scenario_id": "2.1",
  "scenario_version": "1.2.0",
  "rubric_version": "1.1.0",
  "jurisdiction_profile": "international",
  "started_at": "2026-04-05T14:30:00Z",
  "ended_at": "2026-04-05T14:37:22Z",
  "overall_score": 82,
  "score_breakdown": {
    "required_fields": { "score": 90, "missing": ["persons_on_board"] },
    "prowords": { "score": 100 },
    "sequence": { "score": 80, "notes": "Position before vessel ID" },
    "channel": { "score": 100 },
    "clarity": { "score": 60, "notes": "Hesitation before nature of distress" }
  },
  "field_check_results": {
    "mayday_x3": true,
    "this_is": true,
    "vessel_name_x3": true,
    "callsign_or_mmsi": true,
    "position": true,
    "nature": true,
    "assistance": true,
    "persons_on_board": false,
    "over": true
  },
  "transcript_log": [
    { "turn": 1, "actor": "student", "text": "MAYDAY MAYDAY MAYDAY...", "timestamp": "14:31:05" },
    {
      "turn": 2,
      "actor": "mrcc",
      "text": "MAYDAY Motor Vessel BLUE DUCK...",
      "timestamp": "14:31:12"
    }
  ],
  "stt_provider": "openai/gpt-4o-mini-transcribe",
  "stt_confidence": [0.94, 0.87],
  "llm_provider": "anthropic/claude-sonnet-4-6",
  "llm_prompt_hash": "a3f8c2d1",
  "tts_provider": "openai/tts-1",
  "fallback_turns": [],
  "feedback": "Good distress call. You missed stating persons on board...",
  "advisory_feedback": "Good pacing overall. You hesitated before nature of distress."
}
```

---

## 12. Success Criteria

### MVP Success Definition

The MVP is successful when a maritime training school can deploy the application and have students independently progress from zero knowledge to passing simulated radio exams with AI-evaluated voice communication.

### Functional Requirements

- ✅ Student can create an account, complete all 4 theory modules, and pass checkpoint quizzes
- ✅ Student can use Guided Voice Drills after Module 1 with STT-based feedback
- ✅ Student can complete all 21 simulator scenarios across 4 tiers with AI voice interaction
- ✅ Scoring is deterministic, reproducible, and auditable (same transcript + same rubric = same score)
- ✅ After-action review shows full transcript, per-dimension scores, and actionable feedback
- ✅ Theory, drills, and quizzes work offline; simulator clearly communicates online requirement
- ✅ Application installs as PWA on mobile and desktop
- ✅ Application deploys via Docker Compose for self-hosting
- ✅ AI providers are swappable without code changes (configuration only)
- ✅ Jurisdiction profiles correctly vary channel rules and scenario content

### Quality Indicators

- **Test coverage:** ≥85% across the codebase; ≥95% on Layers 1–2 (radio-domain, session-engine)
- **Linting:** Zero Oxlint errors on every commit (enforced via `vp check`)
- **Formatting:** All code formatted by Oxfmt (enforced via `vp check`)
- **Type safety:** TypeScript strict mode, zero type errors
- **Latency:** AI response starts playing within 3 seconds of PTT release on broadband; degraded UX activates gracefully for slower connections
- **STT accuracy:** ≥90% word accuracy on clear English maritime radio speech
- **Scoring consistency:** Same transcript scored identically across 100 consecutive runs
- **Offline:** All cached content loads within 1 second with no network
- **Accessibility:** Radio panel usable via keyboard only; simplified mode available; all audio cues have visual equivalents

### User Experience Goals

- Student touches the simulated radio (voice drills) within the first week of study
- Student completes first AI radio scenario within 2 weeks
- Zero confusion about what works offline vs. what requires connectivity
- No silent hangs or unexplained failures during simulator sessions

---

## 13. Implementation Phases

### Phase 0: Toolchain & Quality Gate (Week 1)

**Goal:** Every line of code written from this point forward is linted, formatted, type-checked, and tested. No code lands without passing the quality gate.

- ✅ Install Vite+ (`curl -fsSL https://vite.plus | bash`)
- ✅ `vp create` — scaffold monorepo (frontend + API)
- ✅ TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess: true`)
- ✅ Configure `vp check` — Oxlint rules (600+), Oxfmt formatting, tsgo type-checking
- ✅ Configure `vp test` — Vitest with coverage thresholds (85% global, 95% Layers 1–2, 80% Layer 5)
- ✅ Playwright setup for E2E tests
- ✅ CI pipeline: `vp check` → `vp test --coverage` → `playwright test` → `vp build`
- ✅ Git hook: `vp check` runs on pre-commit (or enforced in CI only — team preference)
- ✅ Write first test: a trivial "app renders" smoke test to confirm pipeline works end-to-end

**Validation:** `vp check && vp test && vp build` passes on a clean scaffold. CI pipeline runs green. Every subsequent PR is gated by this pipeline.

### Phase 1: Foundations (Weeks 2–4)

**Goal:** Data model, auth, content delivery, offline infrastructure. Tests written alongside every feature.

- ✅ PostgreSQL schema: users, progress, lessons, quizzes — with migration tests
- ✅ Auth service: registration, login, JWT, TOTP 2FA — with unit + integration tests
- ✅ Content API: serve module/lesson/quiz data — with API tests
- ✅ PWA setup: `vite-plugin-pwa` + Workbox service worker
- ✅ Service worker: app shell + content caching
- ✅ IndexedDB: offline progress storage
- ✅ i18next setup with English resource files
- ✅ Jurisdiction profile data model + international default — with unit tests
- ✅ E2E: student can register, log in, browse cached content offline, take a quiz

**Validation:** All above features working + `vp test --coverage` ≥85% + E2E suite passes. No feature merges without tests.

### Phase 2: Learning Content + Interactive Tools (Weeks 5–7)

**Goal:** All four theory modules with interactive tools and checkpoint quizzes.

- ✅ Module 1–4 lesson content (text, diagrams, exercises)
- ✅ Channel Explorer with jurisdiction filter — with component tests
- ✅ MMSI Decoder interactive tool — with unit tests (pattern matching logic)
- ✅ DSC Builder (all categories) — with unit tests
- ✅ Script Builder (MAYDAY, PAN PAN, SECURITE, MEDICO) — with unit tests
- ✅ Checkpoint quizzes with scoring and unlock gating — with integration tests
- ✅ Progress tracking and module unlock logic — with unit tests
- ✅ E2E: student completes all 4 modules and uses all tools offline

**Validation:** Full learning pathway works offline. Coverage ≥85%. All interactive tools tested.

### Phase 3: Radio Panel + Audio + Session Engine (Weeks 8–11)

**Goal:** Working radio simulator with deterministic scenarios (scripted responses before AI).

- ✅ Layer 1: Radio domain state machine — **95%+ unit test coverage** (pure logic)
- ✅ Layer 2: Session engine (scenario machine, rubric engine, jurisdiction rules) — **95%+ unit test coverage**
- ✅ Layer 3: Audio engine (mic capture, radio DSP chain, playback) — integration tests
- ✅ Layer 5: Radio panel UI (SVG faceplate + DOM controls + simplified mode) — component tests
- ✅ Guided Voice Drills (phonetic alphabet, script reading, channel selection)
- ✅ 5 Tier 1 scenarios with pre-scripted responses (no AI yet)
- ✅ Deterministic scoring with versioned rubrics — **snapshot tests** (same input = same output)
- ✅ After-action review UI
- ✅ E2E: student operates radio panel, completes Tier 1 scenario, sees scored transcript

**Validation:** Radio panel keyboard-accessible. Scoring is deterministic (verified by snapshot tests). Coverage: Layers 1–2 ≥95%, overall ≥85%.

### Phase 4: AI Integration + Full Scenario Pack (Weeks 12–15)

**Goal:** Full AI voice loop, all 25 scenarios, degraded UX handling, production readiness.

- ✅ Layer 4: Transport/AI adapters (STT, LLM, TTS — at least 2 providers each) — with mock adapter tests
- ✅ WebSocket session for real-time audio streaming — with integration tests
- ✅ Station persona system prompts (5 personas)
- ✅ All 25 scenarios across 4 tiers with AI responses
- ✅ Degraded/fallback UX (slow turns, failures, connectivity loss) — with simulated failure tests
- ✅ Turn ID / stale-response handling — with concurrency tests
- ✅ Auditable attempt records (18 fields) — with schema validation tests
- ✅ Docker Compose deployment configuration — with smoke test
- ✅ Security review (HTTPS, API key handling, rate limiting, GDPR endpoints)
- ✅ Device testing (iOS Safari AudioContext, mobile touch PTT, various screen sizes)
- ✅ E2E: full pathway Module 1 → Tier 4 exam with AI voice interaction

**Validation:** Full application works end-to-end. Deploys via Docker Compose. Scores auditable and deterministic. Coverage ≥85% across all layers. `vp check` zero errors. All E2E tests pass across Chrome, Firefox, Safari.

---

## 14. Future Considerations

### Post-MVP / v2+ Enhancements

| Feature                      | Value                                                                               | Complexity  |
| ---------------------------- | ----------------------------------------------------------------------------------- | ----------- |
| **Instructor dashboard**     | Class analytics, scenario assignment, progress export                               | Medium      |
| **Custom scenario editor**   | In-app scenario authoring for instructors                                           | Medium-High |
| **Multiplayer mode**         | Student-to-student radio practice (one as vessel, one as coast station)             | High        |
| **Multilingual UI**          | Translated interface; radio comms stay in English                                   | Medium      |
| **Offline simulator**        | Pre-scripted scenario packs + local rubric engine + browser STT fallback            | Medium      |
| **Exam practice mode**       | Timed, exam-condition simulations with official question pool integration           | Medium      |
| **Hardware lab integration** | Sync progress between app and physical GMDSS simulators                             | High        |
| **Completion certificates**  | School-branded completion attestations (not official ROC certificates)              | Low         |
| **Analytics and reporting**  | Curriculum QA: which scenarios produce lowest scores, rubric effectiveness analysis | Medium      |

### Integration Opportunities

- **LMS integration** (Moodle, Canvas) via LTI for grade passback
- **Maritime e-learning platforms** for content syndication
- **Exam body integration** for official question pool alignment per jurisdiction

---

## 15. Risks & Mitigations

| #   | Risk                                                                             | Impact                                                             | Likelihood     | Mitigation                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **AI latency exceeds acceptable threshold on school networks**                   | Simulator feels broken; students lose confidence in the tool       | Medium         | Explicit degraded UX for slow/failed turns; pre-scripted fallback responses in every scenario step; accept 2–3s pause as natural "radio delay"; local AI option eliminates network dependency     |
| 2   | **STT inaccuracy with accented English unfairly penalizes non-native speakers**  | Scoring perceived as unfair; instructor trust erodes               | Medium-High    | Use accent-robust STT models; build tolerance into rubric field matching (fuzzy match, synonyms); store STT confidence per turn for dispute resolution; typed input fallback for individual turns |
| 3   | **Copyright restrictions prevent embedding authoritative IMO/ITU content**       | Cannot use official diagrams or procedure text verbatim            | High (certain) | Paraphrase all content; cite as references only; implement rules in code rather than copying specification text; use US Public Domain sources (FCC, USCG) where applicable                        |
| 4   | **API costs scale faster than expected with student usage**                      | Unsustainable for school-as-a-service model without direct payment | Medium         | **Self-hosted is the default** (faster-whisper + Llama + Piper, no GPU, free). Cloud APIs are optional fallbacks. Cost is zero for self-hosted; guided voice drills use STT only (no LLM+TTS).    |
| 5   | **Web Audio API inconsistencies across mobile browsers (especially iOS Safari)** | Audio capture or playback fails on common student devices          | Medium         | `AudioContext.resume()` on user gesture; extensive device testing matrix; fallback to MediaRecorder-only capture if AudioWorklet unavailable; simplified mode reduces audio processing complexity |

---

## 16. Appendix

### Related Documents

| Document                      | Location                                               | Contents                                                                                                                      |
| ----------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Design Document (v0.2)        | `docs/design-document.md`                              | Full architectural detail, scenario scripts, wireframes, audio processing chains                                              |
| UI Concept Sketch             | `docs/mockups/ui-concept-radio-training-dashboard.svg` | First visual concept — dark theme, 3-column layout, radio panel with LCD                                                      |
| Detailed Component Mockup     | `docs/mockups/gemini-ui-component.html`                | **Primary reference** — full HTML/CSS component mock with exact colors, gradients, shadows, knobs, LCD, PTT, bubbles, scoring |
| Dashboard Wireframe           | `docs/mockups/wireframe-01-dashboard-desktop.svg`      | Landing page: today card, curriculum list, stats sidebar                                                                      |
| Simulator Desktop Wireframe   | `docs/mockups/wireframe-02-simulator-desktop.svg`      | Desktop simulator layout with brief/panel/script/review sub-nav                                                               |
| Simulator Mobile Wireframe    | `docs/mockups/wireframe-03-simulator-mobile.svg`       | Mobile portrait layout with bottom tab bar                                                                                    |
| Polished Desktop Mock         | `docs/mockups/mock-04-simulator-desktop-polished.svg`  | High-fidelity dark theme desktop with radio panel                                                                             |
| SVG Recreations               | `docs/mockups/gemini-ui-recreated*.svg`                | SVG-only renditions of the component mockup                                                                                   |
| Asset Catalog (Free/Reusable) | `docs/deep-research-report.md`                         | Prioritized catalog of CC0/MIT/PD assets for simulator                                                                        |
| PWA & Content Research        | `docs/deep-research-report (1).md`                     | Regulatory sources, PWA patterns, exam frameworks, data model, wireframes                                                     |

### Scenario Catalog Reference

| Tier | #   | Scenario                                       | Type                |
| ---- | --- | ---------------------------------------------- | ------------------- |
| 1    | 1.1 | Radio Check (jurisdiction-appropriate channel) | Routine             |
| 1    | 1.2 | Channel Change                                 | Routine             |
| 1    | 1.3 | Marina Entry Call                              | Routine             |
| 1    | 1.4 | Position Report                                | Routine             |
| 1    | 1.5 | Navigational Warning Reception                 | Safety              |
| 2    | 2.1 | MAYDAY — Fire on Board                         | Distress            |
| 2    | 2.2 | MAYDAY — Flooding/Sinking                      | Distress            |
| 2    | 2.3 | MAYDAY — Collision                             | Distress            |
| 2    | 2.4 | PAN PAN — Engine Failure                       | Urgency             |
| 2    | 2.5 | PAN PAN — Medical Emergency                    | Urgency             |
| 2    | 2.6 | SECURITE — Hazard to Navigation                | Safety              |
| 2    | 2.7 | MAYDAY Acknowledgment                          | Distress (response) |
| 2    | 2.8 | MAYDAY RELAY                                   | Distress (relay)    |
| 3    | 3.1 | Full SAR Scenario                              | Distress + SAR      |
| 3    | 3.2 | False Alert Cancellation                       | DSC procedure       |
| 3    | 3.3 | Distress During Routine Call                   | Priority shift      |
| 3    | 3.4 | Multiple Vessel Coordination                   | SAR                 |
| 3    | 3.5 | Deteriorating Situation                        | Escalation          |
| 3    | 3.6 | Port Approach with Traffic                     | Routine + Safety    |
| 3    | 3.7 | Night/Poor Visibility Encounter                | Safety              |
| 3    | 3.8 | MEDICO with Evacuation                         | Urgency → Distress  |
| 4    | 4.1 | Exam: Random Distress                          | Timed exam          |
| 4    | 4.2 | Exam: Random Urgency/Safety                    | Timed exam          |
| 4    | 4.3 | Exam: Mixed Traffic                            | Timed exam          |
| 4    | 4.4 | Exam: Full Voyage                              | Timed exam          |

### Content Licensing Summary

| Source                                | License                 | Usage Constraint                       |
| ------------------------------------- | ----------------------- | -------------------------------------- |
| Application code                      | AGPLv3                  | Modified versions must share source    |
| Original content (lessons, scenarios) | CC BY-SA 4.0 (proposed) | Attribution + share-alike              |
| FCC / USCG materials                  | US Public Domain        | Free to use; cite as best practice     |
| ITU-R / IMO documents                 | All rights reserved     | Reference only; paraphrase, don't copy |
| Audio SFX (Freesound)                 | CC0                     | No restrictions                        |
| UI libraries (Radix, Tabler, etc.)    | MIT/ISC/Apache/BSD      | Preserve license notices               |
