import { supabase } from '@/constants/supabase'

/* ========= Lookups ========= */
// BASE_URL should already be defined in this file or via EXPO_PUBLIC_API_BASE_URL
// services/documentRequest.ts
import Constants from 'expo-constants'

function getApiBase(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL
  const fromExtra = (Constants.expoConfig?.extra as any)?.API_BASE_URL
  const base = (fromEnv || fromExtra || '').trim().replace(/\/+$/, '')
  if (!base) throw new Error('API base URL is not configured')
  if (!base.startsWith('http')) throw new Error(`Bad API base: ${base}`)
  console.log('[API_BASE]', base)   // <-- keep this visible in Metro logs
  return base
}
const API_BASE = getApiBase()

function okOrThrow(res: Response, body: any) {
  if (!res.ok) throw new Error((body && (body.error || body.detail || body.message)) || `HTTP ${res.status}`)
}

export async function startDocCheckout(docId: number, opts: { success_url: string; cancel_url: string }) {
  const r = await fetch(`${API_BASE}/payments/api/docs/${docId}/start`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts),
  })
  const j = await r.json().catch(() => ({}))
  okOrThrow(r, j)
  return j as { checkout_url: string; provider_session_id: string }
}

export async function confirmDocPayment(docId: number, { dev } = { dev: true }) {
  const r = await fetch(`${API_BASE}/payments/api/docs/${docId}/confirm${dev ? '?dev=1' : ''}`, { method: 'POST' })
  const j = await r.json().catch(() => ({}))
  okOrThrow(r, j)
  return j as { status: string; clearance_rec_id?: number }
}

export async function getDocStatus(docId: number) {
  const r = await fetch(`${API_BASE}/payments/api/docs/${docId}/status`)
  const j = await r.json().catch(() => ({}))
  okOrThrow(r, j)
  return j as { status: string }
}


export type DocType = {
  document_type_id: number
  document_type_name: string
}

export type BusinessLite = { business_id: number; business_name: string }

/** v2 purpose row WITH waiver flags (preferred) */
export type PurposeWithFeeFlags = {
  document_purpose_id: number
  request_document_type_id: number
  purpose_code: string
  purpose_label: string
  fee_item_id: number
  fee_code: string
  current_amount: number
  max_amount: number | null
  default_details: any
  default_offense_no: number | null
  exempt_ftj: boolean
  exempt_senior: boolean
  exempt_pwd: boolean
  exempt_indigent: boolean
  exempt_student: boolean
}

/** legacy v1 shape (no flags) – used only if v2 RPC is missing */
export type PurposeV1 = {
  document_purpose_id: number
  purpose_code: string
  purpose_label: string
  fee_code: string
  current_amount: number
  max_amount: number | null
  default_details: any
  default_offense_no: number | null
}

export async function getDocumentTypes(): Promise<DocType[]> {
  const { data, error } = await supabase.rpc('get_document_types')
  if (error) throw error
  return (data ?? []) as DocType[]
}

/**
 * Get purposes for a document type.
 * Tries v2 (with waiver flags). If the function doesn’t exist yet, falls back to v1.
 */
export async function getPurposesByDocumentType(
  documentTypeId: number
): Promise<PurposeWithFeeFlags[]> {
  // Try v2
  const v2 = await supabase
    .rpc('get_purposes_by_document_type_v2', { p_document_type_id: documentTypeId })

  if (!v2.error && v2.data) {
    return (v2.data as any[]).map(normalizePurposeV2)
  }

  // Fallback to v1 (no flags) – we’ll fill flags as false
  const v1 = await supabase
    .rpc('get_purposes_by_document_type', { p_document_type_id: documentTypeId })
  if (v1.error) throw v1.error

  return (v1.data as any[]).map((r) => normalizePurposeV1toV2(r as PurposeV1))
}

function normalizePurposeV2(row: any): PurposeWithFeeFlags {
  return {
    document_purpose_id: Number(row.document_purpose_id),
    request_document_type_id: Number(row.request_document_type_id),
    purpose_code: String(row.purpose_code),
    purpose_label: String(row.purpose_label),
    fee_item_id: Number(row.fee_item_id),
    fee_code: String(row.fee_code ?? ''),
    current_amount: Number(row.current_amount ?? 0),
    max_amount: row.max_amount == null ? null : Number(row.max_amount),
    default_details: row.default_details ?? {},
    default_offense_no: row.default_offense_no == null ? null : Number(row.default_offense_no),
    exempt_ftj: !!row.exempt_ftj,
    exempt_senior: !!row.exempt_senior,
    exempt_pwd: !!row.exempt_pwd,
    exempt_indigent: !!row.exempt_indigent,
    exempt_student: !!row.exempt_student,
  }
}

function normalizePurposeV1toV2(row: PurposeV1): PurposeWithFeeFlags {
  return {
    document_purpose_id: Number(row.document_purpose_id),
    request_document_type_id: -1, // not returned by v1
    purpose_code: row.purpose_code,
    purpose_label: row.purpose_label,
    fee_item_id: -1, // not returned by v1
    fee_code: row.fee_code,
    current_amount: Number(row.current_amount ?? 0),
    max_amount: row.max_amount == null ? null : Number(row.max_amount),
    default_details: row.default_details ?? {},
    default_offense_no: row.default_offense_no == null ? null : Number(row.default_offense_no),
    exempt_ftj: false,
    exempt_senior: false,
    exempt_pwd: false,
    exempt_indigent: false,
    exempt_student: false,
  }
}

export async function getBusinessesOwnedByPerson(person_id: number): Promise<BusinessLite[]> {
  const { data, error } = await supabase.rpc('get_businesses_owned_by_person', { p_person_id: person_id })
  if (error) throw error
  return (data ?? []) as BusinessLite[]
}

/* ========= Create request ========= */

type CreateInput = {
  requested_by: number
  on_behalf_of?: number | null
  is_on_behalf: boolean
  business_id?: number | null
  purpose_notes?: string | null
  lines: Array<{
    document_purpose_id?: number
    fee_code?: string
    quantity?: number
    offense_no?: number | null
    details?: any
  }>
}

/** Calls Postgres function public.create_document_request(...) and returns the new doc_request_id */
export async function createDocumentRequest(input: CreateInput): Promise<number> {
  const { data, error } = await supabase.rpc('create_document_request', {
    p_requested_by: input.requested_by,
    p_on_behalf_of: input.on_behalf_of ?? null,
    p_is_on_behalf: input.is_on_behalf,
    p_business_id: input.business_id ?? null,
    p_purpose_notes: input.purpose_notes ?? null,
    p_lines: input.lines as any,
  })
  if (error) throw error
  return Number(data)
}

/** Attach an authorization letter to a request (writes into request_document) */
export async function attachAuthorizationLetter(opts: {
  doc_request_id: number
  file_path: string
  reason?: string
}): Promise<void> {
  const { doc_request_id, file_path, reason } = opts
  const { error } = await supabase.rpc('attach_authorization_letter', {
    p_doc_request_id: doc_request_id,
    p_file_path: file_path,
    p_reason: reason ?? 'Letter of authorization (on-behalf).',
  })
  if (error) throw error
}

/* ========= Waiver preview helpers ========= */

/**
 * Ask Postgres how much should be waived PER UNIT for this person & fee item.
 * (Uses your compute_exemption_amount(p_person_id, p_fee_item_id, p_details))
 */
export async function computeExemptionAmount(
  personId: number,
  feeItemId: number,
  details: any = {}
): Promise<number> {
  const { data, error } = await supabase.rpc('compute_exemption_amount', {
    p_person_id: personId,
    p_fee_item_id: feeItemId,
    p_details: details,
  })
  if (error) throw error
  return Number(data ?? 0)
}

/** Utility: compute a pretty preview text and final totals for a selected purpose. */
export async function previewTotalsForPerson(opts: {
  personId: number
  purpose: PurposeWithFeeFlags
  quantity: number
  details?: any
}): Promise<{
  unit_amount: number
  exempt_unit: number
  net_unit: number
  quantity: number
  total_due: number
  label: string // e.g., "₱0.00 (waived – senior)" or "₱80 × 1"
}> {
  const unit_amount = Number(opts.purpose.current_amount || 0)
  const exempt_unit = opts.purpose.fee_item_id > 0
    ? await computeExemptionAmount(opts.personId, opts.purpose.fee_item_id, opts.details ?? {})
    : 0
  const net_unit = Math.max(0, unit_amount - Number(exempt_unit || 0))
  const total_due = net_unit * Math.max(1, Number(opts.quantity || 1))

  // quick human label
  const label =
    net_unit === 0
      ? `₱0.00 (waived)`
      : `₱${net_unit.toLocaleString()} × ${Math.max(1, Number(opts.quantity || 1))}`

  return { unit_amount, exempt_unit, net_unit, quantity: Math.max(1, Number(opts.quantity || 1)), total_due, label }
}

/* ========= Formatting ========= */

export const peso = (n: number | null | undefined) => `₱${Number(n || 0).toLocaleString()}`

/* ========= Lists & detail views (unchanged) ========= */

export type DocRequestDetailRow = {
  doc_request_id: number
  request_code: string
  created_at: string | Date
  status: string
  requested_by_id: number
  requested_by: string
  on_behalf_id: number | null
  on_behalf_of: string | null
  purpose_notes?: string | null
  amount_due: number
}

export type DocLineLite = {
  doc_request_id: number
  document_type_name: string | null
  purpose_code: string | null
}

export type DocRequestListItem = DocRequestDetailRow & { doc_types: string[] }

type ListOptions = { status?: string; search?: string; limit?: number; offset?: number }

export async function fetchMyDocRequests(personId: number, opts: ListOptions = {}): Promise<DocRequestListItem[]> {
  const { status, search, limit = 50, offset = 0 } = opts

  // headers
  let q = supabase
    .from('v_doc_request_detail')
    .select('*')
    .eq('requested_by_id', personId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) q = q.eq('status', status)
  if (search && search.trim()) {
    const s = `%${search.trim()}%`
    q = q.or(`request_code.ilike.${s},on_behalf_of.ilike.${s}`)
  }

  const { data: headers, error } = await q
  if (error) throw error
  const hdrs = (headers ?? []) as DocRequestDetailRow[]
  if (!hdrs.length) return []

  const ids = hdrs.map(h => h.doc_request_id)

  // detail lines → gather document types per request
  const { data: lines, error: lineErr } = await supabase
    .from('v_doc_request_detail_lines')
    .select('doc_request_id, document_type_name, purpose_code')
    .in('doc_request_id', ids)

  if (lineErr) throw lineErr
  const mapTypes = new Map<number, Set<string>>()
  for (const ln of (lines ?? []) as DocLineLite[]) {
    const key = Number(ln.doc_request_id)
    if (!mapTypes.has(key)) mapTypes.set(key, new Set())
    if (ln.document_type_name) mapTypes.get(key)!.add(ln.document_type_name)
  }

  return hdrs.map(h => ({ ...h, doc_types: Array.from(mapTypes.get(h.doc_request_id) ?? []) }))
}

/* ========= Payments ========= */

export type DocRequestLineDetail = {
  doc_request_line_id: number
  doc_request_id: number
  fee_code: string
  fee_name: string
  document_type_name: string | null
  purpose_code: string | null
  quantity: number
  base_amount: number
  waived_amount: number
  surcharge_amount: number
  line_total: number
  details: any
}

export type DocRequestPaymentSummary = {
  doc_request_id: number
  or_count: number
  total_paid: number
  latest_or_number: string | null
  latest_or_time: string | Date | null
}

export type TimelineEvent = {
  common_log_id: number
  occurred_at: string | Date
  action: string
  table_affected: string
  record_affected_id: number
  details: any
  user_type_name: 'STAFF' | 'RESIDENT' | 'SYSTEM' | string
  performer_id: number
  staff_name: string | null
  resident_name: string | null
}

export async function fetchDocRequestDetailBundle(docRequestId: number): Promise<{
  header: DocRequestDetailRow
  lines: DocRequestLineDetail[]
  payments: DocRequestPaymentSummary | null
  timeline: TimelineEvent[]
}> {
  const { data: hdr, error: he } = await supabase
    .from('v_doc_request_detail')
    .select('*')
    .eq('doc_request_id', docRequestId)
    .maybeSingle()
  if (he) throw he
  if (!hdr) throw new Error('Request not found')

  const { data: lines, error: le } = await supabase
    .from('v_doc_request_detail_lines')
    .select('*')
    .eq('doc_request_id', docRequestId)
    .order('doc_request_line_id', { ascending: true })
  if (le) throw le

  const { data: pay, error: pe } = await supabase
    .from('v_doc_request_payments')
    .select('*')
    .eq('doc_request_id', docRequestId)
    .maybeSingle()
  if (pe) throw pe

  const t1 = await supabase
    .from('v_document_timeline')
    .select('*')
    .eq('table_affected', 'doc_request_hdr')
    .eq('record_affected_id', docRequestId)
  
  if (t1.error) throw t1.error

  // Try to get related events via JSON operator, but don't fail if details has invalid JSON
  let t2Data: any[] = []
  try {
    const t2 = await supabase
      .from('v_document_timeline')
      .select('*')
      .eq('details->>doc_request_id', String(docRequestId))
    if (!t2.error && t2.data) {
      t2Data = t2.data
    }
  } catch (e) {
    console.warn('[fetchDocRequestDetailBundle] Failed to query timeline with JSON operator:', e)
  }

  const tl = [...(t1.data ?? []), ...t2Data] as TimelineEvent[]
  tl.sort((a, b) => new Date(b.occurred_at as any).getTime() - new Date(a.occurred_at as any).getTime())

  return {
    header: hdr as DocRequestDetailRow,
    lines: (lines ?? []) as DocRequestLineDetail[],
    payments: (pay ?? null) as DocRequestPaymentSummary | null,
    timeline: tl,
  }
}

export async function getPaymentMethodMap(): Promise<Record<number, string>> {
  try {
    const { data, error } = await supabase.from('payment_method').select('payment_method_id, method_name')
    if (error) throw error
    const map: Record<number, string> = {}
    for (const r of data ?? []) map[(r as any).payment_method_id] = (r as any).method_name
    return map
  } catch {
    return {}
  }
}

export async function getResidentFullProfile(personId: number) {
  const { data, error } = await supabase.rpc('get_specific_resident_full_profile', {
    p_person_id: personId,
  })
  if (error) throw error
  // This RPC returns an array; take the first row
  return (Array.isArray(data) ? data[0] : data) || null
}


// ────────────────────────────────────────────────────────────
// Business Clearance helpers (add to services/documentRequest.ts)
// ────────────────────────────────────────────────────────────

/** Map doc status → UI mode */
export type ClearanceStatus = 'NONE' | 'REQUESTED' | 'ISSUED' | 'REJECTED' | 'CANCELLED'
export type ClearanceMode = 'NORMAL' | 'CTC' | 'BLOCKED'

export function resolveClearanceMode(status: ClearanceStatus): ClearanceMode {
  // ISSUED  → only CTC allowed
  // REQUESTED → block new requests until the current one finishes
  if (status === 'ISSUED') return 'CTC'
  if (status === 'REQUESTED') return 'BLOCKED'
  return 'NORMAL'
}

/** Minimal header (used by receipts / references) */
export async function getDocRequestHeaderLite(docRequestId: number): Promise<{
  doc_request_id: number
  request_code: string | null
  status: string
  created_at: string | Date
  released_at?: string | Date | null
}> {
  // Prefer a view if you have it; otherwise fallback is still safe
  const { data, error } = await supabase
    .from('v_doc_request_detail')
    .select('*')
    .eq('doc_request_id', docRequestId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Request not found')

  return {
    doc_request_id: Number((data as any).doc_request_id),
    request_code: (data as any).request_code ?? null,
    status: String((data as any).status || ''),
    created_at: (data as any).created_at,
    released_at: (data as any).released_at ?? (data as any).issued_on ?? null,
  }
}

/**
 * Is there an *effective* (still-valid) Business Clearance on a given date?
 * Tries RPC `check_business_clearance_effective_on(p_business_id, p_when)`.
 * Fallback returns { has:false } so the UI continues to work during demos.
 */
export async function checkBusinessClearanceEffectiveOn(
  businessId: number,
  when: Date | string,
  validMonths?: number | null
): Promise<{ has: boolean; reference_request_id?: number | null; request_code?: string | null; issued_on?: string | null }> {
  try {
    const { data, error } = await supabase.rpc('check_business_clearance_effective_on', {
      p_business_id: businessId,
      // 👇 use the correct argument name expected by your SQL function
      p_at: typeof when === 'string' ? when : when.toISOString(),
      // optional: pass-through if you want to override default “until next Jan 1”
      p_valid_months: validMonths ?? null,
    })
    if (error) throw error
    const row = (Array.isArray(data) ? data[0] : data) || null
    if (!row) return { has: false }
    return {
      has: !!row.has,
      reference_request_id: row.reference_request_id ?? null,
      request_code: row.request_code ?? null,
      issued_on: row.issued_on ?? null,
    }
  } catch (e) {
    // keep your graceful fallback
    return { has: false }
  }
}


/**
 * Do we already have a request for this business for the given year?
 * Expects RPC `check_business_clearance_for_year(p_business_id, p_year)`.
 * Returns a normalized status; safe fallback is 'NONE'.
 */
export async function checkBusinessClearanceForYear(
  businessId: number,
  year: number
): Promise<{ status: ClearanceStatus; doc_request_id?: number | null; request_code?: string | null }> {
  try {
    const { data, error } = await supabase.rpc('check_business_clearance_for_year', {
      p_business_id: businessId,
      p_year: year,
    })
    if (error) throw error
    const row = (Array.isArray(data) ? data[0] : data) || null
    if (!row) return { status: 'NONE' }
    const status = String(row.status || 'NONE').toUpperCase() as ClearanceStatus
    return {
      status: (['NONE','REQUESTED','ISSUED','REJECTED','CANCELLED'].includes(status) ? status : 'NONE'),
      doc_request_id: row.doc_request_id ?? null,
      request_code: row.request_code ?? null,
    }
  } catch {
    return { status: 'NONE' }
  }
}
