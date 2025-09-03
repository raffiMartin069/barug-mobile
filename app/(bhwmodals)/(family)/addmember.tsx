import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

type Resident = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

const RESIDENTS: Resident[] = [
  { person_id: 'P-001', full_name: 'Rogelio Santos', person_code: 'P03-R001', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-002', full_name: 'Maria Santos', person_code: 'P03-R002', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-003', full_name: 'Juan Dela Cruz', person_code: 'P05-R010', address: 'Purok 5, Sto. Niño' },
  { person_id: 'P-004', full_name: 'Luz Rivera', person_code: 'P01-R020', address: 'Purok 1, Sto. Niño' },
]

const AddMember = () => {
  const [residentSearchText, setResidentSearchText] = useState('')
  const residentItems = useMemo(() => RESIDENTS, [])

  // selected values
  const [residentId, setResidentId] = useState<string>('')
  const [famheadrel, setFamHeadRel] = useState('')
  const [hhheadrel, setHhHeadReal] = useState('')

  return (
    <ThemedView safe>
        <ThemedAppBar
            title='Add Member'
            showNotif={false}
            showProfile={false}
        />

        <ThemedKeyboardAwareScrollView>
            <View>

                <ThemedSearchSelect<Resident>
                    items={residentItems}
                    getLabel={(p) => (p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)}
                    getSubLabel={(p) => p.address}
                    inputValue={residentSearchText}
                    onInputValueChange={(t) => {
                    setResidentSearchText(t)
                    if (!t) setResidentId('')
                    }}
                    placeholder='Search Resident (Name / Resident ID)'
                    // same-style filter as your CreateHousehold snippet
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
                    setResidentId(p.person_id)
                    setResidentSearchText(p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)
                    }}
                    autoCapitalize="words"
                    emptyText="No resident found"
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={famheadrel}
                    setValue={setFamHeadRel}
                    placeholder='Relationship to Family Head'
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={hhheadrel}
                    setValue={setHhHeadReal}
                    placeholder='Relationship to Household Head'
                    order={1}
                />
            </View>

            <Spacer height={15}/>

            <View>
                <ThemedButton>
                    <ThemedText btn>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default AddMember

const styles = StyleSheet.create({})