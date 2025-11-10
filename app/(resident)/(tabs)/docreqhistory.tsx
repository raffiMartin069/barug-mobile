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
      {/* Hero Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroGradient}>
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroTitle}>Document Requests</ThemedText>
            <ThemedText style={styles.heroSubtitle}>Track and manage your document requests</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Search & Filters */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <ThemedIcon name="search" size={16} iconColor="#6b7280" bgColor="transparent" containerSize={20} />
            <ThemedTextInput
              style={styles.searchInput}
              placeholder="Search by code, name, or type…"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.chipRow}>
              {FILTERS.map(f => {
                const selected = selectedFilter === f.key
                return (
                  <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.7}
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#310101" />
            <ThemedText muted style={{ marginTop: 12 }}>Loading requests...</ThemedText>
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <ThemedIcon name="time" size={16} iconColor="#f59e0b" bgColor="#fef3c7" containerSize={28} shape="round" />
                </View>
                <ThemedText style={styles.statNumber}>{active.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Active</ThemedText>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <ThemedIcon name="checkmark-circle" size={16} iconColor="#16a34a" bgColor="#dcfce7" containerSize={28} shape="round" />
                </View>
                <ThemedText style={styles.statNumber}>{history.length}</ThemedText>
                <ThemedText style={styles.statLabel}>Completed</ThemedText>
              </View>
            </View>

            {/* Active Requests */}
            {active.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIconBg}>
                    <ThemedIcon name="document-text" size={14} iconColor="#310101" bgColor="#fef7f0" containerSize={20} shape="round" />
                  </View>
                  <ThemedText style={styles.sectionTitle}>Active Requests</ThemedText>
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{active.length}</ThemedText>
                  </View>
                </View>
                <View style={styles.requestsList}>
                  {active.map(req => (
                    <RequestCard key={req.doc_request_id} req={req} />
                  ))}
                </View>
              </View>
            )}

            {/* History */}
            {history.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionIconBg, { backgroundColor: '#f0fdf4' }]}>
                    <ThemedIcon name="checkmark-circle" size={14} iconColor="#16a34a" bgColor="#f0fdf4" containerSize={20} shape="round" />
                  </View>
                  <ThemedText style={styles.sectionTitle}>Completed Requests</ThemedText>
                  <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#16a34a' }]}>{history.length}</ThemedText>
                  </View>
                </View>
                <View style={styles.requestsList}>
                  {history.map(req => (
                    <RequestCard key={req.doc_request_id} req={req} />
                  ))}
                </View>
              </View>
            )}

            {/* Empty State */}
            {active.length === 0 && history.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <ThemedIcon name="document-text" size={24} iconColor="#d1d5db" bgColor="#f3f4f6" containerSize={48} shape="round" />
                </View>
                <ThemedText style={styles.emptyTitle}>No Document Requests</ThemedText>
                <ThemedText style={styles.emptySubtitle}>Start by creating your first document request</ThemedText>
                <TouchableOpacity 
                  style={styles.emptyButton}
                  onPress={() => router.push('/(residentmodals)/requestdoc')}
                >
                  <ThemedIcon name="add" size={14} iconColor="#fff" bgColor="#310101" containerSize={18} shape="round" />
                  <ThemedText style={styles.emptyButtonText}>Create Request</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(residentmodals)/requestdoc')}>
        <ThemedIcon name="add" size={20} iconColor="#fff" bgColor="transparent" containerSize={24} />
      </TouchableOpacity>
    </ThemedView>
  )
}

function formatPh(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString('en-PH', { dateStyle: 'medium' })
}

function RequestCard({ req }: { req: DocRequestListItem }) {
  const router = useRouter()
  const ui = STATUS_STYLE[req.status] ?? { label: req.status, bg: '#e5e7eb', fg: '#374151' }
  
  return (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => router.push({ pathname: '/(residentmodals)/docreqdetail', params: { id: String(req.doc_request_id) } })}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <View style={styles.requestTitleContainer}>
          <ThemedText style={styles.requestTitle}>
            {req.doc_types?.length ? req.doc_types.join(', ') : 'Document Request'}
          </ThemedText>
          <View style={[styles.statusPill, { backgroundColor: ui.bg }]}>
            <ThemedText style={[styles.statusText, { color: ui.fg }]}>{ui.label}</ThemedText>
          </View>
        </View>
        <ThemedIcon name="chevron-forward" size={12} iconColor="#9ca3af" bgColor="transparent" containerSize={16} />
      </View>
      
      <View style={styles.requestMeta}>
        <View style={styles.metaRow}>
          <ThemedIcon name="receipt" size={12} iconColor="#6b7280" bgColor="transparent" containerSize={16} />
          <ThemedText style={styles.metaText}>#{req.request_code}</ThemedText>
        </View>
        <View style={styles.metaRow}>
          <ThemedIcon name="calendar" size={12} iconColor="#6b7280" bgColor="transparent" containerSize={16} />
          <ThemedText style={styles.metaText}>{formatPh(req.created_at)}</ThemedText>
        </View>
        {req.on_behalf_of && (
          <View style={styles.metaRow}>
            <ThemedIcon name="person" size={12} iconColor="#6b7280" bgColor="transparent" containerSize={16} />
            <ThemedText style={styles.metaText}>For: {req.on_behalf_of}</ThemedText>
          </View>
        )}
        {req.amount_due > 0 && (
          <View style={styles.metaRow}>
            <ThemedIcon name="card" size={12} iconColor="#6b7280" bgColor="transparent" containerSize={16} />
            <ThemedText style={[styles.metaText, { fontWeight: '600', color: '#310101' }]}>
              ₱{Number(req.amount_due).toLocaleString()}
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  // Hero Section
  heroSection: {
    marginTop: -16,
    marginHorizontal: -16,
  },
  heroGradient: {
    backgroundColor: '#310101',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  
  // Search Section
  searchSection: {
    padding: 16,
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  filtersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipSelected: {
    backgroundColor: '#310101',
    borderColor: '#310101',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Content
  contentContainer: {
    padding: 16,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  
  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Sections
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef7f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  badge: {
    backgroundColor: '#fef7f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#310101',
  },
  
  // Request Cards
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  requestTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  requestMeta: {
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#310101',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#310101',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
})