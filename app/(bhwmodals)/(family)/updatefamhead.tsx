import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
// ThemedSearchSelect removed; selection is via CenteredModal
import CenteredModal from '@/components/custom/CenteredModal'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Colors } from '@/constants/Colors'
import { HouseholdException } from '@/exception/HouseholdException'
import { useNiceModal } from '@/hooks/NiceModalProvider'
// usePersonSearchByKey removed; selection is via CenteredModal
// HouseholdCommand not used in this screen
import { HouseholdRepository } from '@/repository/householdRepository'
import { FamilyQuery } from '@/repository/queries/FamilyQuery'
import { useAccountRole } from '@/store/useAccountRole'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native'

type Resident = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

/** Demo data. Replace with your fetched residents list */
// Demo residents removed - real data fetched from FamilyQuery

type ChangeReason =
  | 'MOVED OUT'
  | 'DECEASED'
  | 'DATA CORRECTION'
  | 'DUPLICATE ENTRY'
  | 'OTHER'

const CHANGE_REASONS: ChangeReason[] = [
  'MOVED OUT',
  'DECEASED',
  'DATA CORRECTION',
  'DUPLICATE ENTRY',
  'OTHER',
]

/**
 * Navigate with (example):
 * /update-fam-head?householdId=HH-2024-001&familyNum=FAM-002&currentHeadId=P-002&currentHeadName=Maria%20Santos
 */
const UpdateFamHead = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id?: string
    familyNum?: string
    householdNum?: string
    currentHeadName?: string
  }>()

  const householdId     = params.id ?? ''
  const familyNum       = params.familyNum ?? ''
  const householdNum   = params.householdNum ?? ''
  const currentHeadName = params.currentHeadName ?? '—'

  console.log('UpdateFamHead params:', {
    householdId,
    familyNum,
    householdNum,
    currentHeadName,
  });

  // New head selection
  const [newHeadId, setNewHeadId] = useState<string>('')
  const [newHeadName, setNewHeadName] = useState<string>('')
  const [residentList, setResidentList] = useState<Resident[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [refreshing, setRefreshing] = useState(false)


  // Reason
  const [reason, setReason] = useState<ChangeReason | null>(null)
  const [otherReason, setOtherReason] = useState('')

  const profile = useAccountRole((s) => s.getProfile('resident'))
  const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null
  
  const reasonItems = useMemo(
    () => CHANGE_REASONS.map(r => ({ label: r, value: r })),
    []
  )

  const repository = new HouseholdRepository()
  const { showModal } = useNiceModal()

  const famQuery = useMemo(() => new FamilyQuery(), [])

  // fetch family members when modal opens
  const fetchFamilyMembers = async () => {
    if (!familyNum) return
    setRefreshing(true)
    setIsLoadingMembers(true)
    try {
      const fam = await famQuery.FetchActiveFamilyByFamilyNum(familyNum)
      const familyId = fam?.family_id
      if (!familyId) {
        showModal({ title: 'Family Not Found', message: 'Family not found. Please check the family number.', variant: 'warn', primaryText: 'OK' })
        setResidentList([])
        return
      }
      const members = await famQuery.FetchAllFamilyMemberByFamilyId(Number(familyId))
      if (!Array.isArray(members)) {
        setResidentList([])
        return
      }

      const currentHeadId = await famQuery.FetchActiveFamilyByFamilyNum(familyNum).then(f => f?.family_head_id ?? null)

      const active: Resident[] = members
        .filter((m: any) => Boolean(m.is_active))
        .map((m: any) => {
          console.log('Family member data:', m)

          // exclude the current family head
          if (String(m.person_id) === String(currentHeadId)) return null

          if (!m.is_active 
              || m.person.person_status.person_status_name !== "ACTIVE" 
              || m.person.residential_status.residential_status_name !== "RESIDENT"
            ) {
            return null
          }

          const p = m.person ?? {}
          const middleInitial = p.middle_name ? `${String(p.middle_name).trim()[0].toUpperCase()}.` : ''
          const fullName = `${String(p.first_name ?? '').toUpperCase()} ${middleInitial} ${String(p.last_name ?? '').toUpperCase()}`.replace(/\s+/g, ' ').trim()
          return {
            person_id: String(p.person_id),
            full_name: fullName,
            person_code: p.person_code,
            address: '',
          }
        })
        .filter(Boolean) as Resident[]

      setResidentList(active)
    } catch (e) {
      console.error('fetchFamilyMembers error', e)
      setResidentList([])
    } finally {
      setIsLoadingMembers(false)
      setRefreshing(false)
    }
  }

  const canSubmit =
    !!newHeadId &&
    newHeadId !== familyNum &&
    !!reason &&
    (reason !== 'OTHER' || otherReason.trim().length > 2)

  const handleSubmit = () => {
    const updateInfo = async() => {
      try {
        const finalReason = reason === "OTHER" ? otherReason.trim() : reason!;
        const familyId = await repository.GetFamilyIdByFamilyNumber(familyNum);
        if (!familyId) {
          showModal({ title: 'Warning', message: 'Family not found. Please check the family number and try again.', variant: 'warn', primaryText: 'OK' })
          return;
        }
        const result = await repository.UpdateFamilyHead(familyId, Number(newHeadId), parseInt(addedById ?? '1'), finalReason);
        if (!result) {
          showModal({ title: 'Error', message: 'Failed to update family head. Please try again.', variant: 'error', primaryText: 'OK' })
          return;
        }
        showModal({ title: 'Success', message: 'Family head updated successfully.', variant: 'success', primaryText: 'OK', onPrimary: () => router.back() })
      } catch (error) {
        if (error instanceof HouseholdException) {
          showModal({ title: 'Warning', message: error.message, variant: 'warn', primaryText: 'OK' })
          return;
        }
        console.error('Failed to update family head:', error);
        showModal({ title: 'Error', message: 'An unexpected error occurred. Please try again later.', variant: 'error', primaryText: 'OK' })
      }
    }
    updateInfo();
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar
        title="Update Family Head"
        showNotif={true}
        showProfile={true}
      />

      <ThemedKeyboardAwareScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchFamilyMembers} />}
      >
        <ThemedCard>
          <ThemedText title>
            {'FAM-001'}
          </ThemedText>

          <Spacer height={12} />

          {/* Current family head (read-only) */}
          <ThemedText style={styles.label}>Current Family Head</ThemedText>
          <ThemedTextInput value={currentHeadName} editable={false} pointerEvents="none" onChangeText={''}/>

          <Spacer height={16} />

          {/* New family head search & select */}
          <ThemedText style={styles.label}>New Family Head</ThemedText>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText style={styles.link} onPress={() => { setModalVisible(true); fetchFamilyMembers(); }}>
              Choose from family members
            </ThemedText>
            {isLoadingMembers && (
              <View style={{ marginLeft: 8 }}>
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            )}
          </View>

          <ThemedTextInput
            placeholder="Selected Family Head"
            value={newHeadName}
            editable={false}
            onChangeText={() => {}}
          />

          {newHeadId === familyNum && newHeadId !== '' && (
            <ThemedText style={styles.helper}>
              Selected resident is already the current family head.
            </ThemedText>
          )}

          <Spacer height={20} />

          {/* Reason for change */}
          <ThemedText style={styles.label}>Reason for Change</ThemedText>
          <ThemedDropdown
            placeholder="Select a Reason"
            items={reasonItems}
            value={reason}
            setValue={setReason}
            order={0}
          />

          {reason === 'OTHER' && (
            <>
              <Spacer height={8} />
              <ThemedText style={styles.label}>Please specify</ThemedText>
              <ThemedTextInput
                placeholder="Enter reason"
                value={otherReason}
                onChangeText={setOtherReason}
                multiline
              />
            </>
          )}

          <Spacer height={20} />

          <ThemedButton disabled={!canSubmit} onPress={() => showModal({
            title: 'Update Family Head',
            message: 'Are you sure you want to update the family head?',
            variant: 'info',
            primaryText: 'Update',
            secondaryText: 'Cancel',
            onPrimary: () => handleSubmit(),
          })} label={undefined}>
            <ThemedText btn>Update Family Head</ThemedText>
          </ThemedButton>
        </ThemedCard>

        <CenteredModal visible={modalVisible} title="Select New Family Head" onClose={() => setModalVisible(false)}>
          {isLoadingMembers ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : residentList.length === 0 ? (
            <ThemedText>No family members found.</ThemedText>
          ) : (
            residentList.map((p) => (
              <Pressable
                key={p.person_id}
                onPress={() => {
                  setNewHeadId(p.person_id)
                  setNewHeadName(p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)
                  setModalVisible(false)
                }}
                style={{ paddingVertical: 8 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <ThemedText>{p.full_name}{p.person_code ? ` · ${p.person_code}` : ''}</ThemedText>
                  {String(p.person_id) === String(newHeadId) && (
                    <ThemedText style={{ color: Colors.primary }}>✓</ThemedText>
                  )}
                </View>
              </Pressable>
            ))
          )}
        </CenteredModal>

        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default UpdateFamHead

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  helper: {
    marginTop: 6,
    fontSize: 12,
    color: '#9CA3AF',
  },
  link: {
    fontSize: 12,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
})
