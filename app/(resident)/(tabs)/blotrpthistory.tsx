// app/blotter-history.tsx (example path)

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
import React, { useMemo, useState } from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_UI: Record<
  'filed' | 'mediation' | 'scheduled' | 'settled' | 'referred' | 'dismissed',
  { label: string; bg: string; fg: string }
> = {
  filed:     { label: 'Filed',     bg: '#fde68a', fg: '#92400e' }, // amber
  mediation: { label: 'Mediation', bg: '#cffafe', fg: '#155e75' }, // cyan
  scheduled: { label: 'Scheduled', bg: '#e0e7ff', fg: '#3730a3' }, // indigo
  settled:   { label: 'Settled',   bg: '#d1fae5', fg: '#065f46' }, // green
  referred:  { label: 'Referred',  bg: '#e9d5ff', fg: '#6b21a8' }, // purple
  dismissed: { label: 'Dismissed', bg: '#fecaca', fg: '#7f1d1d' }, // red
}

type BlotterItem = {
  id: string
  title: string
  blotterNo: string
  filedAt: string
  status: keyof typeof STATUS_UI
  complainant: string
  respondent: string
  hearing?: string
}

// ===== Mock Data (temporary) =====
const ACTIVE_BLOTTERS: BlotterItem[] = [
  {
    id: '1',
    title: 'Noise Complaint',
    blotterNo: 'BLTR-2025-0001',
    filedAt: 'Aug 28, 2025',
    status: 'mediation',
    complainant: 'Juan Dela Cruz',
    respondent: 'Pedro Santos',
    hearing: 'Sep 15, 2025',
  },
  {
    id: '2',
    title: 'Physical Injury',
    blotterNo: 'BLTR-2025-0002',
    filedAt: 'Aug 30, 2025',
    status: 'scheduled',
    complainant: 'Maria Lopez',
    respondent: 'Unknown',
    hearing: 'Sep 20, 2025',
  },
  {
    id: '3',
    title: 'Property Dispute',
    blotterNo: 'BLTR-2025-0003',
    filedAt: 'Sep 02, 2025',
    status: 'filed',
    complainant: 'Ana Ramos',
    respondent: 'Ramon Cruz',
  },
]

const HISTORY_BLOTTERS: BlotterItem[] = [
  {
    id: '4',
    title: 'Verbal Altercation',
    blotterNo: 'BLTR-2025-0004',
    filedAt: 'Jul 10, 2025',
    status: 'settled',
    complainant: 'Liza Manalo',
    respondent: 'Katrina Dizon',
  },
  {
    id: '5',
    title: 'Vandalism',
    blotterNo: 'BLTR-2025-0005',
    filedAt: 'Jun 22, 2025',
    status: 'referred',
    complainant: 'Barangay Sto. Niño',
    respondent: 'Minor Group',
  },
  {
    id: '6',
    title: 'Threats',
    blotterNo: 'BLTR-2025-0006',
    filedAt: 'May 03, 2025',
    status: 'dismissed',
    complainant: 'Chris Uy',
    respondent: 'Neighbor',
  },
]

const FILTERS: Array<{ key: 'all' | keyof typeof STATUS_UI; label: string }> = [
  { key: 'all',       label: 'All' },
  { key: 'filed',     label: STATUS_UI.filed.label },
  { key: 'mediation', label: STATUS_UI.mediation.label },
  { key: 'scheduled', label: STATUS_UI.scheduled.label },
  { key: 'settled',   label: STATUS_UI.settled.label },
  { key: 'referred',  label: STATUS_UI.referred.label },
  { key: 'dismissed', label: STATUS_UI.dismissed.label },
]

const BlotRptHistory = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | keyof typeof STATUS_UI>('all')

  const matchesQuery = (b: BlotterItem, q: string) => {
    if (!q) return true
    const t = q.toLowerCase()
    return (
      b.title.toLowerCase().includes(t) ||
      b.blotterNo.toLowerCase().includes(t) ||
      b.complainant.toLowerCase().includes(t) ||
      b.respondent.toLowerCase().includes(t)
    )
  }

  const activeFiltered = useMemo(() => {
    return ACTIVE_BLOTTERS
      .filter(b => (statusFilter === 'all' ? true : b.status === statusFilter))
      .filter(b => matchesQuery(b, search))
  }, [statusFilter, search])

  const historyFiltered = useMemo(() => {
    return HISTORY_BLOTTERS
      .filter(b => (statusFilter === 'all' ? true : b.status === statusFilter))
      .filter(b => matchesQuery(b, search))
  }, [statusFilter, search])

  const renderItem = (b: BlotterItem) => {
    const ui = STATUS_UI[b.status]
    const parties = `${b.complainant} vs ${b.respondent}`
    const meta2 = b.hearing ? `Filed: ${b.filedAt} • Hearing: ${b.hearing}` : `Filed: ${b.filedAt}`

    return (
      <View key={b.id} style={{ marginBottom: 10 }}>
        <ThemedItemCard
          title={b.title}
          meta1={`Blotter #: ${b.blotterNo} • ${parties}`}
          meta2={meta2}
          showPill
          pillLabel={ui.label}
          pillBgColor={ui.bg}
          pillTextColor={ui.fg}
          pillSize="sm"
          route={{ pathname: '/blotterdetails/[id]', params: { id: b.id } }}
        />
      </View>
    )
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
      <ThemedAppBar title="Blotter Reports" />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer />

          {/* Search + Filters */}
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder="Search by title, blotter #, parties…"
              value={search}
              onChangeText={setSearch}
            />

            <Spacer height={10} />

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {FILTERS.map(f => {
                  const selected = f.key === statusFilter
                  return (
                    <TouchableOpacity
                      key={f.key}
                      activeOpacity={0.7}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setStatusFilter(f.key)}
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
                <Link href="/blotter/active">View All</Link>
              </ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {activeFiltered.length ? (
              activeFiltered.map(renderItem)
            ) : (
              <ThemedText muted>No active reports found.</ThemedText>
            )}
          </ThemedCard>

          <Spacer height={20} />

          {/* History */}
          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Blotter Reports History</ThemedText>
              <ThemedText link>
                <Link href="/blotter/history">View All</Link>
              </ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {historyFiltered.length ? (
              historyFiltered.map(renderItem)
            ) : (
              <ThemedText muted>No history records found.</ThemedText>
            )}
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/blotter/new')}>
        <ThemedIcon name="add" bgColor="#310101" size={24} />
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
    gap: 8, // if RN < 0.73, replace with marginRight on chip
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
  chipText: { fontSize: 12 },
  chipTextSelected: { color: '#310101', fontWeight: '600' },
})
