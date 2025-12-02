import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { Alert, Platform, StyleSheet, View } from 'react-native'

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

import { useNiceModal } from '@/hooks/NiceModalProvider'
import { useEmojiRemover } from '@/hooks/useEmojiRemover'
import { useFamilyCreation } from '@/hooks/useFamilyCreation'
import { HouseholdCommand } from '@/repository/commands/HouseholdCommand'
// PersonCommands and kinship logic removed — relationships are chosen manually now
import { FamilyQuery } from '@/repository/queries/FamilyQuery'
import { useAccountRole } from '@/store/useAccountRole'
import { useBasicHouseholdInfoStore } from '@/store/useBasicHouseholdInfoStore'
import { NavigationState, useNavigationStore } from '@/store/useNavigation'
import { PersonSearchRequest } from '@/types/householdHead'
import { FamilyCreationRequest } from '@/types/request/familyCreationRequest'
import { usePersonSearchActiveNonResident } from '@/hooks/usePersonSearchActiveNonResident'


const CreateFamily = () => {

    const [famnum, setFamnum] = useState('')
    const [famhead, setFamhead] = useState<number | string>('')
    const [famHeadText, setFamHeadText] = useState('')
    const [hhheadrel, setHhheadrel] = useState<number | string>('')
    const [nhts, setNhts] = useState<'yes' | 'no'>('no')
    const [indigent, setIndigent] = useState<'yes' | 'no'>('no')
    const [incomesource, setIncomeSource] = useState('')
    const [fammnthlyincome, setFamMonthlyIncome] = useState('')
    const [hhtype, setHhType] = useState('')
    const [householdHeadId, setHouseholdHeadId] = useState('')
    const [householdHeadText, setHouseholdHeadText] = useState('')
    const [ufcNum, setUfcNum] = useState<string>('')
    const [errors, setErrors] = useState<{ [key: string]: string }>({})
    const [isLoadingHousehold, setIsLoadingHousehold] = useState(false)
    const { isValid, err } = useEmojiRemover()
    const householdNumber = useBasicHouseholdInfoStore((s) => s.householdNumber)
    const returnTo = useNavigationStore((state: NavigationState) => state.to)
    const router = useRouter()

    // (normalize helper removed — kinship logic that required it was deleted)

    // Prefill household head when household number is provided
    useEffect(() => {
        let mounted = true
        const fetchHousehold = async () => {
            if (!householdNumber) return
            setIsLoadingHousehold(true)
            try {
                const cmd = new HouseholdCommand()
                const hh = await cmd.FetchHouseholdByHouseholdNumber(String(householdNumber))
                if (!mounted || !hh) return

                // try multiple naming conventions for the household head
                const hhObj = (hh as any).household_head ?? (hh as any).householdHead ?? null
                if (hhObj) {
                    const pid = (hhObj as any).person_id ?? (hhObj as any).personId ?? null
                    if (pid) {
                        setHouseholdHeadId(String(pid))
                        const nameParts = [ (hhObj as any).first_name, (hhObj as any).middle_name, (hhObj as any).last_name ].filter(Boolean)
                        setHouseholdHeadText(nameParts.join(' ').trim())
                    }
                }
            } catch (e: any) {
                console.error('fetchHousehold error', e)
            } finally {
                if (mounted) setIsLoadingHousehold(false)
            }
        }

        fetchHousehold()
        return () => { mounted = false }
    }, [householdNumber])

    // Kinship prefill removed: relationships are now selected manually by the user.

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
    }, [
        householdHeadId, famnum, famhead,
        hhheadrel, hhtype, ufcNum,
        incomesource, fammnthlyincome])

    const { results: residentItems, search } = usePersonSearchActiveNonResident()
    const { createFamily, loading, error } = useFamilyCreation()
    const profile = useAccountRole((s) => s.getProfile('resident'))
    const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null
        const { showModal } = useNiceModal()

    const [isSubmitting, setIsSubmitting] = useState(false)

    const integrityCheck = () => {
        /**
         * 1. Check for empty fields
         * 2. Check for emojis in text fields
         * 3. Set errors state if any validation fails
         * 4. Return true if all validations pass, else false
         */
        const validationErrors = handleValidation
        if (validationErrors) {
            setErrors(validationErrors)
            return false
        }
        setErrors({})
        if (!isValid({ famnum, incomesource, ufcNum })) {
            Alert.alert('Invalid Input', err || 'Emojis are not allowed');
            return false
        }
        return true
    }

    const handleSubmit = async () => {
        const data: FamilyCreationRequest = {
            p_household_id: parseInt(householdHeadId),
            p_added_by_id: parseInt(addedById ?? '1'),
            p_family_num: famnum.trim(),
            p_ufc_num: ufcNum.trim(),
            p_source_of_income: incomesource.trim(),
            p_family_mnthly_icnome_id: parseInt(fammnthlyincome),
            p_nhts_status_id: nhts === 'yes' ? 1 : 2,
            p_indigent_status_id: indigent === 'yes' ? 1 : 2,
            p_household_type_id: parseInt(hhtype),
            p_family_head_id: typeof famhead === 'number' ? famhead : parseInt(famhead || '0'),
            p_rel_to_hhold_head_id: typeof hhheadrel === 'number' ? hhheadrel : parseInt(String(hhheadrel || '0')),
        }
        const result = await createFamily(data)
        // const result = true
        if (!result) {
            Alert.alert('Warning', error || 'Please try again later.')
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
        Alert.alert('Success', 'Family unit created successfully.', [
                    {
                text: 'OK', onPress: () => {
                    // Navigate back to the specified screen after creation
                    const destination = `/${returnTo || 'bhwhome'}`
                    router.push(destination as any)
                }
            }
        ])
    }

    return (
        <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
            <ThemedAppBar
                title='Register Family Unit'
                showNotif={true}
                showProfile={true}
            />
            <ThemedKeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                extraScrollHeight={Platform.OS === 'ios' ? 20 : 100}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', padding: 20 }}
            >
                <View style={styles.container}>

                    <ThemedTextInput
                        placeholder='Household Head (locked)'
                        value={isLoadingHousehold ? 'Loading...' : householdHeadText}
                        editable={false}
                        onChangeText={() => {}}
                    />
                    {errors.householdHeadId && <ThemedText style={styles.required}>{errors.householdHeadId}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedTextInput
                        placeholder='Family Number'
                        value={famnum}
                        onChangeText={setFamnum}
                        keyboardType="numeric"
                    />
                    {errors.famnum && <ThemedText style={styles.required}>{errors.famnum}</ThemedText>}
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
                    {errors.famhead && <ThemedText style={styles.required}>{errors.famhead}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedDropdown
                        items={RELATIONSHIP}
                        value={hhheadrel}
                        setValue={setHhheadrel}
                        placeholder={'Relationship to Household Head'}
                        order={0}
                    />
                    {errors.hhheadrel && <ThemedText style={styles.required}>{errors.hhheadrel}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedDropdown
                        items={HOUSEHOLD_TYPE}
                        value={hhtype}
                        setValue={setHhType}
                        placeholder='Household Type'
                        order={1}
                    />
                    {errors.hhtype && <ThemedText style={styles.required}>{errors.hhtype}</ThemedText>}
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
                    {errors.ufcNum && <ThemedText style={styles.required}>{errors.ufcNum}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedTextInput
                        placeholder='Source of Income'
                        value={incomesource}
                        onChangeText={setIncomeSource}
                    />
                    {errors.incomesource && <ThemedText style={styles.required}>{errors.incomesource}</ThemedText>}
                    <Spacer height={10} />

                    <ThemedDropdown
                        items={MONTHLY_INCOME}
                        value={fammnthlyincome}
                        setValue={setFamMonthlyIncome}
                        placeholder='Family Monthly Income'
                        order={2}
                    />
                    {errors.fammnthlyincome && <ThemedText style={styles.required}>{errors.fammnthlyincome}</ThemedText>}

                    <Spacer height={15} />

                    <ThemedButton label="Continue" onPress={() => showModal({
                        title: 'Create Family Unit',
                        message: 'Create this family unit?',
                        variant: 'info',
                        primaryText: 'Create',
                        secondaryText: 'Cancel',
                        onPrimary: async () => {
                            setIsSubmitting(true)
                            try {
                                const ok = integrityCheck()
                                if (!ok) {
                                    setIsSubmitting(false)
                                    return
                                }

                                // Pre-flight: ensure the selected family head is not already an active house member
                                try {
                                    const famId = typeof famhead === 'number' ? famhead : parseInt(String(famhead || '0'))
                                    if (Number.isFinite(famId) && famId > 0) {
                                        const hhCmd = new HouseholdCommand()
                                        const existing = await hhCmd.FetchActiveHouseMemberByPersonId(famId)
                                        if (existing) {
                                            // show a NiceModal warning and abort submit
                                            showModal({
                                                title: 'Warning',
                                                message: 'This person is an active member of a family.',
                                                variant: 'warn',
                                                primaryText: 'OK'
                                            })
                                            setIsSubmitting(false)
                                            return
                                        }
                                    }
                                } catch (errCheck) {
                                    console.error('active-member preflight error', errCheck)
                                    // allow submit to proceed if the preflight check itself errors
                                }

                                // Pre-flight: check for existing family number
                                try {
                                    const familyQuery = new FamilyQuery()
                                    const existingFamNum = await familyQuery.FetchFamilyByFamilyNum(famnum.trim())
                                    if (existingFamNum) {
                                        showModal({
                                            title: 'Duplicate Family Number',
                                            message: `Family number "${famnum}" already exists. Please use a different number.`,
                                            variant: 'warn',
                                            primaryText: 'OK'
                                        })
                                        setIsSubmitting(false)
                                        return
                                    }
                                } catch (errCheck) {
                                    console.error('family number check error', errCheck)
                                    // allow submit to proceed if the preflight check itself errors
                                }

                                // Pre-flight: check for existing UFC number
                                try {
                                    const familyQuery = new FamilyQuery()
                                    const existingUfc = await familyQuery.FetchFamilyByUfcNum(ufcNum.trim())
                                    if (existingUfc) {
                                        showModal({
                                            title: 'Duplicate UFC Number',
                                            message: `UFC number "${ufcNum}" already exists. Please use a different number.`,
                                            variant: 'warn',
                                            primaryText: 'OK'
                                        })
                                        setIsSubmitting(false)
                                        return
                                    }
                                } catch (errCheck) {
                                    console.error('UFC number check error', errCheck)
                                    // allow submit to proceed if the preflight check itself errors
                                }

                                await handleSubmit()
                            } finally {
                                setIsSubmitting(false)
                            }
                        },
                    })} loading={loading || isSubmitting} disabled={loading || isSubmitting || handleValidation !== null} />
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default CreateFamily

const styles = StyleSheet.create({
    container: { paddingHorizontal: 8 },
    required: { color: '#b00020', fontSize: 12, marginBottom: 6 },
})