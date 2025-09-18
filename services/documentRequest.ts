import { supabase } from '@/constants/supabase'

export type DocType = { document_type_id: number; document_type_name: string }
export type Purpose = {
  document_purpose_id: number
  purpose_code: string
  purpose_label: string
  fee_code: string
  current_amount: number
  max_amount: number | null
  default_details: any
  default_offense_no: number | null
}
export type BusinessLite = { business_id: number; business_name: string }

export async function getDocumentTypes(): Promise<DocType[]> {
  const { data, error } = await supabase.rpc('get_document_types')
  if (error) throw error
  return (data ?? []) as DocType[]
}

export async function getPurposesByDocumentType(document_type_id: number): Promise<Purpose[]> {
  const { data, error } = await supabase.rpc('get_purposes_by_document_type', {
    p_document_type_id: document_type_id,
  })
  if (error) throw error
  return (data ?? []) as Purpose[]
}

export async function getBusinessesOwnedByPerson(person_id: number): Promise<BusinessLite[]> {
  const { data, error } = await supabase.rpc('get_businesses_owned_by_person', { p_person_id: person_id })
  if (error) throw error
  return (data ?? []) as BusinessLite[]
}

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

export const peso = (n: number | null | undefined) => `₱${Number(n || 0).toLocaleString()}`

// --- Types for list UI ---
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

export type DocRequestListItem = DocRequestDetailRow & {
  doc_types: string[]
}

type ListOptions = {
  status?: string
  search?: string
  limit?: number
  offset?: number
}

/** Fetch the resident's requests and aggregate document types per request */
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

  // merge
  const merged: DocRequestListItem[] = hdrs.map(h => ({
    ...h,
    doc_types: Array.from(mapTypes.get(h.doc_request_id) ?? []),
  }))

  return merged
}

// --- Detail view types ---
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

/** Fetches header, lines, payments, and timeline for a single request */
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

  const [t1, t2] = await Promise.all([
    supabase
      .from('v_document_timeline')
      .select('*')
      .eq('table_affected', 'doc_request_hdr')
      .eq('record_affected_id', docRequestId),
    supabase
      .from('v_document_timeline')
      .select('*')
      .eq('details->>doc_request_id', String(docRequestId)),
  ])
  if (t1.error) throw t1.error
  if (t2.error) throw t2.error

  const tl = [...(t1.data ?? []), ...(t2.data ?? [])] as TimelineEvent[]
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
