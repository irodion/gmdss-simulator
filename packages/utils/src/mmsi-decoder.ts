import type { MmsiDecodeResult, MmsiStationType } from "./mmsi-types.ts";
import { midTable } from "./mid-table.ts";

export function decodeMmsi(mmsi: string): MmsiDecodeResult {
  const cleaned = mmsi.replace(/[\s-]/g, "");

  if (!/^\d{9}$/.test(cleaned)) {
    return { valid: false, mmsi: cleaned, error: "MMSI must be exactly 9 digits" };
  }

  // Special prefixes (check before MID-based types)
  if (cleaned.startsWith("974")) {
    return result(
      cleaned,
      "epirb",
      undefined,
      "EPIRB (Emergency Position Indicating Radio Beacon)",
    );
  }
  if (cleaned.startsWith("972")) {
    return result(cleaned, "mob", undefined, "MOB (Man Overboard) device");
  }
  if (cleaned.startsWith("970")) {
    return result(cleaned, "ais_sart", undefined, "AIS-SART (Search and Rescue Transponder)");
  }
  if (cleaned.startsWith("111")) {
    const mid = cleaned.substring(3, 6);
    const country = midTable[mid];
    return result(
      cleaned,
      "sar_aircraft",
      mid,
      `SAR aircraft${country ? ` (${country})` : ""}`,
      country,
    );
  }

  // Coast station: starts with 00
  if (cleaned.startsWith("00")) {
    const mid = cleaned.substring(2, 5);
    const country = midTable[mid];
    return result(cleaned, "coast", mid, `Coast station${country ? ` (${country})` : ""}`, country);
  }

  // Group call: starts with 0 (but not 00)
  if (cleaned.startsWith("0")) {
    const mid = cleaned.substring(1, 4);
    const country = midTable[mid];
    return result(cleaned, "group", mid, `Group call${country ? ` (${country})` : ""}`, country);
  }

  // Ship station: first digit 2-7
  const firstDigit = cleaned[0]!;
  if (firstDigit >= "2" && firstDigit <= "7") {
    const mid = cleaned.substring(0, 3);
    const country = midTable[mid];
    return result(cleaned, "ship", mid, `Ship station${country ? ` (${country})` : ""}`, country);
  }

  // Unknown prefix (8, 9 other than special)
  return { valid: false, mmsi: cleaned, error: "Unknown MMSI prefix" };
}

function result(
  mmsi: string,
  stationType: MmsiStationType,
  mid: string | undefined,
  description: string,
  country?: string,
): MmsiDecodeResult {
  return {
    valid: true,
    mmsi,
    stationType,
    ...(mid ? { mid } : {}),
    ...(country ? { country } : {}),
    description,
  };
}
