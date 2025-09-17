import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'

import {
  fetchDocRequestDetailBundle,
  type DocRequestDetailRow,
  type DocRequestLineDetail,
  type DocRequestPaymentSummary,
  type TimelineEvent,
  getPaymentMethodMap, // ⬅️ new tiny helper (see services section)
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
  REQUEST_CREATED: { icon: 'document-text', tint: '#1e293b', title: () => 'Request Created' },
  LINE_ADDED:      { icon: 'add-circle',     tint: '#0e7490', title: () => 'Line Added' },
  PAYMENT_ACCEPTED:{ icon: 'cash',           tint: '#065f46', title: () => 'Payment Accepted' },
  STATUS_CHANGED:  { icon: 'flag',           tint: '#7c3aed', title: (d) => `Status Changed` },
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
  const balance = Math.max(0, amountDue - totalPaid)

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
        <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
          <Spacer />

          {/* Header */}
          <ThemedCard>
            <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.code}>#{hdr.request_code}</ThemedText>
                <ThemedText small muted>Created:                               {formatPh(hdr.created_at)}</ThemedText>
                <ThemedText small muted>Requested by:         {hdr.requested_by}</ThemedText>
                {hdr.on_behalf_of ? (
                  <ThemedText small muted>On behalf of: {hdr.on_behalf_of}</ThemedText>
                ) : null}
                {hdr.purpose_notes ? (
                  <ThemedText small muted>Notes: {hdr.purpose_notes}</ThemedText>
                ) : null}
              </View>

              {statusUI && (
                <StatusChip label={statusUI.label} bg={statusUI.bg} fg={statusUI.fg} />
              )}
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            <View style={styles.amountRow}>
              <AmountCard label="Amount Due" value={peso(amountDue)} />
              <AmountCard label="Total Paid" value={peso(totalPaid)} />
              <AmountCard label="Balance" value={peso(balance)} strong />
            </View>
          </ThemedCard>

          <Spacer height={14} />

          {/* Items */}
          <ThemedCard>
            <ThemedText style={styles.sectionTitle}>Items</ThemedText>
            <Spacer height={8} />
            {lines.length === 0 ? (
              <ThemedText muted>No line items.</ThemedText>
            ) : (
              lines.map(l => (
                <View key={l.doc_request_line_id} style={styles.lineWrap}>
                  <View style={{ flex: 1 }}>
                    <ThemedText weight="700">{l.fee_name}</ThemedText>
                    <ThemedText small muted>
                      {l.document_type_name || '—'} {l.purpose_code ? `• ${titleCase(l.purpose_code)}` : ''}
                    </ThemedText>
                    <LabelRow>
                      <Chip label={`Qty: ${l.quantity}`} />
                      <Chip label={`Base: ${peso(l.base_amount)}`} />
                      <Chip label={`Waived: ${peso(l.waived_amount)}`} />
                      <Chip label={`Surcharge: ${peso(l.surcharge_amount)}`} />
                    </LabelRow>
                  </View>
                  <ThemedText weight="800">{peso(l.line_total)}</ThemedText>
                </View>
              ))
            )}
          </ThemedCard>

          <Spacer height={14} />

          {/* Payments */}
          <ThemedCard>
            <ThemedText style={styles.sectionTitle}>Payments</ThemedText>
            <Spacer height={8} />
            {!pay || Number(pay.or_count || 0) === 0 ? (
              <ThemedText muted>No payments yet.</ThemedText>
            ) : (
              <>
                <Row label="OR Count" value={String(pay.or_count)} />
                <Row label="Total Paid" value={peso(pay.total_paid)} />
                {pay.latest_or_number ? <Row label="Latest OR No." value={pay.latest_or_number} /> : null}
                {pay.latest_or_time ? <Row label="Latest OR Time" value={formatPh(pay.latest_or_time)} /> : null}
              </>
            )}
          </ThemedCard>

          <Spacer height={14} />

          {/* Timeline */}
          <ThemedCard>
            <ThemedText style={styles.sectionTitle}>Timeline</ThemedText>
            <Spacer height={8} />

            {timeline.length === 0 ? (
              <ThemedText muted>No activity yet.</ThemedText>
            ) : (
              timeline.map(ev => {
                const meta = ACTION_META[ev.action] ?? { icon: 'information-circle', tint: '#475569' }
                const d = parseDetails(ev.details)
                return (
                  <View key={String(ev.common_log_id)} style={styles.timelineRow}>
                    <ThemedIcon
                      name={meta.icon as any}
                      size={20}
                      bgColor={'#f3f4f6'}
                      iconColor={meta.tint}
                      containerSize={44}
                      shape="circle"
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText weight="700">
                        {(meta.title?.(d)) || humanizeAction(ev.action)}
                      </ThemedText>
                      <ThemedText small muted>
                        {formatPh(ev.occurred_at)} • {ev.staff_name || ev.resident_name || ev.user_type_name}
                      </ThemedText>
                      <Spacer height={6} />
                      {renderEventDetails(ev.action, d, payMethodMap)}
                    </View>
                  </View>
                )
              })
            )}
          </ThemedCard>

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
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <ThemedText small weight="700" style={{ color: fg }}>{label}</ThemedText>
    </View>
  )
}

function AmountCard({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.amountCard}>
      <ThemedText small muted>{label}</ThemedText>
      <ThemedText weight={strong ? '800' : '700'}>{value}</ThemedText>
    </View>
  )
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={styles.row}>
      <ThemedText muted style={{ width: 130 }}>{label}</ThemedText>
      <ThemedText style={{ flex: 1 }}>{value ?? '—'}</ThemedText>
    </View>
  )
}

function LabelRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>{children}</View>
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.kvChip}>
      <ThemedText small weight="700" style={{ color: '#334155' }}>{label}</ThemedText>
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
      return (
        <>
          <LabelRow>
            <Chip label={subject} />
            {d?.business_id ? <Chip label={`Business #${d.business_id}`} /> : null}
          </LabelRow>
          {d?.purpose_notes ? (
            <ThemedText small muted style={{ marginTop: 4 }}>Notes: {d.purpose_notes}</ThemedText>
          ) : null}
        </>
      )
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
    default: {
      // Fallback compact preview (no long raw JSON)
      const text = safeJsonSnippet(d)
      return text ? <ThemedText small muted>{text}</ThemedText> : null
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  code: { fontSize: 18, fontWeight: '800' },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  amountRow: { flexDirection: 'row', gap: 10 },
  amountCard: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fafafa',
  },
  lineWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f1f5f9'
  },
  timelineRow: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  kvChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc'
  },
})
