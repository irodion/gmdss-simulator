import { createClient } from "./client.ts";
import {
  jurisdictions,
  lessonProgress,
  lessons,
  modules,
  quizAttempts,
  quizzes,
} from "./schema/index.ts";

const url = process.env["DATABASE_URL"];
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const { db, sql } = createClient(url);

async function seed() {
  console.log("Seeding database...");

  try {
    await db.transaction(async (tx) => {
      // Wipe stale progress and content so reseeding a populated DB
      // doesn't leave orphaned rows or carry over old completion state.
      await tx.delete(quizAttempts);
      await tx.delete(lessonProgress);
      await tx.delete(quizzes);
      await tx.delete(lessons);
      await tx.delete(modules);

      // Modules
      await tx
        .insert(modules)
        .values([
          {
            id: "module-1",
            title: "GMDSS Framework",
            description:
              "Understand the GMDSS system, Sea Area A1, operator certificates, and frequency bands.",
            orderIndex: 1,
            prerequisiteModuleId: null,
          },
          {
            id: "module-2",
            title: "VHF Radio Operation",
            description:
              "Master VHF radio controls, channel system, modulation, antennas, and watchkeeping.",
            orderIndex: 2,
            prerequisiteModuleId: "module-1",
          },
          {
            id: "module-3",
            title: "Communication Procedures",
            description:
              "Learn the phonetic alphabet, pro-words, call procedures, and radio ethics.",
            orderIndex: 3,
            prerequisiteModuleId: "module-2",
          },
          {
            id: "module-4",
            title: "MMSI and DSC",
            description:
              "Decode MMSIs, understand DSC categories, and construct DSC calls on Channel 70.",
            orderIndex: 4,
            prerequisiteModuleId: "module-3",
          },
          {
            id: "module-5",
            title: "Distress and Emergency Procedures",
            description: "Master MAYDAY, PAN PAN, SECURITE, MEDICO, and radio silence commands.",
            orderIndex: 5,
            prerequisiteModuleId: "module-4",
          },
          {
            id: "module-6",
            title: "Navigation Safety and SAR",
            description: "Learn NAVTEX, AIS, EPIRB, SART, pyrotechnics, and SAR coordination.",
            orderIndex: 6,
            prerequisiteModuleId: "module-5",
          },
        ])
        .onConflictDoNothing();

      // Module 1 lessons — GMDSS Framework
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-1-1",
            moduleId: "module-1",
            title: "What is GMDSS?",
            orderIndex: 1,
            contentPath: "en/modules/1/lesson-1.json",
          },
          {
            id: "lesson-1-2",
            moduleId: "module-1",
            title: "Sea Area A1 and Equipment",
            orderIndex: 2,
            contentPath: "en/modules/1/lesson-2.json",
          },
          {
            id: "lesson-1-3",
            moduleId: "module-1",
            title: "Operator Certificates and Regulations",
            orderIndex: 3,
            contentPath: "en/modules/1/lesson-3.json",
          },
          {
            id: "lesson-1-4",
            moduleId: "module-1",
            title: "Frequency Bands Overview",
            orderIndex: 4,
            contentPath: "en/modules/1/lesson-4.json",
          },
        ])
        .onConflictDoNothing();

      // Module 2 lessons — VHF Radio Operation
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-2-1",
            moduleId: "module-2",
            title: "VHF Radio Basics",
            orderIndex: 1,
            contentPath: "en/modules/2/lesson-1.json",
          },
          {
            id: "lesson-2-2",
            moduleId: "module-2",
            title: "The VHF Radio Panel",
            orderIndex: 2,
            contentPath: "en/modules/2/lesson-2.json",
          },
          {
            id: "lesson-2-3",
            moduleId: "module-2",
            title: "VHF Channel System",
            orderIndex: 3,
            contentPath: "en/modules/2/lesson-3.json",
          },
          {
            id: "lesson-2-4",
            moduleId: "module-2",
            title: "Handheld VHF and Antennas",
            orderIndex: 4,
            contentPath: "en/modules/2/lesson-4.json",
          },
          {
            id: "lesson-2-5",
            moduleId: "module-2",
            title: "Radio Discipline and Watchkeeping",
            orderIndex: 5,
            contentPath: "en/modules/2/lesson-5.json",
          },
        ])
        .onConflictDoNothing();

      // Module 3 lessons — Communication Procedures
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-3-1",
            moduleId: "module-3",
            title: "Phonetic Alphabet and Numbers",
            orderIndex: 1,
            contentPath: "en/modules/3/lesson-1.json",
          },
          {
            id: "lesson-3-2",
            moduleId: "module-3",
            title: "Call Procedures and Pro-words",
            orderIndex: 2,
            contentPath: "en/modules/3/lesson-2.json",
          },
          {
            id: "lesson-3-3",
            moduleId: "module-3",
            title: "Ship-to-Ship and Ship-to-Shore",
            orderIndex: 3,
            contentPath: "en/modules/3/lesson-3.json",
          },
          {
            id: "lesson-3-4",
            moduleId: "module-3",
            title: "Internal Communications and Routine",
            orderIndex: 4,
            contentPath: "en/modules/3/lesson-4.json",
          },
          {
            id: "lesson-3-5",
            moduleId: "module-3",
            title: "Radio Ethics and Channel 16",
            orderIndex: 5,
            contentPath: "en/modules/3/lesson-5.json",
          },
        ])
        .onConflictDoNothing();

      // Module 4 lessons — MMSI and DSC
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-4-1",
            moduleId: "module-4",
            title: "MMSI and Call Signs",
            orderIndex: 1,
            contentPath: "en/modules/4/lesson-1.json",
          },
          {
            id: "lesson-4-2",
            moduleId: "module-4",
            title: "DSC Overview and Categories",
            orderIndex: 2,
            contentPath: "en/modules/4/lesson-2.json",
          },
          {
            id: "lesson-4-3",
            moduleId: "module-4",
            title: "DSC Distress Alerts",
            orderIndex: 3,
            contentPath: "en/modules/4/lesson-3.json",
          },
          {
            id: "lesson-4-4",
            moduleId: "module-4",
            title: "Non-Distress DSC",
            orderIndex: 4,
            contentPath: "en/modules/4/lesson-4.json",
          },
          {
            id: "lesson-4-5",
            moduleId: "module-4",
            title: "False Alerts and DSC-Voice Workflow",
            orderIndex: 5,
            contentPath: "en/modules/4/lesson-5.json",
          },
        ])
        .onConflictDoNothing();

      // Module 5 lessons — Distress and Emergency Procedures
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-5-1",
            moduleId: "module-5",
            title: "Communication Priority",
            orderIndex: 1,
            contentPath: "en/modules/5/lesson-1.json",
          },
          {
            id: "lesson-5-2",
            moduleId: "module-5",
            title: "MAYDAY Procedure",
            orderIndex: 2,
            contentPath: "en/modules/5/lesson-2.json",
          },
          {
            id: "lesson-5-3",
            moduleId: "module-5",
            title: "MAYDAY RELAY",
            orderIndex: 3,
            contentPath: "en/modules/5/lesson-3.json",
          },
          {
            id: "lesson-5-4",
            moduleId: "module-5",
            title: "Radio Silence Commands",
            orderIndex: 4,
            contentPath: "en/modules/5/lesson-4.json",
          },
          {
            id: "lesson-5-5",
            moduleId: "module-5",
            title: "PAN PAN and MEDICO",
            orderIndex: 5,
            contentPath: "en/modules/5/lesson-5.json",
          },
          {
            id: "lesson-5-6",
            moduleId: "module-5",
            title: "SECURITE Procedure",
            orderIndex: 6,
            contentPath: "en/modules/5/lesson-6.json",
          },
          {
            id: "lesson-5-7",
            moduleId: "module-5",
            title: "Responding to Distress",
            orderIndex: 7,
            contentPath: "en/modules/5/lesson-7.json",
          },
        ])
        .onConflictDoNothing();

      // Module 6 lessons — Navigation Safety and SAR
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-6-1",
            moduleId: "module-6",
            title: "NAVTEX",
            orderIndex: 1,
            contentPath: "en/modules/6/lesson-1.json",
          },
          {
            id: "lesson-6-2",
            moduleId: "module-6",
            title: "AIS",
            orderIndex: 2,
            contentPath: "en/modules/6/lesson-2.json",
          },
          {
            id: "lesson-6-3",
            moduleId: "module-6",
            title: "EPIRB",
            orderIndex: 3,
            contentPath: "en/modules/6/lesson-3.json",
          },
          {
            id: "lesson-6-4",
            moduleId: "module-6",
            title: "SART and AIS-SART",
            orderIndex: 4,
            contentPath: "en/modules/6/lesson-4.json",
          },
          {
            id: "lesson-6-5",
            moduleId: "module-6",
            title: "PLBs, GPS, and Position Reporting",
            orderIndex: 5,
            contentPath: "en/modules/6/lesson-5.json",
          },
          {
            id: "lesson-6-6",
            moduleId: "module-6",
            title: "Pyrotechnics and Visual Signals",
            orderIndex: 6,
            contentPath: "en/modules/6/lesson-6.json",
          },
          {
            id: "lesson-6-7",
            moduleId: "module-6",
            title: "SAR Coordination",
            orderIndex: 7,
            contentPath: "en/modules/6/lesson-7.json",
          },
        ])
        .onConflictDoNothing();

      // Quizzes — 6 checkpoint quizzes
      await tx
        .insert(quizzes)
        .values([
          {
            id: "module-1-checkpoint",
            moduleId: "module-1",
            title: "Module 1 Checkpoint Quiz",
            passThreshold: 70,
            questions: [
              {
                id: "m1q1",
                text: "How many functional requirements does GMDSS define?",
                options: [
                  { key: "a", text: "5" },
                  { key: "b", text: "7" },
                  { key: "c", text: "9" },
                  { key: "d", text: "12" },
                ],
                correct_answer: "c",
                explanation:
                  "GMDSS defines 9 radiocommunication functions that every SOLAS vessel must perform.",
              },
              {
                id: "m1q2",
                text: "Which sea area is defined by VHF coast station range?",
                options: [
                  { key: "a", text: "A1" },
                  { key: "b", text: "A2" },
                  { key: "c", text: "A3" },
                  { key: "d", text: "A4" },
                ],
                correct_answer: "a",
                explanation:
                  "Sea Area A1 is within range of at least one VHF coast station providing continuous DSC alerting coverage.",
              },
              {
                id: "m1q3",
                text: "Which certificate is needed to operate VHF radio on a compulsory fitted vessel in Sea Area A1?",
                options: [
                  { key: "a", text: "GOC" },
                  { key: "b", text: "ROC" },
                  { key: "c", text: "First Class Radio-Electronic" },
                  { key: "d", text: "No certificate needed" },
                ],
                correct_answer: "b",
                explanation:
                  "The Restricted Operator's Certificate (ROC) qualifies an operator for Sea Area A1 only.",
              },
              {
                id: "m1q4",
                text: "When was GMDSS fully implemented?",
                options: [
                  { key: "a", text: "1 January 1992" },
                  { key: "b", text: "1 February 1999" },
                  { key: "c", text: "1 July 2002" },
                  { key: "d", text: "1 January 1988" },
                ],
                correct_answer: "b",
                explanation:
                  "GMDSS was adopted by IMO in 1988, phased in from 1992, and fully implemented on 1 February 1999.",
              },
              {
                id: "m1q5",
                text: "In which frequency band does NAVTEX operate?",
                options: [
                  { key: "a", text: "VHF" },
                  { key: "b", text: "HF" },
                  { key: "c", text: "MF" },
                  { key: "d", text: "UHF" },
                ],
                correct_answer: "c",
                explanation:
                  "NAVTEX operates at 518 kHz (international) and 490 kHz (national), both in the MF band.",
              },
              {
                id: "m1q6",
                text: "Which band does a Radar-SART operate in?",
                options: [
                  { key: "a", text: "VHF" },
                  { key: "b", text: "S-band" },
                  { key: "c", text: "L-band" },
                  { key: "d", text: "X-band" },
                ],
                correct_answer: "d",
                explanation:
                  "Radar-SART operates at 9 GHz in the X-band, responding to ship and aircraft radar interrogation.",
              },
            ],
          },
          {
            id: "module-2-checkpoint",
            moduleId: "module-2",
            title: "Module 2 Checkpoint Quiz",
            passThreshold: 70,
            questions: [
              {
                id: "m2q1",
                text: "What is the VHF maritime frequency range?",
                options: [
                  { key: "a", text: "118-136 MHz" },
                  { key: "b", text: "156-174 MHz" },
                  { key: "c", text: "300-3000 kHz" },
                  { key: "d", text: "88-108 MHz" },
                ],
                correct_answer: "b",
                explanation: "The maritime VHF band runs from 156 to 174 MHz.",
              },
              {
                id: "m2q2",
                text: "What does the squelch control do?",
                options: [
                  { key: "a", text: "Changes channels" },
                  { key: "b", text: "Adjusts transmission power" },
                  { key: "c", text: "Filters out background noise" },
                  { key: "d", text: "Activates dual watch" },
                ],
                correct_answer: "c",
                explanation:
                  "Squelch sets the noise gate threshold, filtering out weak signals and background static.",
              },
              {
                id: "m2q3",
                text: "What is the channel spacing on VHF marine band?",
                options: [
                  { key: "a", text: "12.5 kHz" },
                  { key: "b", text: "25 kHz" },
                  { key: "c", text: "50 kHz" },
                  { key: "d", text: "100 kHz" },
                ],
                correct_answer: "b",
                explanation: "VHF maritime channels are separated by 25 kHz.",
              },
              {
                id: "m2q4",
                text: "How long must a survival craft VHF battery last?",
                options: [
                  { key: "a", text: "2 hours" },
                  { key: "b", text: "4 hours" },
                  { key: "c", text: "6 hours" },
                  { key: "d", text: "8 hours" },
                ],
                correct_answer: "c",
                explanation:
                  "Ship survival craft batteries must last at least 6 hours on high power.",
              },
              {
                id: "m2q5",
                text: "What is the maximum call duration on Channel 16?",
                options: [
                  { key: "a", text: "30 seconds" },
                  { key: "b", text: "1 minute" },
                  { key: "c", text: "3 minutes" },
                  { key: "d", text: "5 minutes" },
                ],
                correct_answer: "b",
                explanation:
                  "Initial calls on Channel 16 must not exceed 1 minute. Wait 2 minutes before retrying.",
              },
              {
                id: "m2q6",
                text: "Which channels are reserved for AIS?",
                options: [
                  { key: "a", text: "Ch 15 and Ch 17" },
                  { key: "b", text: "Ch 87B and Ch 88B" },
                  { key: "c", text: "Ch 16 and Ch 70" },
                  { key: "d", text: "Ch 06 and Ch 08" },
                ],
                correct_answer: "b",
                explanation: "AIS operates on channels 87B (161.975 MHz) and 88B (162.025 MHz).",
              },
            ],
          },
          {
            id: "module-3-checkpoint",
            moduleId: "module-3",
            title: "Module 3 Checkpoint Quiz",
            passThreshold: 70,
            questions: [
              {
                id: "m3q1",
                text: "What is the phonetic for the letter G?",
                options: [
                  { key: "a", text: "George" },
                  { key: "b", text: "Golf" },
                  { key: "c", text: "Gamma" },
                  { key: "d", text: "Globe" },
                ],
                correct_answer: "b",
                explanation: "G = Golf in the ITU phonetic alphabet.",
              },
              {
                id: "m3q2",
                text: "How is the number 5 pronounced in maritime radio?",
                options: [
                  { key: "a", text: "FIVE" },
                  { key: "b", text: "FIVER" },
                  { key: "c", text: "FIFE" },
                  { key: "d", text: "CINQ" },
                ],
                correct_answer: "c",
                explanation: "The number 5 is pronounced FIFE to avoid confusion.",
              },
              {
                id: "m3q3",
                text: "What does the proword WILCO mean?",
                options: [
                  { key: "a", text: "I understand" },
                  { key: "b", text: "I will comply with your instruction" },
                  { key: "c", text: "Wait for my next transmission" },
                  { key: "d", text: "Message received" },
                ],
                correct_answer: "b",
                explanation: "WILCO means 'I will comply with your instruction' and implies ROGER.",
              },
              {
                id: "m3q4",
                text: "Readability 4 on the readability scale means?",
                options: [
                  { key: "a", text: "Bad" },
                  { key: "b", text: "Fair" },
                  { key: "c", text: "Good" },
                  { key: "d", text: "Excellent" },
                ],
                correct_answer: "c",
                explanation: "The readability scale: 1=Bad, 2=Poor, 3=Fair, 4=Good, 5=Excellent.",
              },
              {
                id: "m3q5",
                text: "In ship-to-ship communications, who selects the working channel?",
                options: [
                  { key: "a", text: "The calling station" },
                  { key: "b", text: "The called station" },
                  { key: "c", text: "The nearest coast station" },
                  { key: "d", text: "Either station" },
                ],
                correct_answer: "b",
                explanation:
                  "In ship-to-ship calls, the called station selects the working channel.",
              },
              {
                id: "m3q6",
                text: "Which channels are for on-board communications at 1W?",
                options: [
                  { key: "a", text: "Ch 06 and Ch 08" },
                  { key: "b", text: "Ch 13 and Ch 16" },
                  { key: "c", text: "Ch 15 and Ch 17" },
                  { key: "d", text: "Ch 70 and Ch 16" },
                ],
                correct_answer: "c",
                explanation:
                  "Channels 15 and 17 are designated for internal ship communications at 1 watt low power.",
              },
              {
                id: "m3q7",
                text: "What should you say before spelling a word phonetically?",
                options: [
                  { key: "a", text: "CORRECTION" },
                  { key: "b", text: "SAY AGAIN" },
                  { key: "c", text: "I SPELL" },
                  { key: "d", text: "IN LETTERS" },
                ],
                correct_answer: "c",
                explanation:
                  "Say 'I SPELL' before spelling out a word using the phonetic alphabet.",
              },
            ],
          },
          {
            id: "module-4-checkpoint",
            moduleId: "module-4",
            title: "Module 4 Checkpoint Quiz",
            passThreshold: 70,
            questions: [
              {
                id: "m4q1",
                text: "How many digits are in a ship station MMSI?",
                options: [
                  { key: "a", text: "7" },
                  { key: "b", text: "8" },
                  { key: "c", text: "9" },
                  { key: "d", text: "10" },
                ],
                correct_answer: "c",
                explanation:
                  "Ship station MMSIs are 9 digits, starting with the 3-digit Maritime Identification Digit (MID).",
              },
              {
                id: "m4q2",
                text: "A coast station MMSI begins with which digits?",
                options: [
                  { key: "a", text: "00" },
                  { key: "b", text: "99" },
                  { key: "c", text: "111" },
                  { key: "d", text: "970" },
                ],
                correct_answer: "a",
                explanation:
                  "Coast station MMSIs start with 00 followed by the MID (e.g., 004281234).",
              },
              {
                id: "m4q3",
                text: "Which channel is reserved exclusively for DSC?",
                options: [
                  { key: "a", text: "Channel 16" },
                  { key: "b", text: "Channel 9" },
                  { key: "c", text: "Channel 13" },
                  { key: "d", text: "Channel 70" },
                ],
                correct_answer: "d",
                explanation:
                  "Channel 70 is dedicated to DSC. Voice transmissions are not permitted on this channel.",
              },
              {
                id: "m4q4",
                text: "How long must you hold the distress button for a rapid DSC alert?",
                options: [
                  { key: "a", text: "2 seconds" },
                  { key: "b", text: "5 seconds" },
                  { key: "c", text: "10 seconds" },
                  { key: "d", text: "15 seconds" },
                ],
                correct_answer: "b",
                explanation:
                  "Press and hold the distress button for 5 seconds to send a rapid DSC distress alert.",
              },
              {
                id: "m4q5",
                text: "How often does a DSC distress alert automatically repeat?",
                options: [
                  { key: "a", text: "Every 1-2 minutes" },
                  { key: "b", text: "Every 3.5-4.5 minutes" },
                  { key: "c", text: "Every 5-6 minutes" },
                  { key: "d", text: "Every 10 minutes" },
                ],
                correct_answer: "b",
                explanation:
                  "The DSC distress alert auto-repeats every 3.5 to 4.5 minutes until acknowledged.",
              },
              {
                id: "m4q6",
                text: "What is the first thing to do after sending a false DSC alert?",
                options: [
                  { key: "a", text: "Broadcast a voice cancellation on Channel 16" },
                  { key: "b", text: "Turn off the equipment to stop the repeat" },
                  { key: "c", text: "Send a MAYDAY" },
                  { key: "d", text: "Switch to Channel 13" },
                ],
                correct_answer: "b",
                explanation:
                  "Turn off the equipment to stop the automatic distress repeat, then turn it back on and broadcast a voice cancellation on Channel 16.",
              },
              {
                id: "m4q7",
                text: "What does MID stand for?",
                options: [
                  { key: "a", text: "Maritime Identification Digit" },
                  { key: "b", text: "Marine Information Database" },
                  { key: "c", text: "Mobile Identity Declaration" },
                  { key: "d", text: "Maritime Inspection District" },
                ],
                correct_answer: "a",
                explanation:
                  "MID = Maritime Identification Digit, the 3-digit country code in an MMSI.",
              },
            ],
          },
          {
            id: "module-5-checkpoint",
            moduleId: "module-5",
            title: "Module 5 Checkpoint Quiz",
            passThreshold: 70,
            questions: [
              {
                id: "m5q1",
                text: "What is the correct priority order of communications?",
                options: [
                  { key: "a", text: "Safety, Urgency, Distress, Routine" },
                  { key: "b", text: "Distress, Urgency, Safety, Routine" },
                  { key: "c", text: "Distress, Safety, Urgency, Routine" },
                  { key: "d", text: "Urgency, Distress, Safety, Routine" },
                ],
                correct_answer: "b",
                explanation:
                  "The priority order is: Distress (highest), Urgency, Safety, Routine (lowest).",
              },
              {
                id: "m5q2",
                text: "How many times is MAYDAY spoken at the start of a distress call?",
                options: [
                  { key: "a", text: "Once" },
                  { key: "b", text: "Twice" },
                  { key: "c", text: "Three times" },
                  { key: "d", text: "As many as needed" },
                ],
                correct_answer: "c",
                explanation:
                  "The distress call begins with MAYDAY MAYDAY MAYDAY — spoken three times.",
              },
              {
                id: "m5q3",
                text: "After sending a DSC distress alert, what should you do next?",
                options: [
                  { key: "a", text: "Wait for DSC acknowledgment" },
                  { key: "b", text: "Switch to Channel 70 for voice" },
                  { key: "c", text: "Begin voice MAYDAY on Channel 16" },
                  { key: "d", text: "Send another DSC alert" },
                ],
                correct_answer: "c",
                explanation:
                  "After the DSC distress alert, immediately begin a voice MAYDAY on Channel 16.",
              },
              {
                id: "m5q4",
                text: "What command resumes normal radio traffic after a distress incident?",
                options: [
                  { key: "a", text: "SEELONCE MAYDAY" },
                  { key: "b", text: "PRUDONCE" },
                  { key: "c", text: "SEELONCE FEENEE" },
                  { key: "d", text: "SEELONCE DISTRESS" },
                ],
                correct_answer: "c",
                explanation:
                  "SEELONCE FEENEE (from French 'silence fini') announces the end of distress traffic and resumes normal working.",
              },
              {
                id: "m5q5",
                text: "What does PRUDONCE mean?",
                options: [
                  { key: "a", text: "Total radio silence" },
                  { key: "b", text: "Distress traffic only on Channel 16" },
                  {
                    key: "c",
                    text: "Restricted working — only distress-related traffic permitted",
                  },
                  { key: "d", text: "Resume all normal communications" },
                ],
                correct_answer: "c",
                explanation:
                  "PRUDONCE (from French 'prudence') allows cautious resumption — only traffic related to the distress situation.",
              },
              {
                id: "m5q6",
                text: "Who should send DSC distress acknowledgments?",
                options: [
                  { key: "a", text: "Any vessel in range" },
                  { key: "b", text: "Only coast stations" },
                  { key: "c", text: "Only vessels within 5 NM" },
                  { key: "d", text: "Any ship with DSC" },
                ],
                correct_answer: "b",
                explanation:
                  "Only coast stations send DSC distress acknowledgments. Ships should listen on Channel 16 for voice MAYDAY.",
              },
              {
                id: "m5q7",
                text: "MEDICO calls are routed through which facility?",
                options: [
                  { key: "a", text: "Directly to the hospital" },
                  { key: "b", text: "A coast station to a Radio Medical Centre" },
                  { key: "c", text: "The nearest vessel with a doctor" },
                  { key: "d", text: "Inmarsat satellite" },
                ],
                correct_answer: "b",
                explanation:
                  "MEDICO calls are PAN PAN calls routed via a coast station to a Radio Medical Centre.",
              },
              {
                id: "m5q8",
                text: "Do SECURITE messages require acknowledgment?",
                options: [
                  { key: "a", text: "Yes, from all stations" },
                  { key: "b", text: "Yes, from coast stations only" },
                  { key: "c", text: "No" },
                  { key: "d", text: "Only if they contain weather warnings" },
                ],
                correct_answer: "c",
                explanation: "SECURITE messages are broadcasts that do not require acknowledgment.",
              },
            ],
          },
          {
            id: "module-6-checkpoint",
            moduleId: "module-6",
            title: "Module 6 Checkpoint Quiz",
            passThreshold: 70,
            questions: [
              {
                id: "m6q1",
                text: "What frequency is International NAVTEX?",
                options: [
                  { key: "a", text: "490 kHz" },
                  { key: "b", text: "518 kHz" },
                  { key: "c", text: "2187.5 kHz" },
                  { key: "d", text: "4209.5 kHz" },
                ],
                correct_answer: "b",
                explanation: "International NAVTEX broadcasts in English on 518 kHz.",
              },
              {
                id: "m6q2",
                text: "What is the approximate range of a NAVTEX station?",
                options: [
                  { key: "a", text: "100 nautical miles" },
                  { key: "b", text: "200 nautical miles" },
                  { key: "c", text: "400 nautical miles" },
                  { key: "d", text: "1000 nautical miles" },
                ],
                correct_answer: "c",
                explanation:
                  "NAVTEX stations have an operational range of approximately 400 nautical miles.",
              },
              {
                id: "m6q3",
                text: "How does a SART appear on a radar display?",
                options: [
                  { key: "a", text: "A single bright dot" },
                  { key: "b", text: "A line of 12 equally spaced dots" },
                  { key: "c", text: "A flashing circle" },
                  { key: "d", text: "A cross shape" },
                ],
                correct_answer: "b",
                explanation:
                  "A SART produces 12 dots on radar, extending outward from the SART's position.",
              },
              {
                id: "m6q4",
                text: "On which frequencies does a 406 MHz EPIRB transmit?",
                options: [
                  { key: "a", text: "VHF Channel 16 only" },
                  { key: "b", text: "406 MHz and 121.5 MHz" },
                  { key: "c", text: "2182 kHz and 156.8 MHz" },
                  { key: "d", text: "406 MHz only" },
                ],
                correct_answer: "b",
                explanation:
                  "A 406 MHz EPIRB transmits on 406 MHz for satellite detection and 121.5 MHz as a homing signal.",
              },
              {
                id: "m6q5",
                text: "How often must an EPIRB battery be replaced?",
                options: [
                  { key: "a", text: "Every year" },
                  { key: "b", text: "Every 2 years" },
                  { key: "c", text: "Every 5 years" },
                  { key: "d", text: "Every 10 years" },
                ],
                correct_answer: "c",
                explanation:
                  "EPIRB batteries must be replaced every 5 years or by the expiry date, whichever comes first.",
              },
              {
                id: "m6q6",
                text: "Which AIS class transmits every 2 seconds when turning at high speed?",
                options: [
                  { key: "a", text: "Class A" },
                  { key: "b", text: "Class B" },
                  { key: "c", text: "Both equally" },
                  { key: "d", text: "Neither — AIS transmits every 30 seconds" },
                ],
                correct_answer: "a",
                explanation:
                  "AIS Class A transmits every 2 seconds when the vessel is turning at speeds above 14 knots.",
              },
              {
                id: "m6q7",
                text: "What height does a parachute rocket reach?",
                options: [
                  { key: "a", text: "100 metres" },
                  { key: "b", text: "200 metres" },
                  { key: "c", text: "300 metres" },
                  { key: "d", text: "500 metres" },
                ],
                correct_answer: "c",
                explanation:
                  "A red parachute rocket reaches approximately 300 metres and is visible for 25+ NM at night.",
              },
              {
                id: "m6q8",
                text: "What does OSC stand for in SAR operations?",
                options: [
                  { key: "a", text: "On-Site Commander" },
                  { key: "b", text: "On-Scene Coordinator" },
                  { key: "c", text: "Operational Safety Controller" },
                  { key: "d", text: "Ocean Search Captain" },
                ],
                correct_answer: "b",
                explanation: "OSC = On-Scene Coordinator, who manages all SAR units at the scene.",
              },
            ],
          },
        ])
        .onConflictDoNothing();

      // Jurisdictions
      await tx
        .insert(jurisdictions)
        .values([
          {
            id: "international",
            label: "International (ITU default)",
            channelPlan: {
              "06": {
                purpose: "Ship-to-ship safety",
                type: "voice",
                tx_allowed: true,
              },
              "08": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "09": {
                purpose: "Calling, boating activities",
                type: "voice",
                tx_allowed: true,
              },
              "10": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "13": {
                purpose: "Bridge-to-bridge navigation safety",
                type: "voice",
                tx_allowed: true,
                max_power: "low",
              },
              "16": {
                purpose: "Distress, safety, and calling",
                type: "voice",
                tx_allowed: true,
              },
              "67": {
                purpose: "Small craft safety",
                type: "voice",
                tx_allowed: true,
              },
              "70": {
                purpose: "Digital Selective Calling",
                type: "dsc_only",
                tx_allowed: false,
              },
              "72": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "77": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
            },
            callingChannel: 16,
            dscChannel: 70,
            notes:
              "Standard ITU Radio Regulations Appendix 18 channel plan. Regional supplements may assign additional channels for port operations.",
          },
          {
            id: "us",
            label: "United States (FCC)",
            channelPlan: {
              "09": {
                purpose: "Boating calling (secondary)",
                type: "voice",
                tx_allowed: true,
              },
              "13": {
                purpose: "Bridge-to-bridge navigation safety",
                type: "voice",
                tx_allowed: true,
                max_power: "low",
              },
              "16": {
                purpose: "Distress, safety, and calling",
                type: "voice",
                tx_allowed: true,
              },
              "22": {
                purpose: "Coast Guard liaison / MSI broadcasts",
                type: "voice",
                tx_allowed: true,
              },
              "68": {
                purpose: "Non-commercial working",
                type: "voice",
                tx_allowed: true,
              },
              "69": {
                purpose: "Non-commercial working",
                type: "voice",
                tx_allowed: true,
              },
              "70": {
                purpose: "Digital Selective Calling",
                type: "dsc_only",
                tx_allowed: false,
              },
              "71": {
                purpose: "Non-commercial working",
                type: "voice",
                tx_allowed: true,
              },
              "72": {
                purpose: "Non-commercial working (ship-to-ship)",
                type: "voice",
                tx_allowed: true,
              },
              "78": {
                purpose: "Non-commercial working",
                type: "voice",
                tx_allowed: true,
              },
            },
            callingChannel: 16,
            dscChannel: 70,
            notes:
              "FCC Part 80 VHF channel plan. Channel 9 is the secondary calling channel. Channel 22A is used for Coast Guard communications.",
          },
          {
            id: "uk",
            label: "United Kingdom (Ofcom/MCA)",
            channelPlan: {
              "06": {
                purpose: "Ship-to-ship safety",
                type: "voice",
                tx_allowed: true,
              },
              "08": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "10": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "13": {
                purpose: "Bridge-to-bridge navigation safety",
                type: "voice",
                tx_allowed: true,
                max_power: "low",
              },
              "16": {
                purpose: "Distress, safety, and calling",
                type: "voice",
                tx_allowed: true,
              },
              "67": {
                purpose: "Small craft safety / coastguard",
                type: "voice",
                tx_allowed: true,
              },
              "70": {
                purpose: "Digital Selective Calling",
                type: "dsc_only",
                tx_allowed: false,
              },
              "73": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "77": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "80": {
                purpose: "Marina operations",
                type: "voice",
                tx_allowed: true,
              },
            },
            callingChannel: 16,
            dscChannel: 70,
            notes:
              "UK VHF channel plan administered by Ofcom and MCA. Channel M1 (37A/157.850 MHz) is used by marinas. Channel 67 is primary small craft safety.",
          },
          {
            id: "eu",
            label: "Europe / Mediterranean (CEPT)",
            channelPlan: {
              "06": {
                purpose: "Ship-to-ship safety",
                type: "voice",
                tx_allowed: true,
              },
              "08": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "09": {
                purpose: "Marina calling / recreational",
                type: "voice",
                tx_allowed: true,
              },
              "10": {
                purpose: "Ship-to-ship / SAR coordination",
                type: "voice",
                tx_allowed: true,
              },
              "12": {
                purpose: "Port operations / VTS",
                type: "voice",
                tx_allowed: true,
              },
              "13": {
                purpose: "Bridge-to-bridge navigation safety",
                type: "voice",
                tx_allowed: true,
                max_power: "low",
              },
              "14": {
                purpose: "Port operations / VTS",
                type: "voice",
                tx_allowed: true,
              },
              "16": {
                purpose: "Distress, safety, and calling",
                type: "voice",
                tx_allowed: true,
              },
              "67": {
                purpose: "Small craft safety / SAR coordination",
                type: "voice",
                tx_allowed: true,
              },
              "70": {
                purpose: "Digital Selective Calling",
                type: "dsc_only",
                tx_allowed: false,
              },
              "72": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "73": {
                purpose: "SAR coordination / ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "77": {
                purpose: "Ship-to-ship",
                type: "voice",
                tx_allowed: true,
              },
              "80": {
                purpose: "Marina operations",
                type: "voice",
                tx_allowed: true,
              },
              "87B": {
                purpose: "AIS 1",
                type: "dsc_only",
                tx_allowed: false,
              },
              "88B": {
                purpose: "AIS 2",
                type: "dsc_only",
                tx_allowed: false,
              },
            },
            callingChannel: 16,
            dscChannel: 70,
            notes:
              "CEPT/ECC harmonised channel plan based on ITU Appendix 18. Covers all European and Mediterranean waters including Israel. Channel 9 is widely used for marina calling. Channels 12 and 14 are common port operations/VTS frequencies. AIS transponders use channels 87B and 88B.",
          },
          {
            id: "ca",
            label: "Canada (ISED/CCG)",
            channelPlan: {
              "06": {
                purpose: "Ship-to-ship safety",
                type: "voice",
                tx_allowed: true,
              },
              "09": {
                purpose: "Calling (commercial and non-commercial)",
                type: "voice",
                tx_allowed: true,
              },
              "13": {
                purpose: "Bridge-to-bridge navigation safety",
                type: "voice",
                tx_allowed: true,
                max_power: "low",
              },
              "14": {
                purpose: "Vessel Traffic Services",
                type: "voice",
                tx_allowed: true,
              },
              "16": {
                purpose: "Distress, safety, and calling",
                type: "voice",
                tx_allowed: true,
              },
              "68": {
                purpose: "Non-commercial working",
                type: "voice",
                tx_allowed: true,
              },
              "70": {
                purpose: "Digital Selective Calling",
                type: "dsc_only",
                tx_allowed: false,
              },
              "71": {
                purpose: "Non-commercial working",
                type: "voice",
                tx_allowed: true,
              },
              "72": {
                purpose: "Non-commercial working (ship-to-ship)",
                type: "voice",
                tx_allowed: true,
              },
              "83": {
                purpose: "Canadian Coast Guard auxiliary",
                type: "voice",
                tx_allowed: true,
              },
            },
            callingChannel: 16,
            dscChannel: 70,
            notes:
              "Canadian VHF channel plan administered by ISED. Channel 16 is monitored by Canadian Coast Guard MCTS centres.",
          },
        ])
        .onConflictDoNothing();
    });

    console.log("Seed complete.");
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});
