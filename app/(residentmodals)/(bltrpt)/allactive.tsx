// app/(residentmodals)/(bltrpt)/allactive.tsx

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
  'filed' | 'mediation' | 'scheduled',
  { label: string; bg: string; fg: string }
> = {
  filed:     { label: 'Filed',     bg: '#fde68a', fg: '#92400e' }, // amber
  mediation: { label: 'Mediation', bg: '#e0e7ff', fg: '#1e3a8a' }, // indigo
  scheduled: { label: 'Scheduled', bg: '#d1fae5', fg: '#065f46' }, // green
}

type BlotterItem = {
  id: string
  caseTitle: string
  caseNo: string
  filedAt: string
  status: keyof typeof STATUS_UI
}

// Active-only dataset (examples)
const ACTIVE_BLOTTERS: BlotterItem[] = [
  { id: 'B1', caseTitle: 'Noise Disturbance', caseNo: 'BLT-2025-0001', filedAt: 'September 10, 2025', status: 'filed' },
  { id: 'B2', caseTitle: 'Property Boundary', caseNo: 'BLT-2025-0002', filedAt: 'September 11, 2025', status: 'mediation' },
  { id: 'B3', caseTitle: 'Simple Mischief',   caseNo: 'BLT-2025-0003', filedAt: 'September 12, 2025', status: 'scheduled' },
]

// — UI-only filters (no actual DB filtering yet) —
const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'filed',      label: 'Filed' },
  { key: 'mediation',  label: 'Mediation' },
  { key: 'scheduled',  label: 'Scheduled' },
] as const
type FilterKey = typeof FILTERS[number]['key']

const AllActive = () => {
  // UI-only (to be wired to DB later)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  return (
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title="Active Blotter Reports" />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer />

          {/* Search + Chips (visual only) */}
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder="Search case no., title..."
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
              <ThemedText style={styles.title}>Active Blotter Reports</ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {ACTIVE_BLOTTERS.length === 0 && (
              <ThemedText style={styles.empty}>No active blotter reports right now.</ThemedText>
            )}

            {/* NOTE: Not applying search/filter to the map yet */}
            {ACTIVE_BLOTTERS.map((item) => {
              const ui = STATUS_UI[item.status]
              return (
                <View key={item.id} style={{ marginBottom: 10 }}>
                  <ThemedItemCard
                    title={item.caseTitle}
                    meta1={`Case #: ${item.caseNo}`}
                    meta2={`Filed: ${item.filedAt}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize="sm"
                    route={{ pathname: '/blotter/[id]', params: { id: item.id } }}
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
