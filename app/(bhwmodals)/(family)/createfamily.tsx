import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { indigentOptions, nhtsOptions } from '@/constants/formOptions'
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

type Famhead = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

// 🔹 mock data — replace with your Supabase query later
const FAMHEAD: Famhead[] = [
  { person_id: 'P-001', full_name: 'Rogelio Santos', person_code: 'P03-R001', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-002', full_name: 'Maria Santos', person_code: 'P03-R002', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-003', full_name: 'Juan Dela Cruz', person_code: 'P05-R010', address: 'Purok 5, Sto. Niño' },
  { person_id: 'P-004', full_name: 'Luz Rivera', person_code: 'P01-R020', address: 'Purok 1, Sto. Niño' },
]

const CreateFamily = () => {
  const [famnum, setFamnum] = useState('')
  const [famhead, setFamhead] = useState('')
  const [famHeadText, setFamHeadText] = useState('')
  const [hhheadrel, setHhheadrel] = useState('')
  const [nhts, setNhts] = useState<'yes' | 'no'>('no')
  const [indigent, setIndigent] = useState<'yes' | 'no'>('no')
  const [incomesource, setIncomeSource] = useState('')
  const [fammnthlyincome, setFamMonthlyIncome] = useState('')
  const [hhtype, setHhType] = useState('')

  const residentItems = useMemo(() => FAMHEAD, [])

  return (
    <ThemedView safe>
        <ThemedAppBar
            title='Register Family Unit'
            showNotif={false}
            showProfile={false}
        />
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedTextInput
                    placeholder='Family Number'
                    value={famnum}
                    onChangeText={setFamnum}
                />

                <Spacer height={10}/>

                <ThemedSearchSelect<Famhead>
                    items={residentItems}
                    getLabel={(p) =>
                    p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
                    }
                    getSubLabel={(p) => p.address}
                    inputValue={famHeadText}
                    onInputValueChange={(t) => {
                    setFamHeadText(t)
                    if (!t) setFamhead('')
                    }}
                    placeholder='Family Head (Name / Resident ID)'
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
                    setFamhead(p.person_id)
                    setFamHeadText(
                        p.person_code 
                        ? `${p.full_name} · ${p.person_code}` 
                        : p.full_name
                    )
                    }}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={hhheadrel}
                    setValue={setHhheadrel}
                    placeholder='Relationship to Household Head'
                    order={0}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={hhtype }
                    setValue={setHhType}
                    placeholder='Household Type'
                    order={1}
                />

                <Spacer height={15}/>

                <View style={{flexDirection: 'row', gap: 10,}}>
                    <View style={{flex: 1}}>
                        <ThemedText subtitle={true}>NHTS Status</ThemedText>

                        <ThemedRadioButton
                            value={nhts}
                            onChange={setNhts}
                            options={nhtsOptions}
                        />
                    </View>

                    <View style={{flex: 1}}>
                        <ThemedText subtitle={true}>Indigent Status</ThemedText>

                        <ThemedRadioButton
                            value={indigent}
                            onChange={setIndigent}
                            options={indigentOptions}
                        />
                    </View>
                </View>

                <ThemedTextInput
                    placeholder='Source of Income'
                    value={incomesource}
                    onChangeText={setIncomeSource}
                />

                <Spacer height={10}/>

                <ThemedDropdown
                    items={[]}
                    value={fammnthlyincome}
                    setValue={setFamMonthlyIncome}
                    placeholder='Family Monthly Income'
                    order={2}
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

export default CreateFamily

const styles = StyleSheet.create({})