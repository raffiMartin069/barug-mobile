import React, { useMemo, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

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

import { indigentOptions, nhtsOptions } from '@/constants/formoptions'
import { HOUSEHOLD_TYPE } from '@/constants/householdType'
import { MONTHLY_INCOME } from '@/constants/monthlyIncome'
import { RELATIONSHIP } from '@/constants/relationship'

import { usePersonSearchByKey } from '@/hooks/usePersonSearch'

import { useFamilyCreation } from '@/hooks/useFamilyCreation'
import { PersonSearchRequest } from '@/types/householdHead'
import { FamilyCreationRequest } from '@/types/request/familyCreationRequest'

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
    const [householdHeadId, setHouseholdHeadId] = useState('')
    const [householdHeadText, setHouseholdHeadText] = useState('')
    const [ufcNum, setUfcNum] = useState<string>('')
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const handleValidation = useMemo(() => {
        const newErrors: { [key: string]: string } = {}
        if (!householdHeadId) newErrors.householdHeadId = 'Household head is required'
        if (!famnum) newErrors.famnum = 'Family number is required'
        if (!famhead) newErrors.famhead = 'Family head is required'
        if (!hhheadrel) newErrors.hhheadrel = 'Relationship to household head is required'
        if (!hhtype) newErrors.hhtype = 'Household type is required'
        if (!ufcNum) newErrors.ufcNum = 'Unique Family Control Number (UFC) is required'
        if (!incomesource) newErrors.incomesource = 'Source of income is required'
        if (!fammnthlyincome) newErrors.fammnthlyincome = 'Family monthly income is required'
        return Object.keys(newErrors).length === 0 ? null : newErrors
    }, [householdHeadId, famnum, famhead, hhheadrel, hhtype, ufcNum, incomesource, fammnthlyincome])

    const { results: residentItems, search } = usePersonSearchByKey()
    const { createFamily, loading, error, success } = useFamilyCreation()

    const handleSubmit = async () => {
        const data: FamilyCreationRequest = {
            p_household_id: parseInt(householdHeadId),
            p_added_by_id: 1,
            p_family_num: famnum.trim(),
            p_ufc_num: ufcNum,
            p_source_of_income: incomesource.trim(),
            p_family_mnthly_icnome_id: parseInt(fammnthlyincome),
            p_nhts_status_id: nhts === 'yes' ? 1 : 2,
            p_indigent_status_id: indigent === 'yes' ? 1 : 2,
            p_household_type_id: parseInt(hhtype),
            p_family_head_id: parseInt(famhead),
        }
        const result = await createFamily(data)
        if (!result) {
            Alert.alert('Something went wrong.', error || 'Please try again later.')
            return
        }
        setHouseholdHeadId('')
        setHouseholdHeadText('')
        setFamnum('')
        setFamHeadText('')
        setHhheadrel('')
        setNhts('no')
        setIndigent('no')
        setIncomeSource('')
        setFamMonthlyIncome('')
        setHhType('')
        setFamhead('')
        setUfcNum('')
        setErrors({})
        Alert.alert('Success', 'Family unit created successfully.')
    }

    return (
        <ThemedView safe>
            <ThemedAppBar
                title='Register Family Unit'
                showNotif={false}
                showProfile={false}
            />
            <ThemedKeyboardAwareScrollView>
                <View>

                    <ThemedSearchSelect<PersonSearchRequest>
                        items={residentItems}
                        getLabel={(p) =>
                            p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
                        }
                        getSubLabel={(p) => p.address}
                        inputValue={householdHeadText}
                        onInputValueChange={(t) => {
                            setHouseholdHeadText(t)
                            search(t)
                            if (!t) setHouseholdHeadId('')
                        }}
                        placeholder='Household Head (Name / Resident ID)'
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
                            setHouseholdHeadId(p.person_id)
                            setHouseholdHeadText(
                                p.person_code
                                    ? `${p.full_name} · ${p.person_code}`
                                    : p.full_name
                            )
                        }}
                    />
                    {errors.householdHeadId && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.householdHeadId}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedTextInput
                        placeholder='Family Number'
                        value={famnum}
                        onChangeText={setFamnum}
                        keyboardType="numeric"
                    />
                    {errors.famnum && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.famnum}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedSearchSelect<PersonSearchRequest>
                        items={residentItems}
                        getLabel={(p) =>
                            p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
                        }
                        getSubLabel={(p) => p.address}
                        inputValue={famHeadText}
                        onInputValueChange={(t) => {
                            setFamHeadText(t)
                            search(t)
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
                    {errors.famhead && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.famhead}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedDropdown
                        items={RELATIONSHIP}
                        value={hhheadrel}
                        setValue={setHhheadrel}
                        placeholder='Relationship to Household Head'
                        order={0}
                    />
                    {errors.hhheadrel && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.hhheadrel}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedDropdown
                        items={HOUSEHOLD_TYPE}
                        value={hhtype}
                        setValue={setHhType}
                        placeholder='Household Type'
                        order={1}
                    />
                    {errors.hhtype && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.hhtype}</ThemedText>}
                    <Spacer height={15} />

                    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <ThemedText subtitle={true}>NHTS Status</ThemedText>

                            <ThemedRadioButton
                                value={nhts}
                                onChange={setNhts}
                                options={nhtsOptions}
                            />
                        </View>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <ThemedText subtitle={true}>Indigent Status</ThemedText>

                            <ThemedRadioButton
                                value={indigent}
                                onChange={setIndigent}
                                options={indigentOptions}
                            />
                        </View>
                    </View>

                    <ThemedTextInput
                        placeholder='Unique Family Control Number (UFC)'
                        value={ufcNum}
                        onChangeText={setUfcNum}
                        keyboardType="numeric"
                    />
                    {errors.ufcNum && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.ufcNum}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedTextInput
                        placeholder='Source of Income'
                        value={incomesource}
                        onChangeText={setIncomeSource}
                    />
                    {errors.incomesource && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.incomesource}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedDropdown
                        items={MONTHLY_INCOME}
                        value={fammnthlyincome}
                        setValue={setFamMonthlyIncome}
                        placeholder='Family Monthly Income'
                        order={2}
                    />
                    {errors.fammnthlyincome && <ThemedText style={{ color: 'red', fontSize: 12 }}>{errors.fammnthlyincome}</ThemedText>}
                </View>
                <Spacer height={15} />

                <View>
                    <ThemedButton onPress={() => {
                        const validationErrors = handleValidation
                        if (validationErrors) {
                            setErrors(validationErrors)
                            return
                        }
                        handleSubmit();
                    }} loading={loading} disabled={loading}>
                        <ThemedText btn>Continue</ThemedText>
                    </ThemedButton>
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default CreateFamily

const styles = StyleSheet.create({})