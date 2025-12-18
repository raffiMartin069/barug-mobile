import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

const PURPOSE_OPTIONS = [
  { label: 'Employment Requirement', value: 'employment' },
  { label: 'School / Scholarship', value: 'school' },
  { label: 'Local Job Application', value: 'local_job' },
  { label: 'Overseas Job Application', value: 'overseas_job' },
  { label: 'Business/Permit Requirement', value: 'business' },
  { label: 'Travel / Visa', value: 'travel' },
  { label: 'Police / NBI Requirement', value: 'police_nbi' },
  { label: 'Financial / Bank Requirement', value: 'bank' },
  { label: 'Medical / Hospital Requirement', value: 'medical' },
  { label: 'Others (specify)', value: 'other' },
]

const ClearanceAdult = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [cstatus, setCStatus] = useState('')
  const [address, setAddress] = useState('')

  // Dropdown value
  const [purpose, setPurpose] = useState<string | null>(null)
  // Free-text purpose only when "other" is selected
  const [otherPurpose, setOtherPurpose] = useState('')

  const showOther = purpose === 'other'

  // This is the value you’d submit to your API
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
            placeholder='Type your purpose'
            value={otherPurpose}
            onChangeText={setOtherPurpose}
          />
        </>
      )}

    </ThemedView>
  )
}

export default ClearanceAdult

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
