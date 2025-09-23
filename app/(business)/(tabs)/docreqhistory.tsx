// (business)/(tabs)/docreqhistory.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons' // ← use known-good icons

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'

import { useAccountRole } from '@/store/useAccountRole'
import {
  fetchMyDocRequests,
  type DocRequestListItem,
} from '@/services/documentRequest'

/* ───────── config ───────── */
const TAG = '[DocReqHistory]'
const BRAND = '#310101'
const SURFACE = '#ffffff'
const BORDER = '#e7e7e7'
const MUTED = '#6b7280'
const OK = { bg: '#d1fae5', fg: '#065f46' }

const BUSINESS_DOC_NAME = 'BARANGAY BUSINESS CLEARANCE'
const NEW_REQ_ROUTE = '/(businessmodals)/bussiness_doc_req'

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  FOR_TREASURER_REVIEW: { label: 'For Treasurer Review', bg: '#fde68a', fg: '#92400e' },
  PAID:                 { label: 'Paid',                 bg: '#dbeafe', fg: '#1e40af' },
  FOR_PRINTING:         { label: 'For Printing',         bg: '#e0e7ff', fg: '#3730a3' },
  RELEASED:             { label: 'Released',             bg: OK.bg,    fg: OK.fg     },
  DECLINED:             { label: 'Declined',             bg: '#fecaca', fg: '#7f1d1d' },
}

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'FOR_TREASURER_REVIEW', label: 'Treasurer' },
  { key: 'PAID', label: 'Paid' },
  { key: 'FOR_PRINTING', label: 'Printing' },
  { key: 'RELEASED', label: 'Released' },
] as const

/* ───────── helpers ───────── */
function log(...args: any[]) { console.log(TAG, ...args) }
function formatPh(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime())
    ? String(d)
    : dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}
function formatPhDateOnly(d: Date) {
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
function isBusinessDoc(i: DocRequestListItem) {
  const names = (i.doc_types || []).map(s => String(s).toUpperCase().trim())
  return names.some(n =>
    n === BUSINESS_DOC_NAME || n.includes('BUSINESS CLEARANCE') || n.includes('BARANGAY BUSINESS')
  )
}
function addOneYear(d: Date) { const c = new Date(d); c.setFullYear(c.getFullYear() + 1); return c }
function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)) }
function getExpiryInfo(createdAt: string | Date) {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  if (isNaN(created.getTime())) return { expiry: null, daysLeft: null, label: 'Unknown expiry', progress: 0 }
  const expiry = addOneYear(created)
  const now = new Date()
  const total = 365
  const daysGone = Math.floor((now.getTime() - created.getTime()) / 86400000)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000)
  const label = daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago`
    : daysLeft === 0 ? 'Expires today'
    : `Expires in ${daysLeft}d`
  return { expiry, daysLeft, label, progress: clamp((daysGone / total) * 100, 0, 100) }
}
function mostRecentBusinessRequest(items: DocRequestListItem[]) {
  const onlyBiz = items.filter(isBusinessDoc)
  if (!onlyBiz.length) return null
  return onlyBiz.reduce((a, b) =>
    new Date(b.created_at).getTime() > new Date(a.created_at).getTime() ? b : a
  )
}

/* ───────── screen ───────── */
export default function DocReqHistory() {
  const router = useRouter()

  // who am I
  const roleStore = useAccountRole()
  const role = roleStore.currentRole ?? 'resident'
  const cached = roleStore.getProfile(role)
  const cachedId = Number(cached?.person_id ?? cached?.details?.person_id ?? 0)

  const [meId, setMeId] = useState<number>(cachedId)
  const [search, setSearch] = useState('')
  const [selectedFilter, setSelectedFilter] =
    useState<(typeof FILTERS)[number]['key']>('ALL')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // list shown under the filter
  const [items, setItems] = useState<DocRequestListItem[]>([])
  // snapshot of ALL business requests → HERO never flips when filter changes
  const [allBusiness, setAllBusiness] = useState<DocRequestListItem[]>([])

  // progress bar anim
  const progAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const fresh = await roleStore.ensureLoaded('resident')
        if (!live) return
        const id = Number(fresh?.person_id ?? fresh?.details?.person_id ?? 0)
        setMeId(id)
      } catch (e) {
        log('ensureLoaded error:', e)
      }
    })()
    return () => { live = false }
  }, [roleStore])

  /** fetch filtered list + all-business for HERO */
  const load = async (id: number) => {
    if (!id) return
    setLoading(true)
    try {
      const statusParam = selectedFilter === 'ALL' ? undefined : selectedFilter

      // 1) visible list
      const respFiltered = await fetchMyDocRequests(id, { status: statusParam, search, limit: 120 }) || []
      const businessFiltered = respFiltered.filter(isBusinessDoc)
      setItems(businessFiltered)

      // 2) hero source
      const respAll = await fetchMyDocRequests(id, { limit: 200 }) || []
      const businessAll = respAll.filter(isBusinessDoc)
      setAllBusiness(businessAll)

      log('visible business:', businessFiltered.length, 'hero business:', businessAll.length)
    } catch (e) {
      log('load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try { await load(meId) } finally { setRefreshing(false) }
  }

  useEffect(() => { load(meId) }, [meId, selectedFilter])
  useEffect(() => { const t = setTimeout(() => load(meId), 250); return () => clearTimeout(t) }, [search])

  // local search on filtered list
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(i =>
      i.request_code.toLowerCase().includes(q) ||
      (i.on_behalf_of || '').toLowerCase().includes(q) ||
      (i.doc_types?.join(', ') || '').toLowerCase().includes(q)
    )
  }, [items, search])

  const active = filtered.filter(i => i.status !== 'RELEASED')
  const history = filtered.filter(i => i.status === 'RELEASED')

  // HERO (from ALL)
  const recent = useMemo(() => mostRecentBusinessRequest(allBusiness), [allBusiness])
  const hero = useMemo(() => {
    if (!recent) return null
    const info = getExpiryInfo(recent.created_at)
    Animated.timing(progAnim, { toValue: info.progress, duration: 500, useNativeDriver: false }).start()
    return {
      last: new Date(recent.created_at),
      expiry: info.expiry,
      label: info.label,
      requestCode: recent.request_code,
      progress: info.progress,
      status: recent.status,
    }
  }, [recent])

  const progWidth = progAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] })

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar title="Business Requests" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollPad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            {/* use Ionicons directly → no mystery white circles */}
            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
            <ThemedText style={styles.heroTitle}>Business Status</ThemedText>
            {hero && (
              <View style={[styles.pill, { backgroundColor: (STATUS_STYLE[hero.status]?.bg || OK.bg) }]}>
                <ThemedText style={[styles.pillText, { color: (STATUS_STYLE[hero.status]?.fg || OK.fg) }]}>
                  {STATUS_STYLE[hero.status]?.label || hero.status}
                </ThemedText>
              </View>
            )}
          </View>

          {hero ? (
            <>
              <ThemedText style={styles.heroLine}>
                Last request: <ThemedText style={styles.heroStrong}>{formatPhDateOnly(hero.last)}</ThemedText> ({hero.requestCode})
              </ThemedText>
              <ThemedText style={styles.heroLine}>
                Expiration: <ThemedText style={styles.heroStrong}>{hero.expiry ? formatPhDateOnly(hero.expiry) : 'Unknown'}</ThemedText>
              </ThemedText>
              <ThemedText style={styles.heroLine}>
                Renewal: <ThemedText style={styles.heroStrong}>{hero.label}</ThemedText>
              </ThemedText>

              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: progWidth }]} />
              </View>

              <View style={styles.policyRow}>
                <Ionicons name="information-circle-outline" size={16} color="#fff" />
                <ThemedText small style={styles.policyText}>
                  Business Clearance expires <ThemedText small style={[styles.policyText, styles.heroStrong]}>1 year</ThemedText> after it was requested.
                </ThemedText>
              </View>
            </>
          ) : (
            <ThemedText style={{ color: '#fff', opacity: 0.9 }}>
              No business clearance yet. Start a request to generate your status.
            </ThemedText>
          )}
        </View>

        {/* Search */}
        <Spacer height={12} />
        <View style={styles.hPad}>
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={MUTED} />
            <View style={{ flex: 1 }}>
              <ThemedTextInput
                placeholder="Search by code, name, or type…"
                value={search}
                onChangeText={setSearch}
                style={{ paddingLeft: 6 }}
              />
            </View>
          </View>

          <Spacer height={12} />

          {/* Filter chips (segmented) */}
          <View style={styles.segment}>
            {FILTERS.map((o, idx) => {
              const selected = selectedFilter === o.key
              return (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => setSelectedFilter(o.key)}
                  activeOpacity={0.9}
                  style={[
                    styles.segmentItem,
                    selected && styles.segmentItemSelected,
                    idx !== FILTERS.length - 1 && styles.segmentDivider,
                  ]}
                >
                  <ThemedText style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {o.label}
                  </ThemedText>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <Spacer height={16} />

        {loading ? (
          <View style={{ paddingVertical: 30 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {/* Active */}
            <ThemedCard>
              <SectionHeader title="Active Requests" />
              <Spacer height={8} />
              <ThemedDivider />
              <Spacer height={8} />
              {active.length === 0 ? (
                <EmptyState text="No active requests." />
              ) : (
                active.map(req => (
                  <View key={req.doc_request_id} style={{ marginBottom: 10 }}>
                    <CleanItem req={req} />
                  </View>
                ))
              )}
            </ThemedCard>

            <Spacer height={16} />

            {/* History */}
            <ThemedCard>
              <SectionHeader title="Request History" />
              <Spacer height={8} />
              <ThemedDivider />
              <Spacer height={8} />
              {history.length === 0 ? (
                <EmptyState text="No released requests yet." />
              ) : (
                history.map(req => (
                  <View key={req.doc_request_id} style={{ marginBottom: 10 }}>
                    <CleanItem req={req} />
                  </View>
                ))
              )}
            </ThemedCard>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => router.push(NEW_REQ_ROUTE)}
      >
        {/* this one can stay your custom component if you like */}
        <View style={styles.fabCircle}>
          <Ionicons name="add" size={26} color="#fff" />
        </View>
      </TouchableOpacity>
    </ThemedView>
  )
}

/* ───────── sub components ───────── */
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.headerRow}>
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyBox}>
      <View style={styles.emptyMark} />
      <Spacer height={6} />
      <ThemedText muted>{text}</ThemedText>
    </View>
  )
}

/** Clean row with status pill BEFORE title, with working navigation */
function CleanItem({ req }: { req: DocRequestListItem }) {
  const router = useRouter() // ← wire navigation
  const ui = STATUS_STYLE[req.status] ?? { label: req.status, bg: '#e5e7eb', fg: '#374151' }
  const title = req.doc_types?.length ? req.doc_types.join(', ') : 'Document Request'
  const exp = getExpiryInfo(req.created_at)
  const expiryText = exp.expiry ? `Expires: ${formatPhDateOnly(exp.expiry)} (${exp.label})` : 'Expires: Unknown'

  return (
    <View style={styles.cleanItem}>
      <View style={styles.cleanHeader}>
        <View style={[styles.pill, { backgroundColor: ui.bg }]}>
          <ThemedText style={[styles.pillText, { color: ui.fg }]}>{ui.label}</ThemedText>
        </View>
        <ThemedText style={styles.cleanTitle}>{title}</ThemedText>
      </View>

      <ThemedText muted style={styles.cleanMeta}>Request #: {req.request_code}</ThemedText>
      <ThemedText muted style={styles.cleanMeta}>
        Requested: {formatPh(req.created_at)}{req.on_behalf_of ? ` • On behalf of: ${req.on_behalf_of}` : ''}
      </ThemedText>
      <ThemedText muted style={styles.cleanMeta}>{expiryText}</ThemedText>

      <View style={{ alignItems: 'flex-end' }}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.cleanBtn}
          onPress={() => router.push({ pathname: '/(residentmodals)/docreqdetail', params: { id: String(req.doc_request_id) } })}
        >
          <ThemedText style={styles.cleanBtnText}>View Details</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  )
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  scrollPad: { paddingBottom: 140 },
  hPad: { paddingHorizontal: 16 },

  hero: {
    marginHorizontal: 16, marginTop: 12, padding: 16,
    backgroundColor: BRAND, borderRadius: 18,
    shadowColor: BRAND, shadowOpacity: 0.15, shadowRadius: 12, elevation: 2,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginLeft: 8 },
  heroLine: { color: '#fff', marginTop: 4 },
  heroStrong: { color: '#fff', fontWeight: '700' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 8, overflow: 'hidden', marginVertical: 12 },
  progressFill: { height: 8, backgroundColor: '#fff' },
  policyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  policyText: { color: '#fff', opacity: 0.9, marginLeft: 6, fontSize: 13},

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: BORDER, borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: SURFACE,
  },

  segment: { borderColor: BORDER, borderWidth: 1, borderRadius: 999, flexDirection: 'row', backgroundColor: SURFACE, overflow: 'hidden' },
  segmentItem: { paddingVertical: 8, paddingHorizontal: 14, flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  segmentItemSelected: { backgroundColor: '#f5f5f5' },
  segmentDivider: { borderRightColor: BORDER, borderRightWidth: 1 },
  segmentText: { fontSize: 12, color: MUTED },
  segmentTextSelected: { color: BRAND, fontWeight: '700' },

  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 'auto' },
  pillText: { fontWeight: '700', fontSize: 12 },

  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  emptyMark: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#f8f8f8', borderColor: BORDER, borderWidth: 1 },

  cleanItem: { backgroundColor: '#fafafa', borderWidth: 1, borderColor: BORDER, borderRadius: 14, padding: 14 },
  cleanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cleanTitle: { fontSize: 16, fontWeight: '800', marginLeft: 8, flexShrink: 1 },
  cleanMeta: { color: MUTED, marginTop: 4 },
  cleanBtn: { marginTop: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#c9c9c9', backgroundColor: '#fff' },
  cleanBtnText: { fontWeight: '700', color: BRAND },

  fab: { position: 'absolute', bottom: 24, right: 20, zIndex: 10 },
  fabCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
})
