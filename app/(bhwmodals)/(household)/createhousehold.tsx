import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

type Hhead = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

const HHHEAD: Hhead[] = [
  { person_id: 'P-001', full_name: 'Rogelio Santos', person_code: 'P03-R001', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-002', full_name: 'Maria Santos', person_code: 'P03-R002', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-003', full_name: 'Juan Dela Cruz', person_code: 'P05-R010', address: 'Purok 5, Sto. Niño' },
  { person_id: 'P-004', full_name: 'Luz Rivera', person_code: 'P01-R020', address: 'Purok 1, Sto. Niño' },
]

const CreateHousehold = () => {
  const [householdnum, setHouseholdNum] = useState('')
  const [hAddress, setHAddress] = useState('')
  const [hhhead, setHhHead] = useState('')
  const [housetype, setHouseType] = useState('')
  const [houseownership, setHouseOwnership] = useState('')

  const [headSearchText, setHeadSearchText] = useState('')
  const residentItems = useMemo(() => HHHEAD, [])

  return (
    <ThemedView safe>
        <ThemedAppBar
            title='Register Household'
            showNotif={false}
            showProfile={false}
        />

        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedTextInput
                    placeholder='Household Number'
                    value={householdnum}
                    onChangeText={setHouseholdNum}
                />

                <Spacer height={10}/>

                <Pressable>
                    <ThemedTextInput
                        placeholder='Home Address'
                        value={hAddress}
                        onChangeText={setHAddress}
                        editable={false}
                        pointerEvents="none"
                    />
                </Pressable>

                <Spacer height={10}/>

                <ThemedSearchSelect<Hhead>
                    items={residentItems}
                    getLabel={(p) =>
                    p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
                    }
                    getSubLabel={(p) => p.address}
                    inputValue={headSearchText}
                    onInputValueChange={(t) => {
                    setHeadSearchText(t)
                    if (!t) setHhHead('') 
                    }}
                    placeholder='Search Household Head (Name / Resident ID)'
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
                    setHhHead(p.person_id)
                    setHeadSearchText(
                        p.person_code
                        ? `${p.full_name} · ${p.person_code}`
                        : p.full_name
                    )
                    }}
                />

                <ThemedDropdown
                    items={[]}
                    value={housetype}
                    setValue={setHouseType}
                    placeholder={'House Type'}
                    order={0}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={houseownership}
                    setValue={setHouseOwnership}
                    placeholder={'House Ownership'}
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

export default CreateHousehold

const styles = StyleSheet.create({})