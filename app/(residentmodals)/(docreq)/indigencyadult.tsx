import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'

const PURPOSE_OPTIONS = [
  { label: 'Scholarship / Educational Assistance', value: 'scholarship' },
  { label: 'Medical / Hospital Assistance', value: 'medical' },
  { label: 'Government Aid / Social Welfare', value: 'gov_aid' },
  { label: 'Employment / Job Application', value: 'employment' },
  { label: 'Financial Assistance (Private / NGO)', value: 'financial' },
  { label: 'Others (specify)', value: 'other' },
] 

const IndigencyAdult = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [nationality, setNationality] = useState('')
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

      {/* Nationality */}
      <ThemedText style={styles.label}>Nationality</ThemedText>
      <ThemedTextInput
        placeholder='Nationality'
        value={nationality}
        onChangeText={setNationality}
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

export default IndigencyAdult

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
