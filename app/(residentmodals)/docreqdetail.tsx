import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'

import {
  fetchDocRequestDetailBundle,
  getPaymentMethodMap,
  type DocRequestDetailRow,
  type DocRequestLineDetail,
  type DocRequestPaymentSummary,
  type TimelineEvent,
} from '@/services/documentRequest'

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  FOR_TREASURER_REVIEW: { label: 'For Review', bg: '#fde68a', fg: '#92400e' },
  PAID:                 { label: 'Paid',                 bg: '#dbeafe', fg: '#1e40af' },
  FOR_PRINTING:         { label: 'For Printing',         bg: '#e0e7ff', fg: '#3730a3' },
  RELEASED:             { label: 'Released',             bg: '#d1fae5', fg: '#065f46' },
  DECLINED:             { label: 'Declined',             bg: '#fecaca', fg: '#7f1d1d' },
}

// Icon & tint per timeline action
const ACTION_META: Record<
  string,
  { icon: string; tint: string; title?: (d?: any) => string }
> = {
  REQUEST_CREATED:   { icon: 'document-text', tint: '#310101', title: () => 'Request Created' },
  REQUEST_ADDED_BY:  { icon: 'document-text', tint: '#310101', title: () => 'Request Added By' },
  LINE_ADDED:        { icon: 'add-circle',     tint: '#310101', title: () => 'Line Added' },
  PAYMENT_ACCEPTED:  { icon: 'cash',           tint: '#310101', title: () => 'Payment Accepted' },
  STATUS_CHANGED:    { icon: 'flag',           tint: '#310101', title: (d) => `Status Changed` },
  OR_ISSUED:         { icon: 'receipt',        tint: '#310101', title: () => 'OR Issued' },
}

export default function DocRequestDetail() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const docId = Number(id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hdr, setHdr] = useState<DocRequestDetailRow | null>(null)
  const [lines, setLines] = useState<DocRequestLineDetail[]>([])
  const [pay, setPay] = useState<DocRequestPaymentSummary | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [payMethodMap, setPayMethodMap] = useState<Record<number, string>>({})

  const load = async () => {
    if (!docId) return
    setLoading(true)
    setError(null)
    try {
      const [bundle, pm] = await Promise.all([
        fetchDocRequestDetailBundle(docId),
        getPaymentMethodMap().catch(() => ({})), // optional
      ])
      setHdr(bundle.header)
      setLines(bundle.lines)
      setPay(bundle.payments)
      setTimeline(bundle.timeline)
      setPayMethodMap(pm)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [docId])

  const statusUI = useMemo(
    () => (hdr ? (STATUS_STYLE[hdr.status] ?? { label: hdr.status, bg: '#e5e7eb', fg: '#374151' }) : null),
    [hdr]
  )

  const amountDue = Number(hdr?.amount_due ?? 0)
  const totalPaid = Number(pay?.total_paid ?? 0)
  
  // Check if there's a status change to PAID in timeline
  const hasStatusChangedToPaid = timeline.some(ev => {
    if (ev.action === 'STATUS_CHANGED') {
      const d = parseDetails(ev.details)
      return String(d?.to_status || '').toUpperCase() === 'PAID'
    }
    return false
  })
  
  const adjustedTotalPaid = hasStatusChangedToPaid ? amountDue : totalPaid
  const balance = hasStatusChangedToPaid ? 0 : Math.max(0, amountDue - totalPaid)

  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar title="Request Details" showBack onPressBack={() => router.back()} />

      {loading ? (
        <Center>
          <ActivityIndicator />
          <ThemedText muted style={{ marginTop: 6 }}>Loading…</ThemedText>
        </Center>
      ) : error ? (
        <Center>
          <ThemedText style={{ color: '#7f1d1d' }}>{error}</ThemedText>
          <Spacer height={10} />
          <ThemedButton onPress={load}><ThemedText btn>Retry</ThemedText></ThemedButton>
        </Center>
      ) : !hdr ? (
        <Center>
          <ThemedText muted>Request not found.</ThemedText>
        </Center>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroGradient}>
              <View style={styles.heroContent}>
                <View style={styles.heroHeader}>
                  <View style={styles.requestBadge}>
                    <ThemedText style={styles.requestLabel}>REQUEST</ThemedText>
                  </View>
                  {statusUI && (
                    <StatusChip label={statusUI.label} bg={statusUI.bg} fg={statusUI.fg} />
                  )}
                </View>
                <ThemedText style={styles.heroTitle}>#{hdr.request_code}</ThemedText>
                <ThemedText style={styles.heroSubtitle}>{formatPh(hdr.created_at)}</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.contentContainer}>
            {/* Quick Info */}
            <View style={styles.quickInfoGrid}>
              <QuickInfoCard icon="person" label="Requested by" value={hdr.requested_by} />
              {hdr.on_behalf_of && (
                <QuickInfoCard icon="people" label="On behalf of" value={hdr.on_behalf_of} />
              )}
            </View>

            {/* Amount Cards */}
            <View style={styles.amountSection}>
              <View style={styles.amountGrid}>
                <AmountCard label="Amount Due" value={peso(amountDue)} color="#dc2626" icon="card" />
                <AmountCard label="Total Paid" value={peso(adjustedTotalPaid)} color="#059669" icon="checkmark-circle" />
                <AmountCard label="Balance" value={peso(balance)} color="#d97706" icon="wallet" strong />
              </View>
            </View>

            {/* Items */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconBg}>
                  <ThemedIcon name="document-text" size={18} iconColor="#310101" />
                </View>
                <ThemedText style={styles.sectionTitle}>Document Items</ThemedText>
              </View>
              {lines.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText muted>No line items found.</ThemedText>
                </View>
              ) : (
                <View style={styles.itemsList}>
                  {lines.map((l, index) => (
                    <View key={l.doc_request_line_id} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <ThemedText style={styles.itemTitle}>{l.fee_name}</ThemedText>
                        <ThemedText style={styles.itemTotal}>{peso(l.line_total)}</ThemedText>
                      </View>
                      <ThemedText style={styles.itemSubtitle}>
                        {l.document_type_name || '—'} {l.purpose_code ? `• ${titleCase(l.purpose_code)}` : ''}
                      </ThemedText>
                      <View style={styles.chipRow}>
                        <Chip label={`Qty: ${l.quantity}`} color="#3b82f6" />
                        <Chip label={`Base: ${peso(l.base_amount)}`} color="#6b7280" />
                        {Number(l.waived_amount) > 0 && <Chip label={`Waived: ${peso(l.waived_amount)}`} color="#059669" />}
                        {Number(l.surcharge_amount) > 0 && <Chip label={`Surcharge: ${peso(l.surcharge_amount)}`} color="#dc2626" />}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Payments */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <ThemedIcon name="card" size={18} iconColor="#059669" />
                </View>
                <ThemedText style={styles.sectionTitle}>Payment History</ThemedText>
              </View>
              {!pay || Number(pay.or_count || 0) === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText muted>No payments recorded yet.</ThemedText>
                </View>
              ) : (
                <View style={styles.paymentGrid}>
                  <PaymentInfoCard label="OR Count" value={String(pay.or_count)} />
                  <PaymentInfoCard label="Total Paid" value={peso(pay.total_paid)} />
                  {pay.latest_or_number && <PaymentInfoCard label="Latest OR No." value={pay.latest_or_number} />}
                  {pay.latest_or_time && <PaymentInfoCard label="Latest OR Time" value={formatPh(pay.latest_or_time)} />}
                </View>
              )}
            </View>

            {/* Timeline */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBg, { backgroundColor: '#f3e8ff' }]}>
                  <ThemedIcon name="time" size={18} iconColor="#7c3aed" />
                </View>
                <ThemedText style={styles.sectionTitle}>Activity Timeline</ThemedText>
              </View>
              {timeline.length === 0 ? (
                <View style={styles.emptyState}>
                  <ThemedText muted>No activity recorded yet.</ThemedText>
                </View>
              ) : (
                <View style={styles.timelineList}>
                  {timeline
                    .filter(ev => {
                      // Filter out unwanted payment session events
                      const action = ev.action?.toLowerCase() || ''
                      return !(
                        action.includes('payment_session_paid') ||
                        action.includes('payment_initiated') ||
                        action.includes('checkout_session_created')
                      )
                    })
                    .map((ev, index, filteredArray) => {
                      const meta = ACTION_META[ev.action] ?? { icon: 'information-circle', tint: '#475569' }
                      const d = parseDetails(ev.details)
                      return (
                        <View key={String(ev.common_log_id)} style={styles.timelineItem}>
                          <View style={styles.timelineIconContainer}>
                            <View style={[styles.timelineIcon, { backgroundColor: '#31010115' }]}>
                              <ThemedIcon name={meta.icon as any} size={18} iconColor={meta.tint} />
                            </View>
                            {index < filteredArray.length - 1 && <View style={styles.timelineLine} />}
                          </View>
                          <View style={styles.timelineContent}>
                            <ThemedText style={styles.timelineTitle}>
                              {(meta.title?.(d)) || humanizeAction(ev.action)}
                            </ThemedText>
                            <ThemedText style={styles.timelineSubtitle}>
                              {formatPh(ev.occurred_at)} • {ev.staff_name || ev.resident_name || ev.user_type_name}
                            </ThemedText>
                            <View style={styles.timelineDetails}>
                              {renderEventDetails(ev.action, d, payMethodMap)}
                            </View>
                          </View>
                        </View>
                      )
                    })}
                </View>
              )}
            </View>
          </View>

          <Spacer height={40} />
        </ScrollView>
      )}
    </ThemedView>
  )
}

/* ---------- Small presentational helpers ---------- */

function Center({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>
}

function StatusChip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <View style={[styles.statusChip, { backgroundColor: bg }]}>
      <ThemedText style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{label}</ThemedText>
    </View>
  )
}

function QuickInfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.quickInfoCard}>
      <View style={styles.quickInfoIcon}>
        <ThemedIcon name={icon as any} size={16} iconColor="#6b7280" />
      </View>
      <View style={styles.quickInfoContent}>
        <ThemedText style={styles.quickInfoLabel}>{label}</ThemedText>
        <ThemedText style={styles.quickInfoValue}>{value}</ThemedText>
      </View>
    </View>
  )
}

function PaymentInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.paymentInfoCard}>
      <ThemedText style={styles.paymentInfoLabel}>{label}</ThemedText>
      <ThemedText style={styles.paymentInfoValue}>{value}</ThemedText>
    </View>
  )
}

function AmountCard({ label, value, strong, color, icon }: { label: string; value: string; strong?: boolean; color?: string; icon?: string }) {
  return (
    <View style={[styles.amountCard, strong && styles.amountCardStrong]}>
      {icon && (
        <View style={[styles.amountIcon, { backgroundColor: `${color}15` }]}>
          <ThemedIcon name={icon as any} size={16} iconColor={color || '#6b7280'} />
        </View>
      )}
      <ThemedText small muted style={styles.amountLabel}>{label}</ThemedText>
      <ThemedText weight={strong ? '800' : '700'} style={[styles.amountValue, strong && { color }]}>{value}</ThemedText>
    </View>
  )
}



function LabelRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>
}

function Chip({ label, color = '#6b7280' }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
      <ThemedText style={{ color, fontSize: 12, fontWeight: '600' }}>{label}</ThemedText>
    </View>
  )
}

/* ---------- Timeline detail rendering ---------- */

function renderEventDetails(
  action: string,
  d: any,
  pm: Record<number, string>
) {
  switch (action) {
    case 'REQUEST_CREATED': {
      const subject = d?.on_behalf_of
        ? `On behalf of #${d.on_behalf_of}`
        : 'Self'
      const channelRaw = d?.channel ? String(d.channel).toUpperCase() : null
      const channel = channelRaw === 'WALKIN' ? 'Walk-in' : channelRaw
      
      return (
        <>
          <LabelRow>
            <Chip label={subject} />
            {d?.business_id ? <Chip label={`Business #${d.business_id}`} /> : null}
            {channel ? <Chip label={channel} color="#059669" /> : null}
          </LabelRow>
          {d?.purpose_notes ? (
            <ThemedText small muted style={{ marginTop: 4 }}>Notes: {d.purpose_notes}</ThemedText>
          ) : null}
        </>
      )
    }
    case 'REQUEST_ADDED_BY': {
      const channelRaw = d?.channel ? String(d.channel).toUpperCase() : null
      const channel = channelRaw === 'WALKIN' ? 'Walk-in' : channelRaw
      return channel ? <Chip label={channel} color="#059669" /> : null
    }
    case 'LINE_ADDED': {
      return (
        <LabelRow>
          {d?.qty != null && <Chip label={`Qty: ${d.qty}`} />}
          {d?.offense_no != null && <Chip label={`Offense: ${d.offense_no}`} />}
          {d?.line_total != null && <Chip label={`Line Total: ${peso(d.line_total)}`} />}
        </LabelRow>
      )
    }
    case 'PAYMENT_ACCEPTED': {
      const method = pm[Number(d?.payment_method_id)] || (d?.payment_method_id ? `Method #${d.payment_method_id}` : 'Method: —')
      return (
        <>
          <LabelRow>
            {d?.or_number && <Chip label={`OR: ${d.or_number}`} />}
            <Chip label={method} />
            {d?.amount_paid != null && <Chip label={`Paid: ${peso(d.amount_paid)}`} />}
            {d?.change_due != null && <Chip label={`Change: ${peso(d.change_due)}`} />}
          </LabelRow>
        </>
      )
    }
    case 'STATUS_CHANGED': {
      const to = String(d?.to_status || '').toUpperCase()
      const s = STATUS_STYLE[to]
      if (s) return <StatusChip label={s.label} bg={s.bg} fg={s.fg} />
      return <Chip label={`To: ${to || '—'}`} />
    }
    case 'OR_ISSUED': {
      return d?.or_number ? <Chip label={d.or_number} color="#059669" /> : null
    }
    default: {
      return null
    }
  }
}

/* ---------- Pure utilities ---------- */

function parseDetails(details: any) {
  if (!details) return {}
  if (typeof details === 'object') return details
  try { return JSON.parse(details) } catch { return {} }
}

function humanizeAction(a?: string | null) {
  if (!a) return 'Event'
  return a.replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase())
}

function titleCase(s?: string | null) {
  if (!s) return ''
  return s.toLowerCase().replace(/_/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase())
}

function formatPh(d: string | Date | null | undefined) {
  if (!d) return '—'
  const dt = typeof d === 'string' ? new Date(d) : d
  if (typeof d === 'string' && isNaN(dt.getTime())) return d
  return dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function peso(n: number | string | null | undefined) {
  const v = Number(n || 0)
  return `₱${v.toLocaleString()}`
}

function safeJsonSnippet(d: any): string | null {
  if (!d || typeof d !== 'object') return null
  try {
    const str = JSON.stringify(d)
    return str.length > 100 ? str.substring(0, 100) + '...' : str
  } catch {
    return null
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  
  // Hero section
  heroSection: {
    marginTop: -16,
    marginHorizontal: -16,
  },
  heroGradient: {
    backgroundColor: '#310101',
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  requestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  requestLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  
  // Content container
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  
  // Quick info
  quickInfoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickInfoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickInfoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  
  // Amount section
  amountSection: {},
  amountGrid: { flexDirection: 'row', gap: 12 },
  amountCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amountCardStrong: {
    backgroundColor: '#fef7f0',
    borderWidth: 2,
    borderColor: '#fed7aa',
  },
  amountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  amountValue: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  
  // Section styles
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef7f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  
  // Items
  itemsList: {
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  itemTotal: {
    fontSize: 18,
    color: '#310101',
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  // Payment info
  paymentGrid: {
    gap: 12,
  },
  paymentInfoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  paymentInfoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  paymentInfoValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  
  // Timeline
  timelineList: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIconContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    left: '50%',
    marginLeft: -1,
    width: 2,
    height: 16,
    backgroundColor: '#e5e7eb',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
  },
  timelineTitle: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '700',
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  timelineDetails: {
    marginTop: 4,
  },
})
