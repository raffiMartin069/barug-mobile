// app/(docreq)/requestdetails/[id].tsx
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

// ---- Status colors (matching your palette) ----
const STATUS_UI: Record<
  'pending' | 'ready' | 'completed' | 'declined',
  { label: string; bg: string; fg: string }
> = {
  pending:   { label: 'Pending',   bg: '#fde68a', fg: '#92400e' }, // amber
  ready:     { label: 'Ready',     bg: '#d1fae5', fg: '#065f46' }, // green
  completed: { label: 'Completed', bg: '#e5e7eb', fg: '#374151' }, // gray
  declined:  { label: 'Declined',  bg: '#fecaca', fg: '#7f1d1d' }, // red
}

type AppStatus = keyof typeof STATUS_UI
type DocType =
  | 'brgy_clearance_adult'
  | 'brgy_clearance_minor'
  | 'cert_death'
  | 'cert_indigency_adult'
  | 'cert_indigency_minor'
  | 'cert_lowincome_adult'
  | 'cert_lowincome_minor'
  | 'cert_residency_adult'
  | 'cert_residency_minor'

type RequestDetailsDTO = {
  id: string
  doc_type: DocType
  title: string
  request_no: string
  fee: string
  status: AppStatus
  requested_at: string
  expected_pickup: string
  // common optional fields
  full_name?: string
  age?: number | string
  civil_status?: string
  nationality?: string
  address?: string
  purpose?: string
  residency_period?: string
  guardian_name?: string
  guardian_rel?: string
  monthly_income?: string
  // death-specific
  deceased_full_name?: string
  age_at_death?: number | string
  date_of_death?: string
  place_of_death?: string
}

// ---- STATIC DATA (sample) ----
const STATIC_REQUESTS: Record<string, RequestDetailsDTO> = {
  '1': {
    id: '1',
    doc_type: 'brgy_clearance_adult',
    title: 'Barangay Clearance',
    request_no: 'REQ-BCLR-20250602-001',
    fee: '₱100.00',
    status: 'pending',
    requested_at: 'June 15, 2023 · 10:30 AM',
    expected_pickup: 'June 18, 2023',
    full_name: 'JUAN DELA CRUZ',
    age: 22,
    civil_status: 'SINGLE',
    address: 'PUROK 2, STO. NIÑO',
    purpose: 'JOB REQUIREMENT',
  },
  '2': {
    id: '2',
    doc_type: 'cert_residency_minor',
    title: 'Certificate of Residency',
    request_no: 'REQ-RES-20250603-002',
    fee: '₱50.00',
    status: 'ready',
    requested_at: 'June 20, 2023 · 9:10 AM',
    expected_pickup: 'June 21, 2023',
    full_name: 'MARIA SANTOS',
    age: 15,
    nationality: 'FILIPINO',
    residency_period: '3 YEARS',
    address: 'PUROK 5, STO. NIÑO',
    guardian_name: 'ANA SANTOS',
    guardian_rel: 'MOTHER',
    purpose: 'SCHOOL REQUIREMENT',
  },
  '3': {
    id: '3',
    doc_type: 'cert_lowincome_adult',
    title: 'Certificate of Low Income',
    request_no: 'REQ-LINC-20250603-003',
    fee: '₱50.00',
    status: 'completed',
    requested_at: 'June 10, 2023 · 1:45 PM',
    expected_pickup: 'June 12, 2023',
    full_name: 'PEDRO REYES',
    age: 34,
    civil_status: 'MARRIED',
    nationality: 'FILIPINO',
    monthly_income: '₱6,500',
    purpose: 'FINANCIAL ASSISTANCE',
    address: 'PUROK 1, STO. NIÑO',
  },
  '4': {
    id: '4',
    doc_type: 'cert_death',
    title: 'Barangay Death Certificate',
    request_no: 'REQ-DC-20250607-004',
    fee: '₱100.00',
    status: 'ready',
    requested_at: 'June 22, 2023 · 2:00 PM',
    expected_pickup: 'June 24, 2023',
    deceased_full_name: 'LOLA M. CRUZ',
    age_at_death: 78,
    nationality: 'FILIPINO',
    date_of_death: 'June 18, 2023',
    place_of_death: 'Sto. Niño Health Center',
    purpose: 'INSURANCE CLAIM',
  },
}

// ---------- Details Renderer ----------
type DetailSpec =
  | { label: string; key: keyof RequestDetailsDTO }
  | { label: string; format: (d: RequestDetailsDTO) => string | number | undefined }

const DETAILS_BY_DOC: Record<DocType, DetailSpec[]> = {
  // Barangay Clearance (18+)
  brgy_clearance_adult: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Civil Status', key: 'civil_status' },
    { label: 'Home Address', key: 'address' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Barangay Clearance (Minor)
  brgy_clearance_minor: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Home Address', key: 'address' },
    { label: 'Parent / Guardian', key: 'guardian_name' },
    { label: 'Relationship to Guardian', key: 'guardian_rel' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Certificate of Residency (18+)
  cert_residency_adult: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Civil Status', key: 'civil_status' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Residency Period', key: 'residency_period' },
    { label: 'Home Address', key: 'address' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Certificate of Residency (Minor)
  cert_residency_minor: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Residency Period', key: 'residency_period' },
    { label: 'Home Address', key: 'address' },
    { label: 'Parent / Guardian', key: 'guardian_name' },
    { label: 'Relationship to Guardian', key: 'guardian_rel' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Certificate of Indigency (18+)
  cert_indigency_adult: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Certificate of Indigency (Minor)
  cert_indigency_minor: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Parent / Guardian', key: 'guardian_name' },
    { label: 'Relationship to Guardian', key: 'guardian_rel' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Certificate of Low Income (18+)
  cert_lowincome_adult: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Civil Status', key: 'civil_status' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Monthly Income', key: 'monthly_income' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Certificate of Low Income (Minor)
  cert_lowincome_minor: [
    { label: 'Full Name', key: 'full_name' },
    { label: 'Age', key: 'age' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Monthly Income', key: 'monthly_income' },
    { label: 'Parent / Guardian', key: 'guardian_name' },
    { label: 'Relationship to Guardian', key: 'guardian_rel' },
    { label: 'Purpose', key: 'purpose' },
  ],
  // Barangay Death Certificate
  cert_death: [
    { label: 'Full Name of Deceased', key: 'deceased_full_name' },
    { label: 'Age at time of death', key: 'age_at_death' },
    { label: 'Nationality', key: 'nationality' },
    { label: 'Date of Death', key: 'date_of_death' },
    { label: 'Place of Death', key: 'place_of_death' },
    { label: 'Purpose', key: 'purpose' },
  ],
}

const toText = (v: any) => (v === undefined || v === null || v === '' ? '—' : String(v))

const DetailRow = ({ label, value }: { label: string; value?: string | number }) => (
  <View style={styles.detailRow}>
    <ThemedText style={styles.detailLabel}>{label}</ThemedText>
    <ThemedText style={styles.detailValue}>{toText(value)}</ThemedText>
  </View>
)

const StatusPill = ({ status }: { status: AppStatus }) => {
  const ui = STATUS_UI[status] ?? STATUS_UI.pending
  return (
    <View style={[styles.pill, { backgroundColor: ui.bg }]}>
      <ThemedText style={[styles.pillText, { color: ui.fg }]}>{ui.label}</ThemedText>
    </View>
  )
}

export default function RequestDetailsScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const data = id ? STATIC_REQUESTS[String(id)] : null
  const detailSpecs = useMemo(
    () => (data ? DETAILS_BY_DOC[data.doc_type] : []),
    [data?.doc_type]
  )

  return (
    <ThemedView safe style={styles.screen}>
      <ThemedAppBar title="Request Details" showBack onBackPress={() => router.back()} showNotif={false} showProfile={false} />

      {!id && (
        <View style={styles.center}>
          <ThemedText>No request id provided.</ThemedText>
        </View>
      )}

      {id && !data && (
        <View style={styles.center}>
          <ThemedText>Request not found (id: {String(id)}).</ThemedText>
          <ThemedText style={styles.smallMuted}>
            Try /requestdetails/1, /requestdetails/2, /requestdetails/3, or /requestdetails/4
          </ThemedText>
        </View>
      )}

      {id && data && (
        <View style={styles.body}>
          <ThemedCard style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.titleText}>{data.title}</ThemedText>

                <ThemedText style={styles.smallMuted}>
                  Request #:
                  <ThemedText style={styles.smallDefault}> {data.request_no}</ThemedText>
                </ThemedText>

                <ThemedText style={styles.smallMuted}>
                  Processing Fee:
                  <ThemedText style={styles.smallDefault}> {data.fee}</ThemedText>
                </ThemedText>
              </View>
              <StatusPill status={data.status} />
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {/* Dates */}
            <View style={styles.metaRow}>
              <View style={styles.metaCol}>
                <ThemedText style={styles.metaLabel}>Date & Time Requested:</ThemedText>
                <ThemedText style={styles.metaValue}>{data.requested_at}</ThemedText>
              </View>
              <View style={styles.metaCol}>
                <ThemedText style={styles.metaLabel}>Expected Pickup Date:</ThemedText>
                <ThemedText style={styles.metaValue}>{data.expected_pickup}</ThemedText>
              </View>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {/* Details */}
            <ThemedText style={styles.detailsTitle}>Details</ThemedText>
            <View style={styles.detailsBox}>
              {detailSpecs.length === 0 ? (
                <ThemedText>—</ThemedText>
              ) : (
                detailSpecs.map((spec, i) => {
                  const value =
                    'key' in spec
                      ? (data as any)[spec.key]
                      : spec.format?.(data)
                  return <DetailRow key={`${data.id}-${i}`} label={spec.label} value={value} />
                })
              )}
            </View>
          </ThemedCard>
        </View>
      )}
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'flex-start' },
  body: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },

  card: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },

  // local text styles (applied via `style` prop on ThemedText)
  titleText: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  smallMuted: { fontSize: 14, opacity: 0.75, marginTop: 2 },
  smallDefault: { fontSize: 14, opacity: 1 },
  metaLabel: { fontSize: 14, opacity: 0.75, marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '600' },
  detailsTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },

  // layout
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  metaCol: { flex: 1 },

  // status pill
  pill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '600' },

  // details box + rows
  detailsBox: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, gap: 8 },
  detailRow: { marginBottom: 6 },
  detailLabel: { fontSize: 12, opacity: 0.7, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600' },
})
