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
  mediation: { label: 'Mediation', bg: '#e0e7ff', fg: '#3730a3' }, // indigo
  scheduled: { label: 'Scheduled', bg: '#cffafe', fg: '#155e75' }, // cyan
  settled:   { label: 'Settled',   bg: '#d1fae5', fg: '#065f46' }, // green
  referred:  { label: 'Referred',  bg: '#fee2e2', fg: '#7f1d1d' }, // rose
  dismissed: { label: 'Dismissed', bg: '#e5e7eb', fg: '#374151' }, // gray
}

type CaseItem = {
  id: string
  caseNo: string
  title: string
  parties: string
  role?: string
  filedAt: string
  nextActionAt?: string
  status: keyof typeof STATUS_UI
}

const ACTIVE_CASES: CaseItem[] = [
  {
    id: 'c1',
    caseNo: 'BC-2025-00014',
    title: 'Physical Injury',
    parties: 'You (Complainant) v. Pedro Santos',
    role: 'Complainant',
    filedAt: 'Aug 28, 2025',
    nextActionAt: 'Hearing: Sep 19, 2025, 9:00 AM',
    status: 'scheduled',
  },
  {
    id: 'c2',
    caseNo: 'BC-2025-00009',
    title: 'Threats / Harassment',
    parties: 'Juan Dela Cruz v. You (Respondent)',
    role: 'Respondent',
    filedAt: 'Aug 10, 2025',
    nextActionAt: 'Mediation: Sep 21, 2025, 3:00 PM',
    status: 'mediation',
  },
  {
    id: 'c3',
    caseNo: 'BC-2025-00001',
    title: 'Theft (minor)',
    parties: 'You (Complainant) v. Unknown',
    role: 'Complainant',
    filedAt: 'Jul 02, 2025',
    status: 'filed',
  },
]

const HISTORY_CASES: CaseItem[] = [
  {
    id: 'c4',
    caseNo: 'BC-2025-00003',
    title: 'Verbal Abuse',
    parties: 'You (Complainant) v. Mark D.',
    role: 'Complainant',
    filedAt: 'May 05, 2025',
    status: 'settled',
  },
  {
    id: 'c5',
    caseNo: 'BC-2025-00004',
    title: 'Property Damage',
    parties: 'You (Complainant) v. Karl M.',
    role: 'Complainant',
    filedAt: 'May 09, 2025',
    status: 'referred',
  },
  {
    id: 'c6',
    caseNo: 'BC-2024-00111',
    title: 'Public Disturbance',
    parties: 'Barangay v. You (Witness)',
    role: 'Witness',
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

const BarangayCases = ({ personId, personName }: { personId?: string; personName?: string } = {}) => {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const router = useRouter()

  // Filter cases by person involvement
  const getPersonCases = (cases: CaseItem[]) => {
    if (!personId && !personName) return cases
    return cases.filter(c => 
      personName ? c.parties.toLowerCase().includes(personName.toLowerCase()) : true
    )
  }

  const personActiveCases = getPersonCases(ACTIVE_CASES)
  const personHistoryCases = getPersonCases(HISTORY_CASES)

  const searchLower = search.trim().toLowerCase()
  const matches = (c: CaseItem) =>
    (activeFilter === 'all' || c.status === activeFilter) &&
    (
      !searchLower ||
      c.caseNo.toLowerCase().includes(searchLower) ||
      c.title.toLowerCase().includes(searchLower) ||
      c.parties.toLowerCase().includes(searchLower) ||
      (c.role?.toLowerCase().includes(searchLower) ?? false)
    )

  const visibleActive = useMemo(() => personActiveCases.filter(matches), [personActiveCases, search, activeFilter])
  const visibleHistory = useMemo(() => personHistoryCases.filter(matches), [personHistoryCases, search, activeFilter])

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
      <ThemedAppBar title='Barangay Cases' />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer />
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder='Search case no., parties, title, or role...'
              value={search}
              onChangeText={setSearch}
            />

            <Spacer height={10} />

            {/* Status chips (same style as blotter-history) */}
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
              <ThemedText style={styles.title}>Active Barangay Cases</ThemedText>
              <ThemedText link>
                <Link href={'/'}>View All</Link>
              </ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {visibleActive.length === 0 ? (
              <ThemedText subtitle style={{ textAlign: 'center', color: '#808080' }}>
                {personName ? `No active barangay cases for ${personName}.` : 'No active barangay cases.'}
              </ThemedText>
            ) : (
              visibleActive.map((c) => {
                const ui = STATUS_UI[c.status]
                return (
                  <View key={c.id} style={{ marginBottom: 10 }}>
                    <ThemedItemCard
                      title={c.title}
                      subtitle={c.parties}
                      meta1={`Barangay Case #: ${c.caseNo}`}
                      meta2={c.nextActionAt ? `Next: ${c.nextActionAt}` : `Filed: ${c.filedAt}`}
                      meta3={c.role ? `Your Role: ${c.role}` : undefined}
                      showPill
                      pillLabel={ui.label}
                      pillBgColor={ui.bg}
                      pillTextColor={ui.fg}
                      pillSize='sm'
                      route={{ pathname: '/cases/details/[id]', params: { id: c.id } }}
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
              <ThemedText style={styles.title}>Barangay Cases History</ThemedText>
              <ThemedText link>
                <Link href={'/'}>View All</Link>
              </ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {visibleHistory.length === 0 ? (
              <ThemedText subtitle style={{ textAlign: 'center', color: '#808080' }}>
                {personName ? `No barangay cases history for ${personName}.` : 'No barangay cases history.'}
              </ThemedText>
            ) : (
              visibleHistory.map((c) => {
                const ui = STATUS_UI[c.status]
                return (
                  <View key={c.id} style={{ marginBottom: 10 }}>
                    <ThemedItemCard
                      title={c.title}
                      subtitle={c.parties}
                      meta1={`Case #: ${c.caseNo}`}
                      meta2={`Filed: ${c.filedAt}`}
                      meta3={c.role ? `Your Role: ${c.role}` : undefined}
                      showPill
                      pillLabel={ui.label}
                      pillBgColor={ui.bg}
                      pillTextColor={ui.fg}
                      pillSize='sm'
                      route={{ pathname: '/cases/details/[id]', params: { id: c.id } }}
                    />
                  </View>
                )
              })
            )}
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/')}>
        <ThemedIcon name={'add'} bgColor='#310101' size={24} />
      </TouchableOpacity>
    </ThemedView>
  )
}

export default BarangayCases

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
