import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedBottomSheet from '@/components/ThemedBottomSheet'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedChip from '@/components/ThemedChip'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Dimensions, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width
const ACTION_BTN_HEIGHT = 44

type Member = {
  id: string
  name: string
  relation: string
  age: number
  sex: 'Male' | 'Female'
}

type Family = {
  familyNum: string
  headName: string
  type: string
  nhts: string | boolean
  indigent: string | boolean
  monthlyIncome: string
  sourceIncome: string
  members: Member[]
}

type Household = {
  id: string
  householdNum: string
  householdHead: string
  address: string
  houseType: string
  houseOwnership: string
  families: Family[]
}

const REMOVAL_REASONS = ['MOVED OUT', 'DECEASED', 'DATA CORRECTION', 'DUPLICATE ENTRY', 'OTHER'] as const
type RemovalReason = typeof REMOVAL_REASONS[number]

// ─────────────────── Reschedule helpers ───────────────────
type WeekRange = { start: Date; end: Date }

function getWeekStart(d: Date): Date {
  // Monday as week start
  const dt = new Date(d)
  const day = dt.getDay() // 0=Sun,1=Mon,...6=Sat
  const diff = day === 0 ? -6 : 1 - day
  dt.setDate(dt.getDate() + diff)
  dt.setHours(0, 0, 0, 0)
  return dt
}

function makeWeekRange(fromDate: Date): WeekRange {
  const start = getWeekStart(fromDate)
  const end = new Date(start)
  // Mon–Fri (5 days)
  end.setDate(start.getDate() + 4)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

function fmtRange(r: WeekRange): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = r.start.toLocaleDateString('en-US', opts)
  const e = r.end.toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

const RESCHED_REASONS = [] as const

const QuarterlySched = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')

  // Filters (placeholder)
  const [status, setStatus] = useState<any>()
  const [weekRangeFilter, setWeekRangeFilter] = useState<any>()

  // NEW: top header current week state
  const [listWeek, setListWeek] = useState<WeekRange>(makeWeekRange(new Date()))
  const shiftListWeek = (deltaWeeks: number) => {
    const base = new Date(listWeek.start)
    base.setDate(base.getDate() + deltaWeeks * 7)
    setListWeek(makeWeekRange(base))
  }

  const [households, setHouseholds] = useState<Household[]>([
    {
      id: 'HH-2024-001',
      householdNum: 'HH-2024-001',
      householdHead: 'Raphael H. Bellosillo',
      address: 'Purok 3, Sitio San Roque',
      houseType: 'Concrete',
      houseOwnership: 'Owned',
      families: [
        {
          familyNum: 'FAM-001',
          headName: 'Raphael H. Bellosillo',
          type: 'NUCLEAR',
          nhts: 'YES',
          indigent: 'NO',
          monthlyIncome: '₱15,000 - ₱20,000',
          sourceIncome: 'Employment',
          members: [
            { id: 'P-1', name: 'Raphael H. Bellosillo', relation: 'HEAD', age: 45, sex: 'Male' },
            { id: 'P-2', name: 'Ana Bellosillo', relation: 'SPOUSE', age: 43, sex: 'Female' },
            { id: 'P-3', name: 'Miko Bellosillo', relation: 'CHILD', age: 16, sex: 'Male' },
          ],
        },
      ],
    },
    {
      id: 'HH-2024-002',
      householdNum: 'HH-2024-002',
      householdHead: 'Maria Santos',
      address: 'Purok 5, Sitio Mabini',
      houseType: 'Wooden',
      houseOwnership: 'Renting',
      families: [
        {
          familyNum: 'FAM-002',
          headName: 'Maria Santos',
          type: 'EXTENDED',
          nhts: 'NO',
          indigent: 'YES',
          monthlyIncome: '₱5,000 - ₱8,000',
          sourceIncome: 'Small Business',
          members: [
            { id: 'P-4', name: 'Maria Santos', relation: 'HEAD', age: 50, sex: 'Female' },
            { id: 'P-5', name: 'Jose Santos', relation: 'CHILD', age: 22, sex: 'Male' },
            { id: 'P-6', name: 'Liza Santos', relation: 'CHILD', age: 19, sex: 'Female' },
            { id: 'P-7', name: 'Juan Dela Cruz', relation: 'GRANDCHILD', age: 5, sex: 'Male' },
          ],
        },
        {
          familyNum: 'FAM-003',
          headName: 'Pedro Cruz',
          type: 'NUCLEAR',
          nhts: 'NO',
          indigent: 'NO',
          monthlyIncome: '₱10,000 - ₱12,000',
          sourceIncome: 'Construction Work',
          members: [],
        },
      ],
    },
    {
      id: 'HH-2024-111',
      householdNum: 'HH-2024-001',
      householdHead: 'Raphael H. Bellosillo',
      address: 'Purok 3, Sitio San Roque',
      houseType: 'Concrete',
      houseOwnership: 'Owned',
      families: [],
    },
    {
      id: 'HH-2024-112',
      householdNum: 'HH-2024-001',
      householdHead: 'Raphael H. Bellosillo',
      address: 'Purok 3, Sitio San Roque',
      houseType: 'Concrete',
      houseOwnership: 'Owned',
      families: [],
    },
  ])

  // ---------- Household details bottom sheet ----------
  const [open, setOpen] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)

  const [familyIndex, setFamilyIndex] = useState(0)
  const familiesScrollRef = useRef<ScrollView>(null)

  const openSheet = (item: Household) => {
    setSelectedHousehold(item)
    setOpen(true)
    setFamilyIndex(0)
    setTimeout(() => {
      familiesScrollRef.current?.scrollTo({ x: 0, animated: false })
    }, 0)
  }

  const closeSheet = () => setOpen(false)

  const onFamiliesScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setFamilyIndex(idx)
  }

  const onPressMember = (fam: Family, mem: Member) => {
    closeSheet()
    router.push({ pathname: '/memberprofile', params: { id: mem.id } })
  }

  // ---------- Remove Member modal ----------
  const [removeOpen, setRemoveOpen] = useState(false)
  const [selectedReason, setSelectedReason] = useState<RemovalReason | null>(null)
  const [otherReason, setOtherReason] = useState('')
  const [pendingRemoval, setPendingRemoval] = useState<{
    householdId: string
    familyNum: string
    member: Member
  } | null>(null)

  const openRemoveModal = (householdId: string, familyNum: string, member: Member) => {
    setPendingRemoval({ householdId, familyNum, member })
    setSelectedReason(null)
    setOtherReason('')
    setRemoveOpen(true)
  }

  // ---------- Reschedule modal ----------
  const [reschedOpen, setReschedOpen] = useState(false)
  const [reschedTarget, setReschedTarget] = useState<Household | null>(null)
  const [reschedWeek, setReschedWeek] = useState<WeekRange>(makeWeekRange(new Date()))
  const [reschedReason, setReschedReason] = useState<string | null>(null)

  const openResched = (hh: Household) => {
    setReschedTarget(hh)
    setReschedReason(null)
    setReschedWeek(makeWeekRange(new Date()))
    setReschedOpen(true)
  }

  const shiftWeek = (deltaWeeks: number) => {
    const base = new Date(reschedWeek.start)
    base.setDate(base.getDate() + deltaWeeks * 7)
    setReschedWeek(makeWeekRange(base))
  }

  const handleConfirmResched = () => {
    // TODO: call your API/RPC here
    // {
    //   household_id: reschedTarget?.id,
    //   week_start: reschedWeek.start.toISOString(),
    //   week_end: reschedWeek.end.toISOString(),
    //   reason: reschedReason
    // }
    setReschedOpen(false)
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title='' />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer height={20} />

          <View style={{ paddingHorizontal: 40 }}>
            {/* ───── Current week header (top) ───── */}
            <View style={styles.topWeekRow}>
              <ThemedText style={styles.topWeekLabel}>Current week:</ThemedText>
              <ThemedText style={styles.topWeekText}>{fmtRange(listWeek)}</ThemedText>
            </View>

            <Spacer height={10} />

            <ThemedTextInput
              placeholder='Search household #, household head...'
              value={search}
              onChangeText={setSearch}
            />

            <Spacer height={10} />

            {/* Filters row (Status + Week Range) */}
            <View style={styles.filtersWrap}>
              <View style={styles.filterCol}>
                <ThemedText style={styles.filterLabel}>Status</ThemedText>
                <ThemedDropdown
                  placeholder="All"
                  items={[]}
                  value={status}
                  setValue={setStatus}
                  order={0}
                />
              </View>

              <View style={styles.filterCol}>
                <ThemedText style={styles.filterLabel}>Week Range</ThemedText>
                <ThemedDropdown
                  placeholder="This Week"
                  items={[]}
                  value={weekRangeFilter}
                  setValue={setWeekRangeFilter}
                  order={0}
                />
              </View>
            </View>

            <Spacer height={10}/>
          </View>

          {households.map((hh) => (
            <View key={hh.id}>
              <Pressable onPress={() => openSheet(hh)}>
                <ThemedCard>
                  <View style={styles.rowContainer}>
                    <View style={styles.rowSubContainer}>
                      <ThemedIcon
                        name={'home'}
                        bgColor={'#310101'}
                        containerSize={40}
                        size={18}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <ThemedText style={{ fontWeight: '700' }} subtitle={true}>
                          {hh.householdNum}
                        </ThemedText>
                        <ThemedText style={{ color: '#475569' }}>
                          Household Head: {hh.householdHead}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} />
                  </View>

                  <View style={[styles.rowSubContainer, { paddingBottom: 5, paddingTop: 5 }]}>
                    <Ionicons name="location-outline" size={16} color="#475569" />
                    <ThemedText style={{ marginLeft: 10, color: '#475569' }}>{hh.address}</ThemedText>
                  </View>

                  <View style={styles.rowSubContainer}>
                    <Ionicons name="people-outline" size={16} color="#475569" />
                    <ThemedText style={{ marginLeft: 10, color: '#475569' }}>
                      {hh.families.length} Families
                    </ThemedText>
                  </View>

                  <Spacer height={12} />

                  {/* CTA: single 'Reschedule' button aligned right */}
                  <View style={styles.ctaRow}>
                    <ThemedButton submit={false} onPress={() => openResched(hh)}>
                      <View style={styles.reschedContent}>
                        <Ionicons name="calendar-outline" size={18} color="#310101" />
                        <ThemedText non_btn>Reschedule</ThemedText>
                      </View>
                    </ThemedButton>
                  </View>
                </ThemedCard>
              </Pressable>

              <Spacer />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- Household Bottom Sheet --------- */}
      <ThemedBottomSheet visible={open} onClose={closeSheet}>
        {selectedHousehold && (
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 8 }}>
              <ThemedText subtitle>{selectedHousehold.householdNum}</ThemedText>
              <ThemedText style={{ color: '#475569' }}>{selectedHousehold.householdHead}</ThemedText>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              {/* Household Info */}
              <View style={{ marginTop: 6 }}>
                <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Household Information</ThemedText>

                <View style={styles.kvRow}>
                  <ThemedText>Household Head</ThemedText>
                  <ThemedText style={styles.kvVal}>{selectedHousehold.householdHead}</ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>Household No.</ThemedText>
                  <ThemedText style={styles.kvVal}>{selectedHousehold.householdNum}</ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>House Type</ThemedText>
                  <ThemedText style={styles.kvVal}>{selectedHousehold.houseType}</ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>House Ownership</ThemedText>
                  <ThemedText style={styles.kvVal}>{selectedHousehold.houseOwnership}</ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>Home Address</ThemedText>
                  <ThemedText style={styles.kvVal}>{selectedHousehold.address}</ThemedText>
                </View>
              </View>

              {/* Families */}
              <View style={{ marginTop: 16 }}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>Families in this Household</ThemedText>

                  <ThemedChip
                    label={'Add Family Unit'}
                    onPress={() => router.push('/createfamily')}
                    filled={false}
                  />
                </View>

                <ScrollView
                  ref={familiesScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onFamiliesScroll}
                  scrollEventThrottle={16}
                >
                  {selectedHousehold.families.map((fam) => (
                    <View key={fam.familyNum} style={{ width: SCREEN_WIDTH - 16, paddingRight: 16 }}>
                      <View style={styles.familyCover}>
                        <Ionicons name="home-outline" size={20} color="#475569" />
                        <View style={{ marginLeft: 10 }}>
                          <ThemedText style={{ fontWeight: '700' }}>{fam.familyNum}</ThemedText>
                          <ThemedText style={{ color: '#64748b', marginTop: 2 }}>
                            Family Head: <ThemedText style={{ fontWeight: '700' }}>{fam.headName}</ThemedText>
                          </ThemedText>
                          <View style={styles.badgesRow}>
                            <View style={styles.badge}><ThemedText style={styles.badgeText}>Type: {fam.type}</ThemedText></View>
                            <View style={styles.badge}><ThemedText style={styles.badgeText}>NHTS: {String(fam.nhts)}</ThemedText></View>
                            <View style={styles.badge}><ThemedText style={styles.badgeText}>Indigent: {String(fam.indigent)}</ThemedText></View>
                            <View style={styles.badge}><ThemedText style={styles.badgeText}>Monthly Income: {fam.monthlyIncome}</ThemedText></View>
                            <View style={styles.badge}><ThemedText style={styles.badgeText}>Source of Income: {fam.sourceIncome}</ThemedText></View>
                          </View>
                        </View>
                      </View>

                      <Spacer height={10} />

                      <View style={styles.sectionHeaderRow}>
                        <ThemedText style={styles.sectionTitle}>Members</ThemedText>

                        <ThemedChip
                          label={'Add Member'}
                          onPress={() => router.push('/addmember')}
                          filled={false}
                        />
                      </View>

                      {fam.members.length > 0 ? (
                        <View style={styles.memberGrid}>
                          {fam.members.map((m) => (
                            <ThemedChip
                              key={m.id}
                              label={m.name}
                              onPress={() => onPressMember(fam, m)}
                              removable
                              onRemove={() => openRemoveModal(selectedHousehold.id, fam.familyNum, m)}
                            />
                          ))}
                        </View>
                      ) : (
                        <ThemedText style={{ color: '#64748b', fontStyle: 'italic' }}>
                          There is no family member in this family.
                        </ThemedText>
                      )}

                      <Spacer height={15}/>

                      <ThemedButton submit={false}>
                        <ThemedText non_btn>Mark as Done</ThemedText>
                      </ThemedButton>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}
      </ThemedBottomSheet>

      {/* ---------- Remove Member Modal ---------- */}
      <ThemedBottomSheet visible={removeOpen} onClose={() => setRemoveOpen(false)} heightPercent={0.85}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <ThemedText subtitle>Remove Member</ThemedText>

            {pendingRemoval && (
              <View style={{ gap: 6, marginTop: 10 }}>
                <ThemedText style={{ color: '#475569' }}>You are removing:</ThemedText>
                <View style={[styles.familyCover, { paddingVertical: 10 }]}>
                  <Ionicons name="person-outline" size={18} color="#475569" />
                  <View style={{ marginLeft: 8 }}>
                    <ThemedText style={{ fontWeight: '700' }}>{pendingRemoval.member.name}</ThemedText>
                    <ThemedText style={{ color: '#64748b' }}>
                      {pendingRemoval.member.relation} • {pendingRemoval.member.sex} • {pendingRemoval.member.age} yrs
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}

            <View style={{ marginTop: 16, gap: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Select a Reason</ThemedText>
              <ThemedDropdown
                placeholder="Select a Reason"
                items={[] /* your items here if needed */}
                value={selectedReason}
                setValue={setSelectedReason}
                order={0}
              />
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <ThemedButton submit={false} onPress={() => setRemoveOpen(false)} style={{ flex: 1, height: ACTION_BTN_HEIGHT }}>
              <ThemedText non_btn>Cancel</ThemedText>
            </ThemedButton>

            <View style={{ width: 10 }} />

            <ThemedButton style={{ flex: 1, height: ACTION_BTN_HEIGHT }}>
              <ThemedText btn>Confirm Remove</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedBottomSheet>

      {/* ========= Reschedule Visit Modal (Bottom Sheet) ========= */}
      <ThemedBottomSheet visible={reschedOpen} onClose={() => setReschedOpen(false)} heightPercent={0.6}>
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            <ThemedText subtitle>Reschedule Visit</ThemedText>

            {reschedTarget && (
              <ThemedText style={{ color: '#64748b', marginTop: 4 }}>
                {reschedTarget.householdNum} • {reschedTarget.householdHead}
              </ThemedText>
            )}

            {/* Week range selector */}
            <View style={{ marginTop: 16 }}>
              <ThemedText style={{ fontWeight: '700', marginBottom: 8 }}>Select week range</ThemedText>

              <View style={styles.weekRow}>
                <Pressable onPress={() => shiftWeek(-1)} style={styles.weekNavBtn} accessibilityLabel="Previous week">
                  <Ionicons name="chevron-back" size={16} />
                </Pressable>

                <ThemedText style={styles.weekLabel}>{fmtRange(reschedWeek)}</ThemedText>

                <Pressable onPress={() => shiftWeek(1)} style={styles.weekNavBtn} accessibilityLabel="Next week">
                  <Ionicons name="chevron-forward" size={16} />
                </Pressable>
              </View>
            </View>

            {/* Reason dropdown */}
            <View style={{ marginTop: 16 }}>
              <ThemedDropdown
                placeholder="Reason"
                items={RESCHED_REASONS.map(r => ({ label: r as string, value: r as string }))}
                value={reschedReason as any}
                setValue={setReschedReason as any}
                order={0}
              />
            </View>
          </ScrollView>

          {/* Footer actions */}
          <View style={styles.sheetFooter}>
            <ThemedButton submit={false} onPress={() => setReschedOpen(false)} style={{ flex: 1, height: ACTION_BTN_HEIGHT }}>
              <ThemedText non_btn>Cancel</ThemedText>
            </ThemedButton>

            <View style={{ width: 10 }} />

            <ThemedButton
              style={{ flex: 1, height: ACTION_BTN_HEIGHT, opacity: reschedReason ? 1 : 0.6 }}
              disabled={!reschedReason}
              onPress={handleConfirmResched}
            >
              <ThemedText btn>Confirm</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedBottomSheet>
    </ThemedView>
  )
}

export default QuarterlySched

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  rowSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // filters
  filtersWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  filterCol: {
    flex: 1,
    minWidth: 0,
  },
  filterLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },

  kvRow: {
    marginVertical: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kvKey: { color: '#64748b', minWidth: 120 },
  kvVal: { fontWeight: '600', color: '#0f172a', flexShrink: 1, textAlign: 'right' },

  familyCover: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E9EDEF',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  badgeText: { fontSize: 12, color: '#334155' },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: { fontWeight: '700', flexShrink: 1 },

  // CTA (single right-aligned 'Reschedule' button)
  ctaRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reschedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Bottom sheet footer
  sheetFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },

  // Reschedule week row (modal)
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  weekNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontWeight: '700',
  },

  // Top header current week
  topWeekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topWeekLabel: {
    fontWeight: '700',
    color: '#0f172a',
  },
  topWeekRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topWeekChevron: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topWeekText: {
    fontWeight: '700',
    marginHorizontal: 8,
  },
})
