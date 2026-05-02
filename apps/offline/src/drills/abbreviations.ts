export interface AbbreviationEntry {
  readonly abbr: string;
  readonly expansion: string;
  readonly family?: string;
}

export const ABBREVIATIONS: readonly AbbreviationEntry[] = [
  // SAR coordination
  { abbr: "RCC", expansion: "Rescue Coordination Centre", family: "rcc-family" },
  { abbr: "MRCC", expansion: "Maritime Rescue Coordination Centre", family: "rcc-family" },
  { abbr: "MRSC", expansion: "Maritime Rescue Sub-Centre", family: "rcc-family" },
  { abbr: "JRCC", expansion: "Joint Rescue Coordination Centre", family: "rcc-family" },
  { abbr: "ARCC", expansion: "Aeronautical Rescue Coordination Centre", family: "rcc-family" },
  { abbr: "SMC", expansion: "SAR Mission Controller" },
  { abbr: "OSC", expansion: "On-Scene Coordinator" },
  { abbr: "SC", expansion: "SAR Coordinator" },
  { abbr: "SRR", expansion: "Search and Rescue Region", family: "srr-family" },
  { abbr: "SRS", expansion: "Search and Rescue Sub-region", family: "srr-family" },
  { abbr: "SRU", expansion: "Search and Rescue Unit", family: "srr-family" },
  { abbr: "MCC", expansion: "Mission Control Centre" },
  { abbr: "LUT", expansion: "Local User Terminal" },
  { abbr: "SPOC", expansion: "SAR Point Of Contact" },
  { abbr: "SITREP", expansion: "Situation Report" },
  { abbr: "ACO", expansion: "Aircraft Co-ordinator" },
  { abbr: "AMVER", expansion: "Automated Mutual-Assistance Vessel Rescue system" },
  { abbr: "CSS", expansion: "Coordinator Surface Search" },
  {
    abbr: "CROSS",
    expansion: "Regional sub-centre of operations for surveillance maritime rescue",
  },

  // Systems, equipment and communications
  { abbr: "GMDSS", expansion: "Global Maritime Distress and Safety System" },
  { abbr: "AIS", expansion: "Automatic Identification System" },
  { abbr: "DSC", expansion: "Digital Selective Calling" },
  { abbr: "EPIRB", expansion: "Emergency Position-Indicating Radio Beacon" },
  { abbr: "SART", expansion: "Search and Rescue Transponder", family: "sart-family" },
  { abbr: "AIS-SART", expansion: "AIS-based Search and Rescue Transponder", family: "sart-family" },
  { abbr: "NAVTEX", expansion: "Navigational Telex" },
  { abbr: "NBDP", expansion: "Narrow-Band Direct-Printing" },
  { abbr: "EGC", expansion: "Enhanced Group Calling" },
  { abbr: "SafetyNET", expansion: "International SafetyNET Service" },
  { abbr: "SSAS", expansion: "Ship Security Alert System" },
  { abbr: "ELT", expansion: "Emergency Locator Transmitter" },
  { abbr: "PLB", expansion: "Personal Locator Beacon" },
  { abbr: "SES", expansion: "Ship Earth Station", family: "earth-station-family" },
  { abbr: "LES", expansion: "Land Earth Station", family: "earth-station-family" },
  { abbr: "CES", expansion: "Coast Earth Station", family: "earth-station-family" },
  { abbr: "CRS", expansion: "Coast Radio Station" },
  { abbr: "NCS", expansion: "Network Coordination Station" },
  { abbr: "LRIT", expansion: "Long Range Identification and Tracking" },
  { abbr: "RT", expansion: "Radio Telephony" },
  { abbr: "WT", expansion: "Radio Telegraphy" },
  { abbr: "SSB", expansion: "Single Side Band" },
  { abbr: "TOR", expansion: "Telex Over Radio" },
  { abbr: "SITOR", expansion: "Simplex Telex Over Radio" },
  { abbr: "ARQ", expansion: "Automatic Repeat reQuest" },

  // Organizations and identification
  { abbr: "IMO", expansion: "International Maritime Organization" },
  { abbr: "ITU", expansion: "International Telecommunication Union" },
  { abbr: "SOLAS", expansion: "International Convention for the Safety of Life at Sea" },
  { abbr: "IMSO", expansion: "International Mobile Satellite Organization" },
  { abbr: "IHO", expansion: "International Hydrographic Organization" },
  {
    abbr: "STCW",
    expansion: "International Convention on Standards of Training, Certification and Watchkeeping",
  },
  { abbr: "MCA", expansion: "Maritime and Coastguard Agency" },
  { abbr: "WMO", expansion: "World Meteorological Organization" },
  { abbr: "MMSI", expansion: "Maritime Mobile Service Identity" },
  { abbr: "MID", expansion: "Maritime Identification Digits" },
  { abbr: "AAIC", expansion: "Accounting Authority Identification Code" },

  // Time, navigation and safety
  { abbr: "UTC", expansion: "Coordinated Universal Time", family: "time-family" },
  { abbr: "GMT", expansion: "Greenwich Mean Time", family: "time-family" },
  { abbr: "UT", expansion: "Universal Time", family: "time-family" },
  { abbr: "TAI", expansion: "International Atomic Time", family: "time-family" },
  { abbr: "ETA", expansion: "Estimated Time of Arrival" },
  { abbr: "LT", expansion: "Local Time" },
  { abbr: "NAVAREA", expansion: "Navigational Area", family: "area-family" },
  { abbr: "METAREA", expansion: "Meteorological Area", family: "area-family" },
  { abbr: "WWNWS", expansion: "World-Wide Navigational Warning Service" },
  { abbr: "MSI", expansion: "Maritime Safety Information" },
  { abbr: "TMAS", expansion: "Telemedical Assistance Service" },
  { abbr: "MOB", expansion: "Man Overboard", family: "pob-family" },
  { abbr: "POB", expansion: "Persons On Board", family: "pob-family" },

  // Watchkeeping and Q-codes
  { abbr: "DW", expansion: "Dual Watch", family: "watch-family" },
  { abbr: "TW", expansion: "Triple Watch", family: "watch-family" },
  { abbr: "QRU", expansion: "No message on hand" },

  // Reporting and navigation systems
  { abbr: "TR", expansion: "Traffic List request (Transit Report)" },
  { abbr: "Tango Romeo", expansion: "Phonetic spelling of TR (Traffic List request)" },
  { abbr: "GLONASS", expansion: "Russian satellite navigation system" },
];
