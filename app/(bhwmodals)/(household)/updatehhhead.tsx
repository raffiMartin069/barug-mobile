import CenteredModal from '@/components/custom/CenteredModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Colors } from '@/constants/Colors'
import { HouseholdException } from '@/exception/HouseholdException'
import { useNiceModal } from '@/hooks/NiceModalProvider'
import { HouseholdCommand } from '@/repository/commands/HouseholdCommand'
import { HouseholdRepository } from '@/repository/householdRepository'
import { FamilyQuery } from '@/repository/queries/FamilyQuery'
import { useAccountRole } from '@/store/useAccountRole'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, View } from 'react-native'

type Hhead = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
  family_id?: string
  family_num?: string
}

/** Demo data. Replace with your fetched residents list */
// const HHHEAD: Hhead[] = []

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
 * Params you can pass when navigating here:
 * /update-hh-head?id=HH-2024-001&householdNum=HH-2024-001&currentHeadId=P-002&currentHeadName=Maria%20Santos
 */
const UpdateHhHead = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id?: string
    householdNum?: string
    currentHeadId?: string
    currentHeadName?: string
  }>()

  const householdId = params.id ?? ''
  const householdNum = params.householdNum ?? householdId
  let currentHeadId = params.currentHeadId ?? ''
  const currentHeadName = params.currentHeadName ?? '—'

  // New head selection state
  const [newHeadId, setNewHeadId] = useState<string>('')
  const [newHeadName, setNewHeadName] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)

  // Reason state (same list as member removal)
  const [reason, setReason] = useState<ChangeReason | null>(null)
  const [otherReason, setOtherReason] = useState('')

  const [hhHeadList, setHhHeadList] = useState<Hhead[]>([]);
  const [refreshing, setRefreshing] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const membersRepo = useMemo(() => new HouseholdCommand(), [])
  

  const fetchMembers = async () => {
    let mounted = true
    setRefreshing(true)
    setIsLoadingMembers(true)
    try {
      if (!householdNum) return

      // fetch household first to get household_id and current head
      const hh = await membersRepo.FetchHouseholdByHouseholdNumber(householdNum)
      currentHeadId = hh?.household_head_id ? String(hh.household_head_id) : ''

      const data = await membersRepo.FetchMembersByHouseholdNumber(householdNum)
      if (!mounted || !Array.isArray(data)) return

      // build family_id -> family_num map from member payload if available
      const familyMap: Record<string, string> = {}
      data.forEach((m: any) => {
        const fid = m?.family_id ? String(m.family_id) : undefined
        const fnum = m?.family?.family_num ?? m?.family_num
        if (fid && fnum) familyMap[fid] = String(fnum)
      })

      // if map empty, fetch families for this household to populate family_num
      if (Object.keys(familyMap).length === 0 && hh?.household_id) {
        try {
          const fq = new FamilyQuery()
          const families = await fq.FetchFamiliesByHouseholdId(hh.household_id)
          if (Array.isArray(families)) {
            families.forEach((f: any) => {
              if (f && f.family_id) {
                familyMap[String(f.family_id)] = f.family_num ? String(f.family_num) : String(f.family_id)
              }
            })
          }
        } catch (e) {
          console.warn('Fetch families for family_num mapping failed', e)
        }
      }

      const mapped: Hhead[] = data.map((m: any) => {
        const p = (m.person ?? {})
        if (!p.person_id) return null
        if (String(p.person_id) === String(currentHeadId)) return null
        if (!m.is_active || p.person_status?.person_status_id !== 1) return null

        const middleInitial = p.middle_name ? `${String(p.middle_name).trim()[0].toUpperCase()}.` : ''
        const fullName = `${String(p.first_name ?? '').toUpperCase()} ${middleInitial} ${String(p.last_name ?? '').toUpperCase()}`.replace(/\s+/g, ' ').trim()

        const familyId = m.family_id ? String(m.family_id) : undefined
        const familyNum = m?.family?.family_num ?? m?.family_num ?? (familyId ? familyMap[familyId] : undefined) ?? familyId

        return {
          person_id: String(p.person_id),
          full_name: fullName,
          person_code: p.person_code,
          address: (p.addresss ? [p.addresss.street, p.addresss.barangay, p.addresss.city].filter(Boolean).join(', ') : ''),
          family_id: familyId,
          family_num: familyNum ? String(familyNum) : undefined,
        }
      }).filter(Boolean)

      setHhHeadList(mapped)
    } catch (e) {
      console.error('fetchMembers error', e)
    } finally {
      setRefreshing(false)
      setIsLoadingMembers(false)
      mounted = false
    }
  }

  useEffect(() => {
    // initial load
    fetchMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdNum, membersRepo, currentHeadId])

  const reasonItems = useMemo(
    () => CHANGE_REASONS.map(r => ({ label: r, value: r })),
    []
  )

  const profile = useAccountRole((s) => s.getProfile('resident'))
  const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null

  const repo = new HouseholdRepository();
  const { showModal } = useNiceModal()

  const canSubmit =
    !!newHeadId &&
    newHeadId !== currentHeadId &&
    !!reason &&
    (reason !== 'OTHER' || otherReason.trim().length > 2)

  // (Search hook removed) selection is driven from household members fetched above

  const handleSubmit = () => {
    const sendData = async () => {
      if (!householdId || !newHeadId || !reason) return;
      const hhId = await repo.GetHouseholdIdByHouseholdNumber(householdNum);
      if (!hhId) {
        showModal({
          title: 'Household Not Found',
          message: 'Household not found. Please check the household number and try again.',
          variant: 'warn',
          primaryText: 'OK'
        })
        return;
      }
      const finalReason = reason === 'OTHER' ? otherReason.trim() : reason;
      try {
        // parse newHeadId to number and validate
        const newHeadIdNum = Number(newHeadId);
        if (!Number.isInteger(newHeadIdNum)) {
          showModal({
            title: 'Invalid ID',
            message: 'Invalid new household head ID. Please select a valid resident.',
            variant: 'warn',
            primaryText: 'OK'
          })
          return;
        }

        const result = await repo.UpdatehouseholdHead(hhId, newHeadIdNum, parseInt(addedById ?? '1'), finalReason)
        if (!result) {
          showModal({
            title: 'Update Failed',
            message: 'Failed to update household head. Please try again.',
            variant: 'error',
            primaryText: 'OK'
          })
          return;
        }
        showModal({
          title: 'Success',
          message: 'Household head updated successfully.',
          variant: 'success',
          primaryText: 'OK',
          onPrimary: () => { router.back() }
        })

      } catch (error) {
        if (error instanceof HouseholdException) {
          showModal({
            title: 'Update Failed',
            message: error.message,
            variant: 'warn',
            primaryText: 'OK'
          })
          return;
        }
        showModal({
          title: 'Error',
          message: 'An unexpected error occurred. Please try again.',
          variant: 'error',
          primaryText: 'OK'
        })
      }
    }
    sendData();
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar
        title="Update Household Head"
        showNotif={true}
        showProfile={true}
      />

      <ThemedKeyboardAwareScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMembers} />}
      >
        <ThemedCard>
          <ThemedText title>
            {householdNum || 'Household'}
          </ThemedText>

          <Spacer height={12} />

          {/* Current head (read-only) */}
          <ThemedText style={styles.label}>Current Household Head</ThemedText>
          <ThemedTextInput
            value={currentHeadName}
            editable={false}
            pointerEvents="none"
            onChangeText={''}
          />

          <Spacer height={16} />

          {/* New head selection: link -> modal, plus readonly text field */}
          <ThemedText style={styles.label}>New Household Head</ThemedText>

          <ThemedText style={styles.link} onPress={() => setModalVisible(true)}>
            Choose from household members
          </ThemedText>

          <ThemedTextInput
            placeholder="Selected Household Head"
            value={newHeadName}
            editable={false}
            onChangeText={() => {}}
          />

          {newHeadId === currentHeadId && newHeadId !== '' && (
            <ThemedText style={styles.helper}>
              Selected resident is already the current head.
            </ThemedText>
          )}

          <Spacer height={20} />

          {/* Reason for change (matches removal reasons) */}
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
            title: 'Update Household Head',
            message: 'Are you sure you want to update the household head?',
            variant: 'info',
            primaryText: 'Update',
            secondaryText: 'Cancel',
            onPrimary: () => { handleSubmit() },
          })} label={undefined}>
            <ThemedText btn>Update Household Head</ThemedText>
          </ThemedButton>
        </ThemedCard>

        <CenteredModal visible={modalVisible} title="Select New Household Head" onClose={() => setModalVisible(false)}>
          {isLoadingMembers ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          ) : hhHeadList.length === 0 ? (
            <ThemedText>No household members found.</ThemedText>
          ) : (
            // group members by family_num (fallback to family_id)
            Object.entries(hhHeadList.reduce((acc: Record<string, Hhead[]>, cur) => {
              const k = cur.family_num ?? cur.family_id ?? 'unknown'
              if (!acc[k]) acc[k] = []
              acc[k].push(cur)
              return acc
            }, {})).map(([familyKey, members]) => (
              <View key={familyKey} style={{ marginBottom: 8 }}>
                <ThemedText style={styles.familyHeader}>{familyKey === 'unknown' ? 'Family' : `Family ${familyKey}`}</ThemedText>
                    {members.map((p) => (
                      <Pressable
                        key={p.person_id}
                        onPress={() => {
                          setNewHeadId(String(p.person_id))
                          setNewHeadName(p.full_name)
                          setModalVisible(false)
                        }}
                        style={{ paddingVertical: 0 }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                          <ThemedText>{p.full_name}{p.person_code ? ` · ${p.person_code}` : ''}</ThemedText>
                          {String(p.person_id) === String(newHeadId) && (
                            <ThemedText style={{ color: Colors.primary }}>✓</ThemedText>
                          )}
                        </View>
                      </Pressable>
                    ))}
              </View>
            ))
          )}
        </CenteredModal>

        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default UpdateHhHead

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
    color: Colors.primary,
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  familyHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
})
