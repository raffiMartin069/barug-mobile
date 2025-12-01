import ChildVisitScheduleQuery from '@/repository/queries/ChildVisitScheduleQuery';

export class ChildVisitDomainException extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'ChildVisitDomainException';
    this.code = code;
  }
}

export type RawChildVisit = {
  child_record_id?: number | string | null;
  visit_no?: number | string | null;
  age?: number | string | null;
  weight?: number | string | null;
  temp?: number | string | null;
  height?: number | string | null;
  findings?: string | null;
  notes?: string | null;
  visit_date?: string | null;
  assessed_by_id?: number | null;
  recorded_by_id?: number | null;
};

export type ValidatedChildVisit = {
  child_record_id: number;
  visit_no?: number | null;
  age: number;
  weight: number;
  temp: number;
  height: number;
  findings?: string | null;
  notes: string | null;
  visit_date?: string | null;
  assessed_by_id?: number | null;
  recorded_by_id?: number | null;
};

// Default constraints (can be adjusted if needed)
const DEFAULTS = {
  MIN_WEIGHT: 0.5,
  MAX_WEIGHT: 40,
  MIN_TEMP: 34.0,
  MAX_TEMP: 42.0,
  MIN_HEIGHT: 30,
  MAX_HEIGHT: 150,
  MAX_AGE: 5, // age must be < 5
};

function parseNumberLike(value: any): number {
  if (value === null || value === undefined || value === '') throw new Error('invalid_number');
  const n = Number(String(value).trim());
  if (!Number.isFinite(n)) throw new Error('invalid_number');
  return n;
}

/**
 * Sanitize by ensuring no emoji are present. If emoji are found, throw.
 * This is a best-effort check using surrogate-pair ranges.
 */
function sanitizeNoEmoji(s: string): string {
  // Regex to find common emoji / surrogate pairs. Not perfect but practical.
  const emojiRegex = /([\u231A-\u231B]|[\u23E9-\u23F3]|[\u23F8-\u23FA]|[\u24C2]|[\u25AA-\u25AB]|[\u25B6]|[\u25C0]|[\u25FB-\u25FE]|[\u2600-\u27BF]|[\u2900-\u297F]|[\u2B00-\u2BFF]|[\uD800-\uDFFF])/g;
  if (emojiRegex.test(s)) {
    throw new Error('emoji_not_allowed');
  }
  return s;
}

/**
 * Validate a child visit payload. Throws ChildVisitDomainException on validation errors.
 * If `visitQuery` is provided, it will be used to detect duplicate visit_no for the same child.
 */
export async function validateChildVisitData(
  raw: RawChildVisit,
  visitQuery?: ChildVisitScheduleQuery,
  opts?: Partial<typeof DEFAULTS>
): Promise<ValidatedChildVisit> {
  const cfg = { ...DEFAULTS, ...(opts ?? {}) } as typeof DEFAULTS;

  // child_record_id must be present and numeric
  if (raw.child_record_id === undefined || raw.child_record_id === null || raw.child_record_id === '') {
    throw new ChildVisitDomainException('Child record is required.', 'child_required');
  }
  let childRecordId: number;
  try {
    childRecordId = parseNumberLike(raw.child_record_id);
  } catch (e) {
    throw new ChildVisitDomainException('Child record id is invalid.', 'child_invalid');
  }

  // visit_no optional but if provided must be integer >= 1
  let visitNo: number | null = null;
  if (raw.visit_no !== undefined && raw.visit_no !== null && String(raw.visit_no).trim() !== '') {
    try {
      visitNo = parseNumberLike(raw.visit_no);
    } catch (e) {
      throw new ChildVisitDomainException('Visit number is invalid.', 'visit_no_invalid');
    }
    if (!Number.isInteger(visitNo) || visitNo < 1) {
      throw new ChildVisitDomainException('Visit number must be an integer >= 1.', 'visit_no_invalid');
    }
  }

  // Age
  if (raw.age === undefined || raw.age === null || String(raw.age).trim() === '') {
    throw new ChildVisitDomainException('Age is required.', 'age_required');
  }
  let ageVal: number;
  try {
    ageVal = parseNumberLike(raw.age);
  } catch (e) {
    throw new ChildVisitDomainException('Age must be a valid number.', 'age_invalid');
  }
  if (ageVal >= cfg.MAX_AGE) {
    throw new ChildVisitDomainException('Age exceeds allowed limit.', 'age_limit');
  }
  if (ageVal < 0) {
    throw new ChildVisitDomainException('Age must not be negative.', 'age_negative');
  }
  if (ageVal >= 1 && !Number.isInteger(ageVal)) {
    throw new ChildVisitDomainException('Age must be an integer for ages >= 1.', 'age_integer_required');
  }

  // Weight
  if (raw.weight === undefined || raw.weight === null || String(raw.weight).trim() === '') {
    throw new ChildVisitDomainException('Weight is required.', 'weight_required');
  }
  let weightVal: number;
  try {
    weightVal = parseNumberLike(raw.weight);
  } catch (e) {
    throw new ChildVisitDomainException('Weight must be a valid number.', 'weight_invalid');
  }
  if (weightVal < cfg.MIN_WEIGHT || weightVal > cfg.MAX_WEIGHT) {
    throw new ChildVisitDomainException(`Weight must be between ${cfg.MIN_WEIGHT} and ${cfg.MAX_WEIGHT}.`, 'weight_range');
  }

  // Temperature
  if (raw.temp === undefined || raw.temp === null || String(raw.temp).trim() === '') {
    throw new ChildVisitDomainException('Temperature is required.', 'temp_required');
  }
  let tempVal: number;
  try {
    tempVal = parseNumberLike(raw.temp);
  } catch (e) {
    throw new ChildVisitDomainException('Temperature must be a valid number.', 'temp_invalid');
  }
  if (tempVal < cfg.MIN_TEMP || tempVal > cfg.MAX_TEMP) {
    throw new ChildVisitDomainException(`Temperature must be between ${cfg.MIN_TEMP} and ${cfg.MAX_TEMP}.`, 'temp_range');
  }

  // Height
  if (raw.height === undefined || raw.height === null || String(raw.height).trim() === '') {
    throw new ChildVisitDomainException('Height is required.', 'height_required');
  }
  let heightVal: number;
  try {
    heightVal = parseNumberLike(raw.height);
  } catch (e) {
    throw new ChildVisitDomainException('Height must be a valid number.', 'height_invalid');
  }
  if (heightVal < cfg.MIN_HEIGHT || heightVal > cfg.MAX_HEIGHT) {
    throw new ChildVisitDomainException(`Height must be between ${cfg.MIN_HEIGHT} and ${cfg.MAX_HEIGHT}.`, 'height_range');
  }

  // Findings (optional) - if present, sanitize (reject emoji)
  let findingsClean: string | null = null;
  if (raw.findings !== undefined && raw.findings !== null && String(raw.findings).trim() !== '') {
    try {
      findingsClean = sanitizeNoEmoji(String(raw.findings));
    } catch (e) {
      throw new ChildVisitDomainException('Emoji characters are not allowed in findings.', 'emoji_not_allowed');
    }
  }

  // Notes optional; if missing set to 'N/A' (English fallback)
  let notesClean: string | null = null;
  if (raw.notes === undefined || raw.notes === null || String(raw.notes).trim() === '') {
    notesClean = 'N/A';
  } else {
    try {
      notesClean = sanitizeNoEmoji(String(raw.notes));
    } catch (e) {
      throw new ChildVisitDomainException('Emoji characters are not allowed in notes.', 'emoji_not_allowed');
    }
  }

  // Cross-validation via ChildVisitScheduleQuery: check duplicate visit_no for same child
  if (visitQuery && visitNo !== null) {
    try {
      const existing = await visitQuery.GetChildVisitsByChildRecordId(childRecordId);
      if (existing && Array.isArray(existing)) {
        const conflict = existing.find((v) => v.visit_no === visitNo && v.visit_id !== undefined);
        if (conflict) {
          throw new ChildVisitDomainException('Visit number already exists for this child.', 'visit_no_conflict');
        }
      }
    } catch (err) {
      if (err instanceof ChildVisitDomainException) throw err;
      // if visitQuery itself failed, surface a generic validation error
      throw new ChildVisitDomainException('Failed to validate visit uniqueness.', 'visit_validation_failed');
    }
  }

  return {
    child_record_id: childRecordId,
    visit_no: visitNo,
    age: ageVal,
    weight: weightVal,
    temp: tempVal,
    height: heightVal,
    findings: findingsClean,
    notes: notesClean,
    visit_date: raw.visit_date ?? null,
    assessed_by_id: raw.assessed_by_id ?? null,
    recorded_by_id: raw.recorded_by_id ?? null,
  };
}

export default validateChildVisitData;
