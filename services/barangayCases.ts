// services/barangayCases.ts
import { supabase } from '@/constants/supabase';
import dayjs from 'dayjs';

/* ---------------- Raw type from RPC (matches your sample) ---------------- */

export type PersonCaseHistoryRow = {
  role_in_case: 'COMPLAINANT' | 'RESPONDENT' | string;
  blotter_case_id: number;
  blotter_case_num: string;
  blotter_case_name: string;
  date_filed: string;           // 'YYYY-MM-DD'
  time_filed: string;           // 'HH:mm:ss'
  complaint_title: string | null;
  case_nature: string | null;
  settlement_status: string | null;   // e.g., PENDING, SETTLED, ARBITRATED
  last_progress: string | null;       // e.g., 'HEARING HELD'
  last_progress_date: string | null;  // timestamptz
  total_payment_amount: string | null; // '150.00'
  last_payment_status: string | null; // e.g., 'PAID'
  last_payment_date: string | null;   // timestamptz
  total_form_submits: number;
  complainant_names: string | null;   // comma-joined list
  respondent_names: string | null;    // comma-joined list
};

/* ---------------- Public: fetch raw case history ---------------- */

/**
 * Fetch barangay blotter CASE history for a person.
 * SQL: select * from fn_person_blotter_case_history(p_person_id)
 */
export async function getPersonBarangayCaseHistory(
  personId: number
): Promise<PersonCaseHistoryRow[]> {
  if (!personId) return [];

  console.log('[BarangayCases] → fetching via RPC fn_person_blotter_case_history', {
    p_person_id: personId,
  });

  // Primary: correct arg name (most installations use p_person_id)
  let { data, error } = await supabase.rpc('fn_person_blotter_case_history', {
    p_person_id: personId,
  });

  // Fallback: in case a wrapper exists that accepts { person_id }
  if (error && /schema cache|could not find the function|No function matches/i.test(error.message)) {
    console.warn('[BarangayCases] RPC name/arg mismatch, retrying with { person_id } …', error);
    ({ data, error } = await supabase.rpc('fn_person_blotter_case_history', {
      person_id: personId,
    }));
  }

  if (error) {
    console.error('[BarangayCases] RPC error:', error);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PersonCaseHistoryRow[];
  console.log('[BarangayCases] ✓ fetched', rows.length, 'rows');
  if (rows.length) console.log('[BarangayCases] sample row:', rows[0]);

  return rows;
}

/* ---------------- Optional: helpers to shape for UI ---------------- */

export type CaseStatusBucket =
  | 'pending'
  | 'under_review'
  | 'settled'
  | 'arbitrated'
  | 'dismissed';

export type CaseHistoryUI = {
  id: string;                    // blotter_case_id as string
  case_no: string;               // blotter_case_num
  title: string;                 // blotter_case_name
  filed_date: string;            // 'YYYY-MM-DD'
  filed_time: string;            // 'HH:mm'
  complaint_title: string | null;
  case_nature: string | null;
  settlement_status: string | null;
  last_progress: string | null;
  last_progress_date: string | null;
  total_payment_amount: string | null;
  last_payment_status: string | null;
  last_payment_date: string | null;
  total_form_submits: number;
  complainants: string | null;
  respondents: string | null;
  role: 'COMPLAINANT' | 'RESPONDENT' | string;
  status_bucket: CaseStatusBucket;
};

/** Map settlement_status to compact UI buckets. */
export function bucketCaseStatus(settlementStatus: string | null): CaseStatusBucket {
  const s = (settlementStatus || '').toUpperCase();
  if (!s || s.includes('PENDING')) return 'pending';
  if (s.includes('SETTLED')) return 'settled';
  if (s.includes('ARBITRATED')) return 'arbitrated';
  if (s.includes('DISMISS')) return 'dismissed';
  return 'under_review';
}

/** Convert raw row → UI shape. */
export function mapCaseRowToUI(r: PersonCaseHistoryRow): CaseHistoryUI {
  return {
    id: String(r.blotter_case_id),
    case_no: r.blotter_case_num,
    title: r.blotter_case_name,
    filed_date: r.date_filed,
    filed_time: (r.time_filed || '').slice(0, 5), // 'HH:mm'
    complaint_title: r.complaint_title,
    case_nature: r.case_nature,
    settlement_status: r.settlement_status,
    last_progress: r.last_progress,
    last_progress_date: r.last_progress_date,
    total_payment_amount: r.total_payment_amount,
    last_payment_status: r.last_payment_status,
    last_payment_date: r.last_payment_date,
    total_form_submits: r.total_form_submits,
    complainants: r.complainant_names,
    respondents: r.respondent_names,
    role: r.role_in_case,
    status_bucket: bucketCaseStatus(r.settlement_status),
  };
}

/**
 * Keep only ONE row per case (latest by last_progress_date, then by filed datetime).
 * Useful because the RPC may return multiple rows referencing the same case/role.
 */
export function squashLatestPerCase(rows: PersonCaseHistoryRow[]): PersonCaseHistoryRow[] {
  const byCase = new Map<number, PersonCaseHistoryRow>();
  for (const r of rows) {
    const curr = byCase.get(r.blotter_case_id);
    if (!curr) {
      byCase.set(r.blotter_case_id, r);
      continue;
    }
    const currTs =
      dayjs(curr.last_progress_date || `${curr.date_filed}T${curr.time_filed || '00:00:00'}`).valueOf();
    const nextTs =
      dayjs(r.last_progress_date || `${r.date_filed}T${r.time_filed || '00:00:00'}`).valueOf();
    if (nextTs > currTs) byCase.set(r.blotter_case_id, r);
  }
  return Array.from(byCase.values());
}

/**
 * Convenience: fetch → squash → map to UI.
 * Sorts newest first by last_progress_date or filed datetime.
 */
export async function getPersonBarangayCaseHistoryUI(
  personId: number
): Promise<CaseHistoryUI[]> {
  const raw = await getPersonBarangayCaseHistory(personId);
  const latest = squashLatestPerCase(raw);
  latest.sort((a, b) => {
    const av = dayjs(a.last_progress_date || `${a.date_filed}T${a.time_filed || '00:00:00'}`).valueOf();
    const bv = dayjs(b.last_progress_date || `${b.date_filed}T${b.time_filed || '00:00:00'}`).valueOf();
    return bv - av; // newest first
  });
  const ui = latest.map(mapCaseRowToUI);
  console.log('[BarangayCases] → UI rows:', ui.length);
  return ui;
}
