// (unchanged imports from your last HouseholdList – plus we removed the remove sheet)
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
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
  findNodeHandle,
} from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

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

// ---- Types for the floating portal menu ----
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
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState()
  const [weekRange, setWeekRange] = useState()

  const [households] = useState<Household[]>([
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
    { id: 'HH-2024-111', householdNum: 'HH-2024-001', householdHead: 'Raphael H. Bellosillo', address: 'Purok 3, Sitio San Roque', houseType: 'Concrete', houseOwnership: 'Owned', families: [] },
    { id: 'HH-2024-112', householdNum: 'HH-2024-001', householdHead: 'Raphael H. Bellosillo', address: 'Purok 3, Sitio San Roque', houseType: 'Concrete', houseOwnership: 'Owned', families: [] },
  ])

  // ---------- details bottom sheet ----------
  const [open, setOpen] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [familyIndex, setFamilyIndex] = useState(0)
  const familiesScrollRef = useRef<ScrollView>(null)
  const openSheet = (item: Household) => {
    setSelectedHousehold(item)
    setOpen(true)
    setFamilyIndex(0)
    setTimeout(() => familiesScrollRef.current?.scrollTo({ x: 0, animated: false }), 0)
  }
  const closeSheet = () => setOpen(false)
  const onFamiliesScroll = (e: any) => setFamilyIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))

  const onPressMember = (fam: Family, mem: Member) => {
    closeSheet()
    router.push({ pathname: '/memberprofile', params: { id: mem.id } })
  }

  // ---------- Floating MENU PORTAL (Modal) ----------
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

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title='List of Household' />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer height={20} />

          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput placeholder='Search household #, household head...' value={search} onChangeText={setSearch} />
            <Spacer height={10} />
            <View style={styles.filtersWrap}>
              <View style={styles.filterCol}>
                <ThemedText style={styles.filterLabel}>Status</ThemedText>
                <ThemedDropdown placeholder="All" items={[]} value={status} setValue={setStatus} order={0} />
              </View>
              <View style={styles.filterCol}>
                <ThemedText style={styles.filterLabel}>Week Range</ThemedText>
                <ThemedDropdown placeholder="This Week" items={[]} value={weekRange} setValue={setWeekRange} order={0} />
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
                      <ThemedIcon name={'home'} bgColor={'#310101'} containerSize={40} size={18} />
                      <View style={{ marginLeft: 10 }}>
                        <ThemedText style={{ fontWeight: '700' }} subtitle={true}>{hh.householdNum}</ThemedText>
                        <ThemedText style={{ color: '#475569' }}>Household Head: {hh.householdHead}</ThemedText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.rowSubContainer, { paddingBottom: 5, paddingTop: 5 }]}>
                    <Ionicons name="location-outline" size={16} color="#475569" />
                    <ThemedText style={{ marginLeft: 10, color: '#475569' }}>{hh.address}</ThemedText>
                  </View>

                  <View style={styles.rowSubContainer}>
                    <Ionicons name="people-outline" size={16} color="#475569" />
                    <ThemedText style={{ marginLeft: 10, color: '#475569' }}>{hh.families.length} Families</ThemedText>
                  </View>

                  <Spacer height={15} />

                  <ThemedButton submit={false} onPress={() => openSheet(hh)}>
                    <ThemedText non_btn={true}>View Details</ThemedText>
                  </ThemedButton>
                </ThemedCard>
              </Pressable>

              <Spacer />
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- Household Bottom Sheet (details) --------- */}
      <ThemedBottomSheet visible={open} onClose={() => setOpen(false)}>
        {selectedHousehold && (
          <View style={{ flex: 1 }}>
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
                            // 👇 go to your UpdateHhHead screen and pass context
                            router.push({
                              pathname: '/updatehhhead',   // or '/update-hh-head' if that’s your file name
                              params: {
                                id: selectedHousehold.id,
                                householdNum: selectedHousehold.householdNum,
                                currentHeadId: '', // put the current head's person_id if you have it
                                currentHeadName: selectedHousehold.householdHead,
                              },
                            })
                          },
                        },
                      {
                        label: 'Update Household Information',
                        onPress: () => {
                            closeMenuPortal()
                            // 👇 go to your UpdateHhHead screen and pass context
                            router.push({
                              pathname: '/updatehhinfo',   // or '/update-hh-head' if that’s your file name
                              params: {
                                id: selectedHousehold.id,
                                householdNum: selectedHousehold.householdNum,
                                currentHeadId: '', // put the current head's person_id if you have it
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

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false} style={{ flexGrow: 0 }}>
              {/* Household Info (unchanged) */}
              <View style={{ marginTop: 6 }}>
                <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Household Information</ThemedText>
                <View style={styles.kvRow}><ThemedText>Household Head</ThemedText><ThemedText style={styles.kvVal}>{selectedHousehold.houseType}</ThemedText></View>
                <View style={styles.kvRow}><ThemedText>Household No.</ThemedText><ThemedText style={styles.kvVal}>{selectedHousehold.houseOwnership}</ThemedText></View>
                <View style={styles.kvRow}><ThemedText>House Type</ThemedText><ThemedText style={styles.kvVal}>{selectedHousehold.address}</ThemedText></View>
                <View style={styles.kvRow}><ThemedText>House Ownership</ThemedText><ThemedText style={styles.kvVal}>{selectedHousehold.address}</ThemedText></View>
                <View style={styles.kvRow}><ThemedText>Home Address</ThemedText><ThemedText style={styles.kvVal}>{selectedHousehold.address}</ThemedText></View>
              </View>

              {/* Families */}
              <View style={{ marginTop: 16 }}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>Families in this Household</ThemedText>
                  <ThemedChip label={'Add Family Unit'} onPress={() => router.push('/createfamily')} filled={false} />
                </View>

                <ScrollView ref={familiesScrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onFamiliesScroll} scrollEventThrottle={16}>
                  {selectedHousehold.families.map((fam) => {
                    const key = `${selectedHousehold.id}:${fam.familyNum}`
                    return (
                      <View key={fam.familyNum} style={{ width: SCREEN_WIDTH - 16, paddingRight: 16 }}>
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
                                        // 👇 go to your UpdateHhHead screen and pass context
                                        router.push({
                                          pathname: '/updatefamhead',   // or '/update-hh-head' if that’s your file name
                                          params: {
                                            id: selectedHousehold.id,
                                            householdNum: selectedHousehold.householdNum,
                                            currentHeadId: '', // put the current head's person_id if you have it
                                            currentHeadName: selectedHousehold.householdHead,
                                          },
                                        })
                                      },
                                    },
                                  {
                                label: 'Update Family Information',
                                onPress: () => {
                                    closeMenuPortal()
                                    // 👇 go to your UpdateHhHead screen and pass context
                                    router.push({
                                      pathname: '/updatefaminfo',   // or '/update-hh-head' if that’s your file name
                                      params: {
                                        id: selectedHousehold.id,
                                        householdNum: selectedHousehold.householdNum,
                                        currentHeadId: '', // put the current head's person_id if you have it
                                        currentHeadName: selectedHousehold.householdHead,
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
                          <ThemedText style={styles.sectionTitle}>Members</ThemedText>
                          <ThemedChip label={'Add Member'} onPress={() => router.push('/addmember')} filled={false} />
                        </View>

                        {fam.members.length > 0 ? (
                          <View style={styles.memberGrid}>
                            {fam.members.map((m) => (
                              <ThemedChip
                                key={m.id}
                                label={m.name}
                                onPress={() => onPressMember(fam, m)}
                                // ⬇️ Removed the X/remove trigger
                                // removable
                                // onRemove={() => {
                                //   closeSheet();
                                //   router.push({ pathname: '/memberprofile', params: { id: m.id, openRemove: '1' } });
                                // }}
                              />
                            ))}
                          </View>
                        ) : (
                          <ThemedText style={{ color: '#64748b', fontStyle: 'italic' }}>
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
    </ThemedView>
  )
}

export default HouseholdList

const styles = StyleSheet.create({
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  rowSubContainer: { flexDirection: 'row', alignItems: 'center' },
  kvRow: {},
  kvKey: { color: '#64748b', minWidth: 120 },
  kvVal: { fontWeight: '600', color: '#0f172a', flexShrink: 1, textAlign: 'right' },

  filtersWrap: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  filterCol: { flex: 1, minWidth: 0 },
  filterLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },

  familyCover: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E9EDEF', borderRadius: 12, padding: 12, backgroundColor: '#fff',
  },
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  badgeText: { fontSize: 12, color: '#334155' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 },
  sectionTitle: { fontWeight: '700', flexShrink: 1 },

  selectBox: {
    borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between'
  },
  optionPanel: { borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', borderRadius: 10, overflow: 'hidden', marginTop: 6 },
  optionItem: { paddingHorizontal: 12, paddingVertical: 10 },
  textField: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FFFFFF' },
  sheetFooter: {
    position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', zIndex: 1,
  },

  headerRightWrap: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  menuItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuItemLast: { borderBottomWidth: 0 },

  portalMenu: {
    position: 'absolute', minWidth: 240, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 6 },
    elevation: 50, zIndex: 9999,
  },
})
