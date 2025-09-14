import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedItemCard from '@/components/ThemedItemCard'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_UI: Record<
  'filed' | 'mediation' | 'scheduled' | 'settled' | 'referred' | 'dismissed',
  { label: string; bg: string; fg: string }
> = {
  filed:     { label: 'Filed',     bg: '#fde68a', fg: '#92400e' }, // amber
  mediation: { label: 'Mediation', bg: '#e0e7ff', fg: '#3730a3' }, // indigo
  scheduled: { label: 'Scheduled', bg: '#cffafe', fg: '#155e75' }, // cyan
  settled:   { label: 'Settled',   bg: '#d1fae5', fg: '#065f46' }, // green
  referred:  { label: 'Referred',  bg: '#fee2e2', fg: '#7f1d1d' }, // rose
  dismissed: { label: 'Dismissed', bg: '#e5e7eb', fg: '#374151' }, // gray
}

type BlotterItem = {
  id: string
  caseNo: string
  title: string
  parties: string
  filedAt: string
  nextActionAt?: string
  status: keyof typeof STATUS_UI
}

const ACTIVE_BLOTTERS: BlotterItem[] = [
  {
    id: 'b1',
    caseNo: 'BLT-2025-00021',
    title: 'Threats / Harassment',
    parties: 'Juan Dela Cruz v. Pedro Santos',
    filedAt: 'Aug 29, 2025',
    nextActionAt: 'Mediation: Sep 20, 2025, 3:00 PM',
    status: 'mediation',
  },
  {
    id: 'b2',
    caseNo: 'BLT-2025-00019',
    title: 'Physical Injury',
    parties: 'Maria Reyes v. Ana Lopez',
    filedAt: 'Aug 20, 2025',
    nextActionAt: 'Hearing: Sep 18, 2025, 9:00 AM',
    status: 'scheduled',
  },
  {
    id: 'b3',
    caseNo: 'BLT-2025-00010',
    title: 'Theft (minor property)',
    parties: 'Ricardo Cruz v. Unknown',
    filedAt: 'Jul 12, 2025',
    status: 'filed',
  },
]

const HISTORY_BLOTTERS: BlotterItem[] = [
  {
    id: 'b4',
    caseNo: 'BLT-2025-00002',
    title: 'Verbal Abuse',
    parties: 'Liza Santos v. Mark Dela Torre',
    filedAt: 'May 02, 2025',
    status: 'settled',
  },
  {
    id: 'b5',
    caseNo: 'BLT-2025-00003',
    title: 'Property Damage',
    parties: 'Jose Ramirez v. Karl Mendoza',
    filedAt: 'May 05, 2025',
    status: 'referred',
  },
  {
    id: 'b6',
    caseNo: 'BLT-2024-00111',
    title: 'Public Disturbance',
    parties: 'Barangay v. John Doe',
    filedAt: 'Dec 18, 2024',
    status: 'dismissed',
  },
]

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'filed',      label: 'Filed' },
  { key: 'mediation',  label: 'Mediation' },
  { key: 'scheduled',  label: 'Scheduled' },
  { key: 'settled',    label: 'Settled' },
  { key: 'referred',   label: 'Referred' },
  { key: 'dismissed',  label: 'Dismissed' },
] as const

type FilterKey = typeof FILTERS[number]['key']

const BlotRptHistory = () => {
  const [search, setSearch] = useState('')           // unused for now (UI only)
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all') // UI only (no filtering yet)
  const router = useRouter()

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
      <ThemedAppBar title='Blotter Reports' />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer />
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder='Search case no., parties, or title...'
              value={search}
              onChangeText={setSearch}
            />

            <Spacer height={10} />

            {/* Chips are visual only for now */}
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

          {/* Active */}
          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Active Blotter Reports</ThemedText>
              <ThemedText link>
                <Link href={'/(residentmodals)/(bltrpt)/allactive'}>View All</Link>
              </ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {ACTIVE_BLOTTERS.map((b) => {
              const ui = STATUS_UI[b.status]
              return (
                <View key={b.id} style={{ marginBottom: 10 }}>
                  <ThemedItemCard
                    title={b.title}
                    subtitle={b.parties}
                    meta1={`Blotter Report #: ${b.caseNo}`}
                    meta2={b.nextActionAt ? `Next: ${b.nextActionAt}` : `Filed: ${b.filedAt}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize='sm'
                    route={{ pathname: '/blotter/details/[id]', params: { id: b.id } }}
                  />
                </View>
              )
            })}
          </ThemedCard>

          <Spacer height={20} />

          {/* History */}
          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Blotter Reports History</ThemedText>
              <ThemedText link>
                <Link href={'/blthistory'}>View All</Link>
              </ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {HISTORY_BLOTTERS.map((b) => {
              const ui = STATUS_UI[b.status]
              return (
                <View key={b.id} style={{ marginBottom: 10 }}>
                  <ThemedItemCard
                    title={b.title}
                    subtitle={b.parties}
                    meta1={`Case #: ${b.caseNo}`}
                    meta2={`Filed: ${b.filedAt}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize='sm'
                    route={{ pathname: '/blotter/details/[id]', params: { id: b.id } }}
                  />
                </View>
              )
            })}
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/')}>
        <ThemedIcon name={'add'} bgColor='#310101' size={24} />
      </TouchableOpacity>
    </ThemedView>
  )
}

export default BlotRptHistory

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    borderColor: '#310101',
  },
  chipText: {
    fontSize: 12,
  },
  chipTextSelected: {
    color: '#310101',
    fontWeight: '600',
  },
})
