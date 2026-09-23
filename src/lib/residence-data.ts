import type { Block, ResidentSession, Room } from "../types/residence";

export interface ResidenceRecord {
  studentNumber: string;
  unit: string;
  room: Room;
  location: string;
  block: Block;
  floor: number;
}

// Blocks A, B, C, D are female residences.
// Blocks E, F are male residences.
export const FEMALE_BLOCKS: Block[] = ["A", "B", "C", "D"];
export const MALE_BLOCKS: Block[] = ["E", "F"];
export const ALL_BLOCKS: Block[] = ["A", "B", "C", "D", "E", "F"];

/**
 * Authoritative Corridor Hills resident dataset mock.
 * Includes the canonical example resident F301C (220123456)
 * plus representatives across male and female blocks.
 */
const AUTHORITATIVE_RESIDENTS: ResidenceRecord[] = [
  // Block F - Male residence
  {
    studentNumber: "220123456",
    unit: "F301",
    room: "C",
    location: "F301C",
    block: "F",
    floor: 3,
  },
  {
    studentNumber: "220123457",
    unit: "F301",
    room: "C",
    location: "F301C",
    block: "F",
    floor: 3,
  },
  {
    studentNumber: "220123458",
    unit: "F301",
    room: "A",
    location: "F301A",
    block: "F",
    floor: 3,
  },
  {
    studentNumber: "220123459",
    unit: "F301",
    room: "B",
    location: "F301B",
    block: "F",
    floor: 3,
  },
  {
    studentNumber: "221458920",
    unit: "F204",
    room: "A",
    location: "F204A",
    block: "F",
    floor: 2,
  },
  // Block E - Male residence
  {
    studentNumber: "222384910",
    unit: "E102",
    room: "B",
    location: "E102B",
    block: "E",
    floor: 1,
  },
  {
    studentNumber: "223491823",
    unit: "E305",
    room: "A",
    location: "E305A",
    block: "E",
    floor: 3,
  },
  // Block A - Female residence
  {
    studentNumber: "220849201",
    unit: "A101",
    room: "A",
    location: "A101A",
    block: "A",
    floor: 1,
  },
  {
    studentNumber: "220849202",
    unit: "A101",
    room: "C",
    location: "A101C",
    block: "A",
    floor: 1,
  },
  // Block B - Female residence
  {
    studentNumber: "221948271",
    unit: "B202",
    room: "B",
    location: "B202B",
    block: "B",
    floor: 2,
  },
  // Block C - Female residence
  {
    studentNumber: "222839104",
    unit: "C303",
    room: "A",
    location: "C303A",
    block: "C",
    floor: 3,
  },
  // Block D - Female residence
  {
    studentNumber: "223948512",
    unit: "D401",
    room: "C",
    location: "D401C",
    block: "D",
    floor: 4,
  },
];

/**
 * Normalizes user input for Unit (e.g. "f301", "f 301", "F-301" -> "F301")
 */
export function normalizeUnit(input: string): string {
  if (!input) return "";
  const cleaned = input.toUpperCase().replace(/[^A-F0-9]/g, "");
  return cleaned;
}

/**
 * Validates and extracts details from a unit string
 */
export function parseUnit(unitStr: string): {
  valid: boolean;
  block?: Block;
  floor?: number;
  unitNumber?: string;
  error?: string;
} {
  const norm = normalizeUnit(unitStr);
  if (!norm || norm.length < 3 || norm.length > 4) {
    return {
      valid: false,
      error: "Please enter a valid unit format (e.g., F301)",
    };
  }

  const blockChar = norm[0] as Block;
  if (!ALL_BLOCKS.includes(blockChar)) {
    return {
      valid: false,
      error: `Invalid block "${blockChar}". Blocks are A through F.`,
    };
  }

  const floorDigit = parseInt(norm[1], 10);
  if (isNaN(floorDigit) || floorDigit < 1 || floorDigit > 5) {
    return {
      valid: false,
      error: "Invalid floor number. Corridor Hills has floors 1 through 4.",
    };
  }

  return {
    valid: true,
    block: blockChar,
    floor: floorDigit,
    unitNumber: norm,
  };
}

export function getBlockType(block: Block): "female" | "male" {
  return FEMALE_BLOCKS.includes(block) ? "female" : "male";
}

export function getBlockDescription(block: Block): string {
  return FEMALE_BLOCKS.includes(block)
    ? `Block ${block} (Female Residence)`
    : `Block ${block} (Male Residence)`;
}

export interface VerificationResult {
  success: boolean;
  session?: ResidentSession;
  error?: string;
}

/**
 * Authoritative verification check.
 * Strictly verifies Unit + Room + TUT Student Number.
 * NEVER leaks sensitive database information, student names,
 * or reveals which unit the student actually belongs to if incorrect.
 */
export async function verifyResident(
  unitInput: string,
  roomInput: string,
  studentNumberInput: string,
): Promise<VerificationResult> {
  // Simulate natural network round-trip
  await new Promise((resolve) => setTimeout(resolve, 380));

  const unit = normalizeUnit(unitInput);
  const room = (roomInput || "").trim().toUpperCase() as Room;
  const studentNumber = (studentNumberInput || "").trim().replace(/\s+/g, "");

  if (!unit || !room || !studentNumber) {
    return {
      success: false,
      error: "Please provide your unit, room, and student number.",
    };
  }

  if (!["A", "B", "C"].includes(room)) {
    return {
      success: false,
      error: "Please select a valid room (A, B, or C).",
    };
  }

  // TUT student numbers are typically 9 digits
  if (!/^\d{8,10}$/.test(studentNumber)) {
    return {
      success: false,
      error: "Please enter a valid official TUT student number (9 digits).",
    };
  }

  // Check authoritative resident registry
  const match = AUTHORITATIVE_RESIDENTS.find(
    (record) =>
      record.unit === unit && record.room === room && record.studentNumber === studentNumber,
  );

  if (!match) {
    // SAFE, FRIENDLY ERROR: strictly does not disclose whether the unit, room, or student # was wrong
    return {
      success: false,
      error: "We couldn't verify those details. Please check your unit, room and student number.",
    };
  }

  // Create secure session token
  const now = new Date();
  const expires = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
  const token = `ch_sess_${btoa(`${match.studentNumber}:${match.location}:${Date.now()}`)}`;

  const session: ResidentSession = {
    studentNumber: match.studentNumber,
    unit: match.unit,
    room: match.room,
    location: match.location,
    block: match.block,
    floor: match.floor,
    token,
    verifiedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  return {
    success: true,
    session,
  };
}
