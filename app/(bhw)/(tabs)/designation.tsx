import Spacer from "@/components/Spacer";
import ThemedAppBar from "@/components/ThemedAppBar";
import ThemedBottomSheet from "@/components/ThemedBottomSheet";
import ThemedButton from "@/components/ThemedButton";
import ThemedCard from "@/components/ThemedCard";
import ThemedChip from "@/components/ThemedChip";
import ThemedDropdown from "@/components/ThemedDropdown_";
import ThemedIcon from "@/components/ThemedIcon";
import ThemedText from "@/components/ThemedText";
import ThemedTextInput from "@/components/ThemedTextInput";
import ThemedView from "@/components/ThemedView";

import { useFetchHouseAndFamily } from "@/hooks/useFetchHouseAndFamily";
import { useMemberRemoval } from "@/hooks/useMemberRemoval";

import { FamilyRepository } from "@/repository/familyRepository";
// removed HealthWorkerRepository import — client-side search will be used instead
import { HouseholdRepository } from "@/repository/householdRepository";
import { StaffRepository } from '@/repository/StaffRepository';

import { HouseholdListService } from "@/services/householdList";
import { MemberRemovalService } from "@/services/memberRemovalService";
// SearchSchedulingService removed — client-side search will be used instead
import { useGeolocationStore } from "@/store/geolocationStore";

import { useHouseMateStore } from "@/store/houseMateStore";
import { useAccountRole } from "@/store/useAccountRole";
import { useBasicHouseholdInfoStore } from "@/store/useBasicHouseholdInfoStore";

import { Family } from "@/types/familyTypes";
import { Household } from "@/types/householdType";
import { MgaKaHouseMates } from "@/types/houseMates";
import { Member } from "@/types/memberTypes";
// HouseholdDataTransformation removed — client-side filtering will be used instead

import CenteredModal from '@/components/custom/CenteredModal';
import { Colors } from '@/constants/Colors';
import { useNiceModal } from '@/hooks/NiceModalProvider';
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    findNodeHandle,
    KeyboardAvoidingView,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    UIManager,
    useColorScheme,
    View,
} from "react-native";

const SCREEN_WIDTH = Dimensions.get("window").width;

const REMOVAL_REASONS = [
  'MOVED OUT',
  'DECEASED',
  'DATA CORRECTION',
  'DUPLICATE ENTRY',
  'OTHER'
] as const

type RemovalReason = typeof REMOVAL_REASONS[number]

type MenuItem = { label: string; onPress: () => void }

type MenuPortalState = {
  visible: boolean
  x: number
  y: number
  w: number
  h: number
  items: MenuItem[]
}

const HouseholdList = () => {
  const router = useRouter();
  const profile = useAccountRole((s) => s.getProfile('resident'))
  const staffId = profile?.person_id ?? useAccountRole.getState().staffId ?? null
  const setMemberId = useHouseMateStore((state: MgaKaHouseMates) => state.setMemberId);
  const setHouseholdId = useHouseMateStore((state: MgaKaHouseMates) => state.setHouseholdId);
  const setFamilyId = useHouseMateStore((state: MgaKaHouseMates) => state.setFamilyId);
  const [resolvedStaffId, setResolvedStaffId] = useState<number | null>(null)

  const { households, setHouseholds, getHouseholds, selectedHousehold, setSelectedHousehold } = useFetchHouseAndFamily(resolvedStaffId,  true);

  useEffect(() => {
    let mounted = true
    const resolveStaff = async () => {
      try {
        const personId = staffId
        if (!personId) return
        const repo = new StaffRepository()
        const staff = await repo.GetStaffByPersonId(Number(personId))
        if (!mounted) return
        if (staff && staff.staff_id) setResolvedStaffId(Number(staff.staff_id))
      } catch (err) {
        console.error('[Designation] failed to resolve staff id:', err)
      }
    }

    resolveStaff()
    return () => { mounted = false }
  }, [staffId])

  const [search, setSearch] = useState('')
  const [visibleHouseholds, setVisibleHouseholds] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const [status, setStatus] = useState()
  const [weekRange, setWeekRange] = useState()
  const [menuPortal, setMenuPortal] = useState<MenuPortalState>({ visible: false, x: 0, y: 0, w: 0, h: 0, items: [] })
  const closeMenuPortal = () => setMenuPortal((m) => ({ ...m, visible: false }))
  const openMenuAtRef = (ref: any, items: MenuItem[]) => {
    const node = findNodeHandle(ref)
    if (!node) return
    UIManager.measureInWindow(node, (x, y, w, h) => {
      const MENU_WIDTH = 240
      const margin = 8
      const left = Math.min(x + w - MENU_WIDTH, SCREEN_WIDTH - MENU_WIDTH - margin)
      const top = y + h + 4
      setMenuPortal({ visible: true, x: left, y: top, w, h, items })
    })
  }
  const houseEllipsisRef = useRef<View>(null)
  const familyEllipsisRefs = useRef<Record<string, View | null>>({})

  const setHouseholdNumber = useBasicHouseholdInfoStore((state) => state.setHouseholdNumber);
  const setHouseholdHead = useBasicHouseholdInfoStore((state) => state.setHouseholdHead);

  const clearAddress = useGeolocationStore((state) => state.clear);

  const isFocused = useIsFocused();

  const fetchHouseholds = React.useCallback(async () => {
    const service = new HouseholdListService(new FamilyRepository(), new HouseholdRepository());
    setLoadingHouseholds(true);
    try {
      await getHouseholds(service);
    } finally {
      setLoadingHouseholds(false);
    }
  }, [getHouseholds]);

  useEffect(() => {
    if (!isFocused) return;
    // ensure we fetch when screen becomes focused or when resolvedStaffId updates
    fetchHouseholds();
  }, [isFocused, resolvedStaffId]);



  // ---------- bottom sheet + member states ----------
  const [open, setOpen] = useState(false);

  const [removeOpen, setRemoveOpen] = useState(false)

  const [reasonOpen, setReasonOpen] = useState(false) // toggles dropdown options
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
    setReasonOpen(false)
    setRemoveOpen(true)
  }

  const [familyIndex, setFamilyIndex] = useState(0);
  const familiesScrollRef = useRef<ScrollView>(null);
  const [loadingHouseholds, setLoadingHouseholds] = useState(false);
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const openSheet = (item: Household) => {
    setSelectedHousehold(item);
    setOpen(true);
    setFamilyIndex(0);
    setTimeout(() => {
      familiesScrollRef.current?.scrollTo({ x: 0, animated: false });
    }, 0);
  };

  const closeSheet = () => setOpen(false);

  // client-side search: no remote service instance required

  const onFamiliesScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setFamilyIndex(idx);
  };

  const onPressMember = (fam: Family, mem: Member) => {
    closeSheet();
    setMemberId(Number(mem.id.split("-")[0]));
    setFamilyId(Number(fam.familyNum.split("-")[1]));
    setHouseholdId(Number(fam.familyNum.split("-")[0]));
    router.push({
      pathname: "/(bhwmodals)/(family)/memberprofile",
    });
  };

  const onPressAddMember = async (id: string) => {
    setFamilyId(Number(id));
    router.push({
      pathname: "/(bhwmodals)/(family)/addmember",
    });
  }


  const { removeMember, loading, error } = useMemberRemoval()

  const memberRemovalHandler = async (id: string) => {
    const memberId = pendingRemoval?.member.id ? Number(pendingRemoval.member.id.split('-')[0]) : null
    const service = new MemberRemovalService(new HouseholdRepository())
    const res = await removeMember(memberId, selectedReason, service)
    if (!res) {
      Alert.alert('Failed', error ?? 'Unable to remove member. Please try again later.')
      return;
    }
    Alert.alert('Success', 'Member has been removed successfully.')
    setRemoveOpen(false)
    await fetchHouseholds()
  }

  const { showModal } = useNiceModal()

  const confirmCompleteHousehold = (householdId?: string | number) => {
    showModal({
      title: 'Confirm Household Visit',
      message: 'Mark this household as visited for the quarter?',
      variant: 'warn',
      primaryText: 'Proceed',
      secondaryText: 'Cancel',
      onPrimary: async () => { await completeHouseholdVisit(householdId) }
    })
  }

  const confirmCompleteFamily = (familyNum?: string) => {
    showModal({
      title: 'Confirm Family Visit',
      message: 'Mark this family as visited for the quarter?',
      variant: 'warn',
      primaryText: 'Proceed',
      secondaryText: 'Cancel',
      onPrimary: async () => { await completeFamilyVisit(familyNum) }
    })
  }

  const confirmMemberRemoval = (memberId?: string | number) => {
    showModal({
      title: 'Confirm Remove',
      message: 'Are you sure you want to remove this member?',
      variant: 'warn',
      primaryText: 'Remove',
      secondaryText: 'Cancel',
      onPrimary: async () => { await memberRemovalHandler(String(memberId ?? '')) }
    })
  }

  const completeHouseholdVisit = async (householdId?: string | number) => {
    if (!householdId) {
      Alert.alert('Failed', 'Household ID is missing');
      return;
    }

    try {
      // ensure resident profile is loaded so staffId is populated in the store
      await useAccountRole.getState().ensureLoaded('resident');
      const staffId = useAccountRole.getState().staffId;
      if (!staffId) {
        Alert.alert('Failed', 'Unable to determine staff ID. Please make sure you are signed in as a BHW.');
        return;
      }

      const repo = new HouseholdRepository();
      await repo.InsertHouseholdVisitCompletion(Number(householdId), staffId);
      Alert.alert('Success', 'Household visit marked complete.');
      // refresh list and close sheet
      await fetchHouseholds();
      setOpen(false);
    } catch (e: any) {
      console.error('completeHouseholdVisit error:', e);
      if (e?.name === 'HouseholdException') {
        Alert.alert('Failed', e.message ?? 'Household error');
      } else {
        Alert.alert('Failed', e?.message ?? 'Unable to mark household as completed.');
      }
    }
  }

  const completeFamilyVisit = async (familyNum?: string) => {
    if (!familyNum) {
      Alert.alert('Failed', 'Family identifier is missing');
      return;
    }

    try {
      await useAccountRole.getState().ensureLoaded('resident');
      const staffId = useAccountRole.getState().staffId;
      if (!staffId) {
        Alert.alert('Failed', 'Unable to determine staff ID. Please make sure you are signed in as a BHW.');
        return;
      }

      const repo = new HouseholdRepository();
      // resolve family id from its number
      const familyId = await repo.GetFamilyIdByFamilyNumber(String(familyNum));
      if (!familyId) {
        Alert.alert('Failed', 'Unable to resolve family id.');
        return;
      }

      await repo.InsertFamilyVisitCompletion(Number(familyId), staffId);
      Alert.alert('Success', 'Family visit marked complete.');
      await fetchHouseholds();
      setOpen(false);
    } catch (e: any) {
      console.error('completeFamilyVisit error:', e);
      if (e?.name === 'HouseholdException') {
        Alert.alert('Failed', e.message ?? 'Household error');
      } else {
        Alert.alert('Failed', e?.message ?? 'Unable to mark family as completed.');
      }
    }
  }

  /* Search execution type is used for retrieving household information.
    This identifies which operation will be used by the search service object.*/
  const [searchExecutionType, setSearchExecutionType] = useState(0)

  // centered modal filter state (used instead of inline dropdown)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [filterModalTitle, setFilterModalTitle] = useState('')
  const [filterModalItems, setFilterModalItems] = useState<{ label: string; value: any }[]>([])
  const [filterModalOnSelect, setFilterModalOnSelect] = useState<((v: any) => void) | null>(null)

  const openFilterModal = (title: string, items: { label: string; value: any }[], onSelect: (v: any) => void) => {
    setFilterModalTitle(title)
    setFilterModalItems(items)
    setFilterModalOnSelect(() => onSelect)
    setFilterModalVisible(true)
  }

  const getLabelFor = (items: { label: string; value: any }[], val: any) => items.find((i) => i.value === val)?.label ?? String(val ?? '')

  const findHousehold = async (key: string | number, executionType: number) => {
    /* Client-side search: filter the currently loaded `households` instead of calling the backend.
       - If key/executionType are missing or executionType === 0, refresh the full list.
       - Otherwise, perform a case-insensitive substring search against a few visible fields.
    */
    if (!key || !executionType || executionType === 0) {
      await fetchHouseholds();
      return;
    }

    const q = String(key).trim().toLowerCase();
    try {
      const filtered = (households || []).filter((hh: any) => {
        const householdNum = String(hh.householdNum ?? '').toLowerCase();
        const head = String(hh.householdHead ?? '').toLowerCase();
        const address = String(hh.address ?? '').toLowerCase();
        const familiesCount = hh.families ? String(hh.families.length) : '';
        const id = String(hh.id ?? '');

        // search families and members
        let familyMatch = false;
        if (Array.isArray(hh.families)) {
          for (const fam of hh.families) {
            const famNum = String(fam.familyNum ?? '').toLowerCase();
            const famHead = String(fam.headName ?? '').toLowerCase();
            if (famNum.includes(q) || famHead.includes(q)) {
              familyMatch = true;
              break;
            }
            if (Array.isArray(fam.members)) {
              for (const m of fam.members) {
                if (String(m.name ?? '').toLowerCase().includes(q)) {
                  familyMatch = true;
                  break;
                }
              }
              if (familyMatch) break;
            }
          }
        }

        return (
          householdNum.includes(q) ||
          head.includes(q) ||
          address.includes(q) ||
          familiesCount.includes(q) ||
          id.includes(q) ||
          familyMatch
        );
      });

      setVisibleHouseholds(filtered);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error performing client-side search:', error);
    }
  };

  // sync visibleHouseholds to source when households change
  useEffect(() => {
    setVisibleHouseholds(households ?? []);
    setCurrentPage(1);
  }, [households]);

  // debounce search input and trigger find
   
  useEffect(() => {
    const t = setTimeout(() => {
      const key = search ?? '';
      if (!key) {
        findHousehold('', 0);
      } else {
        findHousehold(key, 1);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return (visibleHouseholds || []).slice(start, start + itemsPerPage);
  }, [visibleHouseholds, currentPage]);

  return (
    <ThemedView style={{ flex: 1, justifyContent: "flex-start" }} safe={true}>
      <ThemedAppBar title="Designation" />

      <KeyboardAvoidingView>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 50 }}
          showsVerticalScrollIndicator={false}
        >
          <Spacer height={20} />

          {/* ADD SEARCH AND FILTERS SECTION */}
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput placeholder='Search household #, household head...' value={search} onChangeText={(text: string) => {
              setStatus(undefined)
              setWeekRange(undefined)
              setSearch(text)
              setCurrentPage(1)
            }} />
            <Spacer height={10} />
            {/* <View style={styles.filtersWrap}>
              <View style={styles.filterCol}>
                <ThemedText style={styles.filterLabel}>Status</ThemedText>
                <Pressable
                  onPress={() => openFilterModal('Status', FILTER_BY_STATUS, async (value) => {
                    setStatus(value)
                    setSearch('')
                    setWeekRange(undefined)
                    await findHousehold(value, 2)
                    setFilterModalVisible(false)
                  })}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 }}
                >
                  <ThemedText>{status ? getLabelFor(FILTER_BY_STATUS, status) : 'All'}</ThemedText>
                </Pressable>
              </View>
              <View style={styles.filterCol}>
                <ThemedText style={styles.filterLabel}>Week Range</ThemedText>
                <Pressable
                  onPress={() => openFilterModal('Week Range', FILTER_BY_WEEK, async (val) => {
                    setWeekRange(val)
                    setSearch('')
                    setStatus(undefined)
                    if (val === 'all') {
                      await fetchHouseholds()
                    } else {
                      await findHousehold(val as string, 3)
                    }
                    setFilterModalVisible(false)
                  })}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8 }}
                >
                  <ThemedText>{weekRange ? getLabelFor(FILTER_BY_WEEK, weekRange) : 'This Week'}</ThemedText>
                </Pressable>
              </View>
            </View> */}
            <Spacer height={10} />
          </View>
          {/* END SEARCH AND FILTERS SECTION */}

          {displayed.map((hh) => (
            <View key={hh.id}>
              <Pressable onPress={() => openSheet(hh)}>
                <ThemedCard>
                  <View style={styles.rowContainer}>
                    <View style={styles.rowSubContainer}>
                      <ThemedIcon
                        name={"home"}
                        bgColor={"#310101"}
                        containerSize={40}
                        size={18}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <ThemedText
                          style={{ fontWeight: "700" }}
                          subtitle={true}
                        >
                          {hh.householdNum}
                        </ThemedText>
                        <ThemedText style={{ color: "#475569" }}>
                          Household Head: {hh.householdHead}
                        </ThemedText>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} />
                  </View>

                  <View
                    style={[
                      styles.rowSubContainer,
                      { paddingBottom: 5, paddingTop: 5 },
                    ]}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color="#475569"
                    />
                    <ThemedText style={{ marginLeft: 10, color: "#475569" }}>
                      {hh.address}
                    </ThemedText>
                  </View>

                  <View style={styles.rowSubContainer}>
                    <Ionicons name="people-outline" size={16} color="#475569" />
                    <ThemedText style={{ marginLeft: 10, color: "#475569" }}>
                      {hh.families ? `${hh.families.length} Families` : 'No Families'}
                    </ThemedText>
                  </View>

                  <Spacer height={15} />

                  <ThemedButton submit={false} label={undefined} onPress={() => openSheet(hh)}>
                    <ThemedText non_btn={true}>View Details</ThemedText>
                  </ThemedButton>
                </ThemedCard>
              </Pressable>

              <Spacer />
            </View>
          ))}

          {/* Pagination controls */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <ThemedButton label="Prev" onPress={() => setCurrentPage((p) => Math.max(1, p - 1))} />
            <ThemedText>Page {currentPage} of {Math.max(1, Math.ceil((visibleHouseholds || []).length / itemsPerPage))}</ThemedText>
            <ThemedButton label="Next" onPress={() => setCurrentPage((p) => Math.min(Math.max(1, Math.ceil((visibleHouseholds || []).length / itemsPerPage)), p + 1))} />
          </View>
        </ScrollView>

        {/* overlay spinner */}
        {loadingHouseholds && (
          <View style={styles.fullScreenSpinner} pointerEvents="auto">
            <ActivityIndicator size="large" color={theme.link} />
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ---------- Bottom Sheet --------- */}
      <ThemedBottomSheet visible={open} onClose={closeSheet}>
        {selectedHousehold && (
          <View style={{ flex: 1 }}>
            {/* CORRECTED: Single household header with ellipsis */}
            <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <ThemedText subtitle>{selectedHousehold.householdNum}</ThemedText>
                <ThemedText style={{ color: '#475569' }}>{selectedHousehold.householdHead}</ThemedText>
              </View>

              <View style={styles.headerRightWrap}>
                <Pressable
                  ref={houseEllipsisRef}
                  onPress={() =>
                    openMenuAtRef(houseEllipsisRef.current, [
                      {
                        label: 'Update Household Head',
                        onPress: () => {
                          closeMenuPortal()
                          router.push({
                            pathname: '/updatehhhead',
                            params: {
                              id: selectedHousehold.id,
                              householdNum: selectedHousehold.householdNum,
                              currentHeadId: '',
                              currentHeadName: selectedHousehold.householdHead,
                            },
                          })
                        },
                      },
                      {
                        label: 'Update Household Information',
                        onPress: () => {
                          closeMenuPortal()
                          setHouseholdNumber(selectedHousehold.householdNum)
                          setHouseholdHead(selectedHousehold.householdHead)
                          clearAddress();
                          router.push({
                            pathname: '/updatehhinfo',
                            params: {
                              id: selectedHousehold.id,
                              householdNum: selectedHousehold.householdNum,
                              currentHeadId: '',
                              currentHeadName: selectedHousehold.householdHead,
                            },
                          })
                        },
                      },
                    ])
                  }
                  hitSlop={8}
                  style={{ padding: 6 }}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#475569" />
                </Pressable>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              {/* Household Info */}
              <View style={{ marginTop: 6 }}>
                <ThemedText style={{ fontWeight: "700", marginBottom: 6 }}>
                  Household Information
                </ThemedText>
                <View style={styles.kvRow}>
                  <ThemedText>Household Head</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.householdHead}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>Household No.</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.householdNum}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>House Type</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.houseType}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>House Ownership</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.houseOwnership}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>Home Address</ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.address}
                  </ThemedText>
                </View>
              </View>

              {/* Families */}
              <View style={{ marginTop: 16 }}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>
                    Families in this Household
                  </ThemedText>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <ThemedChip
                      label={"Add Family Unit"}
                      onPress={() => {
                        // store household number in the basic household info store before navigating
                        const hhNumAny = (selectedHousehold as any)?.householdNum ?? (selectedHousehold as any)?.householdNum ?? null;
                        const hhNum = hhNumAny != null ? String(hhNumAny) : null;
                        console.log('Adding family to household number:', hhNum);
                        try {
                          setHouseholdNumber(hhNum);
                        } catch (e) {
                          console.warn('setHouseholdNumber failed', e);
                        }
                        router.push("/createfamily");
                      }}
                      filled={false}
                    />
                    <ThemedChip
                      label={"Complete"}
                      onPress={() => confirmCompleteHousehold(selectedHousehold?.id)}
                      filled={true}
                    />
                  </View>
                </View>

                <ScrollView
                  ref={familiesScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onFamiliesScroll}
                  scrollEventThrottle={16}
                >
                  {selectedHousehold.families.map((fam) => {
                    const key = `${selectedHousehold.id}:${fam.familyNum}`
                    return (
                      <View
                        key={fam.familyNum}
                        style={{ width: SCREEN_WIDTH - 16, paddingRight: 16 }}
                      >
                        <View style={[styles.familyCover, { justifyContent: 'space-between' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Ionicons name="home-outline" size={20} color="#475569" />
                            <View style={{ marginLeft: 10, flex: 1 }}>
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

                          <View style={styles.headerRightWrap}>
                            <Pressable
                              ref={(r) => { familyEllipsisRefs.current[key] = r }}
                              onPress={() =>
                                openMenuAtRef(familyEllipsisRefs.current[key], [
                                  {
                                    label: 'Update Family Head',
                                    onPress: () => {
                                      closeMenuPortal()
                                      router.push({
                                        pathname: '/updatefamhead',
                                        params: {
                                          id: selectedHousehold.id,
                                          householdNum: selectedHousehold.householdNum,
                                          familyNum: fam.familyNum,
                                          currentHeadName: fam.headName,
                                        },
                                      })
                                    },
                                  },
                                  {
                                    label: 'Update Family Information',
                                    onPress: () => {
                                      closeMenuPortal()
                                      router.push({
                                        pathname: '/updatefaminfo',
                                        params: {
                                          id: selectedHousehold.id,
                                          householdNum: selectedHousehold.householdNum,
                                          familyNum: fam.familyNum,
                                          familyHeadName: fam.headName,
                                        },
                                      })
                                    },
                                  },
                                ])
                              }
                              hitSlop={8}
                              style={{ paddingLeft: 8, paddingVertical: 6 }}
                            >
                              <Ionicons name="ellipsis-vertical" size={18} color="#475569" />
                            </Pressable>
                          </View>
                        </View>

                        <Spacer height={10} />

                        <View style={styles.sectionHeaderRow}>
                          <ThemedText style={styles.sectionTitle}>
                            Members
                          </ThemedText>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <ThemedChip
                              label={"Add Member"}
                              onPress={() => onPressAddMember(fam.familyNum)}
                              filled={false}
                            />
                            <ThemedChip
                              label={"Complete"}
                              onPress={() => confirmCompleteFamily(fam.familyNum)}
                              filled={true}
                            />
                          </View>
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
                          <ThemedText
                            style={{ color: "#64748b", fontStyle: "italic" }}
                          >
                            There is no family member in this family.
                          </ThemedText>
                        )}
                      </View>
                    )
                  })}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}
      </ThemedBottomSheet>
      {/* --------- MENU PORTAL (always on top) ---------- */}
      <Modal transparent visible={menuPortal.visible} animationType="fade" onRequestClose={closeMenuPortal}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenuPortal} />
        <View style={[styles.portalMenu, { top: menuPortal.y, left: menuPortal.x }]}>
          {menuPortal.items?.map((it, idx) => (
            <Pressable
              key={it.label}
              onPress={it.onPress}
              style={[styles.menuItem, idx === menuPortal.items.length - 1 && styles.menuItemLast]}
            >
              <ThemedText>{it.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Modal>
      <ThemedBottomSheet visible={removeOpen} onClose={() => setRemoveOpen(false)} heightPercent={0.85}>
        <View style={{ flex: 1 }}>
          {/* Scrollable content above the fixed footer */}
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }} // leave room for footer
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
                      {pendingRemoval.member.relation} • {pendingRemoval.member.sex} • {pendingRemoval.member.age} years
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
            <View style={{ marginTop: 16, gap: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Select a Reason</ThemedText>
              {/* Use your ThemedDropdown — order=0 => highest zIndex so menu overlays footer */}
              <ThemedDropdown
                placeholder="Select a Reason"
                items={REMOVAL_REASONS.map(r => ({ label: r, value: r }))}
                value={selectedReason}
                setValue={setSelectedReason}
                order={0}
              />
            </View>
          </ScrollView>
          {/* Fixed footer with actions */}
          <View style={styles.sheetFooter}>
            <ThemedButton
              submit={false}
              onPress={() => setRemoveOpen(false)}
              style={{ flex: 1 }} label={undefined}              
            >
              <ThemedText non_btn>Cancel</ThemedText>
            </ThemedButton>
            <View style={{ width: 10 }} />
            <ThemedButton
              style={{ flex: 1 }} label={undefined}            >
              <ThemedText onPress={() => confirmMemberRemoval(pendingRemoval?.member.id)} btn>Confirm Remove</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </ThemedBottomSheet>
      {/* Centered modal used for filters (status / week range) */}
      <CenteredModal visible={filterModalVisible} title={filterModalTitle} onClose={() => setFilterModalVisible(false)}>
        {filterModalItems.map((it) => (
          <Pressable
            key={String(it.value)}
            onPress={() => {
              try {
                filterModalOnSelect && filterModalOnSelect(it.value)
              } finally {
                setFilterModalVisible(false)
              }
            }}
            style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
          >
            <ThemedText>{it.label}</ThemedText>
          </Pressable>
        ))}
      </CenteredModal>
    </ThemedView>
  );
};

export default HouseholdList;

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 5,
  },
  rowSubContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  kvRow: {},
  kvKey: { color: "#64748b", minWidth: 120 },
  kvVal: {
    fontWeight: "600",
    color: "#0f172a",
    flexShrink: 1,
    textAlign: "right",
  },

  familyCover: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E9EDEF",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  memberGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  badgeText: { fontSize: 12, color: "#334155" },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  optionPanel: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 6
  },
  optionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textField: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF'
  },
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
  sectionTitle: { fontWeight: "700", flexShrink: 1 },
  filtersWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  filterCol: { flex: 1, minWidth: 0 },
  filterLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  headerRightWrap: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  menuItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemLast: { borderBottomWidth: 0 },
  portalMenu: {
    position: 'absolute',
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 50,
    zIndex: 9999,
  },
  fullScreenSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
