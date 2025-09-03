import Spacer from '@/components/Spacer'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'

const LowIncomeAdult = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [cstatus, setCStatus] = useState('')
  const [nationality, setNationality] = useState('')
  const [monthlyincome, setMonthlyIncome] = useState('')
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

      {/* Nationality */}
      <ThemedText style={styles.label}>Nationality</ThemedText>
      <ThemedTextInput
        placeholder='Nationality'
        value={nationality}
        onChangeText={setNationality}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Monthly Personal Income */}
      <ThemedText style={styles.label}>Monthly Personal Income</ThemedText>
      <ThemedTextInput
        placeholder='Monthly Personal Income'
        value={monthlyincome}
        onChangeText={setMonthlyIncome}
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

export default LowIncomeAdult

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
