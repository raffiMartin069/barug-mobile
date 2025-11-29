// (business)/(tabs)/docreqhistory.tsx
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'

import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'

import { useBusinessRequestHistory } from '@/hooks/useBusinessRequestHistory'
import { useAccountRole } from '@/store/useAccountRole'
import type { RequestType } from '@/types/businessRequestHistoryType'

/* ───────── config ───────── */
const BRAND = '#310101'
const SURFACE = '#ffffff'
const BORDER = '#e7e7e7'
const MUTED = '#6b7280'

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING: { label: 'Pending', bg: '#fde68a', fg: '#92400e' },
  FOR_TREASURER_REVIEW: { label: 'For Review', bg: '#fde68a', fg: '#92400e' },
  PAID: { label: 'Paid', bg: '#dbeafe', fg: '#1e40af' },
  FOR_PRINTING: { label: 'For Printing', bg: '#e0e7ff', fg: '#3730a3' },
  RELEASED: { label: 'Released', bg: '#d1fae5', fg: '#065f46' },
  DECLINED: { label: 'Declined', bg: '#fecaca', fg: '#7f1d1d' },
}

const TYPE_CONFIG: Record<RequestType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  CLEARANCE: { label: 'Clearance', icon: 'document-text', color: '#6b4c3b' },
  RENEWAL: { label: 'Renewal', icon: 'refresh', color: '#4a5c6a' },
  CLOSURE: { label: 'Closure', icon: 'close-circle', color: '#7f1d1d' },
}

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'CLEARANCE', label: 'Clearance' },
  { key: 'RENEWAL', label: 'Renewal' },
  { key: 'CLOSURE', label: 'Closure' },
] as const

/* ───────── helpers ───────── */
function formatPh(d: string | Date) {
  const dt = typeof d === 'string' ? new Date(d) : d
  return isNaN(dt.getTime())
    ? String(d)
    : dt.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatCurrency(amount: number | null | undefined) {
  if (!amount) return '₱0.00'
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* ───────── screen ───────── */
export default function DocReqHistory() {
  const router = useRouter()
  const roleStore = useAccountRole()
  const { requests, loading, loadRequests, refresh } = useBusinessRequestHistory()

  const [search, setSearch] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]['key']>('ALL')
  const [refreshing, setRefreshing] = useState(false)
  const [ownerId, setOwnerId] = useState<number | undefined>()

  // Get owner ID
  useEffect(() => {
    roleStore.ensureLoaded('business').then(profile => {
      if (profile?.person_id) {
        setOwnerId(profile.person_id)
      }
    })
  }, [roleStore])

  // Load requests when owner ID is available
  useEffect(() => {
    if (ownerId) {
      loadRequests(ownerId)
    }
  }, [ownerId, loadRequests])

  const onRefresh = async () => {
    if (!ownerId) return
    setRefreshing(true)
    try {
      await refresh(ownerId)
    } finally {
      setRefreshing(false)
    }
  }

  // Filter requests
  const filtered = requests.filter(req => {
    // Type filter
    if (selectedFilter !== 'ALL' && req.type !== selectedFilter) {
      return false
    }
    
    // Search filter
    if (search) {
      const q = search.trim().toLowerCase()
      return (
        req.request_code.toLowerCase().includes(q) ||
        (req.business_name || '').toLowerCase().includes(q) ||
        req.type.toLowerCase().includes(q)
      )
    }
    
    return true
  })

  return (
    <ThemedView style={{ paddingBottom: 0 }} safe>
      <ThemedAppBar title="Activities" showBack={false} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollPad}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Spacer height={12} />
        <View style={styles.hPad}>
          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search-outline" size={18} color={MUTED} />
            <View style={{ flex: 1 }}>
              <ThemedTextInput
                placeholder="Search by code, business, or type…"
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
                <Pressable
                  key={o.key}
                  onPress={() => setSelectedFilter(o.key)}
                  style={[
                    styles.segmentItem,
                    selected && styles.segmentItemSelected,
                    idx !== FILTERS.length - 1 && styles.segmentDivider,
                  ]}
                >
                  <ThemedText style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                    {o.label}
                  </ThemedText>
                </Pressable>
              )
            })}
          </View>
        </View>

        <Spacer height={16} />

        {/* All Requests */}
        <ThemedCard>
          <ThemedText style={styles.title}>Requests</ThemedText>
          <Spacer height={8} />
          <ThemedDivider />
          <Spacer height={8} />
          
          <ScrollView 
            style={styles.requestsContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {loading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator />
              </View>
            ) : filtered.length === 0 ? (
              <EmptyState text="No requests found." />
            ) : (
              filtered.map(req => (
                <View key={req.id} style={{ marginBottom: 10 }}>
                  <RequestItem req={req} />
                </View>
              ))
            )}
          </ScrollView>
        </ThemedCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  )
}

/* ───────── sub components ───────── */
function EmptyState({ text }: { text: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 18 }}>
      <ThemedText muted>{text}</ThemedText>
    </View>
  )
}

function RequestItem({ req }: { req: any }) {
  const statusStyle = STATUS_STYLE[req.status] || { label: req.status, bg: '#e5e7eb', fg: '#374151' }
  const typeConfig = TYPE_CONFIG[req.type as RequestType]

  return (
    <View style={styles.requestItem}>
      {/* Header: Status pill + Type badge */}
      <View style={styles.requestHeader}>
        <View style={[styles.pill, { backgroundColor: statusStyle.bg }]}>
          <ThemedText style={[styles.pillText, { color: statusStyle.fg }]}>
            {statusStyle.label}
          </ThemedText>
        </View>
        <View style={styles.typeBadge}>
          <Ionicons name={typeConfig.icon} size={14} color={typeConfig.color} />
          <ThemedText style={[styles.typeText, { color: typeConfig.color }]}>
            {typeConfig.label}
          </ThemedText>
        </View>
      </View>

      {/* Business name */}
      {req.business_name && (
        <ThemedText style={styles.businessName}>{req.business_name}</ThemedText>
      )}

      {/* Details */}
      <ThemedText muted style={styles.metaText}>Request #: {req.request_code}</ThemedText>
      <ThemedText muted style={styles.metaText}>
        Created: {formatPh(req.created_at)}
      </ThemedText>
      
      {req.period_info && (
        <ThemedText muted style={styles.metaText}>Period: {req.period_info}</ThemedText>
      )}
      
      {req.total_quote && (
        <ThemedText muted style={styles.metaText}>
          Amount: {formatCurrency(req.total_quote)}
        </ThemedText>
      )}
      
      {req.paid_on && (
        <ThemedText muted style={styles.metaText}>
          Paid: {formatPh(req.paid_on)}
        </ThemedText>
      )}
      
      {req.or_number && (
        <ThemedText muted style={styles.metaText}>OR #: {req.or_number}</ThemedText>
      )}
    </View>
  )
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  scrollPad: { paddingBottom: 40 },
  hPad: { paddingHorizontal: 16 },

  title: { fontSize: 18, fontWeight: '700' },

  requestsContainer: {
    maxHeight: 500,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: SURFACE,
  },

  segment: {
    borderColor: BORDER,
    borderWidth: 1,
    borderRadius: 999,
    flexDirection: 'row',
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  segmentItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemSelected: { backgroundColor: '#f5f5f5' },
  segmentDivider: { borderRightColor: BORDER, borderRightWidth: 1 },
  segmentText: { fontSize: 11, color: MUTED },
  segmentTextSelected: { color: BRAND, fontWeight: '700' },

  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { fontWeight: '700', fontSize: 11 },

  requestItem: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  businessName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1f2937',
  },
  metaText: {
    color: MUTED,
    marginTop: 3,
    fontSize: 13,
  },
})
