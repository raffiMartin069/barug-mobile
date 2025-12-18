import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

const PURPOSE_OPTIONS = [
  { label: 'Employment / Job Application', value: 'employment' },
  { label: 'School / Scholarship', value: 'school' },
  { label: 'Government ID / Requirement', value: 'gov_id' },
  { label: 'Travel / Visa', value: 'travel' },
  { label: 'Bank / Financial Requirement', value: 'bank' },
  { label: 'Business / Permit Requirement', value: 'business' },
  { label: 'Legal / Court Requirement', value: 'legal' },
  { label: 'Others (specify)', value: 'other' },
]

const ResidencyAdult = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [cstatus, setCStatus] = useState('')
  const [nationality, setNationality] = useState('')
  const [resperiod, setResPeriod] = useState('')
  const [address, setAddress] = useState('')
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

      {/* Age */}
      <ThemedText style={styles.label}>Age</ThemedText>
      <ThemedTextInput
        placeholder='Age'
        value={age}
        onChangeText={setAge}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Civil Status */}
      <ThemedText style={styles.label}>Civil Status</ThemedText>
      <ThemedTextInput
        placeholder='Civil Status'
        value={cstatus}
        onChangeText={setCStatus}
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

      {/* Residency Period */}
      <ThemedText style={styles.label}>Residency Period</ThemedText>
      <ThemedTextInput
        placeholder='Residency Period'
        value={resperiod}
        onChangeText={setResPeriod}
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

export default ResidencyAdult

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
