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
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

type Resident = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

/** Demo data. Replace with your fetched residents list */
const RESIDENTS: Resident[] = [
  { person_id: 'P-001', full_name: 'Rogelio Santos', person_code: 'P03-R001', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-002', full_name: 'Maria Santos',   person_code: 'P03-R002', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-003', full_name: 'Juan Dela Cruz', person_code: 'P05-R010', address: 'Purok 5, Sto. Niño' },
  { person_id: 'P-004', full_name: 'Luz Rivera',     person_code: 'P01-R020', address: 'Purok 1, Sto. Niño' },
]

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
    householdId?: string
    familyNum?: string
    currentHeadId?: string
    currentHeadName?: string
  }>()

  const householdId     = params.householdId ?? ''
  const familyNum       = params.familyNum ?? ''
  const currentHeadId   = params.currentHeadId ?? ''
  const currentHeadName = params.currentHeadName ?? '—'

  // New head selection
  const [searchText, setSearchText] = useState('')
  const [newHeadId, setNewHeadId] = useState<string>('')

  // Reason
  const [reason, setReason] = useState<ChangeReason | null>(null)
  const [otherReason, setOtherReason] = useState('')

  const residentItems = useMemo(() => RESIDENTS, [])
  const reasonItems = useMemo(
    () => CHANGE_REASONS.map(r => ({ label: r, value: r })),
    []
  )

  const canSubmit =
    !!newHeadId &&
    newHeadId !== currentHeadId &&
    !!reason &&
    (reason !== 'OTHER' || otherReason.trim().length > 2)

  const handleSubmit = () => {
    // TODO: call your API / mutation:
    // {
    //   householdId,
    //   familyNum,
    //   newHeadId,
    //   reason,
    //   reasonNote: reason === 'OTHER' ? otherReason.trim() : undefined
    // }
    router.back()
  }

  return (
    <ThemedView style={{ flex: 1 }} safe>
      <ThemedAppBar
        title="Update Family Head"
        showNotif={false}
        showProfile={false}
      />

      <ThemedKeyboardAwareScrollView>
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
          <ThemedSearchSelect<Resident>
            items={residentItems}
            getLabel={(p) =>
              p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
            }
            getSubLabel={(p) => p.address}
            inputValue={searchText}
            onInputValueChange={(t) => {
              setSearchText(t)
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
              setSearchText(
                p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
              )
            }}
          />

          {newHeadId === currentHeadId && newHeadId !== '' && (
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

          <ThemedButton disabled={!canSubmit} onPress={handleSubmit}>
            <ThemedText btn>Update Family Head</ThemedText>
          </ThemedButton>
        </ThemedCard>

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
})
