/**
 * Theory Mode question bank — authored multiple-choice questions on GMDSS
 * regulatory and systems knowledge.
 *
 * Unlike the count-driven Drill Modes, Theory questions are authored (not
 * generated) and each carries its own correct answer plus three distractors.
 * Theory has no adaptive footprint — see docs/adr/0001-theory-mode-non-adaptive.md.
 *
 * The seed set below is derived only from already-vetted repository content:
 * `channels.ts` and the frontend lesson JSON under
 * `apps/frontend/public/content/en/modules/`. Every seeded question is flagged
 * `REVIEW:` — the bank is expected to be verified and expanded by a domain
 * reviewer, who deletes the flag once a question is confirmed.
 */

export type TheoryTopic = "COSPAS-SARSAT" | "NAVTEX" | "Channels" | "SART" | "VHF" | "MMSI";

/** Companion enumeration of every TheoryTopic — drives topic-balanced selection. */
export const THEORY_TOPICS: readonly TheoryTopic[] = [
  "COSPAS-SARSAT",
  "NAVTEX",
  "Channels",
  "SART",
  "VHF",
  "MMSI",
];

export interface TheoryQuestion {
  /** Stable id, e.g. "theory-navtex-1". */
  readonly id: string;
  readonly topic: TheoryTopic;
  readonly prompt: string;
  /** The single correct option, verbatim. */
  readonly correctAnswer: string;
  /** Exactly three self-contained wrong options (no "a and c"-style references). */
  readonly distractors: readonly [string, string, string];
  /** Optional rationale shown after the question is answered. */
  readonly explanation?: string;
}

export const THEORY_QUESTIONS: readonly TheoryQuestion[] = [
  // ── COSPAS-SARSAT ── seeded from modules/6/lesson-3.json (EPIRB) ──────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-1",
    topic: "COSPAS-SARSAT",
    prompt:
      "On which frequency does an EPIRB transmit its primary distress signal to the Cospas-Sarsat satellite system?",
    correctAnswer: "406 MHz",
    distractors: ["121.5 MHz", "518 kHz", "156.8 MHz"],
    explanation:
      "EPIRBs transmit the satellite distress signal on 406 MHz. 121.5 MHz is the low-power homing frequency for rescue craft closing in — it is not used for satellite detection.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-2",
    topic: "COSPAS-SARSAT",
    prompt:
      "How does the current MEOSAR generation of Cospas-Sarsat improve on the older LEOSAR system?",
    correctAnswer: "It provides near-instantaneous global detection and better position accuracy",
    distractors: [
      "It removes the need to register the beacon",
      "It lets the beacon transmit voice as well as data",
      "It works without a 406 MHz beacon on board",
    ],
    explanation:
      "MEOSAR (Medium Earth Orbit) gives near-instantaneous global detection and improved accuracy. The older LEOSAR system relied on Doppler processing and could take up to two hours to fix a position.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-3",
    topic: "COSPAS-SARSAT",
    prompt: "Why is registering an EPIRB with the relevant authority mandatory?",
    correctAnswer: "It links the beacon's coded identity to the vessel so rescuers can identify it",
    distractors: [
      "It activates the beacon's 406 MHz transmitter",
      "It is only required for Category 2 EPIRBs",
      "It extends the battery life to five years",
    ],
    explanation:
      "Each EPIRB carries a coded identity linked to the vessel's MMSI. Without registration a rescue coordination centre cannot identify the vessel in distress, which delays the SAR response.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-4",
    topic: "COSPAS-SARSAT",
    prompt: "What activates a Category 1 EPIRB when a vessel sinks?",
    correctAnswer: "A hydrostatic release unit lets it float free and transmit automatically",
    distractors: [
      "The crew must remove it from its bracket and switch it on by hand",
      "An internal timer triggers it 24 hours after the last GPS fix",
      "Seawater contact with the antenna completes a transmit circuit",
    ],
    explanation:
      "A Category 1 EPIRB sits in a bracket with a hydrostatic release unit (HRU). Water pressure frees it so it floats clear and transmits automatically. A Category 2 EPIRB must be activated by hand.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-5",
    topic: "COSPAS-SARSAT",
    prompt: "Which of these is NOT a feature you would find on a 406 MHz satellite EPIRB?",
    correctAnswer: "An acoustic homing transmitter",
    distractors: [
      "A 121.5 MHz homing transmitter",
      "An AIS locating transmitter",
      "A high-intensity flashing light",
    ],
    explanation:
      "A 406 MHz EPIRB locates by radio and light: the 406 MHz signal reaches the Cospas-Sarsat satellites, a low-power 121.5 MHz transmitter homes in rescue craft, newer beacons add an AIS locating signal, and a high-intensity light aids the visual search. An EPIRB carries no acoustic homing — there is no sonar-style signal to home on.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-6",
    topic: "COSPAS-SARSAT",
    prompt: "An EPIRB has been activated by accident. What should you do?",
    correctAnswer:
      "Deactivate the EPIRB and notify the nearest Rescue Coordination Centre (RCC) on VHF Channel 16 to cancel the alert",
    distractors: [
      "Disconnect the EPIRB's battery and take no further action",
      "Notify a Mission Control Centre (MCC) by DSC on Channel 70",
      "Broadcast a distress-alert cancellation to all stations on Channel 16",
    ],
    explanation:
      "If an EPIRB is set off by accident, the Cospas-Sarsat satellites have already relayed a distress alert to a Rescue Coordination Centre (RCC) — switching the beacon off does not undo that. The correct procedure is to deactivate the EPIRB to stop further transmission and immediately notify the nearest RCC on VHF Channel 16 to cancel the alert, giving the vessel name, MMSI, position, and the nature of the false activation. Do not confuse the RCC, which coordinates the SAR response, with a Mission Control Centre (MCC) — the Cospas-Sarsat ground station that routes the satellite alert. Broadcasting to all stations is how a false DSC alert is cancelled. Authorities normally impose no penalty for an accidental alert that is cancelled promptly and correctly.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-7",
    topic: "COSPAS-SARSAT",
    prompt:
      "A MEOLUT (Medium Earth Orbit Local User Terminal) ground station receives beacon data from:",
    correctAnswer:
      "MEOSAR repeaters carried on navigation (GNSS) satellites in medium Earth orbit, about 19,000–24,000 km up",
    distractors: [
      "LEOSAR satellites in low Earth orbit, about 1,000 km up",
      "Inmarsat satellites in geostationary orbit",
      "A Mission Control Centre (MCC) on the ground",
    ],
    explanation:
      "A MEOLUT is the ground station of the MEOSAR system. MEOSAR places SAR repeaters on the navigation (GNSS) satellites — GPS, Galileo, and GLONASS — in medium Earth orbit at roughly 19,000–24,000 km. A MEOLUT tracks several of these satellites at once and receives the 406 MHz beacon bursts they relay; working from multiple satellites simultaneously, rather than waiting for one low-orbit satellite to pass overhead and measuring its Doppler shift, gives near-instantaneous and highly accurate global detection. The MEOLUT then forwards the located data to a Mission Control Centre (MCC), which passes it to the RCC. It does not receive from the ~1,000 km LEOSAR satellites — that is a LEOLUT's job — or from Inmarsat, and the MCC sits downstream of the MEOLUT, not as its source.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-8",
    topic: "COSPAS-SARSAT",
    prompt: "What is a LUT (Local User Terminal) in the Cospas-Sarsat system?",
    correctAnswer:
      "A ground receiving station that takes satellite-relayed beacon signals and computes the beacon's position",
    distractors: [
      "A satellite that detects a beacon and relays its signal down to the ground",
      "The centre that forwards located beacon data to the responsible rescue authorities",
      "The centre that tasks and coordinates the search-and-rescue units on scene",
    ],
    explanation:
      "A LUT (Local User Terminal) is the ground receiving station of the Cospas-Sarsat system. When a 406 MHz beacon is activated, a satellite picks up the signal — for the classic LEOSAR/GEOSAR generation it also measures the Doppler shift as it passes overhead — and relays the raw data down to a LUT. The LUT processes that data to compute the beacon's position and identity, then passes the result to a Mission Control Centre (MCC), which routes it to the Rescue Coordination Centre (RCC) that coordinates the rescue. The chain runs: beacon → satellite → LUT → MCC → RCC.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-9",
    topic: "COSPAS-SARSAT",
    prompt: "Which of these devices can be activated either manually or automatically?",
    correctAnswer: "A float-free (Category 1) 406 MHz EPIRB",
    distractors: ["An AIS-SART", "A radar-SART (9 GHz transponder)", "A NAVTEX receiver"],
    explanation:
      'A float-free Category 1 EPIRB is the one device here with two activation modes. If the vessel sinks, water pressure trips its hydrostatic release unit (HRU); the beacon floats free and transmits automatically. It can also be switched on by hand at any time. A radar-SART and an AIS-SART are both switched on by hand only — neither has a float-free or water-activated mode. A NAVTEX receiver is not "activated" for distress at all: it is left running to receive maritime safety information automatically and has no manual distress function. A Category 2 EPIRB, by contrast, is manual-activation only — it is the float-free Category 1 housing that adds the automatic mode.',
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-cospas-10",
    topic: "COSPAS-SARSAT",
    prompt:
      "Which satellite system does Cospas-Sarsat use for its MEOSAR (medium-Earth-orbit) search-and-rescue layer?",
    correctAnswer: "The GNSS navigation satellites (GPS, Galileo, GLONASS)",
    distractors: [
      "Inmarsat geostationary satellites",
      "The Iridium satellite-phone constellation",
      "Digital Selective Calling (DSC) on Channel 70",
    ],
    explanation:
      "MEOSAR launches no dedicated satellites — it places 406 MHz SAR repeaters as a payload on the GNSS navigation constellations (GPS, Galileo and GLONASS) at roughly 19,000–24,000 km. Several are always in view, so a beacon is located almost instantly without waiting for a low-orbit satellite to pass overhead. Inmarsat (geostationary) carried the older GEOSAR alerting but gives no position; Iridium is a commercial satellite-phone network, not part of Cospas-Sarsat; and DSC on Channel 70 is terrestrial VHF alerting, unrelated to the satellite layer.",
  },

  // ── NAVTEX ── seeded from modules/6/lesson-1.json (NAVTEX) ────────────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-1",
    topic: "NAVTEX",
    prompt: "On which frequency is the International NAVTEX service broadcast?",
    correctAnswer: "518 kHz",
    distractors: ["490 kHz", "4209.5 kHz", "2187.5 kHz"],
    explanation:
      "International NAVTEX broadcasts in English on 518 kHz. 490 kHz carries national-language NAVTEX, and 4209.5 kHz is the tropical HF NAVTEX frequency.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-2",
    topic: "NAVTEX",
    prompt: "How often does each NAVTEX station broadcast on its assigned schedule?",
    correctAnswer: "Once every 4 hours",
    distractors: ["Once every hour", "Once every 12 hours", "Continuously, with no fixed schedule"],
    explanation:
      "Each NAVTEX station transmits once every 4 hours, with each broadcast lasting up to 10 minutes. The fixed schedule lets many stations share one frequency without overlapping.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-3",
    topic: "NAVTEX",
    prompt: "Which NAVTEX message types can NOT be rejected by the receiver?",
    correctAnswer: "Navigational warnings, meteorological warnings, and SAR information",
    distractors: [
      "Ice reports and pilot service messages",
      "Meteorological forecasts only",
      "Any message type may be rejected by the operator",
    ],
    explanation:
      "Message types A (navigational warnings), B (meteorological warnings), D (SAR information) and L (additional navigational warnings) cannot be rejected — they are mandatory safety categories.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-4",
    topic: "NAVTEX",
    prompt: "In a NAVTEX message preamble, what does the first character (B1) identify?",
    correctAnswer: "The transmitting station",
    distractors: ["The message type", "The message serial number", "The message priority level"],
    explanation:
      "In the preamble B1B2B3B4, the B1 character (A-Z) identifies the transmitting station. B2 is the message type and B3B4 are the two-digit serial number.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-5",
    topic: "NAVTEX",
    prompt: "What are the three priority levels a NAVTEX message can carry?",
    correctAnswer: "Vital, Important, and Routine",
    distractors: [
      "Distress, Urgency, and Safety",
      "Emergency, Priority, and Normal",
      "Critical, Standard, and Optional",
    ],
    explanation:
      "NAVTEX messages carry one of three priority levels. VITAL messages demand immediate broadcast and use serial number 00 — they are always printed. IMPORTANT messages go out at the next scheduled transmission. ROUTINE messages travel in the normal broadcast cycle. Distress, Urgency, and Safety are the priorities of radiotelephony traffic, not NAVTEX.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-6",
    topic: "NAVTEX",
    prompt: "NAVTEX delivers MSI to ships. What does the abbreviation MSI stand for?",
    correctAnswer: "Maritime Safety Information",
    distractors: [
      "Maritime Situation Index",
      "Marine Signal Identifier",
      "Mandatory Safety Instructions",
    ],
    explanation:
      "MSI is Maritime Safety Information — navigational warnings, meteorological warnings and forecasts, and SAR information. NAVTEX is one of the GMDSS services that delivers MSI to ships automatically.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-7",
    topic: "NAVTEX",
    prompt: "In a NAVTEX preamble, what type of message does the B2 type-code 'D' identify?",
    correctAnswer: "Search and rescue information",
    distractors: ["Navigational warnings", "Ice reports", "Meteorological forecasts"],
    explanation:
      "The B2 character codes the message type: A = navigational warnings, B = meteorological warnings, C = ice reports, D = SAR information, E = meteorological forecasts, L = additional navigational warnings. Codes A, B, D and L cannot be rejected by the receiver.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-8",
    topic: "NAVTEX",
    prompt: "Which of these would NOT be broadcast on a NAVTEX service?",
    correctAnswer: "A ship's routine position report to its company office",
    distractors: [
      "A navigational warning about a damaged buoy",
      "A coastal gale warning",
      "A search-and-rescue information broadcast",
    ],
    explanation:
      "NAVTEX carries Maritime Safety Information only — navigational warnings, meteorological warnings and forecasts, and SAR information — broadcast one-way to all ships. It never carries a vessel's own routine or private traffic, such as a position report to its company.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-9",
    topic: "NAVTEX",
    prompt:
      "The radio equipment carried into a life raft has one purpose: to get the survivors found. Which of these is NOT part of that survival-craft equipment?",
    correctAnswer: "A NAVTEX receiver",
    distractors: ["An EPIRB", "A portable (handheld) VHF radio", "A SART"],
    explanation:
      "The radio equipment carried into a survival craft has one job — to get you found. An EPIRB alerts rescue authorities through the Cospas-Sarsat satellites, a SART lets searching ships and aircraft home in on the craft, and a portable handheld VHF gives on-scene voice contact with rescuers. A NAVTEX receiver does the opposite: it only receives Maritime Safety Information — navigational and weather warnings broadcast to the ship. It cannot alert anyone to your distress or help anyone locate you, so it has no place in the life raft.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-10",
    topic: "NAVTEX",
    prompt: "What is broadcast on the frequency 4209.5 kHz?",
    correctAnswer:
      "Tropical NAVTEX — the HF NAVTEX service that extends maritime safety information into tropical warning areas",
    distractors: [
      "National NAVTEX — maritime safety information in the local national language",
      "International NAVTEX — the primary English-language service for all GMDSS vessels",
      "HF DSC distress and safety alerting for vessels beyond MF range",
    ],
    explanation:
      "NAVTEX operates on three frequencies: 518 kHz carries International NAVTEX in English; 490 kHz carries National NAVTEX in the local language; 4209.5 kHz is Tropical NAVTEX, an HF frequency extending coverage into tropical warning areas. All three deliver the same maritime safety information — only frequency, language, and coverage differ. 4209.5 kHz is easily confused with the HF DSC distress frequency 4207.5 kHz, but the two are separate services.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-11",
    topic: "NAVTEX",
    prompt:
      "Consider these statements about NAVTEX. (1) A NAVTEX station's range always exceeds that of a coastal VHF station. (2) A NAVTEX station's range roughly doubles at night. (3) The world is divided into 21 areas called NAVAREAs. Which statements are correct?",
    correctAnswer: "All three statements are correct",
    distractors: [
      "Only statements 1 and 3 are correct",
      "Only statements 2 and 3 are correct",
      "Only statement 3 is correct",
    ],
    explanation:
      "All three are correct. (1) A NAVTEX station reaches roughly 400 NM, far beyond the 30-50 NM line-of-sight range of a coastal VHF station. (2) NAVTEX uses the MF band; at night, sky-wave propagation extends its range substantially — roughly double the daytime ground-wave coverage. This is why two stations sharing the same B1 identifier must lie about 800 NM apart and time-share their broadcasts. (3) The world is divided into 21 geographical areas called NAVAREAs, each with a NAVAREA coordinator who promulgates navigational warnings.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-12",
    topic: "NAVTEX",
    prompt:
      "A NAVTEX receiver will reject (not print) an incoming message when: (1) the message has already been received before; (2) its message-type character (B2) has been programmed for rejection by the operator; (3) its transmitting-station character (B1) has been programmed for rejection by the operator. In which of these cases is the message rejected?",
    correctAnswer: "In all three cases",
    distractors: ["Only in cases 1 and 2", "Only in case 1", "Only in cases 2 and 3"],
    explanation:
      "Rejected in all three. (1) The receiver stores recently received messages and automatically discards duplicates. (2) The operator can program out whole message-type categories (the B2 character) that are not relevant — though the safety types A, B, D and L can never be rejected. (3) The operator can likewise deselect individual transmitting stations (the B1 character) outside the vessel's area. A message escapes rejection only when it is new, from a selected station, of a selected type — or carries serial number 00 (VITAL), which is always printed.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-13",
    topic: "NAVTEX",
    prompt: 'Under what conditions will messages from NAVTEX station "P" be received and printed?',
    correctAnswer:
      "If station P is selected in the receiver's programming, or if the message carries serial number 00",
    distractors: [
      "Only while a daily receiver self-test routine is running",
      "Only if the message's identification code is already stored in memory",
      'Only if the receiver is set to "Individual" rather than "All stations"',
    ],
    explanation:
      'A NAVTEX receiver prints a station\'s messages when that station\'s B1 character — here "P" — is among those selected in its programming. In addition, any message numbered 00 (serial B3B4 = 00) is a VITAL message: it is always printed regardless of receiver settings, even from a station the operator has deselected. A message whose identification code is already stored is the opposite case — it would be rejected as a duplicate; and NAVTEX has no "Individual/All stations" selection (that is a DSC concept).',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-14",
    topic: "NAVTEX",
    prompt:
      "A NAVTEX receiver is programmed to receive four stations. How many reception cycles will it receive from those stations in one day?",
    correctAnswer: "24",
    distractors: ["4", "16", "21"],
    explanation:
      "Each NAVTEX station transmits on its fixed schedule once every four hours — six times in a 24-hour day. With four stations selected, the receiver therefore sees 4 × 6 = 24 broadcast cycles per day. The distractor 4 is merely the number of stations; 21 is the number of NAVAREAs (a different fact entirely); 16 corresponds to no NAVTEX figure.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-15",
    topic: "NAVTEX",
    prompt:
      'A NAVTEX message is received from coast station "N", carrying a navigational warning with serial number 23. Which message identification code (B1B2B3B4) identifies it?',
    correctAnswer: "NA23",
    distractors: ["AN23", "NNNN", "NANA"],
    explanation:
      'Every NAVTEX message carries a four-character identifier B1B2B3B4. B1 is the transmitting station\'s letter (here N), B2 is the subject/message-type letter (A = navigational warning), and B3B4 are the two-digit serial number (23). Read in that order the code is NA23. AN23 reverses the station and subject letters; "NNNN" is the end-of-message signal that closes a NAVTEX/telex transmission, not an identifier; and NANA is not a valid code at all.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-16",
    topic: "NAVTEX",
    prompt: 'A maritime safety broadcast carries a "gale warning". What does that warn of?',
    correctAnswer:
      "That winds of gale force — Beaufort force 8 (34 knots) or more — are expected or already blowing",
    distractors: [
      "That hurricane-force winds have already struck and the storm has passed its peak",
      "A routine weather forecast issued on a fixed schedule regardless of wind strength",
      "That dangerously high waves from a distant earthquake are approaching the coast",
    ],
    explanation:
      'A gale warning is a meteorological warning that mean winds of Beaufort force 8 (34–40 knots) or stronger are expected or occurring — one of the standard maritime safety information (MSI) weather messages broadcast by NAVTEX and radio. Storm- and hurricane-force winds are covered by separate, higher-grade warnings; an ordinary scheduled forecast is not a "warning"; and seismic sea waves are the subject of tsunami warnings, not gale warnings.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-navtex-17",
    topic: "NAVTEX",
    prompt: 'A navigational warning reports a "floating mine". What hazard is being described?',
    correctAnswer:
      "An explosive sea mine drifting freely on or near the surface, a danger to passing vessels",
    distractors: [
      "A mooring buoy that has broken loose from its anchor and is adrift",
      "A submerged rock or wreck charted as a danger to navigation",
      "A patch of floating debris or lost fishing gear that could foul a propeller",
    ],
    explanation:
      "A floating mine is a drifting explosive sea mine — a serious hazard broadcast as a navigational warning so that vessels keep well clear and report any sighting to the authorities. It is not a runaway mooring buoy, not a fixed underwater obstruction such as a rock or wreck, and not ordinary floating debris, even though those may also be reported as hazards to navigation.",
  },

  // ── Channels ── seeded from drills/channels.ts ───────────────────────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-1",
    topic: "Channels",
    prompt:
      "Which VHF channel is the international voice channel for distress, safety, and calling?",
    correctAnswer: "Channel 16",
    distractors: ["Channel 70", "Channel 06", "Channel 13"],
    explanation:
      "Channel 16 is the international voice distress, safety, and calling channel. Channel 70 carries DSC distress alerts but no voice traffic.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-2",
    topic: "Channels",
    prompt:
      "Which VHF channel is reserved for Digital Selective Calling (DSC) distress, safety, and calling?",
    correctAnswer: "Channel 70",
    distractors: ["Channel 16", "Channel 06", "Channel 72"],
    explanation:
      "Channel 70 is used exclusively for DSC distress, safety, and calling — no voice transmission is permitted on it. Voice distress traffic moves to Channel 16.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-3",
    topic: "Channels",
    prompt: "Which VHF channel is designated worldwide for bridge-to-bridge navigation safety?",
    correctAnswer: "Channel 13",
    distractors: ["Channel 16", "Channel 06", "Channel 09"],
    explanation:
      "Channel 13 is the world-wide bridge-to-bridge channel for navigation safety communication between vessels. Channel 06 is primary for inter-ship SAR; Channel 16 is for distress and calling.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-4",
    topic: "Channels",
    prompt:
      "Which VHF channel is the primary frequency for inter-ship and ship-to-aircraft search and rescue?",
    correctAnswer: "Channel 06",
    distractors: ["Channel 16", "Channel 13", "Channel 09"],
    explanation:
      "Channel 06 is the primary inter-ship and ship-to-aircraft channel for search and rescue. Channel 16 is for distress and calling; Channel 13 is for bridge-to-bridge navigation safety.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-5",
    topic: "Channels",
    prompt: "Which of these VHF channels is NOT a simplex channel?",
    correctAnswer: "Channel 25",
    distractors: ["Channel 16", "Channel 06", "Channel 13"],
    explanation:
      "Channels 24 and 25 are public-correspondence channels — duplex, using separate ship and coast-station frequencies so both can speak at once, like a telephone call. Channels 16, 06 and 13 are simplex: one frequency, press-to-talk, one station at a time.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-6",
    topic: "Channels",
    prompt: "What is the purpose of bridge-to-bridge communication on VHF?",
    correctAnswer:
      "Coordinating navigation safety between vessels — agreeing passing, overtaking, and manoeuvring intentions",
    distractors: [
      "Coordinating search-and-rescue operations between ships and aircraft",
      "Calling port authorities to arrange a berth and request a pilot",
      "Exchanging routine operational and social messages between vessels' crews",
    ],
    explanation:
      "Bridge-to-bridge communication is one of the GMDSS functional requirements. On VHF it uses Channel 13, and its purpose is navigation safety: the watch officers of two vessels speak directly, bridge to bridge, to agree how they will pass, overtake, or manoeuvre clear of one another. It matters most in congested waterways, near bridges, and in port approaches, where many states make monitoring Channel 13 mandatory. It is not a search-and-rescue channel (Ch 06), a port-operations channel (Ch 12/14), or a channel for routine chatter.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-7",
    topic: "Channels",
    prompt: "When must a radiotelephone-fitted vessel keep watch on VHF Channel 13 while at sea?",
    correctAnswer: "Whenever possible — typically by keeping a Dual Watch with Channel 16",
    distractors: [
      "There is no need; a coast station's continuous watch is sufficient",
      "Continuously, 24 hours a day, as a mandatory replacement for the Channel 16 watch",
      "Only for 8 hours a day, during daylight",
    ],
    explanation:
      "Channel 13 is the worldwide bridge-to-bridge navigation-safety channel, used to arrange safe passing and manoeuvring. A vessel should monitor it whenever possible so other ships can reach it for navigation safety — most conveniently by running a Dual Watch that listens to Channel 13 alongside the distress and calling watch on Channel 16. It does not replace the Channel 16 watch, a coast station's watch does not relieve the ship of it, and it is not a fixed 8-hour daylight duty.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-8",
    topic: "Channels",
    prompt: "What is the purpose of VHF Channel 16?",
    correctAnswer: "The distress, urgency, safety, and calling channel for radiotelephony (voice)",
    distractors: [
      "The DSC channel for distress, urgency, and safety alerts",
      "A channel that replaces Channel 70 in the GMDSS system",
      "A channel dedicated to NAVTEX and weather broadcasts",
    ],
    explanation:
      "Channel 16 (156.800 MHz) is the international VHF voice channel for distress, urgency, safety and calling — where a spoken MAYDAY, PAN PAN or SÉCURITÉ is made and stations make initial contact before moving to a working channel. The trap is the DSC role: digital distress alerts go on Channel 70, not 16 — the two are complementary, not interchangeable, and neither replaces the other. NAVTEX is a separate MF service on 518 kHz, not a VHF channel.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-channels-9",
    topic: "Channels",
    prompt:
      "Which equipment is used to send distress alerts and routine calls to a specific station, a group, or all stations?",
    correctAnswer: "A DSC (Digital Selective Calling) controller",
    distractors: ["A NAVTEX receiver", "A GPS receiver", "A scanning watch receiver"],
    explanation:
      "Digital Selective Calling (DSC) sends a short coded digital call addressed to one specific station (by its MMSI), to a group, or to all stations — for distress, urgency, safety or routine purposes. The DSC controller is the equipment that composes and sends those calls (on VHF Channel 70). A NAVTEX receiver only receives broadcast safety information and cannot call anyone; a GPS receiver only supplies position; and a scanning watch receiver merely listens across DSC channels for incoming alerts — it does not originate calls.",
  },

  // ── SART ── seeded from modules/6/lesson-4.json (SART and AIS-SART) ───────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-1",
    topic: "SART",
    prompt: "How does a radar-SART appear on a searching vessel's radar display at long range?",
    correctAnswer: "Twelve equally-spaced dots extending from the SART's position",
    distractors: [
      "A single bright dot",
      "A set of concentric circles",
      "A flashing alphanumeric label",
    ],
    explanation:
      "At long range a radar-SART shows 12 equally-spaced dots. As the vessel closes in the dots become arcs, and within about 1 NM they merge into concentric circles. A single dot indicates the self-test mode.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-2",
    topic: "SART",
    prompt: "A radar-SART responds only to which type of radar?",
    correctAnswer: "X-band (9 GHz) radar",
    distractors: ["S-band (3 GHz) radar", "Both X-band and S-band radar", "Doppler weather radar"],
    explanation:
      "A radar-SART responds only to X-band (9 GHz) radar. It will not respond to S-band (3 GHz) radar, so a searching vessel must use its X-band set.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-3",
    topic: "SART",
    prompt: "What is the main advantage of an AIS-SART over a traditional radar-SART?",
    correctAnswer:
      "It appears on every AIS-equipped display within range, not only on radar screens",
    distractors: [
      "It can be detected by S-band as well as X-band radar",
      "It has a far longer detection range than a radar-SART",
      "It transmits an audible alarm as well as a radio signal",
    ],
    explanation:
      "An AIS-SART transmits on the AIS VHF channels, so it appears on every AIS-equipped display (ECDIS, AIS receivers, radar with AIS overlay) within range — not just on radar screens.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-4",
    topic: "SART",
    prompt: "What does a radar-SART show on the radar display during its self-test?",
    correctAnswer: "A single dot",
    distractors: [
      "Twelve equally-spaced dots",
      "A ring of concentric circles",
      "No response at all",
    ],
    explanation:
      "The radar-SART self-test produces a single dot — distinct from the twelve dots of a live activation. Run the test briefly and only when no SAR operation is in progress.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-5",
    topic: "SART",
    prompt:
      "How does an active AIS-SART appear on a radar or chart plotter that displays AIS targets?",
    correctAnswer: "As a dedicated SART symbol — a circle with a cross — that raises an alarm",
    distractors: [
      "As twelve equally-spaced dots, exactly like a radar-SART trace",
      "As an ordinary AIS vessel triangle, with no special marking",
      "As a ring of expanding concentric circles centred on its position",
    ],
    explanation:
      "An AIS-SART is reported as a distinct distress target: the plotter draws the standardised SART symbol — a circle with a cross — and raises an alarm. This differs from a radar-SART, which has no symbol; it paints a raw radar echo of twelve dots, then arcs, then concentric circles as the range closes.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-6",
    topic: "SART",
    prompt:
      "As a searching vessel closes the range on a radar-SART, how does its mark on the X-band radar change?",
    correctAnswer:
      "Twelve dots first, then arcs, then complete concentric circles centred on the SART",
    distractors: [
      "Complete circles first, then arcs, then twelve dots",
      "A single dot that simply grows brighter as the range closes",
      "Twelve dots that move closer together without changing shape",
    ],
    explanation:
      "At long range a radar-SART paints twelve equally-spaced dots. As the vessel closes in, the dots stretch into arcs; within about 1 NM the arcs merge into complete concentric circles centred on the SART. This changing picture confirms the team is homing in. A single dot instead indicates the self-test mode.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-7",
    topic: "SART",
    prompt:
      "A survival craft has activated a radar-SART. How can the survivors improve the range at which it is detected?",
    correctAnswer: "Mount or hold the SART as high as possible above the water",
    distractors: [
      "Switch the SART to a higher transmit-power setting",
      "Aim the SART's antenna toward the approaching vessel",
      "Press the self-test button repeatedly so it sends more signals",
    ],
    explanation:
      "A radar-SART works by line of sight, like radar itself, so detection range depends on height. Raising the SART — on a pole or held up — extends that line of sight: a ship's radar (15 m scanner) picks it up at about 8 NM, while an aircraft detects it up to 30 NM purely because of the greater height. A SART has no power control and radiates in all directions, so the only thing survivors can do to extend its range is get it as high as they can — at least 1 metre above sea level.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-sart-8",
    topic: "SART",
    prompt: "A SART has been activated by mistake. How must the false alert be cancelled?",
    correctAnswer:
      "Switch the SART off and broadcast a formal distress cancellation to all stations on Channel 16",
    distractors: [
      "Switch the SART off — once it stops transmitting, no further action is needed",
      "Notify only the nearest Rescue Coordination Centre (RCC), with no broadcast to other ships",
      "Report it to a Mission Control Centre (MCC), which will route the cancellation to nearby ships",
    ],
    explanation:
      "A SART is a locally visible distress signal: a radar-SART paints a twelve-dot trace on the X-band radar of any ship or aircraft within range, and an AIS-SART appears on every AIS-equipped display in range. A false activation may therefore already have been seen by vessels all around you — not by a single coordination centre. Cancelling it takes two steps: switch the SART off to stop the signal, then broadcast a formal distress cancellation to all stations on Channel 16 so every vessel that may have detected it knows the distress was false. This differs from a false EPIRB alert, which travels by satellite to one RCC and is cancelled by notifying that RCC.",
  },

  // ── VHF ── seeded from modules/2/lesson-1.json (VHF Radio Basics) ─────────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-1",
    topic: "VHF",
    prompt: "What is the maximum permitted output power for a fixed VHF marine radio installation?",
    correctAnswer: "25 watts",
    distractors: ["1 watt", "5 watts", "100 watts"],
    explanation:
      "A fixed VHF installation may transmit at up to 25 watts (high power). The 1-watt low-power setting should be used whenever range allows, to limit interference.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-2",
    topic: "VHF",
    prompt: "What kind of propagation does maritime VHF communication rely on?",
    correctAnswer: "Line-of-sight",
    distractors: [
      "Ground wave following the Earth's curvature",
      "Sky wave reflected by the ionosphere",
      "Tropospheric scatter over the horizon",
    ],
    explanation:
      "VHF signals travel in straight lines and do not bend around the horizon. Range therefore depends mainly on antenna height — typically 20 to 60 NM for a ship installation.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-3",
    topic: "VHF",
    prompt: "What is the typical communication range of a ship-mounted VHF radio?",
    correctAnswer: "About 20 to 60 nautical miles",
    distractors: [
      "About 5 nautical miles",
      "Up to about 400 nautical miles",
      "Several thousand nautical miles",
    ],
    explanation:
      "Because VHF is line-of-sight, a ship-mounted set typically reaches 20 to 60 NM depending on antenna heights. MF ground wave reaches roughly 400 NM; HF sky wave reaches thousands of NM.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-4",
    topic: "VHF",
    prompt: "In which frequency band does maritime VHF radio operate?",
    correctAnswer: "156 to 174 MHz",
    distractors: ["300 kHz to 3 MHz", "3 to 30 MHz", "406 to 512 MHz"],
    explanation:
      "Maritime VHF operates between 156 and 174 MHz. 300 kHz to 3 MHz is the MF band; 3 to 30 MHz is the HF band.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-5",
    topic: "VHF",
    prompt: "What does the abbreviation DSC stand for in GMDSS radio equipment?",
    correctAnswer: "Digital Selective Calling",
    distractors: [
      "Duplex Selective Calling",
      "Digital Selective Command",
      "Distress Selective Calling",
    ],
    explanation:
      "DSC stands for Digital Selective Calling — a technique that sends a short, coded digital message to alert a specific station, a group, or all stations. On VHF it uses Channel 70; a DSC distress alert carries the vessel's MMSI and, when the set is interfaced to a GPS, its position.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-6",
    topic: "VHF",
    prompt:
      "Which of the following is NOT required to be carried by a vessel operating only in GMDSS Sea Area A1?",
    correctAnswer: "An MF radio installation with DSC",
    distractors: ["A VHF radio with DSC", "A 406 MHz satellite EPIRB", "A NAVTEX receiver"],
    explanation:
      "Sea Area A1 lies within VHF range of a coast station that keeps a continuous DSC watch, so a vessel operating only there carries a VHF radio with DSC, a NAVTEX receiver for maritime safety information, and a 406 MHz EPIRB. An MF radio with DSC is the defining requirement of Sea Area A2, not A1.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-7",
    topic: "VHF",
    prompt: "Which of these situations would NOT call for an Urgency (PAN PAN) message?",
    correctAnswer: "A large unlit object is drifting in a busy shipping lane",
    distractors: [
      "A crew member needs urgent medical advice",
      "A vessel has lost steering but is not in immediate danger",
      "A vessel has engine failure in a shipping lane, with no immediate danger to life",
    ],
    explanation:
      "Urgency (PAN PAN) covers a vessel or person in a serious situation that is not yet grave and imminent danger — lost steering, engine failure, or a crew member needing urgent medical advice. A drifting navigational hazard endangers no vessel directly; warning other ships about it is a Safety (SÉCURITÉ) message.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-8",
    topic: "VHF",
    prompt: "Which of these is NOT part of a spoken MAYDAY distress message?",
    correctAnswer: "The vessel's destination and estimated time of arrival",
    distractors: [
      "The vessel's position",
      "The nature of the distress",
      "The number of persons on board",
    ],
    explanation:
      "A voice MAYDAY message follows a precise format: identity (name, call sign, MMSI), position, nature of the distress, assistance required, number of persons on board, and any other useful information. The vessel's destination and ETA are no part of it — a distress message reports the emergency now, not the voyage plan.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-9",
    topic: "VHF",
    prompt: 'When does a vessel transmit a Transit Report (TR, spoken "Tango Romeo")?',
    correctAnswer:
      "When it is underway, to give coast stations along its route its voyage details so authorities can track it",
    distractors: [
      "When the vessel is in distress and needs immediate rescue assistance",
      "When the vessel sights a hazard it must warn other ships about",
      "When the vessel wants the coast station to place a telephone call ashore",
    ],
    explanation:
      'A Transit Report (TR, "Tango Romeo") is a routine report a vessel underway sends to coast stations along its route. It lists voyage details — vessel name and call sign, departure and destination ports, intermediate stops, ETA, and persons on board — so authorities can track the vessel and launch a search if it fails to arrive. Many coastal states make a TR mandatory in their waters. It is not a distress call, a navigational warning, or a public-correspondence (telephone) request.',
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-10",
    topic: "VHF",
    prompt: "What is the low-power setting of a fixed (ship-installed) VHF marine radio?",
    correctAnswer: "1 watt",
    distractors: ["0.25 watt", "0.5 watt", "5 watts"],
    explanation:
      "A fixed VHF installation switches between 25 watts (high) and 1 watt (low). Regulations require using the minimum power necessary, so 1 watt is correct for nearby vessels and port working — it reduces interference. Note that 1 watt is the low setting for a fixed set but the high setting for a GMDSS handheld, whose low power is only 0.25 watt.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-11",
    topic: "VHF",
    prompt:
      "What is the minimum low-power setting of a GMDSS-compliant portable (handheld) VHF radio?",
    correctAnswer: "0.25 watt",
    distractors: ["0.5 watt", "1 watt", "5 watts"],
    explanation:
      "A GMDSS-compliant handheld VHF has a minimum low power of 0.25 watt and a high power of 1 watt — far less than a fixed installation's 25 watts. The low 0.25-watt setting conserves the battery, which matters in a survival craft. Take care not to confuse the figures: 1 watt is the handheld's high power but a fixed set's low power.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-12",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear a station transmit: "ALL STATIONS, ALL STATIONS, ALL STATIONS — THIS IS Marion — SEELONCE MAYDAY." What does this mean?',
    correctAnswer:
      "Marion is ordering radio silence — all stations must stop transmitting on the frequency while distress traffic continues",
    distractors: [
      "The distress is over; normal working on the channel may now resume",
      "Marion is relaying another vessel's distress to the coast station as a MAYDAY RELAY",
      "Radio silence is partly relaxed; the frequency may now be used with care for distress-related traffic",
    ],
    explanation:
      'SEELONCE MAYDAY ("SEELONCE" is the phonetic French for "silence") is the primary radio-silence command. It is transmitted by the vessel in distress, or by the station controlling the distress traffic, to demand that every other station immediately stop transmitting on the distress frequency so the distress traffic is not blocked. "Marion" is simply the identity of the station imposing the silence. It does not mean the distress is over — that is SEELONCE FEENEE — nor that the frequency may be used cautiously again — that is PRUDONCE.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-13",
    topic: "VHF",
    prompt:
      'On Channel 16 a coast station broadcasts: "ALL STATIONS x3 — THIS IS [coast station] — SEELONCE FEENEE." What does this mean?',
    correctAnswer:
      "The distress is over — radio silence is lifted and normal working on the channel may resume",
    distractors: [
      "All stations must stop transmitting at once — distress traffic is in progress",
      "The frequency may be used cautiously, but only for traffic related to the distress",
      "A new distress incident has begun and a fresh period of silence applies",
    ],
    explanation:
      'SEELONCE FEENEE (from the French "silence finie" — silence ended) marks the formal end of a distress. It is broadcast by the station supervising the distress traffic, usually a coast station, to lift the radio silence and restore normal working on the frequency. Demanding silence is SEELONCE MAYDAY; a cautious partial relaxation is PRUDONCE. An individual vessel may not declare the distress over — only the supervising station can.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-14",
    topic: "VHF",
    prompt:
      'On Channel 16 the station controlling a distress transmits: "PRUDONCE." What does this mean?',
    correctAnswer:
      "Radio silence is partly relaxed — the frequency may be used with care, but only for traffic related to the distress",
    distractors: [
      "The distress is over and full normal working may now resume",
      "Complete radio silence is demanded from every station",
      "The frequency is open for any urgent traffic, including unrelated PAN PAN messages",
    ],
    explanation:
      'PRUDONCE (from the French "prudence") is a partial relaxation of radio silence, issued only by the station controlling the distress. The distress is still ongoing, so the frequency may be used cautiously for distress-related traffic only — normal traffic stays prohibited. The full lifting of silence is SEELONCE FEENEE; a total silence demand is SEELONCE MAYDAY.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-15",
    topic: "VHF",
    prompt:
      'During a distress on Channel 16, a vessel that is not controlling the distress transmits: "SEELONCE DISTRESS." What does this mean?',
    correctAnswer:
      "That vessel has heard interference with the distress traffic and is demanding the interfering station stop",
    distractors: [
      "It is the silence command reserved for the vessel in distress or the controlling station",
      "It announces that the distress traffic has finished and normal working may resume",
      "It permits cautious use of the frequency for distress-related traffic",
    ],
    explanation:
      "SEELONCE DISTRESS may be transmitted by any station — not just the one controlling the distress — that hears harmful interference with the distress traffic; it tells the offending station to stop. SEELONCE MAYDAY, by contrast, is the silence command reserved for the vessel in distress or the controlling station. SEELONCE FEENEE ends the distress; PRUDONCE relaxes the silence.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-16",
    topic: "VHF",
    prompt:
      "You are part-way through a routine call on Channel 16 when a MAYDAY distress call breaks in. What must you do?",
    correctAnswer:
      "Immediately stop transmitting and listen — distress traffic has absolute priority",
    distractors: [
      "Quickly finish your current message, then release the channel",
      "Switch to low power and continue your call",
      "Move your routine call to a working channel and carry on",
    ],
    explanation:
      "Distress communications have absolute priority over all other traffic. The instant a MAYDAY is heard, every station whose transmission could interfere must stop at once and listen — you do not finish your message, reduce power, or relocate the call first. Finishing the message delays the casualty, low power still interferes, and moving channels risks missing the distress traffic. Only immediate silence guarantees the vessel in distress can be heard.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-17",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "PAN PAN, PAN PAN, PAN PAN — ALL STATIONS x3 — THIS IS ...". What does this mean?',
    correctAnswer: "A vessel or person has an urgent but not immediately life-threatening problem",
    distractors: [
      "A vessel is in grave and imminent danger and needs immediate assistance",
      "A navigational or weather hazard is being broadcast for the safety of shipping",
      "A station is relaying a distress message on behalf of another vessel",
    ],
    explanation:
      'PAN PAN (from the French "panne", a breakdown) is the urgency signal — second in the priority order, below distress (MAYDAY) and above safety (SECURITE) and routine traffic. It announces a serious situation concerning a vessel or person that is not grave and imminent danger: loss of steering, engine failure in a shipping lane, a person overboard, or a serious but not immediately life-threatening injury. If the danger becomes immediate, the message is upgraded to MAYDAY.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-18",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "SECURITE, SECURITE, SECURITE — ALL STATIONS x3 — THIS IS ...". What does this mean?',
    correctAnswer:
      "A safety message follows — a navigational or meteorological warning for the awareness of shipping",
    distractors: [
      "A vessel is in grave and imminent danger and needs immediate assistance",
      "A vessel has an urgent but not immediately life-threatening problem",
      "A station is relaying a distress message on behalf of another vessel",
    ],
    explanation:
      'SECURITE (pronounced "say-cure-ee-tay", French for safety) is the safety signal — third in the priority order, below distress and urgency and above routine traffic. Unlike MAYDAY and PAN PAN it does not concern a vessel in danger; it carries a navigational or meteorological warning — a floating hazard, an unlit buoy, a new wreck, approaching severe weather — for the awareness of all shipping. It is a one-way broadcast and ends with OUT, as no acknowledgment is expected.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-19",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "MAYDAY RELAY, MAYDAY RELAY, MAYDAY RELAY — THIS IS ...". What does this mean?',
    correctAnswer:
      "A station that is not itself in distress is passing on a distress message for another vessel",
    distractors: [
      "The vessel transmitting is itself in grave and imminent danger",
      "A vessel has an urgent but not immediately life-threatening problem",
      "A navigational or weather hazard is being broadcast for the safety of shipping",
    ],
    explanation:
      "A MAYDAY RELAY is transmitted by a station that is not itself in distress, to pass on a distress message for another vessel — typically because that vessel cannot transmit, or its distress call has gone unanswered. Any vessel or coast station may relay. Note the word RELAY: an ordinary MAYDAY is the casualty's own call, whereas a MAYDAY RELAY carries someone else's distress. The relaying station quotes the original message exactly and tries to reach a coast station first.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-20",
    topic: "VHF",
    prompt: "What is the purpose of the SQUELCH control on a VHF radio?",
    correctAnswer:
      "It mutes the receiver's background static when no signal is present, while still letting genuine incoming transmissions through",
    distractors: [
      "It adjusts the transmitter's output power between high (25 W) and low (1 W)",
      "It filters out interference bleeding in from adjacent channels",
      "It boosts weak incoming signals so distant stations can be heard more clearly",
    ],
    explanation:
      "Squelch sets a signal-strength threshold on the receiver. Below the threshold the speaker stays silent — muting the constant background hiss — and signals above it come through. Its purpose is to spare the operator a continuous wash of static between transmissions while still passing real traffic. Squelch affects reception only: it has nothing to do with transmit power (that is the separate High/Low power control), it does not filter adjacent channels, and it does not boost weak signals — in fact, set too high it does the opposite, hiding weak signals from distant stations. The correct technique is to open squelch fully until static is heard, then advance it just until the static disappears.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-21",
    topic: "VHF",
    prompt: "What is the purpose of the DW (Dual Watch) button on a VHF radio?",
    correctAnswer:
      "It makes the radio monitor Channel 16 alongside your selected working channel, so you keep a watch on the distress and calling channel while still working another channel",
    distractors: [
      "It continuously cycles through every programmed memory channel, stopping on any channel with activity",
      "It switches the radio straight to Channel 16 from whatever channel is currently in use",
      "It alternates monitoring between two working channels of your choice, with Channel 16 not included",
    ],
    explanation:
      'The DW button switches on Dual Watch. The receiver alternates rapidly between your selected working channel and Channel 16, pausing on whichever channel has an active signal. The purpose is to let you work or monitor another channel without losing the listening watch on the international distress and calling channel. If a signal appears on Channel 16, the radio stays there until the transmission ends. Dual Watch is a receive-only monitoring feature; it does not affect your transmissions. It differs from the general SCAN function, which cycles through all programmed memory channels, and from the dedicated "16" button, which simply jumps straight to Channel 16.',
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-22",
    topic: "VHF",
    prompt:
      "GMDSS requires a radiotelephone to be carried into the survival craft (life raft). Which equipment meets that requirement?",
    correctAnswer:
      "A portable two-way VHF radiotelephone working on Channel 16, plus at least one other channel, with analogue voice emission (class F3E/G3E)",
    distractors: [
      "A portable DSC controller working on Channel 70",
      "A portable radiotelephone working on the 121.5 MHz aeronautical emergency frequency",
      "Three separate radios — one for Channel 16 voice, one for DSC on Channel 70, and one for 121.5 MHz — are all required",
    ],
    explanation:
      "The radiotelephone taken into a survival craft is a portable (handheld) two-way VHF set. It works on Channel 16 — the international voice distress and calling channel — and at least one other channel, carrying ordinary analogue speech (emission class F3E/G3E). Channel 70 is wrong: it carries DSC digital alerts only and voice transmission on it is forbidden, so a DSC controller is not a radiotelephone. 121.5 MHz is wrong too: it is the aeronautical emergency and homing frequency — the band an EPIRB uses so rescue craft can home in — not a marine voice channel; no survival-craft handheld carries speech there. And only one radio is required, not three: the single handheld VHF provides the voice link, while satellite alerting (EPIRB) and radar location (SART) are separate, non-radiotelephone devices.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-23",
    topic: "VHF",
    prompt: "Which of these will REDUCE the range at which your VHF receiver can pick up signals?",
    correctAnswer: "Setting the SQUELCH control to maximum",
    distractors: [
      "Setting the SQUELCH control to minimum",
      "Selecting high (25 W) transmit power",
      "Extending the antenna to its full height",
    ],
    explanation:
      "Squelch sets a signal-strength threshold below which the receiver stays muted. Turned to maximum, it raises that threshold so high that weak, distant signals fall below it and are silenced — you never hear them, which effectively shrinks your reception range. Set to minimum, squelch mutes nothing and you hear even the weakest signals (along with background static), so it does not cut range. Transmit power affects how far you are heard, not how far you can hear; and raising the antenna increases range, not reduces it. The correct technique is to open squelch until static appears, then back it off just until the static disappears.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-24",
    topic: "VHF",
    prompt:
      'On Channel 16 you hear: "ALL STATIONS, ALL STATIONS, ALL STATIONS — THIS IS Rota Radio, Rota Radio, Rota Radio — gale warning, Channel 27." What does this mean?',
    correctAnswer:
      "Rota coast radio station is announcing that it has a gale warning and will broadcast it on Channel 27",
    distractors: [
      "A ship is asking Rota Radio whether it holds any gale warning for Channel 27",
      "Rota Radio is asking all ships to report any gale-warning information to it",
      "Rota Radio is ready to receive gale warnings from vessels on Channel 27",
    ],
    explanation:
      "A coast station addresses ALL STATIONS on Channel 16 to announce maritime safety information, then names the working channel where the full message will follow — here Channel 27. The broadcast therefore tells every vessel: a gale warning is coming, switch to Channel 27 to hear it. The announcement flows from coast station to ships (a one-way broadcast of safety information); it is not a ship querying the coast station, nor a request for vessels to send in weather reports. Listening ships simply tune to Channel 27 for the warning.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-25",
    topic: "VHF",
    prompt:
      'In radiotelephony, how is "DSC20" spelled out using the standard phonetic alphabet and figure-spelling?',
    correctAnswer: "DELTA SIERRA CHARLIE BISSOTWO NADAZERO",
    distractors: [
      "DELTA SENSOR CHARLIE BISSOTWO NADAZERO",
      "DIGITAL SIERRA CHARLIE BISSOTWO NADAZERO",
      "DELTA SIERRA CHARLIE BISSOTWO ZERO",
    ],
    explanation:
      'Each letter is given its NATO phonetic word — D = DELTA, S = SIERRA, C = CHARLIE — and each figure its ITU maritime figure-spelling, in which 2 is BISSOTWO and 0 is NADAZERO. So DSC20 becomes DELTA SIERRA CHARLIE BISSOTWO NADAZERO. The traps substitute non-standard words: there is no "SENSOR" or "DIGITAL" in the phonetic alphabet (S is always SIERRA, D always DELTA), and figures must consistently use the ITU forms — spelling the 2 as BISSOTWO but lapsing into a plain "ZERO" for the 0 is wrong, because 0 is NADAZERO.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-26",
    topic: "VHF",
    prompt:
      "Which statement about a portable (handheld) VHF radiotelephone for a life raft is NOT correct?",
    correctAnswer:
      "It operates in simplex on 156.525 MHz (Channel 70), plus at least one other channel",
    distractors: [
      "It must be waterproof to a depth of 1 metre for at least 5 minutes",
      "It has a minimum effective radiated power of 0.25 W",
      "It must operate on Channel 16 and at least one additional channel",
    ],
    explanation:
      "The incorrect statement is the frequency. A survival-craft handheld is a voice radiotelephone working on Channel 16 (156.800 MHz) and at least one other channel — not Channel 70. 156.525 MHz / Channel 70 is the DSC channel, on which voice is prohibited, so it can never be the handheld's working frequency. The other three are all genuine GMDSS requirements: waterproof to 1 m for 5 minutes, a minimum power of 0.25 W, and operation on Channel 16 plus at least one working channel.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-27",
    topic: "VHF",
    prompt:
      "You have accidentally transmitted a false DSC distress alert on VHF. After stopping the repeat transmissions, what must you do?",
    correctAnswer:
      "Prepare a voice cancellation message and transmit it on Channel 16 to all stations",
    distractors: [
      "Send a second DSC distress-cancellation on Channel 70",
      "Transmit a voice cancellation on Channel 13",
      "Transmit a voice cancellation on Channel 24",
    ],
    explanation:
      "After a false DSC distress alert, stop the automatic repeats (use the distress-cancel function, or switch the set off and back on), then broadcast a voice cancellation on Channel 16 — the distress and calling channel — addressed to all stations, giving your vessel name, MMSI, the time of the false alert, and a request to cancel it. The cancellation is made by voice on Channel 16, not by another DSC transmission on Channel 70, and not on a working channel such as 13 or 24, where the stations that heard the alert are not listening.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-28",
    topic: "VHF",
    prompt:
      "Urgency (PAN PAN) traffic has the second-highest priority, below distress. Of the situations below, which would be sent with that second priority? (1) A vessel has lost steering and requires towing. (2) A crew member needs urgent medical advice. (3) A coast station is broadcasting a gale warning.",
    correctAnswer: "Situations 1 and 2",
    distractors: ["Situation 1 only", "Situations 1, 2 and 3", "Situation 3 only"],
    explanation:
      "Urgency (PAN PAN) covers a serious situation concerning a vessel or person that is not yet grave and imminent danger. A vessel disabled by loss of steering and needing a tow (1) and a crew member needing urgent medical advice — a PAN PAN MEDICO (2) — both qualify. A gale warning (3) is a safety message (SÉCURITÉ), the third priority, not urgency. The order is: distress first, urgency second, safety third, routine last.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-29",
    topic: "VHF",
    prompt:
      "Which of these are Safety (SÉCURITÉ) messages? (1) A meteorological warning. (2) A navigational warning. (3) A man-overboard alert.",
    correctAnswer: "Messages 1 and 2",
    distractors: ["Message 1 only", "Messages 1, 2 and 3", "Message 3 only"],
    explanation:
      "Safety (SÉCURITÉ) traffic carries navigational and meteorological warnings for the awareness of shipping — so a meteorological warning (1) and a navigational warning (2) are both safety messages. A man-overboard (3) is a life-threatening emergency: it is distress (MAYDAY), or at least urgency (PAN PAN), never a mere safety broadcast. Safety is the third priority, below distress and urgency.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-30",
    topic: "VHF",
    prompt:
      'Your vessel "Andrea" is calling Haifa Radio on Channel 16 to place two radiotelephone calls. Which is the correct initial call?',
    correctAnswer:
      '"Haifa Radio, Haifa Radio, Haifa Radio — this is Andrea, Andrea, Andrea — I have two R/T calls, please — Channel 26"',
    distractors: [
      '"Haifa Radio — this is Andrea, Andrea — I have two R/T calls, please — Channel 6"',
      '"Haifa Radio, Haifa Radio, Haifa Radio — this is Andrea, Andrea, Andrea — I have two R/T calls, please — Channel 16"',
      '"Haifa Radio, Haifa Radio — this is Andrea, Andrea, Andrea — I have two R/T calls, please — Channel 26"',
    ],
    explanation:
      "An initial call uses the full format — the called station's name three times, THIS IS, then your own name three times — and nominates a working channel to move the traffic off Channel 16. Channel 26 is a public-correspondence working channel, so it is the correct nomination. The distractors each fail on one point: one uses the abbreviated format (names spoken too few times) for a first call; one nominates Channel 16 itself, which must be kept clear for distress and calling and never used for the R/T traffic; and one gives the called station's name only twice. Only the full three-times format with a proper working channel is correct.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-31",
    topic: "VHF",
    prompt:
      "Once contact has been established with a station, what is the abbreviated (shortened) calling format?",
    correctAnswer:
      "The called station's name spoken once, then THIS IS and your own name spoken twice",
    distractors: [
      "The called station's name spoken twice, then THIS IS and your own name spoken once",
      "Both station names spoken once, with no THIS IS",
      "Both station names spoken three times, as in the initial call",
    ],
    explanation:
      "After the first full exchange — when both stations have already identified each other — you switch to the abbreviated format to save air time: the called station's name once, THIS IS, then your own name twice. The full three-times-each format is reserved for the initial contact, before identities are established. The abbreviated form still keeps THIS IS and gives clear identification; it simply reduces the repetitions now that both stations know who is who.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-32",
    topic: "VHF",
    prompt:
      "What is the correct order of communication priorities under the Radio Regulations, from highest to lowest?",
    correctAnswer: "Distress, urgency, safety, routine",
    distractors: [
      "Vital, important, routine",
      "Distress call, distress message, distress traffic",
      "Activating DSC, activating EPIRB, activating SART",
    ],
    explanation:
      'The Radio Regulations rank radiocommunications in four priority levels, highest first: distress (MAYDAY), urgency (PAN PAN), safety (SÉCURITÉ), then routine traffic. "Vital/important/routine" are the NAVTEX message-priority labels, a different scheme. "Distress call, message, traffic" are the three phases within a single distress, not the overall priority order. And listing distress equipment (DSC/EPIRB/SART) describes alerting devices, not communication priorities.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-33",
    topic: "VHF",
    prompt: "When are the details of a Transit Report (TR, voyage report) normally transmitted?",
    correctAnswer: "Before entering and after leaving port",
    distractors: [
      "Every four hours throughout the voyage",
      "Once a day at a fixed time",
      "Only when directed by an RCC during a distress",
    ],
    explanation:
      "A Transit Report gives coast stations a vessel's voyage details so authorities can track it and raise the alarm if it fails to arrive. It is sent at the key points of the passage — typically before entering and after leaving port (departure and arrival reporting) — not on a fixed four-hourly or daily clock, and not only during a distress. Many coastal states make such reporting mandatory in their waters.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-34",
    topic: "VHF",
    prompt:
      "At the end of a transmission, which procedure word tells the other station that you expect a reply?",
    correctAnswer: '"OVER"',
    distractors: ['"OUT"', '"STAND BY"', '"RECEIVED"'],
    explanation:
      '"OVER" means: my transmission is finished and I expect a reply from you — it hands the exchange back to the other station. "OUT" is its opposite: the communication is finished and no reply is expected (and the two are never used together). "STAND BY" asks the other station to wait, and "RECEIVED" (or ROGER) merely acknowledges that a message was heard. Only OVER invites the other station to respond.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-35",
    topic: "VHF",
    prompt:
      'In distress traffic, a station acknowledges a distress message by transmitting "RECEIVED MAYDAY". What does that acknowledgement mean?',
    correctAnswer: "I have received your distress message and I am listening to you",
    distractors: [
      "I have received your distress message and I am proceeding immediately to assist you",
      "I have received your distress message and I am about to summon additional help",
      "I have received your distress message and I have taken over control of the distress traffic",
    ],
    explanation:
      "RECEIVED MAYDAY — sent as MAYDAY, the distressed vessel's name three times, THIS IS, your own name three times, then RECEIVED MAYDAY — simply acknowledges that the distress message has been received and understood, and that the acknowledging station is now listening. It does not by itself state that the station is proceeding to assist, summoning further help, or controlling the traffic; those are separate actions and messages. Control of distress traffic is imposed with the proword SEELONCE MAYDAY by the station in distress or the station coordinating the rescue, not by the act of acknowledging.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-36",
    topic: "VHF",
    prompt:
      "A survival craft's portable VHF radiotelephone has a limited battery. If no acknowledgement to the distress call has been received, when should it normally be switched on to transmit?",
    correctAnswer:
      "When the SART is triggered by a nearby radar, or a vessel or aircraft is sighted — when rescuers are within VHF range",
    distractors: [
      "Immediately on boarding the life raft, transmitting continuously to maximise the chance of being heard",
      "Only once an EPIRB alert signal has been received",
      "As soon as the raft is taken out of standby mode",
    ],
    explanation:
      "The survival-craft handheld VHF has a small battery and only line-of-sight range, so transmitting before any rescuer is within range merely drains it for nothing. The correct practice is to keep it off and conserve power until help is near — when the SART begins to be interrogated by an approaching radar, or you actually sight a ship or aircraft — and only then make voice contact on Channel 16. Transmitting continuously from the moment you board, or in response to some unrelated EPIRB signal, wastes the limited battery you will need when rescuers finally arrive.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-37",
    topic: "VHF",
    prompt: 'In maritime radio traffic, what does the term "medical evacuation" (MEDEVAC) mean?',
    correctAnswer:
      "The physical removal of an injured or sick person from a vessel for treatment elsewhere",
    distractors: [
      "Radio advice from a doctor ashore on how to treat a patient who stays on board",
      "The evacuation of the whole crew into the liferafts when abandoning ship",
      "A scheduled drill in which the crew practises first aid and casualty handling",
    ],
    explanation:
      "A medical evacuation (MEDEVAC) is the actual transfer of a casualty off the ship — typically by helicopter or rescue craft — so they can reach proper medical care. It is distinct from MEDICO / medical advice, where a doctor advises by radio while the patient remains aboard; from abandoning ship into liferafts; and from a training drill. The defining feature is that the patient physically leaves the vessel.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-vhf-38",
    topic: "VHF",
    prompt:
      'During a radio exchange the other station asks you to "spell your name". What are you being asked to do?',
    correctAnswer:
      "Give the letters of the name one by one using the phonetic alphabet (Alfa, Bravo, Charlie …)",
    distractors: [
      "Repeat the name three times slowly so it can be written down",
      "Transmit the name in Morse code, letter by letter",
      "Give your vessel's call sign or MMSI in place of the name",
    ],
    explanation:
      'To "spell" a word on the radio means to send it letter by letter using the standard phonetic alphabet (Alfa, Bravo, Charlie …), so a name or word that is hard to hear is received without error. It is not merely repeating the word, it is not Morse code, and it is not a request for the call sign or MMSI — those identify the station but do not spell out the name asked for.',
  },

  // ── MMSI ── seeded from modules/4/lesson-1.json (MMSI and Call Signs) ─────
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-1",
    topic: "MMSI",
    prompt: "How many digits does a Maritime Mobile Service Identity (MMSI) contain?",
    correctAnswer: "9 digits",
    distractors: ["7 digits", "6 digits", "11 digits"],
    explanation:
      "An MMSI is a unique 9-digit number programmed into the ship's DSC equipment and automatically included in every DSC transmission.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-2",
    topic: "MMSI",
    prompt: "An MMSI that begins with the prefix 00 identifies which kind of station?",
    correctAnswer: "A coast station",
    distractors: ["A ship station", "A group of ships for a fleet call", "A SAR aircraft"],
    explanation:
      "An MMSI beginning with 00 followed by the MID is a coast station. A single leading 0 marks a group call, prefix 111 a SAR aircraft, and no leading zero a ship station.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-3",
    topic: "MMSI",
    prompt: "What is the Maritime Identification Digit (MID) within an MMSI?",
    correctAnswer: "A 3-digit country code assigned by the ITU",
    distractors: [
      "The vessel's alphanumeric voice call sign",
      "A checksum that validates the MMSI",
      "A 2-digit code identifying the sea area",
    ],
    explanation:
      "The MID is a 3-digit ITU country code. Its position within the 9-digit MMSI indicates the station type — for example, positions 1 to 3 for a ship station.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-4",
    topic: "MMSI",
    prompt: "Which MMSI prefix identifies a SAR aircraft?",
    correctAnswer: "Prefix 111",
    distractors: ["Prefix 00", "Prefix 970", "Prefix 99"],
    explanation:
      "Prefix 111 identifies a SAR aircraft. Prefix 00 marks a coast station, 970 an AIS-SART, and 99 a navigational aid.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-5",
    topic: "MMSI",
    prompt: "Which MMSI prefix identifies an AIS-equipped EPIRB (an EPIRB-AIS device)?",
    correctAnswer: "Prefix 974",
    distractors: ["Prefix 970", "Prefix 972", "Prefix 111"],
    explanation:
      "An AIS-EPIRB transmits an AIS identity beginning with 974. The neighbouring device prefixes are 970 for an AIS-SART and 972 for an AIS man-overboard (MOB) device; 111 identifies a SAR aircraft.",
  },

  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-6",
    topic: "MMSI",
    prompt: "What does the abbreviation AIS stand for?",
    correctAnswer: "Automatic Identification System",
    distractors: [
      "Automatic Information System",
      "Auto Insert Signal",
      "Automated Inter-ship Service",
    ],
    explanation:
      'AIS is the Automatic Identification System — each vessel automatically and continuously broadcasts its identity (MMSI and name), position, course, speed and voyage data, and receives the same from others. The classic trap is "Automatic Information System": close but wrong — it is identification, not information. AIS underlies the AIS-SART and EPIRB-AIS locating devices.',
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-7",
    topic: "MMSI",
    prompt:
      "Israel has the Maritime Identification Digit (MID) 428. Which of these is a valid MMSI for a group of Israeli vessels (a fleet call)?",
    correctAnswer: "042811111",
    distractors: ["004280111", "428011111", "041111428"],
    explanation:
      "A group (fleet) call MMSI has the form 0MIDxxxxx — a single leading zero, then the MID, then five more digits: 0-428-11111 = 042811111. The distractors each misplace something. 004280111 begins with 00, which marks a coast station, not a group. 428011111 starts with the MID itself (positions 1-3), so it is an individual ship station. 041111428 keeps the leading-zero group shape but puts the digits 428 at the end instead of straight after the zero — the MID must immediately follow any prefix zeros. Read the leading digits (00 = coast, single 0 = group, non-zero = ship), then the MID right after them, and only 042811111 fits.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-8",
    topic: "MMSI",
    prompt:
      "A ship station has the MMSI 234280482. What is its Maritime Identification Digit (MID)?",
    correctAnswer: "234",
    distractors: ["428", "482", "342"],
    explanation:
      "For a ship station the MID is simply the first three digits of the nine-digit MMSI — here 234. (A non-zero first digit confirms an ordinary ship station, with the MID in positions 1-3.) The distractors are digit-shuffles: 482 reuses the last three digits, 428 is the well-known Israel MID, and 342 rearranges the first three. Only the leading three, read in order, give the country code.",
  },
  // REVIEW: seeded — verify before exam use
  {
    id: "theory-mmsi-9",
    topic: "MMSI",
    prompt:
      "Which shipboard installation lets you view the identification and voyage details (name, course, speed, destination) of other vessels around you?",
    correctAnswer: "AIS (Automatic Identification System)",
    distractors: ["NAVTEX", "EPIRB", "SART"],
    explanation:
      "AIS continuously exchanges identification and voyage data between vessels — each ship transmits its MMSI, name, position, course, speed, and often destination and ETA, shown on a display or chart plotter. NAVTEX only receives broadcast maritime safety information and tells you nothing about specific nearby ships; an EPIRB is a one-way distress beacon; a SART is a radar or AIS locating responder for survival craft. None of those three show other vessels' voyage details.",
  },
];
