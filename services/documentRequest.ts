import { supabase } from '@/constants/supabase'

/* ========= Lookups ========= */

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

  // Fallback to v1 (no flags) – fill flags as false
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

/** Utility: compute preview text and totals for a selected purpose. */
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
  label: string
}> {
  const unit_amount = Number(opts.purpose.current_amount || 0)
  const exempt_unit = opts.purpose.fee_item_id > 0
    ? await computeExemptionAmount(opts.personId, opts.purpose.fee_item_id, opts.details ?? {})
    : 0
  const net_unit = Math.max(0, unit_amount - Number(exempt_unit || 0))
  const total_due = net_unit * Math.max(1, Number(opts.quantity || 1))
  const label = net_unit === 0
    ? `₱0.00 (waived)`
    : `₱${net_unit.toLocaleString()} × ${Math.max(1, Number(opts.quantity || 1))}`
  return { unit_amount, exempt_unit, net_unit, quantity: Math.max(1, Number(opts.quantity || 1)), total_due, label }
}

/* ========= Lists & detail ========= */

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

/* ========= Business clearance gating ========= */

export type YearClearanceStatus =
  | 'NONE'
  | 'REQUESTED'
  | 'ISSUED'
  | 'REJECTED'
  | 'CANCELLED'

/** Your existing year check (keep for in-progress detection) */
export async function checkBusinessClearanceForYear(
  businessId: number,
  year: number
): Promise<{ status: YearClearanceStatus; doc_request_id?: number | null; last_status_id?: number | null; last_changed_at?: string | null }> {
  const { data, error } = await supabase.rpc('check_business_clearance_for_year', {
    p_business_id: businessId,
    p_year: year,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    status: (row?.status ?? 'NONE') as YearClearanceStatus,
    doc_request_id: row?.doc_request_id ?? null,
    last_status_id: row?.last_status_id ?? null,
    last_changed_at: row?.last_changed_at ?? null,
  }
}

/** NEW: date-based validity check (handles cross-year) */
export async function checkBusinessClearanceEffectiveOn(
  businessId: number,
  at: Date = new Date()
): Promise<{
  has: boolean
  reference_request_id: number | null
  request_code: string | null
  issued_on: string | null
  valid_until: string | null
  basis_year: number | null
}> {
  const { data, error } = await supabase.rpc('check_business_clearance_effective_on', {
    p_business_id: businessId,
    p_at: at.toISOString(),
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    has: !!row?.has,
    reference_request_id: row?.reference_request_id ?? null,
    request_code: row?.request_code ?? null,
    issued_on: row?.issued_on ?? null,
    valid_until: row?.valid_until ?? null,
    basis_year: row?.basis_year ?? null,
  }
}

/** Map backend status to UI mode */
export type ClearanceUIMode = 'BC' | 'CTC' | 'BLOCKED'
export function resolveClearanceMode(s: YearClearanceStatus): ClearanceUIMode {
  if (s === 'ISSUED') return 'CTC'
  if (s === 'REQUESTED') return 'BLOCKED'
  return 'BC'
}

/** Light header to show request_code & release time in CTC reference box */
export async function getDocRequestHeaderLite(docRequestId: number): Promise<{ request_code: string | null; released_at: string | null }> {
  const { data, error } = await supabase
    .from('v_doc_request_detail')
    .select('request_code, released_at')
    .eq('doc_request_id', docRequestId)
    .maybeSingle()
  if (error) throw error
  return { request_code: data?.request_code ?? null, released_at: data?.released_at ?? null }
}

/* ========= Formatting ========= */

export const peso = (n: number | null | undefined) => `₱${Number(n || 0).toLocaleString()}`
