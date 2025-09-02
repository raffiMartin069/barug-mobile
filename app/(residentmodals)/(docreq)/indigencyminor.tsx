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

const IndigencyMinor = () => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [nationality, setNationality] = useState('')
  const [rel, setRel] = useState('')
  const [purpose, setPurpose] = useState('')

  const [selectedGuardian, setSelectedGuardian] = useState<GuardianOption | null>(null)
  const guardianOptions: GuardianOption[] = useMemo(
    () => [
      { id: '1', name: 'JUAN DELA CRUZ', relationship: 'FATHER', address: 'PUROK 1, SITIO ABC' },
      { id: '2', name: 'MARIA DELA CRUZ', relationship: 'MOTHER', address: 'PUROK 1, SITIO ABC' },
      { id: '3', name: 'PEDRO SANTOS', relationship: 'LEGAL GUARDIAN', address: 'PUROK 3, SITIO XYZ' },
      { id: '4', name: 'ANA REYES', relationship: 'AUNT', address: 'PUROK 5, SITIO KLM' },
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

      {/* Nationality */}
      <ThemedText style={styles.label}>Nationality</ThemedText>
      <ThemedTextInput
        placeholder='Nationality'
        value={nationality}
        onChangeText={setNationality}
        editable={false}
      />

      <Spacer height={10}/>

      {/* Parent / Guardian */}
      <ThemedText style={styles.label}>Parent / Guardian</ThemedText>
      <ThemedSearchSelect
        items={guardianOptions}
        getLabel={(g) => g.name}
        getSubLabel={(g) =>
          g.address ? `${g.relationship} • ${g.address}` : g.relationship
        }
        placeholder='Parent / Guardian'
        onSelect={(g) => {
          setSelectedGuardian(g)
          setRel(g.relationship || '')
        }}
        value={selectedGuardian}
        reflectSelectionInInput
        autoCapitalize="words"
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
        items={[]}
        placeholder='Select Purpose'
        value={purpose}
        setValue={setPurpose}
      />
    </ThemedView>
  )
}

export default IndigencyMinor

const styles = StyleSheet.create({
  label: {
    fontWeight: '700',
  },
})
