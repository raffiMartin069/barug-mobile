// /(resident)/(tabs)/docreqhistory.tsx
import React, { useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedItemCard from '@/components/ThemedItemCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'

import { useAccountRole } from '@/store/useAccountRole'
import {
  fetchMyDocRequests,
  type DocRequestListItem,
} from '@/services/documentRequest'

/** DB → UI status mapping */
const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  FOR_TREASURER_REVIEW: { label: 'For Treasurer Review', bg: '#fde68a', fg: '#92400e' }, // amber
  PAID:                 { label: 'Paid',                 bg: '#dbeafe', fg: '#1e40af' }, // blue
  FOR_PRINTING:         { label: 'For Printing',         bg: '#e0e7ff', fg: '#3730a3' }, // indigo
  RELEASED:             { label: 'Released',             bg: '#d1fae5', fg: '#065f46' }, // green
  DECLINED:             { label: 'Declined',             bg: '#fecaca', fg: '#7f1d1d' }, // red (if you add it later)
}

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'FOR_TREASURER_REVIEW', label: 'For Treasurer' },
  { key: 'PAID', label: 'Paid' },
  { key: 'FOR_PRINTING', label: 'For Printing' },
  { key: 'RELEASED', label: 'Released' },
] as const

/** Hide Barangay Business Clearance on the resident screen */
const BUSINESS_DOC_NAME = 'BARANGAY BUSINESS CLEARANCE'
function isBusinessDoc(i: DocRequestListItem) {
  const names = (i.doc_types || []).map(s => String(s).toUpperCase().trim())
  return names.some(n =>
    n === BUSINESS_DOC_NAME ||
    n.includes('BUSINESS CLEARANCE') ||
    n.includes('BARANGAY BUSINESS')
  )
}

export default function DocReqHistory() {
  const router = useRouter()

  // who am I
  const roleStore = useAccountRole()
  const role = roleStore.currentRole ?? 'resident'
  const cached = roleStore.getProfile(role)
  const meId = Number(cached?.person_id ?? cached?.details?.person_id ?? 0)

  // UI state
  const [search, setSearch] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]['key']>('ALL')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [items, setItems] = useState<DocRequestListItem[]>([])

  const load = async () => {
    if (!meId) return
    setLoading(true)
    try {
      const resp = await fetchMyDocRequests(meId, {
        status: selectedFilter === 'ALL' ? undefined : selectedFilter,
        search,
        limit: 50,
      })
      // ⬇️ Exclude Business Clearance for residents
      const nonBusinessOnly = (resp || []).filter(i => !isBusinessDoc(i))
      setItems(nonBusinessOnly)
    } catch (e) {
      console.log('[docreqhistory] load error:', e)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // ensure profile is loaded once, then fetch
    let live = true
    ;(async () => {
      await roleStore.ensureLoaded('resident')
      if (!live) return
      await load()
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter])

  // local search filter (in addition to server search)
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

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar title="Document Requests" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 88 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Spacer />
        <View style={{ paddingHorizontal: 40 }}>
          <ThemedTextInput
            placeholder="Search by code, name, or type…"
            value={search}
            onChangeText={(t) => { setSearch(t); /* optional: debounce then load() */ }}
          />

          <Spacer height={10} />

          {/* Status filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {FILTERS.map(f => {
                const selected = selectedFilter === f.key
                return (
                  <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.8}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => setSelectedFilter(f.key)}
                  >
                    <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {f.label}
                    </ThemedText>
                  </TouchableOpacity>
                )
              })}
            </View>
          </ScrollView>
        </View>

        <Spacer />

        {loading ? (
          <View style={{ paddingVertical: 30 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <>
            {/* Active */}
            <ThemedCard>
              <View style={styles.row}>
                <ThemedText style={styles.title}>Active Requests</ThemedText>
              </View>

              <Spacer height={10} />
              <ThemedDivider />
              <Spacer height={10} />

              {active.length === 0 ? (
                <ThemedText muted>No active requests.</ThemedText>
              ) : (
                active.map(req => {
                  const ui = STATUS_STYLE[req.status] ?? { label: req.status, bg: '#e5e7eb', fg: '#374151' }
                  return (
                    <View key={req.doc_request_id} style={{ marginBottom: 10 }}>
                      <ThemedItemCard
                        title={req.doc_types?.length ? req.doc_types.join(', ') : 'Document Request'}
                        meta1={`Request #: ${req.request_code}`}
                        meta2={`Requested: ${formatPh(req.created_at)}${req.on_behalf_of ? ` • On behalf of: ${req.on_behalf_of}` : ''}`}
                        meta3={req.amount_due > 0 ? `Amount Due: ₱${Number(req.amount_due).toLocaleString()}` : undefined}
                        showPill
                        pillLabel={ui.label}
                        pillBgColor={ui.bg}
                        pillTextColor={ui.fg}
                        pillSize="sm"
                        route={{ pathname: '/(residentmodals)/docreqdetail', params: { id: String(req.doc_request_id) } }}
                      />
                    </View>
                  )
                })
              )}
            </ThemedCard>

            <Spacer height={20} />

            {/* History */}
            <ThemedCard>
              <View style={styles.row}>
                <ThemedText style={styles.title}>Request History</ThemedText>
              </View>

              <Spacer height={10} />
              <ThemedDivider />
              <Spacer height={10} />

              {history.length === 0 ? (
                <ThemedText muted>No released requests yet.</ThemedText>
              ) : (
                history.map(req => {
                  const ui = STATUS_STYLE[req.status] ?? { label: req.status, bg: '#e5e7eb', fg: '#374151' }
                  return (
                    <View key={req.doc_request_id} style={{ marginBottom: 10 }}>
                      <ThemedItemCard
                        title={req.doc_types?.length ? req.doc_types.join(', ') : 'Document Request'}
                        meta1={`Request #: ${req.request_code}`}
                        meta2={`Requested: ${formatPh(req.created_at)}${req.on_behalf_of ? ` • On behalf of: ${req.on_behalf_of}` : ''}`}
                        showPill
                        pillLabel={ui.label}
                        pillBgColor={ui.bg}
                        pillTextColor={ui.fg}
                        pillSize="sm"
                        route={{ pathname: '/(residentmodals)/docreqdetail', params: { id: String(req.doc_request_id) } }}
                      />
                    </View>
                  )
                })
              )}
            </ThemedCard>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(residentmodals)/requestdoc')}>
        <ThemedIcon name="add" bgColor="#310101" size={24} />
      </TouchableOpacity>
    </ThemedView>
  )
}

function formatPh(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  title: { fontSize: 20, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 20, right: 20, zIndex: 999 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: '#e5e7eb', marginRight: 8, backgroundColor: '#ffffff',
  },
  chipSelected: { borderColor: '#310101' },
  chipText: { fontSize: 12 },
  chipTextSelected: { color: '#310101', fontWeight: '600' },
})