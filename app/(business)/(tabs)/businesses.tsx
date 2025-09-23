import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedBottomSheet from '@/components/ThemedBottomSheet'
import ThemedCard from '@/components/ThemedCard'
import ThemedChip from '@/components/ThemedChip'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

// ─────────────────────────── types ───────────────────────────
type Business = {
  id: string
  name: string
  category: string
  ownershipType: string
  status: 'Active' | 'Inactive' | 'Suspended'
  dues?: number
  expiringSoon?: boolean
  address: string
  monthlyGross?: string
  monthlyGrossLive?: boolean
  nextRenewal?: string
  renewalRequired?: boolean
  complianceOk?: boolean

  // details sheet fields
  businessType?: string            // e.g., Micro Enterprise
  natureOfBusiness?: string        // e.g., Retail — General Merchandise
  description?: string
  dateEstablished?: string         // ISO or display string
  capitalInvested?: number
  dtiSecRegNo?: string
  prevYearGrossSales?: number
  operatingDays?: string[]         // e.g., ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  operatingHours?: string          // e.g., 08:00 — 20:00
  numEmployees?: number
  prevBarangayClearance?: boolean
  proofFileName?: string
  proofFileUrl?: string
}

// ─────────────────────────── helpers ─────────────────────────
const formatPeso = (n?: number) =>
  typeof n === 'number'
    ? `₱ ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '—'

const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

// ─────────────────────────── mock data ───────────────────────
const MOCK_BUSINESSES: Business[] = [
  {
    id: 'BIZ-001',
    name: 'Mauco Auto Repair Shop',
    category: 'Services',
    ownershipType: 'Partnership',
    status: 'Active',
    expiringSoon: true,
    address: 'Brgy. Pampango, Poblacion, Tandag City',
    monthlyGross: '₱120,000',
    monthlyGrossLive: true,
    nextRenewal: 'Dec 5, 2025',
    renewalRequired: true,
    complianceOk: true,

    businessType: 'Micro Enterprise',
    natureOfBusiness: 'Services — Auto Repair',
    description: 'Full-service automobile repair and maintenance.',
    dateEstablished: '2018-03-10',
    capitalInvested: 80000,
    dtiSecRegNo: 'DTI-1234567890',
    prevYearGrossSales: 350000,
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    operatingHours: '08:00 — 20:00',
    numEmployees: 5,
    prevBarangayClearance: true,
    proofFileName: 'receipt_clearance_2024.jpg',
    proofFileUrl: '#',
  },
  {
    id: 'BIZ-002',
    name: 'Sari Sari ni Maria',
    category: 'Trading',
    ownershipType: 'Sole Proprietorship',
    status: 'Active',
    address: 'Purok 3, Kanipaan, Tandag City',
    monthlyGross: '₱35,000',
    monthlyGrossLive: true,
    nextRenewal: 'Aug 10, 2025',
    renewalRequired: false,
    complianceOk: true,

    businessType: 'Micro Enterprise',
    natureOfBusiness: 'Retail — Sari-Sari Store',
    description: 'Convenience retail of daily household items, snacks, and mobile load.',
    dateEstablished: '2018-03-10',
    capitalInvested: 80000,
    dtiSecRegNo: 'DTI-1234567890',
    prevYearGrossSales: 350000,
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    operatingHours: '08:00 — 20:00',
    numEmployees: 2,
    prevBarangayClearance: true,
    proofFileName: 'receipt_clearance_2024.jpg',
    proofFileUrl: '#',
  },
  {
    id: 'BIZ-003',
    name: 'Pandesal Corner',
    category: 'F&B',
    ownershipType: 'Partnership',
    status: 'Inactive',
    address: 'Lutaw-Lutaw, Tandag City',
    monthlyGross: '₱60,000',
    monthlyGrossLive: false,
    nextRenewal: '—',
    renewalRequired: false,
    complianceOk: false,

    businessType: 'Micro Enterprise',
    natureOfBusiness: 'Food & Beverage — Bakery',
    description: 'Freshly baked bread and pastries daily.',
    dateEstablished: '2020-01-15',
    capitalInvested: 120000,
    dtiSecRegNo: 'DTI-00997731',
    prevYearGrossSales: 410000,
    operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    operatingHours: '05:00 — 18:00',
    numEmployees: 4,
    prevBarangayClearance: false,
    proofFileName: 'biz_permit_2024.pdf',
    proofFileUrl: '#',
  },
]

// ─────────────────────────── screen ──────────────────────────
const Businesses = () => {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const [selected, setSelected] = useState<Business | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const filtered = useMemo(() => {
    return MOCK_BUSINESSES.filter((b) => {
      const q = search.trim().toLowerCase()
      const matchesQ =
        q === '' ||
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      const matchesStatus =
        !statusFilter || statusFilter === 'All' || b.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesQ && matchesStatus
    })
  }, [search, statusFilter])

  const openDetails = (biz: Business) => {
    setSelected(biz)
    setDetailsOpen(true)
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar title="Businesses" />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <Spacer height={10} />

        {filtered.map((biz) => (
          <View key={biz.id} style={{ paddingHorizontal: 24, marginTop: 8 }}>
            <Pressable onPress={() => openDetails(biz)}>
              <ThemedCard>
                {/* Header */}
                <View style={styles.headerRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.businessName}>{biz.name}</ThemedText>
                    <ThemedText style={styles.subline}>
                      {biz.category} • {biz.ownershipType}
                    </ThemedText>
                  </View>

                  <View style={styles.headerActions}>
                    <StatusChip status={biz.status} />
                    {biz.expiringSoon && <ThemedChip label="Expiring soon" />}
                  </View>
                </View>

                {/* Address */}
                <View style={styles.addrRow}>
                  <Ionicons name="location-outline" size={16} color="#475569" />
                  <ThemedText style={styles.addrText}>{biz.address}</ThemedText>
                </View>

                {/* Metrics */}
                <View style={styles.metricsRow}>
                  <MetricTile
                    icon="cash-outline"
                    label="Monthly Gross"
                    pill={biz.monthlyGrossLive ? 'Live' : undefined}
                    value={biz.monthlyGross || '—'}
                  />
                  <MetricTile
                    icon="calendar-outline"
                    label="Next Renewal"
                    pill={biz.renewalRequired ? 'Required' : undefined}
                    value={biz.nextRenewal || '—'}
                  />
                </View>

                {/* Footer chips */}
                <View style={styles.footerChips}>
                  <ThemedChip
                    label={biz.complianceOk ? 'Compliance up to date' : 'Compliance issues'}
                    filled={false}
                  />
                  <ThemedChip
                    label="Check renewal"
                    filled={false}
                    onPress={() => openDetails(biz)}
                  />
                </View>
              </ThemedCard>
            </Pressable>

            <Spacer height={20} />
          </View>
        ))}
      </ScrollView>

      {/* ───────── Business Details Bottom Sheet ───────── */}
      <ThemedBottomSheet visible={detailsOpen} onClose={() => setDetailsOpen(false)} heightPercent={0.75}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <ThemedText subtitle>Business Details</ThemedText>
          <Spacer height={8} />

          {/* 2-column KV grid like the image */}
          <View style={styles.kvGrid}>
            {/* Row 1 */}
            <KV label="Business Name" value={selected?.name} bold />
            <KV label="Business Type" value={selected?.businessType} bold />

            {/* Row 2 */}
            <KV label="Nature of Business" value={selected?.natureOfBusiness} />
            <KV label="Ownership Type" value={selected?.ownershipType} />

            {/* Row 3 */}
            <KV label="Business Address" value={selected?.address} colSpan={2} />

            {/* Row 4 */}
            <KV label="Description" value={selected?.description} colSpan={2} />

            {/* Row 5 */}
            <KV label="Date Established" value={selected?.dateEstablished} />
            <KV label="DTI/SEC Registration No." value={selected?.dtiSecRegNo} />

            {/* Row 6 */}
            <KV label="Capital Invested" value={formatPeso(selected?.capitalInvested)} />
            <KV label="Previous Year Gross Sales" value={formatPeso(selected?.prevYearGrossSales)} />

            {/* Row 7: Operating days + hours */}
            <View style={[styles.kvCol, styles.col]}>
              <ThemedText style={styles.kvKey}>Operating Days</ThemedText>
              <View style={styles.daysRow}>
                {DAY_KEYS.map((d) => {
                  const active = selected?.operatingDays?.includes(d)
                  return (
                    <View key={d} style={[styles.dayPill, active ? styles.dayPillActive : styles.dayPillMuted]}>
                      <ThemedText style={[styles.dayText, active ? styles.dayTextActive : styles.dayTextMuted]}>
                        {d}
                      </ThemedText>
                    </View>
                  )
                })}
              </View>
            </View>

            <KV label="Operating Hours" value={selected?.operatingHours} />

            {/* Row 8 */}
            <KV label="No. of Employees" value={String(selected?.numEmployees ?? '—')} />
            <KV
              label="Previous Barangay Clearance"
              value={selected?.prevBarangayClearance ? 'Yes' : 'No'}
            />

            {/* Row 9: Proof of Business */}
            <View style={[styles.kvCol, styles.col, { marginTop: 6 }]} >
              <ThemedText style={styles.kvKey}>Proof of Business</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ThemedText style={[styles.kvVal, { flexShrink: 1 }]}>
                  {selected?.proofFileName || '—'}
                </ThemedText>
                {!!selected?.proofFileUrl && (
                  <Pressable onPress={() => {/* open viewer / WebBrowser.openBrowserAsync(selected.proofFileUrl) */}}>
                    <ThemedText style={{ fontWeight: '700' }}>View</ThemedText>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedBottomSheet>
    </ThemedView>
  )
}

export default Businesses

// ─────────────────────────── sub-components ───────────────────
const StatusChip = ({ status }: { status: Business['status'] }) => {
  const color =
    status === 'Active' ? '#16a34a' :
    status === 'Suspended' ? '#b45309' :
    '#6b7280'
  return (
    <View style={[styles.statusPill, { borderColor: `${color}33`, backgroundColor: `${color}1A` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText style={[styles.statusText, { color }]}>{status}</ThemedText>
    </View>
  )
}

const MetricTile = ({
  icon,
  label,
  pill,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  pill?: string
  value: string
}) => {
  return (
    <View style={styles.metricTile}>
      <View style={styles.metricHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name={icon} size={16} color="#475569" />
          <ThemedText style={styles.metricLabel}>{label}</ThemedText>
        </View>
        {!!pill && (
          <View style={styles.metricPill}>
            <ThemedText style={styles.metricPillText}>{pill}</ThemedText>
          </View>
        )}
      </View>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
    </View>
  )
}

// ─────────────────────────── styles ───────────────────────────
const styles = StyleSheet.create({
  headerRow: { flexDirection: 'column', gap: 6 },
  businessName: { fontWeight: '700' },
  subline: { color: '#6b7280' },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 6 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 6 },
  addrText: { color: '#475569' },

  metricsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  metricTile: { flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { marginLeft: 8, color: '#475569' },
  metricPill: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#F8FAFC' },
  metricPillText: { fontSize: 12, color: '#334155' },
  metricValue: { marginTop: 6, fontWeight: '700' },

  footerChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },

  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  dot: { width: 8, height: 8, borderRadius: 999, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Details sheet grid
  kvGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 18,
    rowGap: 10,
  },
  col: { width: '48%' },
  kvCol: {},
  kvKey: { color: '#64748b', marginBottom: 2 },
  kvVal: { fontWeight: '700', color: '#0f172a' },

  // operating days
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  dayPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  dayPillActive: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  dayPillMuted: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  dayText: { fontSize: 12 },
  dayTextActive: { color: '#111827', fontWeight: '600' },
  dayTextMuted: { color: '#9CA3AF' },
})

// simple KV cell component (handles colSpan + bold)
function KV({
  label,
  value,
  bold,
  colSpan = 1,
}: {
  label: string
  value?: string
  bold?: boolean
  colSpan?: 1 | 2
}) {
  const style = [styles.kvVal, bold ? { fontWeight: '800' } : null]
  if (colSpan === 2) {
    return (
      <View style={[styles.kvCol, { width: '100%' }]}>
        <ThemedText style={styles.kvKey}>{label}</ThemedText>
        <ThemedText style={style}>{value ?? '—'}</ThemedText>
      </View>
    )
  }
  return (
    <View style={[styles.kvCol, styles.col]}>
      <ThemedText style={styles.kvKey}>{label}</ThemedText>
      <ThemedText style={style}>{value ?? '—'}</ThemedText>
    </View>
  )
}
