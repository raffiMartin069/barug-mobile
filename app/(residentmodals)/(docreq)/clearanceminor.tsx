import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

type GuardianOption = {
  id: string
  name: string
  relationship: string
  address?: string
}

const PURPOSE_OPTIONS = [
  { label: 'School / Scholarship', value: 'school' },
  { label: 'Local ID / Government Requirement', value: 'gov_req' },
  { label: 'Medical / Hospital Requirement', value: 'medical' },
  { label: 'Travel / Visa', value: 'travel' },
  { label: 'Sports / Competition', value: 'sports' },
  { label: 'Employment of Parent/Guardian', value: 'guardian_employment' },
  { label: 'Others (specify)', value: 'other' },
]

const ClearanceMinor = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [address, setAddress] = useState('')
  const [rel, setRel] = useState('')
  const [purpose, setPurpose] = useState<string | null>(null)
  const [otherPurpose, setOtherPurpose] = useState('')
  const showOther = purpose === 'other'
  const finalPurpose = useMemo(
    () => (showOther ? otherPurpose.trim() : purpose || ''),
    [showOther, otherPurpose, purpose]
  )

  const [selectedGuardian, setSelectedGuardian] = useState<GuardianOption | null>(null)
  const guardianOptions: GuardianOption[] = useMemo(
    () => [
      { id: '1', name: 'JUAN DELA CRUZ', relationship: 'FATHER', address: 'PUROK 1, SITIO ABC' },
      { id: '2', name: 'MARIA DELA CRUZ', relationship: 'MOTHER', address: 'PUROK 1, SITIO ABC' },
      { id: '3', name: 'PEDRO SANTOS', relationship: 'LEGAL GUARDIAN', address: 'PUROK 3, SITIO XYZ' },
    ],
    []
  )

  return (
    <ThemedView safe>
      {/* Full Name */}
      <ThemedText style={styles.label}>Full Name</ThemedText>
      <ThemedTextInput
        placeholder='Full Name'
        value={name}
        onChangeText={setName}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Age */}
      <ThemedText style={styles.label}>Age</ThemedText>
      <ThemedTextInput
        placeholder='Age'
        value={age}
        onChangeText={setAge}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Home Address */}
      <ThemedText style={styles.label}>Home Address</ThemedText>
      <ThemedTextInput
        placeholder='Home Address'
        value={address}
        onChangeText={setAddress}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Parent / Guardian */}
      <ThemedText style={styles.label}>Parent / Guardian</ThemedText>
      <ThemedSearchSelect
        items={guardianOptions}
        getLabel={(g) => g.name}
        getSubLabel={(g) => g.address ? `${g.relationship} • ${g.address}` : g.relationship}
        placeholder='Parent / Guardian'
        onSelect={(g) => {
        setSelectedGuardian(g)
        setRel(g.relationship || '')
        }}
        value={selectedGuardian}
        reflectSelectionInInput
        // Better for names than 'characters'
        autoCapitalize="words"
        // Optional: show more rows before scrolling
        maxDropdownHeight={280}
      />

      <Spacer height={10}/>

      {/* Relationship */}
      <ThemedText style={styles.label}>Relationship to Parent / Guardian</ThemedText>
      <ThemedTextInput
        placeholder='Relationship'
        value={rel}
        onChangeText={setRel}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Purpose */}
      <ThemedText style={styles.label}>Purpose</ThemedText>
      <ThemedDropdown
        items={PURPOSE_OPTIONS}
        placeholder='Select Purpose'
        value={purpose}
        setValue={setPurpose}
      />

      {showOther && (
        <>
          <Spacer height={10} />
          <ThemedText style={styles.label}>Please specify</ThemedText>
          <ThemedTextInput
            placeholder='Type purpose here'
            value={otherPurpose}
            onChangeText={setOtherPurpose}
          />
        </>
      )}
    </ThemedView>
  )
}

export default ClearanceMinor

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
