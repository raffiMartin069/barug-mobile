import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'

const ClearanceAdult = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [cstatus, setCStatus] = useState('')
  const [address, setAddress] = useState('')
  const [purpose, setPurpose] = useState('')

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
        items={[]}
        placeholder='Select Purpose'
        value={purpose}
        setValue={setPurpose}
      />
    </ThemedView>
  )
}

export default ClearanceAdult

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
