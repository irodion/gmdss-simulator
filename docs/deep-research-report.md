# Free and Reusable Asset Catalog for a VHF/DSC Simulator in a GMDSS Exam-Prep PWA

## Executive summary

A high-quality VHF/DSC simulator benefits most from (a) authoritative **channel/procedure references**, (b) **safe-to-reuse UI iconography and radio-console components**, and (c) **radio-style audio textures** (static, squelch, beeps) that can be mixed with learner speech and verified via an online transcription model.

The strongest “low legal risk + high simulator value” asset path is:

- **Public-domain U.S. government references** for channel usage and voice procedures (e.g., FCC charts; USCG NAVCEN MAYDAY procedure). U.S. federal works are generally **not copyrightable in the U.S.** under 17 U.S.C. §105. citeturn1search3turn23view0turn10view1  
- **CC0 audio SFX from Freesound** for radio static + squelch + beeps + clicks (fastest way to get convincing “radio feel”). citeturn21view1turn19view0turn16view0turn17view0  
- **Permissively licensed icon sets + UI primitives** (MIT/ISC/Apache/BSD) to build a realistic console UI without inheriting share-alike obligations. citeturn6search0turn3search0turn6search1turn6search3turn25search1  
- **OpenAI real-time transcription guidance** for audio format + noise reduction configuration (24 kHz mono PCM for streaming transcription; optional noise reduction modes). citeturn24search8turn24search11turn24search3  

Where you should be cautious:
- Photos of real radios often include **brand names/logos** (trademark risk) and can be hard to “productize” in a commercial training UI. citeturn12view1  
- Some “CC0” UI click sounds on community sites may be *claimed* CC0 but possibly derived from proprietary sources (you should treat these as higher-risk unless you can verify provenance). citeturn19view3  
- IMO/ITU documents are highly authoritative but often **not free to reuse** as content assets; avoid embedding their diagrams unless explicitly licensed.

## Licensing baseline and reuse rules

### What counts as “free to reuse” for your use case
You requested: **public domain, CC0, CC‑BY, or permissive open-source**.

- **Public domain (U.S. federal)**: Works prepared by U.S. government employees as part of their official duties are not copyrightable in the U.S. (17 U.S.C. §105). citeturn1search3  
- **CC0**: You can reuse without attribution (though internal credit is still a nice practice). Example: Freesound items explicitly labeled “Creative Commons 0.” citeturn21view1turn19view0turn16view0  
- **CC BY**: Reuse allowed **with attribution**. Example: Freesound audio may be CC BY 4.0 (credit required). citeturn16view1  
- **Permissive software licenses (MIT/ISC/Apache/BSD)**: Typically allow commercial use with preservation of license notices; Apache 2.0 adds explicit patent terms. citeturn25search1turn6search1turn6search3turn7search0turn25search21  

### Platform-specific “good signals”
- entity["organization","DVIDS","us defense media portal"] commonly labels individual items “PUBLIC DOMAIN,” and its FAQ indicates content is generally public domain with exceptions called out per-asset. citeturn15search3turn22view0  
- entity["organization","Wikimedia Commons","media repository"]: each file page shows its specific license (CC0, CC BY-SA, etc.). citeturn11view3turn11view2turn12view1  
- entity["organization","Freesound","creative commons audio repo"]: each sound page lists the exact license (CC0 / CC BY, etc.). citeturn21view1turn19view0turn16view1turn17view0  

## Prioritized catalog of reusable assets

The table below is designed as a working backlog: you can copy it into Notion/Jira and mark “approved” once you’ve downloaded and stored license metadata alongside each file.

**Legend (Priority):** P0 = should use in MVP, P1 = strong option, P2 = optional/nice-to-have, P3 = risky/conditional.

| Priority | Title | Type | Short description | License (link) | Source URL | Recommended use in simulator | Attribution requirements | Risk notes |
|---|---|---|---|---|---|---|---|---|
| P0 | Marine VHF Radio Channels (FCC chart) | Diagram / dataset (PDF) | 1‑page chart summarizing VHF channel usage categories (distress/calling, port operations, DSC ch.70, etc.) citeturn23view0 | Public domain in U.S. (17 U.S.C. §105) `https://www.law.cornell.edu/uscode/text/17/105` citeturn1search3 | `https://wireless.fcc.gov/marine/vhfchanl.pdf` citeturn23view0 | Core “channel lookup” dataset; reference panel; quiz source | None required for PD (U.S.), but cite “FCC” in-app as best practice | U.S.-specific channel plan; verify against your exam jurisdiction; avoid implying Coast Guard endorsement |
| P0 | Radio Information For Boaters (USCG NAVCEN) – MAYDAY procedure + example | Sample transcript / procedure text | Step-by-step MAYDAY procedure on VHF Ch.16 + a fully written example script citeturn10view1 | Public domain in U.S. (17 U.S.C. §105) `https://www.law.cornell.edu/uscode/text/17/105` citeturn1search3 | `https://www.navcen.uscg.gov/radio-information-for-boaters` citeturn10view1 | Seed “expected transcript templates” for AI-checked exercises; build slot-filling tasks (position, distress type, persons onboard) | None required for PD (U.S.), but credit USCG NAVCEN in references | Page also includes legal/prosecution notes; keep UX learner-centered |
| P0 | “Static.wav” (Jace) | Audio sample (SFX) | Short static with breakup; clearly labeled CC0 citeturn21view0 | CC0 `https://creativecommons.org/publicdomain/zero/1.0/` citeturn21view0 | `https://freesound.org/people/Jace/sounds/17804/` citeturn21view0 | Mix under learner voice to simulate weak signal; generate “noise profiles” | None | Not maritime-specific; keep mix level modest so transcription still works |
| P0 | “continuous static.wav” (Jace) | Audio loop (SFX) | Looping static; CC0 citeturn21view1 | CC0 `https://creativecommons.org/publicdomain/zero/1.0/` citeturn21view1 | `https://freesound.org/people/Jace/sounds/35291/` citeturn21view1 | Background bed for “radio on / standby watch” feel | None | Not maritime-specific; ensure it doesn’t cause user fatigue |
| P0 | Radio Sign Off / Squelch (JovianSounds) | Audio sample (SFX) | Walkie-talkie “end transmission” squelch; CC0 citeturn19view0 | CC0 `https://creativecommons.org/publicdomain/zero/1.0/` citeturn19view0 | `https://freesound.org/people/JovianSounds/sounds/524205/` citeturn19view0 | Play on PTT release; adds realism to pacing and turn-taking | None | Not maritime-specific; still very suitable |
| P0 | Walkie Talkie Beep (SoundBiterSFX) | Audio sample (SFX) | Short “chirp/beep” that reads as comms start/alert; CC0 citeturn16view0 | CC0 `https://creativecommons.org/publicdomain/zero/1.0/` citeturn16view0 | `https://freesound.org/people/SoundBiterSFX/sounds/732209/` citeturn16view0 | Incoming call alert; DSC “attention” cue (stylized) | None | Not a real DSC waveform (fine as UI feedback) |
| P0 | Microphone.svg (OpenClipart via Wikimedia) | Icon (SVG) | Simple microphone icon; explicitly CC0 citeturn11view3 | CC0 `https://creativecommons.org/publicdomain/zero/1.0/` citeturn11view3 | `https://commons.wikimedia.org/wiki/File:Microphone.svg` citeturn11view3 | PTT button icon, “record” indicator, accessibility cues | None | Generic; good for consistent UI |
| P0 | Tabler Icons | Icon set | Large MIT-licensed SVG icon set with consistent stroke style citeturn6search12turn6search0 | MIT (see LICENSE) `https://github.com/tabler/tabler-icons/blob/master/LICENSE` citeturn6search0 | `https://github.com/tabler/tabler-icons` citeturn6search12 | Knobs, volume, settings, warning, ship, waves, location, timer, etc. | Keep license notice in repo/app “About” | None specific; confirm you don’t use any third-party brand marks |
| P0 | Radix UI Primitives (WorkOS) | UI components | Unstyled, accessible primitives (Slider, Toggle, Dialog), MIT-licensed citeturn25search5turn25search1 | MIT `https://github.com/radix-ui/primitives/blob/main/LICENSE` citeturn25search1 | `https://github.com/radix-ui/primitives` citeturn25search5 | Build a “radio console” with keyboard-friendly controls (channel knob slider, squelch, volume, modal dialogs) | Preserve license notice | Not a “skin”; you still design the console visuals |
| P1 | Marine VHF Sailor type.jpg (Wikimedia) | Photo reference | Photo of a maritime VHF radio (incl. DSC watch); CC BY‑SA/GFDL dual-licensed citeturn12view0 | CC BY‑SA 3.0 `http://creativecommons.org/licenses/by-sa/3.0/` (also GFDL) citeturn12view0 | `https://commons.wikimedia.org/wiki/File:Maritime_VHF_Sailor_type.jpg` citeturn12view1 | Optional “how real radios look” reference image in a lesson | Attribution + indicate changes; share-alike for derivatives | Contains “Sailor” brand category; **trademark/logos** visible—avoid in commercial product UI mockups, or crop/blur |
| P1 | Radio VHF marine (nb).svg (Wikimedia) | Icon/illustration | Stylized VHF marine radio illustration; CC BY‑SA 3.0 citeturn11view2 | CC BY‑SA 3.0 `https://creativecommons.org/licenses/by-sa/3.0/` citeturn11view2 | `https://commons.wikimedia.org/wiki/File:Radio_VHF_marine_(nb).svg` citeturn11view2 | Onboarding illustration; “VHF module” card art | Attribution + share-alike for derivatives | Share-alike may add compliance work; consider using MIT icons instead |
| P1 | Heroicons | Icon set | Simple MIT-licensed icon set, popular in React/Vue stacks citeturn3search0 | MIT `https://github.com/tailwindlabs/heroicons/blob/master/LICENSE` citeturn3search0 | `https://github.com/tailwindlabs/heroicons` citeturn3search0 | Alternative to Tabler; good for “alert,” “speaker,” “mic,” “bookmark,” etc. | Preserve license notice | Style differs from Tabler; pick one set for consistency |
| P1 | Lucide | Icon set | ISC-licensed icon set; simple, consistent; explicitly avoids brand logos citeturn6search1turn6search32 | ISC `https://lucide.dev/license` citeturn6search1 | `https://github.com/lucide-icons/lucide` citeturn6search32 | Great for warning/status icons without brand/trademark baggage | Preserve license notice | Choose one icon set to reduce bundle size |
| P1 | Material Design Icons (Google) | Icon set | Apache 2.0 licensed icon repo citeturn6search3 | Apache 2.0 `https://github.com/google/material-design-icons/blob/master/LICENSE` citeturn6search3 | `https://github.com/google/material-design-icons` citeturn6search3 | Familiar UI symbols; good if you’re already using Material UI | Preserve license notice | Large; can bloat bundle if not tree-shaken |
| P1 | webaudio-controls | UI components | WebComponents knobs/sliders/switches; repo indicates Apache 2.0 and notes sample knob image credits citeturn5view0 | Apache 2.0 (repo) citeturn5view0 | `https://github.com/g200kg/webaudio-controls` citeturn5view0 | Fast path to “hardware-like” knobs without heavy custom SVG work | Preserve license notice | Repo notes some sample knob images have separate credits/licenses; avoid copying any non-Apache sample assets without verifying citeturn5view0 |
| P1 | react-dial-knob | UI component | Lightweight knob control (mouse/touch/keyboard accessible), MIT citeturn8search0turn8search1 | MIT `https://github.com/pavelkukov/react-dial-knob/blob/master/LICENSE.txt` citeturn8search0 | `https://github.com/pavelkukov/react-dial-knob` citeturn8search1 | Channel selector knob, squelch knob, volume knob | Preserve license notice | Ensure keyboard mapping matches accessibility expectations |
| P1 | react-7-segment-display | UI component | 7-seg display component (radio channel readout feel), MIT citeturn7search2 | MIT (repo) citeturn7search2 | `https://github.com/nachovigilante/react-7-segment-display` citeturn7search2 | Channel number display, dual-watch indicator, MMSI “numeric entry” mode | Preserve license notice | Visual style may need CSS tuning for realism |
| P1 | wavesurfer.js | UI component | Audio waveform visualization + playback tooling; BSD 3‑Clause license in repo citeturn7search0turn7search4 | BSD-3 `https://github.com/katspaugh/wavesurfer.js/blob/beta/LICENSE` citeturn7search0 | `https://wavesurfer.xyz/` citeturn7search4 | Review learner recordings; show clipped audio; allow “listen back” | Preserve license notice | Website “about” pages may conflict; trust the repo LICENSE for the version you ship (verify on upgrade) citeturn7search0turn7search24 |
| P2 | Radio Static (GowlerMusic) | Audio sample (SFX) | Longer “handheld radio static”; CC BY 4.0 citeturn16view1 | CC BY 4.0 `https://creativecommons.org/licenses/by/4.0/` citeturn16view1 | `https://freesound.org/people/GowlerMusic/sounds/262267/` citeturn16view1 | More varied static bed; stress-test transcription robustness | **Attribution required** (author credit) | Ensure attribution is present in app credits/about; not maritime-specific |
| P2 | Wet Click (Breviceps) | Audio sample (SFX) | Very short UI click; CC0 citeturn17view0 | CC0 `https://creativecommons.org/publicdomain/zero/1.0/` citeturn17view0 | `https://freesound.org/people/Breviceps/sounds/448080/` citeturn17view0 | Button press feedback for on-screen console keys | None | None significant |
| P2 | DVIDS “Coast Guard marine broadcasts” (with transcript download option) | Audio + transcript (PD) | Long-form authentic Coast Guard command center recordings; page marked “PUBLIC DOMAIN” and offers transcript/CC download links citeturn22view0 | Public domain per-asset label; see DVIDS copyright info citeturn22view0turn15search21 | `https://www.dvidshub.net/audio/65690/historical-audio-file-coast-guard-marine-broadcasts-sept-11-2001-4-4` citeturn22view0 | Advanced listening/transcription drills; “real-world radio traffic” mode | Credit requested by DVIDS policy; optionally add non-endorsement disclaimer citeturn15search0turn15search21 | Contains 9/11 context; could be distressing; also may require login to download transcript/audio |
| P3 | UI_Click.wav (finix473) | Audio (SFX) | UI click labeled CC0, but comments allege it resembles an Xbox notification sound citeturn19view3 | CC0 label on page citeturn19view3 | `https://freesound.org/people/finix473/sounds/546974/` citeturn19view3 | Only if you need an extra “confirm” click | None | **Provenance risk** (possible derivative of proprietary console sound); prefer safer CC0 clicks (e.g., Wet Click) citeturn19view3turn17view0 |
| P3 | Internet Archive CC0 “ambience” mega-pack | Dataset (audio library) | Large CC0 ambience library item; may contain useful harbor/room/vehicle ambiences citeturn14search0 | CC0 label on item page citeturn14search0 | `https://archive.org/details/SSE_Library_AMBIENCE` citeturn14search0 | If you want optional “bridge ambience” or “engine hum” backgrounds | None | Very large; content not curated to maritime—requires time to find relevant clips |
| P3 | Internet Archive CC0 “various sound effects” | Dataset (audio library) | CC0-labeled mixed foley pack; not maritime-specific citeturn14search2 | CC0 label on item page citeturn14search2 | `https://archive.org/details/various-sound-effects` citeturn14search2 | Only if you need generic UI/foley beyond Freesound | None | Unclear indexing; may not contain radio-appropriate sounds |

## Candidate asset comparison table

This smaller table highlights **8–12 candidates** you can realistically integrate first (MVP-friendly) while keeping licensing clean.

| Candidate | Best-for | License simplicity | Simulator impact | Operational risk | Why it’s a strong pick |
|---|---|---|---|---|---|
| FCC Marine VHF Channels PDF citeturn23view0 | Authoritative channel mapping | High (PD in U.S.) citeturn1search3 | Very high | Low | Directly fuels channel quizzes + “choose correct channel” simulator logic |
| USCG NAVCEN MAYDAY procedure + example citeturn10view1 | Voice procedure scripts | High (PD in U.S.) citeturn1search3 | Very high | Low | Converts naturally into slot-based exercises and AI-checked speaking drills |
| Freesound “continuous static.wav” (CC0) citeturn21view1 | Background radio texture | Very high | High | Low | Adds realism fast; safe license; easy to loop |
| Freesound “Radio Sign Off / Squelch” (CC0) citeturn19view0 | PTT release cue | Very high | High | Low | Immediately increases “radio feel” and UX timing |
| Freesound “Walkie Talkie Beep” (CC0) citeturn16view0 | Alerts / call cues | Very high | Medium | Low | Great for incoming/outgoing call state transitions |
| Microphone.svg (CC0) citeturn11view3 | PTT/record icon | Very high | Medium | Low | Avoids share-alike and looks clean on all DPIs |
| Tabler Icons (MIT) citeturn6search12turn6search0 | Full icon system | High | Medium | Low | Clean licensing; large coverage; works for console UI |
| Radix UI Primitives (MIT) citeturn25search5turn25search1 | Accessible controls | High | High | Low | Gets keyboard-friendly sliders/toggles/dialogs right with minimal custom work |
| react-dial-knob (MIT) citeturn8search0turn8search1 | Knobs | High | High | Low–Med | Realistic channel/volume knobs; verify accessibility behavior in your design |
| wavesurfer.js (BSD-3) citeturn7search0turn7search4 | Recording review UI | High | Medium | Low | Makes AI-feedback loops more transparent (“listen back” + waveform) |

## Final recommended shortlist

If you want the **tightest, lowest-friction MVP** that still feels like a radio simulator, these 5 are the best “first commits”:

- **FCC Marine VHF Channels chart (PD in U.S.)** — authoritative channel categories for training logic and UI reference. citeturn23view0turn1search3  
- **USCG NAVCEN “Radio Information for Boaters” MAYDAY procedure + example (PD in U.S.)** — ready-to-structure transcript templates for AI-checked speaking drills. citeturn10view1turn1search3  
- **Freesound “continuous static.wav” (CC0)** — the simplest “radio realism” lever that doesn’t threaten transcription. citeturn21view1  
- **Freesound “Radio Sign Off / Squelch” (CC0)** — makes PTT interactions feel authentic (press-to-talk flow). citeturn19view0  
- **Radix UI Primitives (MIT)** — fastest way to ship a keyboard-friendly console UI without hand-rolling accessibility. citeturn25search1turn25search5  

If you need a 6th: **Tabler Icons (MIT)** for overall icon consistency. citeturn6search0turn6search12  

## Implementation checklist for audio assets with an AI transcription pipeline

This checklist assumes your simulator is “online-verified”: learners speak into the mic, you transcribe server-side, and compare to expected procedures.

### Audio capture and preprocessing
- Capture mic audio with a consistent pipeline (Web Audio API is the typical browser foundation for capture/routing/mixing). citeturn4search13  
- Maintain **two audio tracks**:
  - **Clean track** (minimal/no added static): used for transcription and scoring.
  - **Presentation track** (with static/squelch beeps): used for user体验/realism playback.
- Keep SFX levels low and consider ducking static under speech (or disable static during scoring) so the transcription model is evaluating the learner’s radio phraseology, not your noise bed.

### Encoding formats and sample rates for transcription
Two common patterns (choose one and standardize):

- **File-based transcription (batch / per-attempt)**: Use one of the API-supported formats (e.g., `wav`, `mp3`, `m4a`, `webm`). OpenAI’s speech-to-text guide lists supported upload types and a 25 MB limit. citeturn24search0  
- **Streaming / real-time transcription**: OpenAI’s realtime transcription guide documents supported input formats including `audio/pcm` **24 kHz mono PCM** and optional built-in noise reduction modes. citeturn24search8  
  - If using realtime transcription sessions, OpenAI’s reference indicates `pcm16` expectations: **16-bit PCM, 24 kHz, mono, little-endian**. citeturn24search11  

### Noise handling (important for “radio realism” + “fair scoring”)
- If using OpenAI realtime transcription, consider `audio.input.noise_reduction` with `near_field` for headset/mic usage or `far_field` for speakerphone-like setups. citeturn24search8  
- Build difficulty levels by adjusting **noise mix**, not by degrading the learner’s own mic track:
  - Level 1: no static added
  - Level 2: low static bed
  - Level 3: static + occasional dropouts (use CC0 “Static.wav” with breakup) citeturn21view0  

### Transcript scoring approach (robust against minor wording variance)
- Prefer **slot-based scoring** for structured calls:
  - Required tokens (e.g., “MAYDAY” x3; “THIS IS”; ship name; position; nature of distress; assistance; persons onboard). citeturn10view1  
- Allow tolerance for punctuation and small filler words; focus on **presence and order** of critical fields.

### Synthetic TTS fallback for prompts
If you need spoken prompts (e.g., “Channel 16, make a distress call now”):
- OpenAI Text-to-Speech documentation notes multiple output formats (mp3/opus/wav/pcm), and describes PCM output as raw samples at **24 kHz 16-bit** without headers. citeturn24search2turn24search3  
- Store prompt audio in a cache for offline replay (but keep “checking correctness” online if that’s a requirement).

## Open-source UI libraries and icon sets suitable for a radio console UI

This section focuses on **license + suitability** for a “hardware-like” console.

### UI component libraries (React/Vue)
- **Radix UI Primitives (MIT)**: Accessible, unstyled primitives; excellent for keyboard shortcuts and console-like interactions. citeturn25search5turn25search1  
- **PrimeReact (MIT)**: Large component set, includes dial/knob-like inputs; verify design consistency and keep bundle lean. citeturn25search3turn8search19  
- **MUI / Material UI (MIT)**: Strong baseline components (sliders, dialogs) and ecosystem; pairs naturally with Material icons (Apache 2.0). citeturn4search0turn6search3  
- **Vuetify (MIT)** (Vue): Material-style components; good if you choose Vue. citeturn3search13  

### Console-specific controls
- **react-dial-knob (MIT)**: Purpose-built knob UI with keyboard/touch support; ideal for channel/volume/squelch controls. citeturn8search0turn8search1  
- **webaudio-controls (Apache 2.0)**: WebComponents-based knobs/sliders/switches; fastest “hardware panel” look, but verify any included sample images’ licenses before copying. citeturn5view0  
- **react-7-segment-display (MIT)**: Good for “channel readout” styling. citeturn7search2  
- **wavesurfer.js (BSD-3)**: Great for playback review, user trust (“what did I actually say?”), and basic audio QA. citeturn7search0turn7search4  

### Icon sets
- **Tabler Icons (MIT)**: Best all-around for clean, consistent console glyphs. citeturn6search12turn6search0  
- **Heroicons (MIT)**: Simple, widely adopted; great alternative. citeturn3search0  
- **Lucide (ISC)**: Explicitly avoids brand logos; reduces trademark headaches. citeturn6search1turn6search32  
- **Material Design Icons (Apache 2.0)**: Good if you go “Material.” citeturn6search3  
- **Font Awesome Free (multiple licenses)**: Widely known, but license stack is more complex and includes brand icons (trademark considerations). citeturn3search11  

## Notes on “sample transcripts” and “datasets” licensing

- The FCC chart and NAVCEN “Radio Information” content are the best “official, practical, quickly reusable” starting points for building your simulator’s **channel dataset** and default **voice procedure templates**. citeturn23view0turn10view1turn1search3  
- For additional structured datasets, **Wikidata’s structured data is available under CC0** (useful if you want CC0-backed vocab lists like the NATO phonetic alphabet, geography labels, etc.). citeturn4search26turn4search18  
- For large volumes of public-domain voice audio (non-maritime), **LibriVox recordings are released under a public domain dedication (CC0)** per Creative Commons’ writeup. citeturn4search19  

