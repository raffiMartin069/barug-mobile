import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

const PURPOSE_OPTIONS = [
  { label: 'Insurance Claim', value: 'insurance' },
  { label: 'Burial / Funeral Requirement', value: 'burial' },
  { label: 'Hospital / Medical Records', value: 'medical' },
  { label: 'Government Benefit / Assistance', value: 'gov_benefit' },
  { label: 'Inheritance / Legal Matters', value: 'inheritance' },
  { label: 'Others (specify)', value: 'other' },
]

const Death = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [nationality, setNationality] = useState('')
  const [dateofdeath, setDateofDeath] = useState('')
  const [placeofdeath, setPlaceofDeath] = useState('')
  const [purpose, setPurpose] = useState<string | null>(null)
  const [otherPurpose, setOtherPurpose] = useState('')

  const showOther = purpose === 'other'
  const finalPurpose = useMemo(
    () => (showOther ? otherPurpose.trim() : purpose || ''),
    [showOther, otherPurpose, purpose]
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

      {/* Age at time of Death */}
      <ThemedText style={styles.label}>Age at time of Death</ThemedText>
      <ThemedTextInput
        placeholder='Age at time of Death'
        value={age}
        onChangeText={setAge}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Nationality */}
      <ThemedText style={styles.label}>Nationality</ThemedText>
      <ThemedTextInput
        placeholder='Nationality'
        value={nationality}
        onChangeText={setNationality}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Date of Death */}
      <ThemedText style={styles.label}>Date of Death</ThemedText>
      <ThemedTextInput
        placeholder='Date of Death'
        value={dateofdeath}
        onChangeText={setDateofDeath}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Place of Death */}
      <ThemedText style={styles.label}>Place of Death</ThemedText>
      <ThemedTextInput
        placeholder='Place of Death'
        value={placeofdeath}
        onChangeText={setPlaceofDeath}
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

export default Death

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
