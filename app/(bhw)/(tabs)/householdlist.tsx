import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedBottomSheet from '@/components/ThemedBottomSheet'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Dimensions, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

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

const HouseholdList = () => {
  const router = useRouter()

  const household: Household = {
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
  }

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

  const onPressMember = (fam: Family, mem: Member) => {
    closeSheet()
    router.push({
      pathname: '/memberprofile',
      params: { id: mem.id },
    })
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar 
        title='List of Household'
      />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer height={20} />

          <Pressable onPress={() => openSheet(household)}>
            <ThemedCard>
              <View style={styles.rowContainer}>
                <View style={styles.rowSubContainer}>
                  <ThemedIcon
                    name={'home-outline'}
                    iconColor={'#475569'}
                    bgColor={'#ccd4dfff'}
                    shape="round"
                    containerSize={40}
                    size={18}
                  />
                  <View style={{ marginLeft: 10 }}>
                    <ThemedText style={{ fontWeight: '700' }} subtitle={true}>
                      {household.householdNum}
                    </ThemedText>
                    <ThemedText style={{ color: '#475569' }}>
                      Household Head: {household.householdHead}
                    </ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} />
              </View>

              <View style={[styles.rowSubContainer, { paddingBottom: 5, paddingTop: 5 }]}>
                <Ionicons name="location-outline" size={16} color="#475569" />
                <ThemedText style={{ marginLeft: 10, color: '#475569' }}>{household.address}</ThemedText>
              </View>

              <View style={styles.rowSubContainer}>
                <Ionicons name="people-outline" size={16} color="#475569" />
                <ThemedText style={{ marginLeft: 10, color: '#475569' }}>
                  {household.families.length} Families
                </ThemedText>
              </View>

              <Spacer height={15} />

              <ThemedButton submit={false} onPress={() => openSheet(household)}>
                <ThemedText non_btn={true}>View Details</ThemedText>
              </ThemedButton>
            </ThemedCard>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab}>
        <ThemedIcon name={'add'} bgColor="#310101" size={24} />
      </TouchableOpacity>

      {/* ---------- Bottom Sheet --------- */}
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
                  <ThemedText>
                    Household Head
                  </ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.houseType}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>
                    Household No.
                  </ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.houseOwnership}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>
                    House Type
                  </ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.address}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>
                    House Ownership
                  </ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.address}
                  </ThemedText>
                </View>
                <View style={styles.kvRow}>
                  <ThemedText>
                    Home Address
                  </ThemedText>
                  <ThemedText style={styles.kvVal}>
                    {selectedHousehold.address}
                  </ThemedText>
                </View>
              </View>

              {/* Families */}
              <View style={{ marginTop: 16 }}>
                <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>
                  Families in this Household
                </ThemedText>

                <ScrollView
                  ref={familiesScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onFamiliesScroll}
                  scrollEventThrottle={16}
                >
                  {selectedHousehold.families.map((fam) => (
                    <View key={fam.familyNum} style={{ width: SCREEN_WIDTH - 32, paddingRight: 16 }}>
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

                      <ThemedText style={{ fontWeight: '700', marginBottom: 6, marginTop: 10 }}>Members</ThemedText>
                      {fam.members.length > 0 ? (
                        <View style={styles.memberGrid}>
                          {fam.members.map((m) => (
                            <Pressable key={m.id} onPress={() => onPressMember(fam, m)} style={styles.memberPill}>
                              <ThemedText>{m.name}</ThemedText>
                            </Pressable>
                          ))}
                        </View>
                      ) : (
                        <ThemedText style={{ color: '#64748b', fontStyle: 'italic' }}>There is no family member in this family.</ThemedText>
                      )}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}
      </ThemedBottomSheet>
    </ThemedView>
  )
}

export default HouseholdList

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
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },

  kvRow: {
    
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
  memberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  memberPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2F7',
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  badgesRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  badgeText:   { fontSize: 12, color: '#334155' },
})
