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
import { supabase } from '@/constants/supabase'
import { useMemberRemoval } from '@/hooks/useMemberRemoval'
import { HealthWorkerRepository } from '@/repository/HealthWorkerRepository'
import { HouseholdRepository } from '@/repository/householdRepository'
import { MemberRemovalService } from '@/services/memberRemovalService'
import { SchedulingService } from '@/services/SchedulingService'
import { useHouseMateStore } from '@/store/houseMateStore'
import { MgaKaHouseMates } from '@/types/houseMates'
import { Ionicons } from '@expo/vector-icons'
import { useIsFocused } from '@react-navigation/native'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, Dimensions, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native'

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

const REMOVAL_REASONS = [
  'MOVED OUT',
  'DECEASED',
  'DATA CORRECTION',
  'DUPLICATE ENTRY',
  'OTHER'
] as const
type RemovalReason = typeof REMOVAL_REASONS[number]

const QuarterlySched = () => {
  const router = useRouter()
  const [search, setSearch] = useState('')

  // NEW: dropdown state
  const [status, setStatus] = useState()
  const [weekRange, setWeekRange] = useState()
  const setMemberId = useHouseMateStore((state: MgaKaHouseMates) => state.setMemberId);
  const setFamilyId = useHouseMateStore((state: MgaKaHouseMates) => state.setFamilyId);

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

  // ---------- bottom sheet + member states ----------
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

  const fetchData = async () => {
    try {
      const service = new SchedulingService(new HealthWorkerRepository());
      const raw = await service.Execute();
      console.log("Raw data from scheduling service:", raw);
      const docs = (Array.isArray(raw) ? raw : [])
        .map((r) => {
          if (typeof r === "string") {
            try { return JSON.parse(r); } catch { return null; }
          }
          return r;
        })
        .filter(Boolean);

      const mapped = docs.map((doc: any) => {
        const hh = doc.household ?? {};
        const families = Array.isArray(doc.families) ? doc.families : [];

        return {
          id: hh.household_id ? `HH-${hh.household_id}` : `HH-${hh.household_num ?? Math.random().toString(36).slice(2, 8)}`,
          householdNum: hh.household_num ?? String(hh.household_id ?? ""),
          householdHead: hh.household_head_name ?? "",
          address: hh.address ?? "",
          houseType: hh.house_type ?? "",
          houseOwnership: hh.house_ownership ?? "",
          families: families.map((f: any) => ({
            familyNum: f.family_num ?? (f.family_id ? `FAM-${f.family_id}` : ""),
            headName: f.family_head_name ?? "",
            type: f.household_type ?? "",
            nhts: f.nhts_status ?? "",
            indigent: f.indigent_status ?? "",
            monthlyIncome: f.monthly_income ?? "",
            sourceIncome: f.source_of_income ?? "",
            members: Array.isArray(f.members)
              ? f.members.map((m: any) => ({
                id: m.person_id ? `P-${m.person_id}` : (m.full_name ?? "").replace(/\s+/g, "_"),
                name: m.full_name ?? "",
                relation: m.relationship_to_household_head ?? m.relationship ?? "",
                age: typeof m.age === "number" ? m.age : parseInt(m.age, 10) || 0,
                sex: m.sex ?? "",
              }))
              : [],
          })),
        };
      });

      setHouseholds(mapped);
    } catch (err) {
      console.error("Failed to fetch/normalize households:", err);
      setHouseholds([]);
    }
  };

  const isFocused = useIsFocused();

  useEffect(() => {
      if (!isFocused) return;
      fetchData();
      setOpen(false);
    }, [isFocused]);

  const onPressMember = (fam: Family, mem: Member) => {
    closeSheet();
    setMemberId(Number(mem.id.split("-")[1]));
    // refactored:
    // navigation works with /memberprofile but it does not mount the component which causes console.logs or useEffect not to execute.
    router.push({
      pathname: "/(bhwmodals)/(family)/memberprofile",
    });

  };

  // ---------- remove modal states ----------
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

  const onPressAddMember = async (id: string) => {
    setFamilyId(Number(id));
    router.push({
      pathname: "/(bhwmodals)/(family)/addmember",
    });
    await fetchData();
  }

  const { removeMember, loading, error } = useMemberRemoval();

  const memberRemovalHandler = async (id: string) => {
    const memberId = pendingRemoval?.member.id ? Number(pendingRemoval.member.id.split('-')[1]) : null
    const service = new MemberRemovalService(new HouseholdRepository())
    const res = await removeMember(memberId, selectedReason, service)
    if (!res) {
      Alert.alert('Failed', error ?? 'Unable to remove member. Please try again later.')
      return;
    }
    Alert.alert('Success', 'Member has been removed successfully.')
    setRemoveOpen(false)
    setOpen(false)
    await fetchData();
  }

  const markAsDone = async () => {
    const schedId = await HealthWorkerRepository.GetScheduleIdByHouseholdId(Number(selectedHousehold?.id.split("-")[1]));
    if (!schedId) {
      Alert.alert('Error', 'Schedule ID not found for this household.');
      return;
    }
    const res = await HealthWorkerRepository.InsertMarkAsDone({ p_hth_id: schedId, p_staff_id: 1, p_remarks: "N/A" });
    if (!res) {
      Alert.alert('Failed', 'Unable to mark as done. Please try again later.');
      return;
    }
    Alert.alert('Success', 'Household marked as done.');
    setOpen(false);
    await fetchData();
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title='' />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer height={20} />

          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder='Search household #, household head...'
              value={search}
              onChangeText={(text) => {
                setSearch(text);
              }}
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
                  value={weekRange}
                  setValue={setWeekRange}
                  order={0}
                />
              </View>
            </View>

            <Spacer height={10} />
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
                    <ThemedButton
                      submit={false}
                      onPress={() => openSheet(hh)}
                    >
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
                          onPress={() => onPressAddMember(fam.familyNum)}
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

                      <Spacer height={15} />

                      <ThemedButton onPress={() => {
                        markAsDone();
                      }}  submit={false}>
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

      {/* ---------- Remove Member Modal (Bottom Sheet) ---------- */}
      <ThemedBottomSheet visible={removeOpen} onClose={() => setRemoveOpen(false)} heightPercent={0.85}>
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
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
                items={REMOVAL_REASONS.map(r => ({ label: r, value: r }))}
                value={selectedReason}
                setValue={setSelectedReason}
                order={0}
              />
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <ThemedButton
              submit={false}
              onPress={() => setRemoveOpen(false)}
              style={{ flex: 1, height: ACTION_BTN_HEIGHT }}
            >
              <ThemedText non_btn>Cancel</ThemedText>
            </ThemedButton>

            <View style={{ width: 10 }} />

            <ThemedButton style={{ flex: 1, height: ACTION_BTN_HEIGHT }}>
              <ThemedText onPress={() => memberRemovalHandler(pendingRemoval?.member.id)} btn>Confirm Remove</ThemedText>
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

  // dropdown styles (modal footer)
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
})
