import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { HouseholdException } from '@/exception/HouseholdException'
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { HouseholdRepository } from '@/repository/householdRepository'
import { useAccountRole } from '@/store/useAccountRole'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet } from 'react-native'

type Hhead = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
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
  const currentHeadId = params.currentHeadId ?? ''
  const currentHeadName = params.currentHeadName ?? '—'

  // New head selection state
  const [headSearchText, setHeadSearchText] = useState('')
  const [newHeadId, setNewHeadId] = useState<string>('')

  // Reason state (same list as member removal)
  const [reason, setReason] = useState<ChangeReason | null>(null)
  const [otherReason, setOtherReason] = useState('')

  const [hhHeadList, setHhHeadList] = useState<Hhead[]>([]);

  const residentItems = useMemo(() => hhHeadList, [hhHeadList])
  const reasonItems = useMemo(
    () => CHANGE_REASONS.map(r => ({ label: r, value: r })),
    []
  )

  const profile = useAccountRole((s) => s.getProfile('resident'))
  const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null

  const repo = new HouseholdRepository();

  const canSubmit =
    !!newHeadId &&
    newHeadId !== currentHeadId &&
    !!reason &&
    (reason !== 'OTHER' || otherReason.trim().length > 2)

  const { results, search } = usePersonSearchByKey()

  useEffect(() => {
    if (!results || !Array.isArray(results)) return;

    setHhHeadList(prev => {
      const newItems = results.filter(
        r => !prev.some(p => p.person_id === r.person_id)
      );
      return [...prev, ...newItems];
    });
  }, [results]);

  const handleSubmit = () => {
    const sendData = async () => {
      if (!householdId || !newHeadId || !reason) return;
      const hhId = await repo.GetHouseholdIdByHouseholdNumber(householdNum);
      if (!hhId) {
        Alert.alert('Error', 'Household not found. Please check the household number and try again.');
        return;
      }
      const finalReason = reason === 'OTHER' ? otherReason.trim() : reason;
      try {
        let paresedNewHeadId: number = null;
        if (Number.isInteger(newHeadId)) {
          paresedNewHeadId = parseInt(newHeadId);
        }

        const result = await repo.UpdatehouseholdHead(hhId, paresedNewHeadId, parseInt(addedById ?? '1'), finalReason)
        if (!result) {
          Alert.alert('Error', 'Failed to update household head. Please try again.');
          return;
        }
        Alert.alert(
          'Success',
          'Household head updated successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.back(), // only runs when OK is pressed
            },
          ],
          { cancelable: false }
        );

      } catch (error) {
        if (error instanceof HouseholdException) {
          Alert.alert('Warning', error.message);
          return;
        }
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
    sendData();
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar
        title="Update Household Head"
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
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

          {/* New head search & select */}
          <ThemedText style={styles.label}>New Household Head</ThemedText>

          <ThemedSearchSelect<Hhead>
            items={residentItems}
            getLabel={(p) =>
              p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
            }
            getSubLabel={(p) => p.address}
            inputValue={headSearchText}
            onInputValueChange={(t) => {
              setHeadSearchText(t)
              search(t)
              if (!t) setNewHeadId('')
            }}
            placeholder="Search (Name / Resident ID)"
            filter={(p, q) => {
              const query = q.toLowerCase()
              return (
                p.full_name.toLowerCase().includes(query) ||
                (p.person_code || '').toLowerCase().includes(query) ||
                (p.address || '').toLowerCase().includes(query) ||
                query.includes(p.full_name.toLowerCase()) ||
                (p.person_code && query.includes(p.person_code.toLowerCase()))
              )
            }}
            onSelect={(p) => {
              setNewHeadId(p.person_id)
              setHeadSearchText(
                p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
              )
            }}
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

          <ThemedButton disabled={!canSubmit} onPress={handleSubmit}>
            <ThemedText btn>Update Household Head</ThemedText>
          </ThemedButton>
        </ThemedCard>

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
})
