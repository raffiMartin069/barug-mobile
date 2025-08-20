import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedBottomSheet from '@/components/ThemedBottomSheet'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useRef, useState } from 'react'
import { Dimensions, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native'

const SCREEN_WIDTH = Dimensions.get('window').width

const Avatar = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <View style={styles.avatar}>
      <ThemedText style={styles.avatarText}>{initials}</ThemedText>
    </View>
  )
}

/* ------------ Types ------------- */
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

type Request = {
  id: string
  name: string
  status: string
  submittedAt: string
  address: string
  reason: string
  householdHead: string
  householdNum: string
  houseType: string
  houseOwnership: string
  families: Family[]
}

/* -------- Member Details Modal (simple) -------- */
function MemberDetailsModal({
  visible, onClose, member, family,
}: {
  visible: boolean
  onClose: () => void
  member: Member | null
  family: Family | null
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={styles.memberAvatar}>
              <ThemedText style={{ fontWeight: '700', color: '#334155' }}>
                {(member?.name ?? '?').split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={{ fontWeight: '700' }}>{member?.name ?? '—'}</ThemedText>
            </View>
          </View>

          <View style={styles.kv}>
            <View style={styles.kvItem}><ThemedText style={[styles.kvKey, { fontWeight: 'bold' }]}>Personal Information</ThemedText></View>
            <View style={styles.kvItem}><ThemedText style={styles.kvKey}>Relation</ThemedText><ThemedText style={styles.kvVal}>{member?.relation ?? '—'}</ThemedText></View>
            <View style={styles.kvItem}><ThemedText style={styles.kvKey}>Age</ThemedText><ThemedText style={styles.kvVal}>{member?.age ?? '—'}</ThemedText></View>
            <View style={styles.kvItem}><ThemedText style={styles.kvKey}>Sex</ThemedText><ThemedText style={styles.kvVal}>{member?.sex ?? '—'}</ThemedText></View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            <ThemedButton submit={false} style={{ flex: 1 }} onPress={onClose}>
              <ThemedText non_btn>Close</ThemedText>
            </ThemedButton>
            <ThemedButton style={{ flex: 1 }} onPress={() => {/* navigate to profile if you have route */}} >
              <ThemedText non_btn>View Full Profile</ThemedText>
            </ThemedButton>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const HouseholdVisit = () => {
  const router = useRouter()

  const req: Request = {
    id: 'REQ-000187',
    name: 'Juan Dela Cruz',
    status: 'Pending',
    submittedAt: '2025-08-09 14:12',
    address: 'Purok 3, Sitio San Roque',
    reason: 'Verify new household head & update family members',
    householdHead: 'Bellosillo, Raphael H.',
    householdNum: 'HH-000123',
    houseType: 'Concrete',
    houseOwnership: 'Owned',
    families: [
      {
        familyNum: 'FAM-001',
        headName: 'Bellosillo, Raphael H.',
        type: 'NUCLEAR',
        nhts: 'YES',
        indigent: 'NO',
        monthlyIncome: '₱15,000 - ₱20,000',
        sourceIncome: 'Employment',
        members: [
          { id: 'P-1', name: 'Raphael Bellosillo', relation: 'HEAD', age: 45, sex: 'Male' },
          { id: 'P-2', name: 'Ana Bellosillo', relation: 'SPOUSE', age: 43, sex: 'Female' },
          { id: 'P-3', name: 'Miko Bellosillo', relation: 'CHILD', age: 16, sex: 'Male' },
        ],
      },
      {
        familyNum: 'FAM-002',
        headName: 'Cruz, Juan D.',
        type: 'EXTENDED',
        nhts: 'NO',
        indigent: 'NO',
        monthlyIncome: '₱10,000 - ₱15,000',
        sourceIncome: 'Self-Employed',
        members: [
          { id: 'P-4', name: 'Juan Dela Cruz', relation: 'HEAD', age: 35, sex: 'Male' },
          { id: 'P-5', name: 'Maria Dela Cruz', relation: 'SPOUSE', age: 34, sex: 'Female' },
        ],
      },
    ],
  }

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Request | null>(null)

  const [familyIndex, setFamilyIndex] = useState(0)
  const familiesScrollRef = useRef<ScrollView>(null)

  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  const openSheet = (item: Request) => {
    setSelected(item)
    setOpen(true)
    setFamilyIndex(0)
    setTimeout(() => {
      familiesScrollRef.current?.scrollTo({ x: 0, animated: false })
    }, 0)
  }

  const closeSheet = () => setOpen(false)

  const onPressMember = (fam: Family, mem: Member) => {
    setSelectedFamily(fam)
    setSelectedMember(mem)
    setOpen(false)
    router.push({
      pathname: '/memberprofile',
    })
  }

  const onFamiliesScroll = (e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setFamilyIndex(idx)
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar/>

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer height={20}/>
          
          <Pressable onPress={() => openSheet(req)}>
            <ThemedCard>
              <View style={styles.rowContainer}>
                <View style={styles.rowSubContainer}>
                  <Avatar name={req.name} />
                  <View style={{ marginLeft: 10 }}>
                    <ThemedText style={{ fontWeight: '700' }} subtitle={true}>{req.name}</ThemedText>
                    <ThemedText style={{ color: '#475569' }}>{req.status}</ThemedText>
                  </View>
                </View>
                <Ionicons name='chevron-forward' size={18} />
              </View>

              <ThemedText style={{ marginLeft: 10, color: '#475569' }}>{req.reason}</ThemedText>
              <Spacer height={10}/>
              <View style={styles.rowSubContainer}>
                <Ionicons name='calendar-outline' size={16} color='#475569' />
                <ThemedText style={{ marginLeft: 10, color: '#475569' }}>{req.submittedAt}</ThemedText>
              </View>

              <Spacer height={10}/>
              <Pressable onPress={() => openSheet(req)}>
                <ThemedButton submit={false}>
                  <ThemedText non_btn>View Details</ThemedText>
                </ThemedButton>
              </Pressable>
            </ThemedCard>
          </Pressable>

          <Spacer height={20}/>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTTOM SHEET */}
      <ThemedBottomSheet visible={open} onClose={closeSheet}>
        {selected && (
          <View style={{ flex: 1 }}>
            {/* Handle + Header */}
            <View style={{ marginBottom: 8 }}>
              <ThemedText subtitle>{selected.name}</ThemedText>
              <View style={styles.pillRow}>
                <View style={styles.pill}><ThemedText style={styles.pillText}>{selected.status}</ThemedText></View>
                <View style={[styles.pill, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                  <ThemedText style={[styles.pillText, { color: '#334155' }]}>{selected.id}</ThemedText>
                </View>
              </View>
            </View>

            {/* Scrollable content */}
            <ScrollView
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              {/* Household */}
              <View style={{ marginTop: 6 }}>
                <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Household</ThemedText>
                  <View>
                    <View style={styles.kvRow}>
                      <ThemedText compact style={styles.kvKey}>Household Head</ThemedText>
                      <ThemedText compact style={styles.kvVal}>{selected.householdHead}</ThemedText>
                    </View>
                    <View style={styles.kvRow}>
                      <ThemedText compact style={styles.kvKey}>Household No.</ThemedText>
                      <ThemedText compact style={styles.kvVal}>{selected.householdNum}</ThemedText>
                    </View>
                    <View style={styles.kvRow}>
                      <ThemedText compact style={styles.kvKey}>House Type</ThemedText>
                      <ThemedText compact style={styles.kvVal}>{selected.houseType}</ThemedText>
                    </View>
                    <View style={styles.kvRow}>
                      <ThemedText compact style={styles.kvKey}>House Ownership</ThemedText>
                      <ThemedText compact style={styles.kvVal}>{selected.houseOwnership}</ThemedText>
                    </View>
                    <View style={styles.kvRow}>
                      <ThemedText compact style={styles.kvKey}>Home Address</ThemedText>
                      <ThemedText compact style={styles.kvVal} numberOfLines={2}>
                        {selected.address}
                      </ThemedText>
                    </View>
                  </View>
              </View>

              {/* Families */}
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <ThemedText style={{ fontWeight: '700' }}>Families in this Household</ThemedText>
                  <ThemedText style={{ color: '#64748b' }}>{selected.families.length} Families</ThemedText>
                </View>

                <ScrollView
                  ref={familiesScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={onFamiliesScroll}
                  scrollEventThrottle={16}
                >
                  {selected.families.map((fam) => (
                    <View key={fam.familyNum} style={{ width: SCREEN_WIDTH - 32, paddingRight: 16 }}>
                      <View style={styles.familyCover}>
                        <View style={styles.coverIcon}>
                          <Ionicons name="home-outline" size={20} color="#475569" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={styles.familyTitle}>{fam.familyNum}</ThemedText>
                          <ThemedText style={{ color: '#64748b', marginTop: 2 }}>
                            Family Head: <ThemedText style={{ fontWeight: '700' }}>{fam.headName}</ThemedText> · Family No: <ThemedText style={{ fontWeight: '700' }}>{fam.familyNum}</ThemedText>
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
                          {fam.members.map(m => (
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


      {/* Member details modal */}
      <MemberDetailsModal
        visible={memberModalOpen}
        onClose={() => setMemberModalOpen(false)}
        member={selectedMember}
        family={selectedFamily}
      />
    </ThemedView>
  )
}

export default HouseholdVisit

/* ------------------- styles ------------------- */
const styles = StyleSheet.create({
  avatar: {
    height: 40, width: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  avatarText: { fontWeight: '700', color: '#334155' },
  rowContainer: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginVertical: 5,
  },
  rowSubContainer: { flexDirection: 'row', alignItems: 'center' },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  pill: {
    borderWidth: 1, borderColor: '#E9EDEF', backgroundColor: '#F1F5F9',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, alignSelf: 'flex-start',
  },
  pillText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  kv: { rowGap: 6 },
  kvItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',          // keeps rows tight
    paddingVertical: 6,            // small, consistent spacing
    gap: 12,
  },
  kvRow: {
    
  },
  kvKey: { color: '#64748b', minWidth: 120 },
  kvVal: { fontWeight: '600', color: '#0f172a', flexShrink: 1, textAlign: 'right' },

  familyCover: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E9EDEF', borderRadius: 12, padding: 12, backgroundColor: '#fff'
  },
  coverIcon: {
    width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F1F5F9'
  },
   familyTitle: { fontWeight: '700', fontSize: 16 },
  badgesRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge:       { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  badgeText:   { fontSize: 12, color: '#334155' },

  memberGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberPill:  { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#EEF2F7', borderWidth: 1, borderColor: '#E5EAF0' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 16, backgroundColor: '#fff', padding: 16 },
  memberAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
})
