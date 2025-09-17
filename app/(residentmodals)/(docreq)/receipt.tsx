import React, { useEffect, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedPill from '@/components/ThemedPill'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'

import { fetchDocRequestDetailBundle, peso, type DocRequestLineDetail } from '@/services/documentRequest'

const STATUS_UI: Record<string, { bg: string; fg: string; label: string }> = {
    FOR_TREASURER_REVIEW: { bg: '#fde68a', fg: '#92400e', label: 'For Treasurer Review' },
    PAID: { bg: '#dbeafe', fg: '#1e40af', label: 'Paid' },
    FOR_PRINTING: { bg: '#e0e7ff', fg: '#3730a3', label: 'For Printing' },
    RELEASED: { bg: '#d1fae5', fg: '#065f46', label: 'Released' },
    DECLINED: { bg: '#fecaca', fg: '#7f1d1d', label: 'Declined' },
}

export default function Receipt() {
    const router = useRouter()
    const { id } = useLocalSearchParams<{ id?: string }>()
    const reqId = Number(id)

    const [loading, setLoading] = useState(true)
    const [code, setCode] = useState<string>('')
    const [createdAt, setCreatedAt] = useState<string>('')
    const [status, setStatus] = useState<string>('FOR_TREASURER_REVIEW')
    const [amountDue, setAmountDue] = useState<number>(0)
    const [lines, setLines] = useState<DocRequestLineDetail[]>([])
    const [orCount, setOrCount] = useState<number>(0)
    const [latestOrNo, setLatestOrNo] = useState<string | null>(null)
    const [latestOrTime, setLatestOrTime] = useState<string | null>(null)

    useEffect(() => {
        let live = true
            ; (async () => {
                try {
                    setLoading(true)
                    const { header, lines, payments } = await fetchDocRequestDetailBundle(reqId)
                    if (!live) return
                    setCode(header.request_code)
                    setCreatedAt(header.created_at)
                    setStatus(header.status)
                    setAmountDue(Number(header.amount_due || 0))
                    setLines(lines)
                    setOrCount(payments?.length || 0)
                    setLatestOrNo(payments?.[0]?.or_number || null)
                    setLatestOrTime(payments?.[0]?.created_at || null)
                } finally {
                    if (live) setLoading(false)
                }
            })()
        return () => { live = false }
    }, [reqId])

    const ui = STATUS_UI[status] ?? { bg: '#e5e7eb', fg: '#374151', label: status }
    const docTitle = useMemo(() => {
        const parts = Array.from(new Set(lines.map(l =>
            `${l.document_type_name || 'Document'}${l.purpose_code ? ` – ${titleCase(l.purpose_code)}` : ''}`
        )))
        return parts.join(', ')
    }, [lines])

    return (
        <ThemedView safe>
            <ThemedAppBar title="Receipt" showNotif={false} showProfile={false} />

            <View style={styles.hero}>
                <View style={styles.badge}><Ionicons name="checkmark" size={28} color="#fff" /></View>
                <ThemedText style={styles.heroTitle}>Request Submitted</ThemedText>
                <ThemedText style={styles.heroSub}>We’ll notify you of updates.</ThemedText>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                <Spacer />

                <ThemedCard>
                    <View style={styles.headerRow}>
                        <ThemedText style={styles.headerText}>Request #</ThemedText>
                        <ThemedText style={styles.headerText}>{code || '—'}</ThemedText>
                    </View>

                    <Spacer height={10} />
                    <ThemedDivider />
                    <Spacer height={10} />

                    <KV label="Document" value={docTitle || '—'} />
                    <KV label="Date Requested" value={formatPh(createdAt)} />
                    <KV label="Processing Fee" value={peso(amountDue)} strong />
                    <View style={styles.kvRow}>
                        <ThemedText style={styles.kvLabel}>Status</ThemedText>
                        <ThemedPill label={ui.label} size="sm" bgColor={ui.bg} textColor={ui.fg} />
                    </View>

                    {!!orCount && (
                        <>
                            <Spacer height={10} />
                            <ThemedDivider />
                            <Spacer height={10} />
                            <KV label="OR Count" value={String(orCount)} />
                            <KV label="Latest OR No." value={latestOrNo || '—'} />
                            <KV label="Latest OR Time" value={formatPh(latestOrTime)} />
                        </>
                    )}
                </ThemedCard>

                <Spacer />

                {/* ITEMS */}
                <ThemedCard>
                    <View style={styles.cardHeaderRow}>
                        <ThemedText style={styles.cardTitle}>Items</ThemedText>
                        <ThemedText small muted>
                            {lines.length} {lines.length === 1 ? 'item' : 'items'}
                        </ThemedText>
                    </View>

                    <Spacer height={6} />

                    {lines.length === 0 ? (
                        <ThemedText muted>No items.</ThemedText>
                    ) : (
                        lines.map(l => <ItemRow key={l.doc_request_line_id} line={l} />)
                    )}

                    {Boolean(lines.length) && (
                        <>
                            <Spacer height={8} />
                            <ThemedDivider />
                            <Spacer height={8} />
                            <TotalsBlock lines={lines} />
                        </>
                    )}
                </ThemedCard>

                <Spacer />

                <ThemedCard>
                    <ThemedText style={styles.cardTitle}>Next steps</ThemedText>
                    <Spacer height={8} />
                    <Step text="Keep your Request # for pickup." />
                    <Step text="Bring valid ID upon claiming." />
                    <Step text="You’ll get a notification if payment or printing is required." />
                </ThemedCard>

                <Spacer height={15} />

                <View style={styles.actionsRow}>
                    <ThemedButton style={{ flex: 1 }} onPress={() => router.push({ pathname: '/(residentmodals)/docreqdetail', params: { id: String(reqId) } })}>
                        <ThemedText btn>View Request Details</ThemedText>
                    </ThemedButton>
                    <ThemedButton submit={false} style={{ flex: 1 }} onPress={() => router.replace('/(resident)/(tabs)/docreqhistory')}>
                        <ThemedText non_btn>Back to History</ThemedText>
                    </ThemedButton>
                </View>
            </ScrollView>
        </ThemedView>
    )
}

/* helpers */
function KV({ label, value, strong }: { label: string; value?: string | number | null; strong?: boolean }) {
    return (
        <View style={styles.kvRow}>
            <ThemedText style={styles.kvLabel}>{label}</ThemedText>
            <ThemedText style={[styles.kvValue, strong && styles.emphasis]}>{value ?? '—'}</ThemedText>
        </View>
    )
}
const Step = ({ text }: { text: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4 }}>
        <Ionicons name="checkmark-circle-outline" size={18} color="#065f46" />
        <ThemedText style={{ marginLeft: 8 }}>{text}</ThemedText>
    </View>
)
function titleCase(s?: string | null) {
    if (!s) return ''
    return s.toLowerCase().replace(/_/g, ' ').replace(/(^|\s)\S/g, c => c.toUpperCase())
}
function formatPh(d?: string | Date | null) {
    if (!d) return '—'
    const dt = typeof d === 'string' ? new Date(d) : d
    if (typeof d === 'string' && isNaN(dt.getTime())) return d
    return dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function ItemRow({ line }: { line: DocRequestLineDetail }) {
  const waived = Number(line.waived_amount || 0)
  const surcharge = Number(line.surcharge_amount || 0)

  return (
    <View style={styles.itemCard}>
      <View style={{ flex: 1 }}>
        <ThemedText weight="700">{line.fee_name}</ThemedText>
        <ThemedText small muted>
          {line.document_type_name || '—'}
          {line.purpose_code ? ` • ${titleCase(line.purpose_code)}` : ''}
        </ThemedText>

        <View style={styles.tagRow}>
          <ThemedPill size="sm" label={`Qty ${line.quantity}`} bgColor="#e0f2fe" textColor="#075985" />
          <ThemedPill size="sm" label={`Base ${peso(line.base_amount)}`} bgColor="#f3f4f6" textColor="#374151" />
          {waived > 0 && (
            <ThemedPill size="sm" label={`Waived -${peso(waived)}`} bgColor="#dcfce7" textColor="#166534" />
          )}
          {surcharge > 0 && (
            <ThemedPill size="sm" label={`Surcharge +${peso(surcharge)}`} bgColor="#fef3c7" textColor="#92400e" />
          )}
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', minWidth: 96 }}>
        <ThemedText weight="800" style={styles.money}>
          {peso(line.line_total)}
        </ThemedText>
        <ThemedText small muted>Line Total</ThemedText>
      </View>
    </View>
  )
}

function TotalsBlock({ lines }: { lines: DocRequestLineDetail[] }) {
  const totals = lines.reduce(
    (acc, l) => {
      acc.base += Number(l.base_amount || 0)
      acc.waived += Number(l.waived_amount || 0)
      acc.surcharge += Number(l.surcharge_amount || 0)
      acc.total += Number(l.line_total || 0)
      return acc
    },
    { base: 0, waived: 0, surcharge: 0, total: 0 }
  )

  return (
    <View>
      <KV label="Subtotal" value={peso(totals.base)} />
      {totals.waived > 0 && <KV label="Total Waived" value={`- ${peso(totals.waived)}`} />}
      {totals.surcharge > 0 && <KV label="Total Surcharge" value={`+ ${peso(totals.surcharge)}`} />}
      <KV label="Grand Total" value={peso(totals.total)} strong />
    </View>
  )
}



/* styles */
const styles = StyleSheet.create({
    hero: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18, alignItems: 'center', backgroundColor: '#310101' },
    badge: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
    heroSub: { color: '#f3e8e8', fontSize: 12, textAlign: 'center', marginTop: 4 },

    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerText: { fontSize: 16, fontWeight: '700' },

    cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },

    kvRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 6 },
    kvLabel: { fontSize: 13, color: '#6b7280', flexShrink: 1, paddingRight: 8 },
    kvValue: { fontSize: 14, color: '#111827', fontWeight: '600', textAlign: 'right', flexShrink: 1 },
    emphasis: { fontWeight: '800' },

    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: 1, borderColor: '#f3f4f6' },

    actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 12 },
    itemCard: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingVertical: 10,
  paddingHorizontal: 10,
  borderWidth: 1,
  borderColor: '#f1f5f9',
  borderRadius: 12,
  backgroundColor: '#ffffff',
  marginTop: 8,
  shadowColor: '#000',
  shadowOpacity: 0.03,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 1 },
  elevation: 1,
},
tagRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 8,
},
money: {
  fontSize: 16,
  // use tabular numerals when available to align digits
  // @ts-ignore RN web/Android may ignore; iOS will honor
  fontVariant: ['tabular-nums'],
},
cardHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},

})
