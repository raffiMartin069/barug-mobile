// app/blotter-history.tsx

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
    'settled'|'dismissed',
  { label: string; bg: string; fg: string }
> = {
  settled:   { label: 'Settled',   bg: '#e5e7eb', fg: '#374151' }, // gray
  dismissed: { label: 'Dismissed', bg: '#fecaca', fg: '#7f1d1d' }, // red
}

type BlotterItem = {
  id: string
  caseTitle: string
  caseNo: string
  filedAt: string
  status: keyof typeof STATUS_UI
}

// ✅ History-only dataset (resolved outcomes)
const HISTORY_BLOTTERS: BlotterItem[] = [
  { id: 'HB1', caseTitle: 'Minor Physical Injuries', caseNo: 'BLT-2024-0312', filedAt: 'March 12, 2024', status: 'settled' },
  { id: 'HB3', caseTitle: 'Threats',                caseNo: 'BLT-2024-0607', filedAt: 'June 07, 2024',  status: 'dismissed' },
]

// — UI-only filters (no actual DB filtering yet) —
const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'settled',    label: 'Settled' },
  { key: 'dismissed',  label: 'Dismissed' },
] as const
type FilterKey = typeof FILTERS[number]['key']

const BltHistory = () => {
  // UI-only state (to be wired to DB later)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  return (
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title="Blotter History" />

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
              <ThemedText style={styles.title}>Blotter History</ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {HISTORY_BLOTTERS.length === 0 && (
              <ThemedText style={styles.empty}>No past blotter cases yet.</ThemedText>
            )}

            {/* NOTE: Not applying search/filter to the map yet */}
            {HISTORY_BLOTTERS.map((item) => {
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

export default BltHistory

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
