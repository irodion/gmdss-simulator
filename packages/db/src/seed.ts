import { createClient } from "./client.ts";
import { jurisdictions, lessons, modules, quizzes } from "./schema/index.ts";

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
      // Modules
      await tx
        .insert(modules)
        .values([
          {
            id: "module-1",
            title: "VHF Radio Fundamentals",
            description:
              "Understand VHF radio controls, channel system, and basic operating discipline.",
            orderIndex: 1,
            prerequisiteModuleId: null,
          },
          {
            id: "module-2",
            title: "MMSI and Digital Selective Calling",
            description: "Decode MMSIs, understand DSC categories, and construct DSC calls.",
            orderIndex: 2,
            prerequisiteModuleId: "module-1",
          },
          {
            id: "module-3",
            title: "Distress, Urgency, Safety, and Medical Procedures",
            description: "Master MAYDAY, PAN PAN, SECURITE, and MEDICO procedures.",
            orderIndex: 3,
            prerequisiteModuleId: "module-2",
          },
          {
            id: "module-4",
            title: "SAR Equipment and Procedures",
            description:
              "Learn about EPIRB, SART, radar reflectors, GPS, PLBs, and SAR coordination.",
            orderIndex: 4,
            prerequisiteModuleId: "module-3",
          },
        ])
        .onConflictDoNothing();

      // Module 1 lessons
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-1-1",
            moduleId: "module-1",
            title: "What is VHF Maritime Radio?",
            orderIndex: 1,
            contentPath: "en/modules/1/lesson-1.json",
          },
          {
            id: "lesson-1-2",
            moduleId: "module-1",
            title: "The VHF Radio Panel",
            orderIndex: 2,
            contentPath: "en/modules/1/lesson-2.json",
          },
          {
            id: "lesson-1-3",
            moduleId: "module-1",
            title: "VHF Channel System",
            orderIndex: 3,
            contentPath: "en/modules/1/lesson-3.json",
          },
          {
            id: "lesson-1-4",
            moduleId: "module-1",
            title: "Basic Call Procedure",
            orderIndex: 4,
            contentPath: "en/modules/1/lesson-4.json",
          },
          {
            id: "lesson-1-5",
            moduleId: "module-1",
            title: "Radio Discipline",
            orderIndex: 5,
            contentPath: "en/modules/1/lesson-5.json",
          },
          {
            id: "lesson-1-6",
            moduleId: "module-1",
            title: "Watchkeeping Obligations",
            orderIndex: 6,
            contentPath: "en/modules/1/lesson-6.json",
          },
        ])
        .onConflictDoNothing();

      // Module 2 lessons
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-2-1",
            moduleId: "module-2",
            title: "What is an MMSI?",
            orderIndex: 1,
            contentPath: "en/modules/2/lesson-1.json",
          },
          {
            id: "lesson-2-2",
            moduleId: "module-2",
            title: "DSC Overview",
            orderIndex: 2,
            contentPath: "en/modules/2/lesson-2.json",
          },
          {
            id: "lesson-2-3",
            moduleId: "module-2",
            title: "Distress Alerts via DSC",
            orderIndex: 3,
            contentPath: "en/modules/2/lesson-3.json",
          },
          {
            id: "lesson-2-4",
            moduleId: "module-2",
            title: "Urgency, Safety, and Routine DSC",
            orderIndex: 4,
            contentPath: "en/modules/2/lesson-4.json",
          },
          {
            id: "lesson-2-5",
            moduleId: "module-2",
            title: "False Alerts and Cancellation",
            orderIndex: 5,
            contentPath: "en/modules/2/lesson-5.json",
          },
          {
            id: "lesson-2-6",
            moduleId: "module-2",
            title: "DSC to Voice Workflow",
            orderIndex: 6,
            contentPath: "en/modules/2/lesson-6.json",
          },
        ])
        .onConflictDoNothing();

      // Module 3 lessons
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-3-1",
            moduleId: "module-3",
            title: "Communication Priority",
            orderIndex: 1,
            contentPath: "en/modules/3/lesson-1.json",
          },
          {
            id: "lesson-3-2",
            moduleId: "module-3",
            title: "MAYDAY Procedure",
            orderIndex: 2,
            contentPath: "en/modules/3/lesson-2.json",
          },
          {
            id: "lesson-3-3",
            moduleId: "module-3",
            title: "MAYDAY RELAY",
            orderIndex: 3,
            contentPath: "en/modules/3/lesson-3.json",
          },
          {
            id: "lesson-3-4",
            moduleId: "module-3",
            title: "PAN PAN Procedure",
            orderIndex: 4,
            contentPath: "en/modules/3/lesson-4.json",
          },
          {
            id: "lesson-3-5",
            moduleId: "module-3",
            title: "SECURITE Procedure",
            orderIndex: 5,
            contentPath: "en/modules/3/lesson-5.json",
          },
          {
            id: "lesson-3-6",
            moduleId: "module-3",
            title: "MEDICO Calls",
            orderIndex: 6,
            contentPath: "en/modules/3/lesson-6.json",
          },
          {
            id: "lesson-3-7",
            moduleId: "module-3",
            title: "Responding to Distress",
            orderIndex: 7,
            contentPath: "en/modules/3/lesson-7.json",
          },
        ])
        .onConflictDoNothing();

      // Module 4 lessons
      await tx
        .insert(lessons)
        .values([
          {
            id: "lesson-4-1",
            moduleId: "module-4",
            title: "EPIRB",
            orderIndex: 1,
            contentPath: "en/modules/4/lesson-1.json",
          },
          {
            id: "lesson-4-2",
            moduleId: "module-4",
            title: "SART",
            orderIndex: 2,
            contentPath: "en/modules/4/lesson-2.json",
          },
          {
            id: "lesson-4-3",
            moduleId: "module-4",
            title: "Radar Reflectors",
            orderIndex: 3,
            contentPath: "en/modules/4/lesson-3.json",
          },
          {
            id: "lesson-4-4",
            moduleId: "module-4",
            title: "GPS and Position Reporting",
            orderIndex: 4,
            contentPath: "en/modules/4/lesson-4.json",
          },
          {
            id: "lesson-4-5",
            moduleId: "module-4",
            title: "Personal Locator Beacons",
            orderIndex: 5,
            contentPath: "en/modules/4/lesson-5.json",
          },
          {
            id: "lesson-4-6",
            moduleId: "module-4",
            title: "SAR Coordination",
            orderIndex: 6,
            contentPath: "en/modules/4/lesson-6.json",
          },
          {
            id: "lesson-4-7",
            moduleId: "module-4",
            title: "Pyrotechnics and Visual Signals",
            orderIndex: 7,
            contentPath: "en/modules/4/lesson-7.json",
          },
        ])
        .onConflictDoNothing();

      // Quizzes with sample questions
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
                text: "What is the international distress and calling channel?",
                options: [
                  { key: "a", text: "Channel 9" },
                  { key: "b", text: "Channel 16" },
                  { key: "c", text: "Channel 70" },
                  { key: "d", text: "Channel 13" },
                ],
                correct_answer: "b",
                explanation:
                  "Channel 16 (156.800 MHz) is the international distress, safety, and calling frequency.",
              },
              {
                id: "m1q2",
                text: "What is the purpose of the squelch control?",
                options: [
                  { key: "a", text: "To change channels" },
                  { key: "b", text: "To adjust transmission power" },
                  { key: "c", text: "To filter out background noise" },
                  { key: "d", text: "To activate dual watch" },
                ],
                correct_answer: "c",
                explanation:
                  "The squelch control sets the noise gate threshold, filtering out weak signals and background static.",
              },
              {
                id: "m1q3",
                text: "Which channel is reserved exclusively for Digital Selective Calling?",
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
                id: "m1q4",
                text: "What does the proword 'OVER' mean?",
                options: [
                  { key: "a", text: "The communication is finished" },
                  { key: "b", text: "I have finished my transmission and expect a response" },
                  { key: "c", text: "Please repeat your last message" },
                  { key: "d", text: "Message received and understood" },
                ],
                correct_answer: "b",
                explanation:
                  "'OVER' indicates you have finished your transmission and are awaiting a reply. 'OUT' means the communication is finished.",
              },
              {
                id: "m1q5",
                text: "What should you do before transmitting on any channel?",
                options: [
                  { key: "a", text: "Switch to high power" },
                  { key: "b", text: "Listen first to check if the channel is clear" },
                  { key: "c", text: "Send a DSC alert" },
                  { key: "d", text: "Turn off dual watch" },
                ],
                correct_answer: "b",
                explanation:
                  "Always listen before transmitting to avoid interfering with ongoing communications.",
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
                text: "How many digits are in a standard ship station MMSI?",
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
                id: "m2q2",
                text: "What category of DSC call is used for distress?",
                options: [
                  { key: "a", text: "Routine" },
                  { key: "b", text: "Safety" },
                  { key: "c", text: "Urgency" },
                  { key: "d", text: "Distress" },
                ],
                correct_answer: "d",
                explanation:
                  "A distress DSC alert is sent when there is grave and imminent danger to the vessel or persons.",
              },
              {
                id: "m2q3",
                text: "After sending a DSC distress alert, what should you do next?",
                options: [
                  { key: "a", text: "Wait for DSC acknowledgment" },
                  { key: "b", text: "Switch to Channel 70 for voice" },
                  { key: "c", text: "Begin voice MAYDAY on Channel 16 immediately" },
                  { key: "d", text: "Send another DSC alert" },
                ],
                correct_answer: "c",
                explanation:
                  "After the DSC distress alert, immediately begin a voice MAYDAY on Channel 16. Do not wait for DSC acknowledgment.",
              },
              {
                id: "m2q4",
                text: "Who should acknowledge a DSC distress alert?",
                options: [
                  { key: "a", text: "Any vessel in range" },
                  { key: "b", text: "Only coast stations" },
                  { key: "c", text: "Only vessels within 5 nautical miles" },
                  { key: "d", text: "Any ship with DSC capability" },
                ],
                correct_answer: "b",
                explanation:
                  "Only coast stations send DSC distress acknowledgments. Individual ships should not acknowledge DSC distress alerts — they should listen on Channel 16 for the voice MAYDAY.",
              },
              {
                id: "m2q5",
                text: "What is the MID portion of an MMSI?",
                options: [
                  { key: "a", text: "The last 3 digits" },
                  { key: "b", text: "The first 3 digits identifying the country" },
                  { key: "c", text: "A 2-digit vessel type code" },
                  { key: "d", text: "The port of registration code" },
                ],
                correct_answer: "b",
                explanation:
                  "The Maritime Identification Digit (MID) is the first 3 digits of a ship MMSI, identifying the flag state.",
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
                text: "What is the correct order of communication priority?",
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
                id: "m3q2",
                text: "How many times should 'MAYDAY' be spoken at the start of a distress call?",
                options: [
                  { key: "a", text: "Once" },
                  { key: "b", text: "Twice" },
                  { key: "c", text: "Three times" },
                  { key: "d", text: "As many times as needed" },
                ],
                correct_answer: "c",
                explanation:
                  "The distress call begins with 'MAYDAY MAYDAY MAYDAY' — spoken three times.",
              },
              {
                id: "m3q3",
                text: "What signal word is used for an urgency message?",
                options: [
                  { key: "a", text: "MAYDAY" },
                  { key: "b", text: "PAN PAN" },
                  { key: "c", text: "SECURITE" },
                  { key: "d", text: "MEDICO" },
                ],
                correct_answer: "b",
                explanation:
                  "PAN PAN (spoken three times) is used for urgency messages — situations that are serious but do not pose immediate danger.",
              },
              {
                id: "m3q4",
                text: "When would you use a MAYDAY RELAY?",
                options: [
                  { key: "a", text: "To cancel a false distress alert" },
                  { key: "b", text: "To relay a distress message on behalf of another vessel" },
                  { key: "c", text: "To request medical advice" },
                  { key: "d", text: "To repeat your own MAYDAY" },
                ],
                correct_answer: "b",
                explanation:
                  "A MAYDAY RELAY is sent when you receive a distress message from another vessel and believe it has not been received by a coast station.",
              },
              {
                id: "m3q5",
                text: "What prefix is used for safety messages?",
                options: [
                  { key: "a", text: "MAYDAY" },
                  { key: "b", text: "PAN PAN" },
                  { key: "c", text: "SECURITE" },
                  { key: "d", text: "SAFETY" },
                ],
                correct_answer: "c",
                explanation:
                  "SECURITE (spoken three times) is used for safety messages — navigational warnings, meteorological warnings, etc.",
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
                text: "What does EPIRB stand for?",
                options: [
                  { key: "a", text: "Emergency Position Indicating Radio Beacon" },
                  { key: "b", text: "Electronic Position Information Radio Band" },
                  { key: "c", text: "Emergency Personal Identification Radio Beacon" },
                  { key: "d", text: "Electronic Personal Indicating Radio Band" },
                ],
                correct_answer: "a",
                explanation:
                  "EPIRB = Emergency Position Indicating Radio Beacon. It transmits distress signals to satellites when activated.",
              },
              {
                id: "m4q2",
                text: "How does a SART appear on a radar display?",
                options: [
                  { key: "a", text: "As a single bright dot" },
                  { key: "b", text: "As a line of 12 equally spaced dots" },
                  { key: "c", text: "As a flashing circle" },
                  { key: "d", text: "As a cross shape" },
                ],
                correct_answer: "b",
                explanation:
                  "A SART produces a series of 12 dots on a radar display, extending outward from the SART's position.",
              },
              {
                id: "m4q3",
                text: "On which frequencies does a 406 MHz EPIRB transmit?",
                options: [
                  { key: "a", text: "VHF Channel 16 only" },
                  { key: "b", text: "406 MHz (satellite) and 121.5 MHz (homing)" },
                  { key: "c", text: "2182 kHz and 156.8 MHz" },
                  { key: "d", text: "406 MHz only" },
                ],
                correct_answer: "b",
                explanation:
                  "A 406 MHz EPIRB transmits on 406 MHz for satellite detection and 121.5 MHz as a homing signal for SAR aircraft.",
              },
              {
                id: "m4q4",
                text: "What is the primary purpose of a Personal Locator Beacon (PLB)?",
                options: [
                  { key: "a", text: "Ship-to-ship communication" },
                  {
                    key: "b",
                    text: "Alerting SAR authorities when an individual is in distress",
                  },
                  { key: "c", text: "Marking a vessel's position on radar" },
                  { key: "d", text: "Broadcasting navigational warnings" },
                ],
                correct_answer: "b",
                explanation:
                  "A PLB is a personal distress beacon carried by individuals. When activated, it alerts SAR satellites to the person's position.",
              },
              {
                id: "m4q5",
                text: "What is the role of the On-Scene Coordinator (OSC) in SAR?",
                options: [
                  { key: "a", text: "To navigate the distressed vessel" },
                  {
                    key: "b",
                    text: "To coordinate search and rescue efforts at the scene",
                  },
                  { key: "c", text: "To relay messages to the media" },
                  { key: "d", text: "To maintain radio silence" },
                ],
                correct_answer: "b",
                explanation:
                  "The OSC coordinates all SAR units at the scene, assigns search patterns, and reports to the MRCC.",
              },
            ],
          },
        ])
        .onConflictDoNothing();

      // International jurisdiction
      await tx
        .insert(jurisdictions)
        .values({
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
        })
        .onConflictDoNothing();
    });

    console.log("Seed complete.");
  } finally {
    await sql.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
