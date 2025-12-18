import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedItemCard from '@/components/ThemedItemCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_UI: Record<
  'pending' | 'ready' | 'completed',
  { label: string; bg: string; fg: string }
> = {
  pending:   { label: 'Pending',   bg: '#fde68a', fg: '#92400e' }, // amber
  ready:     { label: 'Ready',     bg: '#d1fae5', fg: '#065f46' }, // green
  completed: { label: 'Completed', bg: '#e5e7eb', fg: '#374151' }, // gray
}

type RequestItem = {
  id: string
  title: string
  requestNo: string
  requestedAt: string
  status: keyof typeof STATUS_UI
}

// Active-only dataset
const ACTIVE_REQUESTS: RequestItem[] = [
  {
    id: '1',
    title: 'Barangay Clearance',
    requestNo: 'REQ-BCLR-20250602-001',
    requestedAt: 'June 15, 2023',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Certificate of Indigency',
    requestNo: 'REQ-INDG-20250602-002',
    requestedAt: 'June 18, 2023',
    status: 'ready',
  },
]

// Filters (UI-only for now)
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'ready', label: 'Ready' },
  { key: 'completed', label: 'Completed' },
] as const

type FilterKey = typeof FILTERS[number]['key']

const AllActive = () => {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  return (
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title="Active Requests" />

      <KeyboardAvoidingView>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          <Spacer />

          {/* Search and Filters */}
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder="Search request no. or title..."
              value={search}
              onChangeText={setSearch}
            />

            <Spacer height={10} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {FILTERS.map((f) => {
                  const selected = f.key === activeFilter
                  return (
                    <TouchableOpacity
                      key={f.key}
                      activeOpacity={0.7}
                      onPress={() => setActiveFilter(f.key)}
                      style={[styles.chip, selected && styles.chipSelected]}
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

          <ThemedCard>
            <View style={styles.headerRow}>
              <ThemedText style={styles.title}>Active Requests</ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {ACTIVE_REQUESTS.length === 0 && (
              <ThemedText style={styles.empty}>No active requests right now.</ThemedText>
            )}

            {/* NOTE: Not applying search/filter yet, UI only */}
            {ACTIVE_REQUESTS.map((req) => {
              const ui = STATUS_UI[req.status]
              return (
                <View key={req.id} style={{ marginBottom: 10 }}>
                  <ThemedItemCard
                    title={req.title}
                    meta1={`Request #: ${req.requestNo}`}
                    meta2={`Requested: ${req.requestedAt}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize="sm"
                    route={{ pathname: '/request/[id]', params: { id: req.id } }}
                  />
                </View>
              )
            })}
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

export default AllActive

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  empty: { textAlign: 'center', opacity: 0.6, paddingVertical: 8 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipSelected: { borderColor: '#310101' },
  chipText: { fontSize: 12 },
  chipTextSelected: { color: '#310101', fontWeight: '600' },
})
