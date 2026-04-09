# GMDSS Study Plan

A comprehensive study guide based on the Global Maritime Distress and Safety System (GMDSS) curriculum, organized into 15 topics covering regulatory framework, communication systems, operational procedures, and safety equipment. Based on the GMDSS Jan 2026 classbook, ALRS Volume 5 (NP285), and MID-MMSI reference list.

> **ROC vs GOC Legend**
>
> The **Restricted Operator's Certificate (ROC)** qualifies an operator for **Sea Area A1 only** (VHF coast station range, ~20–50 nm). ROC training focuses on VHF equipment, VHF DSC (Ch 70), SART, NAVTEX, EPIRB basics, and VHF distress procedures.
>
> The **General Operator's Certificate (GOC)** is required for Sea Areas A2, A3, and A4 and covers all GMDSS sub-systems including MF, HF, NBDP, and Inmarsat.
>
> Each topic below is marked: **MANDATORY FOR ROC**, **PARTIALLY RELEVANT FOR ROC**, or **OPTIONAL FOR ROC (GOC only)**.

---

## Topic 0: SRC/ROC Exam Structure and Certification

> **MANDATORY FOR ROC** — Understanding the exam format is essential for preparation.

**Description:** The SRC (Short Range Certificate) / ROC exam structure, pass requirements, and certificate scope. The exam consists of Part A (written) and Part B (practical). Part A is a 30-minute written exam with 20 multiple-choice questions (pass mark: 80). Part B is a 15-minute practical test involving preparation and transmission of a distress broadcast including alert, call, message, and distress traffic (pass mark: 75). A candidate who fails Part A cannot proceed to Part B. A candidate who passes Part A but fails Part B may retake Part B on two exam dates within one year (minimum one month between attempts). The SRC/ROC certificate authorises voice-only communication on VHF, limited to channel selection (no manual frequency control) — "limited radiotelephone service."

**Resources:**

- National maritime authority / Ministry of Communications exam guidelines
- [IMO STCW Convention](https://www.imo.org/en/OurWork/HumanElement/Pages/STCW-Conv-LINK.aspx)

**Example Questions:**

1. What are the two parts of the SRC exam, and what is the pass mark for each?
2. If you fail Part B but pass Part A, what are the conditions for retaking?
3. What does "limited radiotelephone service" mean in the context of the SRC certificate?

---

## Topic 1: GMDSS Overview and Functional Requirements

> **MANDATORY FOR ROC** — General awareness of the GMDSS system, its purpose, and functional requirements is part of all operator certifications.

**Description:** Introduction to the Global Maritime Distress and Safety System — its history, basic concept, and the nine radiocommunication functions every SOLAS vessel must perform. Covers the system's adoption by the IMO in 1988, full implementation in 1999, and the network of devices, shore stations, satellites, and coordination centres that make up the system.

**Resources:**

- [IMO — GMDSS Overview](https://www.imo.org/en/OurWork/Safety/Pages/GMDSS.aspx)
- [ALRS Volume 5 (NP285)](https://www.admiralty.co.uk/publications/publications-and-reference-guides/admiralty-list-of-radio-signals) — Section 1: General
- [ITU Radio Regulations, Articles 30–33](https://www.itu.int/pub/R-REG-RR)

**Example Questions:**

1. List the nine radiocommunication functions that every GMDSS-equipped vessel must be capable of performing under SOLAS Chapter IV.
2. What was the key difference between the pre-GMDSS distress system and the current GMDSS regarding the role of ship operators versus automated alerting?
3. Name the four main sub-systems of the GMDSS and briefly explain each one's function (DSC, Inmarsat, Cospas-Sarsat, MSI).

---

## Topic 2: GMDSS Sea Areas and Equipment Requirements

> **PARTIALLY RELEVANT FOR ROC** — ROC candidates must understand Sea Area A1 definitions and A1 equipment requirements. Knowledge of A2/A3/A4 boundaries and their MF/HF/Inmarsat equipment tables is optional (GOC only). Questions 2 and 3 below are GOC-level.

**Description:** Definitions of Sea Areas A1 through A4, their geographical boundaries, and the mandatory radio equipment carriage requirements for SOLAS ships based on their area of operation. Also covers non-SOLAS vessel requirements and voluntary participation.

**Resources:**

- [SOLAS Chapter IV — Radiocommunications](https://www.imo.org/en/KnowledgeCentre/ConferencesMeetings/Pages/SOLAS.aspx)
- ALRS Volume 5 (NP285) — Equipment Tables
- [ITU-R M.1171 — Radiotelephony Procedures](https://www.itu.int/rec/R-REC-M.1171)

**Example Questions:**

1. Define the boundaries of Sea Areas A1, A2, A3, and A4. What are the primary radio communication methods required for each?
2. A SOLAS cargo ship of 500 GT is navigating in Sea Area A3 using an Inmarsat solution. List the mandatory radio equipment, including any duplicated systems.
3. What are the specific geographical limits of Sea Area A3, and which satellite system provides the continuous alerting coverage for this area?
4. For a vessel sailing exclusively in Sea Area A1, what are the two options permitted for carrying an EPIRB?

---

## Topic 2B: VHF Equipment, Modulation, and Operation

> **MANDATORY FOR ROC** — Detailed knowledge of VHF equipment controls, modulation types, communication modes, frequency bands, antenna effects, and handheld VHF specifications is core to the SRC/ROC curriculum.

**Description:** Practical VHF equipment operation including: frequency modulation (FM) for voice channels (E3F/E3G modulation) vs. DSC channel 70 (B2G modulation); the difference between AM and FM; simplex communication (one frequency, push-to-talk), duplex (two frequencies for simultaneous transmit/receive, requires antenna splitter, used between ship and shore), and semi-duplex (using one frequency of a duplex channel). VHF transceiver controls: Volume/ON-OFF, Channel Select, CH.16 quick-select, Squelch (silences noise, affects reception range only), Dual Watch (DW — monitors Ch 16 alongside a working channel), Power attenuator (25W default to 1W for onboard use), and Distress Alert button (quick access to Ch 70 DSC alert, minimum data = MMSI). Frequency bands overview: VLF (10–30 kHz), LF (30–300 kHz), MF (300–3000 kHz), HF (3–30 MHz), VHF (30–300 MHz), UHF (300–1000 MHz), L-Band (1–2 GHz for Inmarsat), S-Band (2–4 GHz), X-Band (8–12 GHz for radar/SART). Maritime VHF band: 156–174 MHz, divided into 59 channels separated by 25 kHz (Channels 1–28, 60–88, AIS1, AIS2). Handheld VHF specifications: low power 0.25W minimum / 1W high; channels: Ch 16 + at least one working channel; NiCd rechargeable battery; spare lithium battery required; operating time: 40 min–1 hr transmit, 8 hrs listening; waterproof to 1 m depth for 5 minutes; range between two handhelds ~5 miles. Ship batteries should last 6 hours at high power. VHF communication range depends on antenna height, atmospheric conditions, and transmission power. Typical ranges: handheld-to-handheld 5 nm, yacht-to-yacht 15 nm, ship-to-ship 25 nm, yacht (9m antenna) to shore 35 nm, ship (90m antenna) to shore 60 nm.

**Resources:**

- GMDSS Jan 2026 classbook — VHF Equipment section
- [ITU Radio Regulations — Maritime Mobile Band](https://www.itu.int/pub/R-REG-RR)
- ALRS Volume 5 (NP285) — VHF section

**Example Questions:**

1. What type of modulation is used on VHF voice channels (e.g., Ch 16) and what designation is given to DSC modulation on Ch 70?
2. Explain the difference between simplex, duplex, and semi-duplex communication. Which type is used between a small vessel and a shore station?
3. What are the minimum specifications for a handheld VHF (power levels, battery life, waterproofing, channels)?
4. How does antenna height affect VHF communication range? Give typical ranges for handheld-to-handheld vs. ship-to-shore.

---

## Topic 3: Digital Selective Calling (DSC)

> **PARTIALLY RELEVANT FOR ROC** — ROC candidates must know VHF DSC operations (Ch 70), distress alert procedures, and basic call categories. MF/HF DSC specifics (multi-frequency attempts, HF acknowledgement timing) are optional (GOC only). Questions 1 and 3 below are GOC-level.

**Description:** Structure and content of DSC calls, operating procedures, call categories (Distress, Urgency, Safety, Routine), Format Specifiers, frequency management, and the differences between VHF, MF, and HF DSC operations. Includes the DSC distress alert transmission sequence and acknowledgement procedures.

**Resources:**

- [ITU-R M.493 — DSC System Technical Characteristics](https://www.itu.int/rec/R-REC-M.493)
- [ITU-R M.541 — DSC Operational Procedures](https://www.itu.int/rec/R-REC-M.541)
- ALRS Volume 5 (NP285) — DSC Operating Procedures

**Example Questions:**

1. Describe the "single frequency call attempt" for a DSC distress alert on MF/HF. Include the number of bursts, total transmission time, and automatic repetition interval.
2. What is the purpose of the "Format Specifier" in a DSC call structure, and how does a receiver respond when it is set to "Distress" or "All Ships"?
3. What is the mandatory time interval a coast station must observe before acknowledging a DSC distress alert received on MF or HF frequencies?
4. Under what specific conditions is a ship station permitted to transmit a DSC distress relay on behalf of another vessel?

---

## Topic 4: Radiotelephony Procedures, Pro-words, and Radio Ethics

> **MANDATORY FOR ROC** — VHF radiotelephony procedures, pro-words, phonetic alphabet, readability scale, contact procedures, and radio ethics/Ch 16 rules are core SRC/ROC material. NBDP (ARQ/FEC modes, radiotelex) and MF/HF voice procedures are **OPTIONAL (GOC only)**.

**Description:** Comprehensive VHF voice procedures including: establishing contact on Channel 16 (full reading = call sign x3 + identification x3; abbreviated reading = call sign x1 + identification x2); ITU phonetic alphabet and number pronunciation; readability scale (1 = unreadable through 5 = excellent); standard pro-words (Over, Out, Standby, Up, Roger/Received, Copy, Say Again/Repeat, I Spell, I Say Again, In Figures, In Letters, Correct, After/Before Word, Calling Station). Principles of conversation: in ship-to-shore calls, the shore station determines the working channel and duration; in ship-to-ship calls, the called ship determines the working channel. Internal ship communications use Ch 15/17 at low power (1W), with abbreviated reading — main station identified as vessel name + "Control," substations as vessel name + phonetic letter (e.g., "Tami Control," "Tami Bravo"). Radio ethics on Channel 16: conversations max 1 minute, contact check max 10 seconds, call intervals of 2 minutes, no routine conversations, confidentiality of communications, observe channel allocation (local and international), observe broadcasting laws. Also covers Routine calls: Transit Report (Tango Romeo) for reporting voyage details to coast stations (vessel name, departure port, destination, intermediate stops, passengers on board) and Traffic List (Tango Lima) — coast station broadcasts of vessels with pending messages. Radio telephone calls via commercial shore stations with credit card or collect payment. NBDP section (GOC only): ARQ vs FEC modes for radiotelex.

**Resources:**

- GMDSS Jan 2026 classbook — VHF Procedures, Radio Ethics, Routine Transmissions sections
- [ITU-R M.1171 — Radiotelephony Procedures](https://www.itu.int/rec/R-REC-M.1171)
- ALRS Volume 5 (NP285) — Section on Radiotelephony

**Example Questions:**

1. Describe the full and abbreviated reading procedures for establishing contact on Channel 16. When is abbreviated reading used?
2. List at least six standard pro-words used in VHF radiotelephony and explain when each is used.
3. What are the specific rules for using Channel 16 (maximum conversation duration, call intervals, prohibited uses)?
4. In a ship-to-ship call, which station determines the working channel? What about in a ship-to-shore call?

---

## Topic 5: Inmarsat Satellite Communications

> **OPTIONAL FOR ROC (GOC only)** — Inmarsat satellite terminals are required for Sea Areas A3/A4 vessels. ROC holders operate exclusively in Sea Area A1 and are not required to operate Inmarsat equipment. Basic awareness of Inmarsat's existence within the GMDSS may be useful but is not examined at ROC level. All questions in this topic are GOC-level.

**Description:** The Inmarsat geostationary satellite system including its orbital altitude, coverage area (70°N to 70°S), Ocean Regions, and the roles of Land Earth Stations (LES), Network Coordination Stations (NCS), and Mobile Earth Stations (MES). Covers Inmarsat B, C, mini-C, and Fleet services, with focus on GMDSS-compliant terminals for distress alerting.

**Resources:**

- [Inmarsat Maritime Safety](https://www.inmarsat.com/en/solutions-services/maritime/safety.html)
- ALRS Volume 5 (NP285) — Inmarsat Systems section
- [IMO Resolution A.807(19) — Performance Standards for Inmarsat-C](https://www.imo.org)

**Example Questions:**

1. Describe the function and relationship between the Land Earth Station (LES) and the Network Coordination Station (NCS) within an Inmarsat Ocean Region.
2. Compare the capabilities of Inmarsat C terminals with Inmarsat Fleet F77 regarding GMDSS voice communications and distress prioritisation.
3. What is the orbital altitude of Inmarsat geostationary satellites, and what are the latitude limits for their reliable coverage?
4. Explain how the "Distress (SoS) button" on an Inmarsat terminal facilitates immediate ship-to-shore alerting even when all satellite channels are busy.

---

## Topic 6: Cospas-Sarsat System and EPIRBs

> **PARTIALLY RELEVANT FOR ROC** — ROC candidates must know basic EPIRB operation: how to activate it, float-free mechanism, registration, and marking requirements. Detailed knowledge of the Cospas-Sarsat satellite architecture (LEOSAR vs GEOSAR vs MEOSAR, Doppler positioning method, LUT/MCC processing chain) is **OPTIONAL FOR ROC (GOC only)**. Questions 1 and 3 are GOC-level.

**Description:** The Cospas-Sarsat satellite-aided search and rescue system including LEOSAR, GEOSAR, and MEOSAR components. Covers the 406 MHz beacon technology, Doppler positioning, beacon registration, and the detailed characteristics of EPIRBs (float-free, hydrostatic release) and PLBs. Includes EPIRB marking requirements per IMO Resolution A.810(19). Key classbook details: EPIRBs transmit on 406 MHz and 121.5 MHz. Category 1 = float-free with hydrostatic release (activates at 75 cm depth), automatic operation. Category 2 = same frequencies but manual activation only. Transmits 0.5-second burst every 50 seconds at 5W power. EPIRB does NOT emit a sound signal. Contains MMSI identification encoded into content. Battery life: minimum 48 hours continuous transmission; batteries replaced every 5 years if unused. Registration at www.406registration.com is mandatory (global registered beacons: ~1,634,000 of ~2,105,000 total). EPIRB testing: physical integrity check (most important), move power button to middle (light comes on), check battery validity, check hydrostatic trigger. GPIRB = GPS + EPIRB combination — includes built-in GPS for precise positioning. If within GEOSAR coverage, rescue begins almost immediately (minutes); otherwise, falls back to full LEOSAR Doppler process. LEOSAR: 4 transpolar satellites at 1000 km altitude, Doppler positioning (2–5 km accuracy), full orbit ~100 minutes, satellite footprint ~400 km, sunrise-to-sunset pass 15–17 min, rescue ~2 hours. GEOSAR: geostationary at 36,000 km, relay only (no Doppler), requires GPS-equipped beacon for position. MEOSAR: 19,000–24,000 km altitude, uses GPS/GLONASS/Galileo constellations, 70+ satellites when complete (minimum 4 visible anywhere), near-instantaneous global detection after one beacon burst, footprint 7x larger than LEO. EPIRB false alarm cancellation: turn off device, contact nearest coast station on Ch 16 with cancel message.

**Resources:**

- [Cospas-Sarsat Official Website](https://www.cospas-sarsat.int)
- ALRS Volume 5 (NP285) — EPIRB System section
- [IMO Resolution A.810(19) — EPIRB Performance Standards](https://www.imo.org)

**Example Questions:**

1. Explain the Doppler method used by the LEOSAR system to determine a beacon's position. How does this differ from the location capabilities of the GEOSAR system?
2. At what depth does the hydrostatic trigger activate a float-free EPIRB, and what is the minimum required duration for continuous distress transmission once activated?
3. What are the primary advantages of the MEOSAR system over the traditional LEOSAR/GEOSAR systems regarding detection time and position accuracy?
4. What are the specific marking requirements for a satellite EPIRB according to IMO Resolution A.810(19)?

---

## Topic 7: SART and AIS-SART

> **MANDATORY FOR ROC** — SART and AIS-SART are part of the mandatory equipment even in Sea Area A1. ROC candidates must understand operation, testing, the 12-dot radar display, and battery requirements.

**Description:** Search and Rescue Transponders (SART) and AIS-SART devices used for locating survivors. Covers operating frequencies, the 12-dot radar display code, range characteristics, battery requirements, and the visual differences between Radar-SART and AIS-SART on bridge displays.

**Resources:**

- [IMO Resolution A.802(19) — SART Performance Standards](https://www.imo.org)
- ALRS Volume 5 (NP285) — Locating Signals section
- [IMO MSC.246(83) — AIS-SART Performance Standards](https://www.imo.org)

**Example Questions:**

1. Compare the technical characteristics of a Radar-SART and an AIS-SART, including their operating frequencies and the specific visual indicators they produce on a display.
2. Explain the 12-dot code produced by a Radar-SART on an X-band radar. How does this display change as the rescue vessel approaches within 1 nautical mile of the SART?
3. What is the minimum battery standby duration required for a SART, and what is its minimum active transmission time once triggered by a radar signal?

---

## Topic 8: NAVTEX and SafetyNET (Maritime Safety Information)

> **PARTIALLY RELEVANT FOR ROC** — NAVTEX reception is mandatory even in Sea Area A1, so ROC candidates must understand NAVTEX message structure, B1–B4 codes, frequencies, and message types. The EGC/SafetyNET section (Inmarsat-based MSI) and HF NBDP MSI broadcasts are **OPTIONAL FOR ROC (GOC only)** as they apply to Sea Areas A2–A4. Questions 3 is GOC-level.

**Description:** The Maritime Safety Information (MSI) promulgation system including International and National NAVTEX (518 kHz / 490 kHz), Enhanced Group Calling (EGC) via Inmarsat SafetyNET, the World-Wide Navigational Warning Service (WWNWS), NAVAREA coordinators, and message types. NAVTEX introduced in Boston 1983, part of GMDSS since 1999. Frequencies: International = 518 kHz (English), National = 490 kHz (local language), Tropical = 4209.5 kHz. Stations broadcast every 4 hours for up to 10 minutes. Range up to 400 miles. Minimum distance between transmitters with same ID signal: ~800 miles. Before sailing, leave NAVTEX open continuously for 4–12 hours to receive a full message round. NAVTEX message preamble structure: ZCZC followed by B1 (transmitting station letter A–Z, e.g., P = Haifa Radio, F = Antalya, M = Cyprus, H = Iraklion), B2 (message type letter), B3B4 (sequential message number 01–99). Message types (B2 codes): A = Navigational warnings, B = Meteorological warnings, C = Ice reports, D = Search & Rescue info, E = Meteorological forecasts, F = Pilot service, G = Decca messages, H = Loran messages, I = Omega messages, J = Satnav messages, K = Other electronic nav, L = Additional nav warnings, V/W/X/Y = Special services, Z = No messages on hand (QRU). Messages L, D, B, A cannot be deleted by user. Recommended not to delete E. Message priority levels: VITAL (immediate transmission, message number 00), IMPORTANT (immediate when frequency free), ROUTINE (when frequency free). CER (Character Error Rate): if CER exceeds 5%, message is automatically deleted and retransmitted in next cycle; up to 4.9% CER the message is retained but may need manual deletion if unreadable. The world is divided into 21 NAVAREAs (16 areas + 5 regions, including North Pole additions from 01.07.2010). Within each NAVAREA, stations are identified A–Z. EGC/SafetyNET section (GOC only): Inmarsat-based MSI for areas outside NAVTEX coverage.

**Resources:**

- [IMO — WWNWS Guidance](https://www.imo.org/en/OurWork/Safety/Pages/NavigationalWarnings.aspx)
- ALRS Volume 3 (NP283) — NAVTEX Stations
- ALRS Volume 5 (NP285) — MSI section

**Example Questions:**

1. Explain the meaning of the technical code characters B1, B2, B3, and B4 found in the preamble of a standard NAVTEX message.
2. What is the operational range of a NAVTEX coastal station, and what is the minimum required distance between two transmitters using the same identification signal?
3. Within the Inmarsat EGC system, identify the five "C codes" used to instruct the Land Earth Station on how to process an MSI message.
4. Compare the broadcast frequencies used for International NAVTEX versus National NAVTEX services.

---

## Topic 9: Distress, Urgency, and Safety Procedures

> **MANDATORY FOR ROC** — Core distress, urgency, and safety procedures on VHF are essential for all operators. ROC candidates must know VHF MAYDAY/PAN PAN/SECURITE voice procedures, false alert cancellation on Ch 70/Ch 16, and priority of communications. Procedures involving MF/HF DSC relay and Inmarsat-based distress alerting are optional (GOC only). Question 2's MF/HF on-scene frequencies are GOC-level detail.

**Description:** Comprehensive operational procedures for MAYDAY (distress), PAN PAN (urgency), and SECURITE (safety) communications. This topic is heavily practical and includes complete voice scripts as taught in the classbook.

**DSC Distress Alert:** Two methods — (1) Rapid alert: press and hold panic button for 5 seconds (transmits default data: MMSI, last position/time, nature = Undesignated); (2) Full alert: via Menu, select distress nature, verify position and time, then transmit. The alert auto-repeats every 3.5–4.5 minutes until acknowledged. Small ships do NOT acknowledge DSC distress alerts. Nature of distress options: Undesignated (default), Fire/Explosion, Flooding, Collision, Grounding, Capsizing/Listing, Sinking, Adrift/Disabled, Piracy, Abandoning Ship, Man Overboard.

**Distress voice procedure (Ch 16):** MAYDAY x3 → This is [vessel name x3, MMSI] → MAYDAY [vessel name] → position → nature of distress → assistance required → persons on board → any other useful info → OVER. During abandonment, activate: SART (placed high on raft), EPIRB (in water tied to raft), portable VHF on Ch 16 high power with spare battery.

**Acknowledgement:** MAYDAY → [vessel in distress x3] → This is [own vessel x3] → Received MAYDAY → distance and ETA → OVER.

**Distress relay (MAYDAY RELAY):** When a vessel cannot transmit, or distress call is unanswered/interrupted, or relay is requested. MAYDAY RELAY x3 → This is [own vessel x3, MMSI] → Following received from [vessel in distress, MMSI] on Ch 16, QUOTE → [repeat MAYDAY message] → UNQUOTE → OVER. Priority: contact coast station first.

**Radio silence commands:** SEELONCE MAYDAY (by vessel in distress or supervising station) to silence interfering vessels. SEELONCE DISTRESS (by any other vessel) for the same purpose. PRUDONCE (cautious resumption — allows limited use of Ch 16 while distress continues). SEELONCE FEENEE (end of distress — broadcast by supervising station to All Stations).

**Urgency (PAN PAN):** Second priority. Used for vessel/person safety without immediate life threat — malfunction, MEDICO (medical advice/assistance), evacuation needed, or worsening situation. DSC urgency call on Ch 70, then voice on Ch 16. Must be cancelled when urgency ends. MEDICO message structure includes: gender, age, body temp, blood pressure, status, description of events, actions taken, treatment given.

**Safety (SECURITE):** Third priority. Navigation warnings, meteorological warnings. DSC safety call on Ch 70, then voice on Ch 16, continuing on working channel.

**False alarm cancellation:** Turn off device to stop transmitting → Turn on → Broadcast on Ch 16 to All Stations: cancel my false distress alert of [date], time [UTC], position, Master [name, MMSI, date, time UTC] → OUT. No punitive measures if properly reported. Same procedure for EPIRB false alarms (contact nearest coast station).

**Priority order:** 1. DISTRESS, 2. URGENCY, 3. SAFETY, 4. ROUTINE.

**Resources:**

- GMDSS Jan 2026 classbook — Distress, Urgency, Safety, and Routine sections (with full scripts)
- [ITU Radio Regulations, Article 32 — GMDSS Distress Procedures](https://www.itu.int/pub/R-REG-RR)
- ALRS Volume 5 (NP285) — Distress and Safety Procedures
- [IMO COMSAR Circular 25 — False Alert Guidance](https://www.imo.org)

**Example Questions:**

1. What are the two methods for transmitting a DSC distress alert? What default data is sent with the rapid (panic button) method?
2. List all the distress nature options available when transmitting a DSC distress alert.
3. What is the difference between SEELONCE MAYDAY, SEELONCE DISTRESS, PRUDONCE, and SEELONCE FEENEE? Who may use each?
4. Describe the complete MEDICO urgency message structure. What patient information must be included?

---

## Topic 9B: Automatic Identification System (AIS)

> **MANDATORY FOR ROC** — AIS is standard equipment on SOLAS vessels and increasingly common on small craft. Understanding AIS data, channels, and AIS-SART/AIS-EPIRB integration is part of modern GMDSS training.

**Description:** The Automatic Identification System (AIS) — a collision avoidance and safety system for vessels in crowded areas (especially near ports). AIS operates on two dedicated VHF channels: AIS1 (161.975 MHz, Ch 87B) and AIS2 (162.025 MHz, Ch 88B). The system performs ship-to-shore, shore-to-ship, and ship-to-ship transmissions. Transmission timing is self-organising: the system listens briefly to identify available time slots, updating frequency based on vessel speed. Dynamic data transmitted every 2–10 seconds while underway (speed-dependent) and every 3 minutes while at anchor includes: MMSI, position, speed over ground (0–102 knots), course over ground (to 0.1°), true heading (from gyro compass), rate of turn (0–720°/min), and navigation status (at anchor, under way using engine, not under command, etc.). AIS-SART integration: AIS Search and Rescue Transmitters operate on AIS channels, produce 8 messages per minute (4 on each channel), with identification code starting with 970. The AIS-SART symbol on ECDIS/radar is a circle with an X inside. AIS-EPIRB: since 1 July 2022, new EPIRBs must include internal AIS (on 161.975/162.025 MHz) alongside 406 MHz and GNSS receiver. AIS-EPIRB identification code starts with 974. Reference: www.marinetraffic.com for live vessel tracking.

**Resources:**

- GMDSS Jan 2026 classbook — AIS section
- [IMO — AIS Overview](https://www.imo.org/en/OurWork/Safety/Pages/AIS.aspx)
- [MarineTraffic](https://www.marinetraffic.com)

**Example Questions:**

1. On which VHF channels does AIS operate, and how often is dynamic data transmitted for a vessel underway vs. at anchor?
2. List the dynamic data items transmitted by AIS. What vessel identification is always included?
3. What is the AIS-SART symbol on an ECDIS display, and what is the MMSI prefix for AIS-SART devices?
4. Since what date must new EPIRBs include AIS capability, and what is the MMSI prefix for AIS-EPIRB devices?

---

## Topic 10: MMSI, Call Signs, and Identification

> **MANDATORY FOR ROC** — MMSI is programmed into VHF DSC equipment and is fundamental to all DSC operations. ROC candidates must understand ship MMSI structure, MID country codes, and basic call sign usage. Detailed Inmarsat numbering plans (Question 4) are optional (GOC only).

**Description:** Maritime Mobile Service Identity (MMSI) — the unique 9-digit identification system for ships, coast stations, and groups. Covers MMSI structure and format for different station types, Maritime Identification Digits (MID) as country codes, special MMSI prefixes for AIS-SART, MOB devices, and EPIRB-AIS, as well as Inmarsat numbering plans. MMSI is automatically included in every DSC call and is self-powered upon initial installation (replacement by qualified technician only). Call signs: the first two components identify the country (two letters, or letter+number, or number+letter). Israel's identification components: 4X or 4Y. Call sign structure varies by station type: ship (e.g., 4XGSK), coast station (e.g., 4XO for Haifa RCC), lifeboat (mothership ID + XX), aircraft (aircraft ID + X). MMSI format examples with Israel MID 428: Ship = 428123456, Coast station = 004281234 (prefix 00), Ship group = 042812345 (prefix 0), AIS-SART = 970211234 (prefix 970), MOB personal = 972211234 (prefix 972), EPIRB-AIS = 974211234 (prefix 974), SAR aircraft = 111428123 (prefix 111), NAV-AID = 994281234 (prefix 99).

**Resources:**

- [ITU-R M.585 — MMSI Assignment and Use](https://www.itu.int/rec/R-REC-M.585)
- ALRS Volume 5 (NP285) — MMSI section
- [ITU MID Table](https://www.itu.int/en/ITU-R/terrestrial/fmd/Pages/mid.aspx)

**Example Questions:**

1. Construct the 9-digit MMSI format for: (a) a single ship, (b) a coast station, and (c) a group of ships.
2. What do the first three digits (MID) of an MMSI represent? What is the specific MID for vessels registered in Israel?
3. Identify the unique prefix digits used in MMSI numbers for AIS-SARTs, Man Overboard (MOB) devices, and EPIRB-AIS facilities.
4. Explain the Inmarsat numbering plan regarding how ship MMSI numbers relate to Inmarsat B, C, and M terminal identities.

---

## Topic 11: SOLAS Regulations, Maintenance, and Personnel

> **PARTIALLY RELEVANT FOR ROC** — ROC candidates must understand basic SOLAS requirements for Sea Area A1 vessels, VHF watchkeeping duties, radio log book requirements, and the distinction between ROC and GOC certificates. Detailed maintenance options for A3/A4 vessels (Question 1), reserve power requirements for ocean-going ships (Question 4), and MF watchkeeping specifics are optional (GOC only).

**Description:** Extracts from SOLAS Chapter IV covering radio installation requirements, energy sources, reserve power, maintenance options (at-sea, shore-based, duplication), position-updating, and radio watchkeeping. Also covers classes of operator certificates (GOC, ROC, First/Second Class Radio-Electronic Certificates), STCW 95 requirements, and the GMDSS Radio Log Book.

**Resources:**

- [SOLAS Chapter IV — Full Text](https://www.imo.org/en/KnowledgeCentre/ConferencesMeetings/Pages/SOLAS.aspx)
- [STCW Convention and Code](https://www.imo.org/en/OurWork/HumanElement/Pages/STCW-Conv-LINK.aspx)
- ALRS Volume 5 (NP285) — Regulations section

**Example Questions:**

1. According to SOLAS Regulation 15, what are the three options available to shipowners to ensure the availability of radio equipment? How many options must a Sea Area A3 vessel nominate?
2. What are the continuous watchkeeping requirements for a GMDSS-equipped ship while at sea, specifically regarding VHF and MF frequencies?
3. List the three classes of Radio Operator Certificates in descending order of qualification as defined by the Radio Regulations.
4. What is the mandatory "reserve source of energy" requirement for radio installations on ships provided with (and without) an emergency source of electrical power?

---

## Topic 12: Search and Rescue (SAR) Framework

> **PARTIALLY RELEVANT FOR ROC** — ROC candidates should have a general awareness of the SAR system and know what an RCC does. Detailed knowledge of the Cospas-Sarsat processing chain (MCC/LUT roles), IAMSAR Manual volumes, SAR SITREP formats, and advanced OSC/CSS coordination procedures is **OPTIONAL FOR ROC (GOC only)**. Questions 1, 2, and 4 are GOC-level.

**Description:** The international SAR system including the roles of Rescue Coordination Centres (RCC), Mission Control Centres (MCC), Local User Terminals (LUT), On-Scene Coordinators (OSC), and Coordinators of Surface Search (CSS). Key classbook details: RCC activities upon receiving distress alert include (1) attempting to contact the vessel in distress and (2) broadcasting a distress message on NAVTEX to expand the search circle. The RCC supervises rescue operations and appoints the OSC (field operations commander). MCC performs information cross-referencing and MMSI determination. LUT is a ground station that calculates the beacon's location from satellite data. The classbook includes an East Mediterranean SAR Areas map showing the SAR responsibility zones for Israel, Cyprus, Greece, Turkey, Egypt, and other regional states. Covers the three-volume IAMSAR Manual, SAR SITREP reporting, and the operational chain from distress detection through rescue coordination.

**Resources:**

- [IAMSAR Manual (Volumes I–III)](https://www.imo.org/en/Publications/Pages/Home.aspx)
- [Cospas-Sarsat — SAR System Description](https://www.cospas-sarsat.int/en/system-overview)
- ALRS Volume 5 (NP285) — SAR section

**Example Questions:**

1. Define the roles of the Rescue Coordination Centre (RCC) and the Mission Control Centre (MCC) in the processing of a Cospas-Sarsat distress alert.
2. What is a Local User Terminal (LUT), and what specific data does it calculate after receiving a signal from a Cospas or Sarsat satellite?
3. Identify the responsibilities of the On-Scene Coordinator (OSC) and the Coordinator Surface Search (CSS) during a maritime SAR incident.
4. What is the purpose of a SAR SITREP, and what specific information is typically included in the "Situation" section of the report?

---

## VHF Channel Quick Reference

| Channel    | Frequency (MHz) | Purpose                                                 |
| ---------- | --------------- | ------------------------------------------------------- |
| 16         | 156.800         | Distress and safety traffic (radiotelephony)            |
| 70         | 156.525         | DSC distress, urgency, and safety alerts                |
| 06         | 156.300         | Inter-ship SAR coordination; ship-to-aircraft           |
| 08         | —               | Second choice for intership communication               |
| 11         | —               | Communication on vessel movement (Israel: Israeli Navy) |
| 12, 14     | —               | Port operations                                         |
| 13         | 156.650         | Bridge-to-bridge navigation safety                      |
| 15, 17     | —               | Internal ship communication (1W power)                  |
| 24–27      | —               | Duplex public communication (shore-to-ship)             |
| 67, 73     | —               | Fishing vessel communication                            |
| 75, 76     | —               | Guard bands for Ch 16 (1W power only)                   |
| AIS1 (87B) | 161.975         | AIS channel 1                                           |
| AIS2 (88B) | 162.025         | AIS channel 2                                           |

---

## Key Frequencies Table

| Frequency  | Band | Purpose                            |
| ---------- | ---- | ---------------------------------- |
| 2187.5 kHz | MF   | DSC distress and safety            |
| 2182 kHz   | MF   | Radiotelephony distress and safety |
| 4207.5 kHz | HF   | DSC distress and safety            |
| 6312 kHz   | HF   | DSC distress and safety            |
| 8414.5 kHz | HF   | DSC distress and safety            |
| 518 kHz    | MF   | International NAVTEX               |
| 490 kHz    | MF   | National NAVTEX                    |
| 4209.5 kHz | HF   | NAVTEX-type NBDP broadcasts        |
| 406 MHz    | UHF  | Cospas-Sarsat EPIRB                |
| 9 GHz      | SHF  | Radar-SART (X-band)                |

---

## NAVTEX Message Types (B2 Codes)

| Code       | Message Type                     | Can be rejected? |
| ---------- | -------------------------------- | ---------------- |
| A          | Navigational warnings            | NO               |
| B          | Meteorological warnings          | NO               |
| C          | Ice reports                      | Yes              |
| D          | Search & Rescue information      | NO               |
| E          | Meteorological forecasts         | Not recommended  |
| F          | Pilot service messages           | Yes              |
| G          | Decca messages                   | Yes              |
| H          | Loran messages                   | Yes              |
| I          | Omega messages                   | Yes              |
| J          | Satnav messages                  | Yes              |
| K          | Other electronic nav messages    | Yes              |
| L          | Additional navigational warnings | NO               |
| V, W, X, Y | Special services                 | Yes              |
| Z          | No messages on hand (QRU)        | —                |

## MMSI Prefix Quick Reference

| Prefix    | Station Type  | Example (Israel MID 428) |
| --------- | ------------- | ------------------------ |
| MIDxxxxxx | Ship          | 428123456                |
| 00MIDxxxx | Coast station | 004281234                |
| 0MIDxxxxx | Ship group    | 042812345                |
| 111MIDxxx | SAR aircraft  | 111428123                |
| 970MIDxxx | AIS-SART      | 970211234                |
| 972MIDxxx | MOB personal  | 972211234                |
| 974MIDxxx | EPIRB-AIS     | 974211234                |
| 99MIDxxxx | NAV-AID       | 994281234                |

## DSC Distress Nature Codes

| Code      | Nature of Distress  |
| --------- | ------------------- |
| (default) | Undesignated        |
| 1         | Fire / Explosion    |
| 2         | Flooding            |
| 3         | Collision           |
| 4         | Grounding           |
| 5         | Capsizing / Listing |
| 6         | Sinking             |
| 7         | Adrift / Disabled   |
| 8         | Abandoning Ship     |
| 9         | Piracy              |
| 10        | Man Overboard       |

---

_Sources: GMDSS Jan 2026 ENGLISH.pdf (classbook), NP285 (ALRS Volume 5), MID-MMSI List_
