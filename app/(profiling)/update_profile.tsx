// app/update_profile.tsx
import { updateUnverifiedBasicInfo } from '@/api/residentApi'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDatePicker from '@/components/ThemedDatePicker'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRegistrationStore } from '@/store/registrationStore'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'

import {
    civilStatusOptions,
    genderOptions,
    nationalityOptions,
    religionOptions,
    suffixOptions,
} from '@/constants/formoptions'

type RouteParams = {
    profile?: string
    person_id?: string
    street?: string
    purok?: string
    brgy?: string
    city?: string
    skipPrefill?: string        // NEW
    returnTo?: string
}

type Option = { label: string; value: string }

const mapLabelToValue = (opts: Option[], label?: string | null, fallbackId?: number | string) => {
    if (fallbackId !== undefined && fallbackId !== null && `${fallbackId}` !== '') {
        return String(fallbackId)
    }
    if (!label) return ''
    const needle = `${label}`.trim().toLowerCase()
    const found = opts.find((o) => o.label.trim().toLowerCase() === needle)
    return found ? String(found.value) : ''
}

const UpdateProfile = () => {
    const router = useRouter()
    const {
        profile: rawProfile,
        person_id,
        street: pStreet,
        purok: pPurok,
        brgy: pBrgy,
        city: pCity,
        skipPrefill,
        returnTo,                    // ✅ NEW
    } = useLocalSearchParams<RouteParams>()

    const {
        // state
        fname, mname, lname, suffix, gender, dob,
        civilStatus, nationality, religion,
        mobnum, email, haddress,
        street, puroksitio, brgy, city,
        // actions
        setField, setAddress,
    } = useRegistrationStore()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPrefilling, setIsPrefilling] = useState(true)

    // run prefill ONCE; also skip if store already has data or skipPrefill=1
    const didPrefillRef = useRef(false)

    // Date-safe value for ThemedDatePicker
    const dobDate = useMemo(() => {
        if (!dob) return undefined
        const d = new Date(dob)
        return isNaN(d.getTime()) ? undefined : d
    }, [dob])

    // Dropdown helpers
    const setCivilStatusState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
        return (valOrFn) => {
            const prev = useRegistrationStore.getState().civilStatus
            const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
            setField('civilStatus', next)
        }
    }, [setField])

    const setNationalityState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
        return (valOrFn) => {
            const prev = useRegistrationStore.getState().nationality
            const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
            setField('nationality', next)
        }
    }, [setField])

    const setReligionState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
        return (valOrFn) => {
            const prev = useRegistrationStore.getState().religion
            const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
            setField('religion', next)
        }
    }, [setField])

    const setSuffixState = useMemo<React.Dispatch<React.SetStateAction<string>>>(() => {
        return (valOrFn) => {
            const prev = useRegistrationStore.getState().suffix || ''
            const next = typeof valOrFn === 'function' ? (valOrFn as (p: string) => string)(prev) : valOrFn
            setField('suffix', next ?? '')
        }
    }, [setField])

    // PREFILL FIRST (but not after returning from map)
    useEffect(() => {
        // skip if:
        //  - we already prefilled this mount
        //  - store already has meaningful data (user came back)
        //  - caller explicitly asked to skip (skipPrefill=1)
        const hasData =
            Boolean(useRegistrationStore.getState().fname) ||
            Boolean(useRegistrationStore.getState().lname) ||
            Boolean(useRegistrationStore.getState().email) ||
            Boolean(useRegistrationStore.getState().haddress)

        if (didPrefillRef.current || hasData || String(skipPrefill || '') === '1') {
            setIsPrefilling(false)
            return
        }
        didPrefillRef.current = true

            ; (async () => {
                try {
                    const data = rawProfile ? JSON.parse(String(rawProfile)) : {}

                    const sexName = (data.sex_name ?? data.sex ?? '').toString()
                    const birthRaw = data.date_of_birth ?? data.birthdate ?? ''
                    const birth = (() => {
                        if (!birthRaw) return ''
                        const d = new Date(birthRaw)
                        return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
                    })()

                    const civilId = mapLabelToValue(civilStatusOptions, data.civil_status, data.civil_status_id)
                    const natId = mapLabelToValue(nationalityOptions, data.nationality, data.nationality_id)
                    const relId = mapLabelToValue(religionOptions, data.religion, data.religion_id)

                    const mergedStreet = pStreet ?? data.street_name ?? data.street ?? ''
                    const mergedPurok = pPurok ?? data.purok_sitio_name ?? data.purok_sitio ?? data.purok ?? ''
                    const mergedBrgy = pBrgy ?? data.barangay_name ?? data.barangay ?? ''
                    const mergedCity = pCity ?? data.city_name ?? data.city ?? ''
                    const fullAddr = [mergedStreet, mergedPurok, mergedBrgy, mergedCity].filter(Boolean).join(', ')

                    // bulk fields
                    setField('fname', data.first_name ?? '')
                    setField('mname', data.middle_name ?? '')
                    setField('lname', data.last_name ?? '')
                    setField('suffix', data.suffix ?? '')
                    setField('gender', sexName.toLowerCase() === 'male' ? 'male' : 'female')
                    setField('dob', birth)
                    setField('civilStatus', civilId)
                    setField('nationality', natId)
                    setField('religion', relId)
                    setField('mobnum', data.mobile_number ?? '')
                    setField('email', data.email ?? '')
                    setField('haddress', fullAddr)

                    // granular address (used by map/update flows)
                    setAddress({
                        street: mergedStreet,
                        puroksitio: mergedPurok,
                        brgy: mergedBrgy,
                        city: mergedCity,
                    })
                } catch (e) {
                    console.error('Prefill parse error:', e)
                    Alert.alert('Error', 'Invalid profile data passed.')
                } finally {
                    setIsPrefilling(false)
                }
            })()
    }, [rawProfile, pStreet, pPurok, pBrgy, pCity, setField, setAddress, skipPrefill])

    // validators (same as PersonalInfo, minus passwords)
    const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    const validateMobileNumber = (n: string) => /^(09\d{9}|\+639\d{9})$/.test(n)
    // ...inside UpdateProfile component

    const handleSubmit = async () => {
        if (isSubmitting) return

        const trimmedFname = fname.trim()
        const trimmedMname = mname.trim()
        const trimmedLname = lname.trim()
        const trimmedSuffix = (suffix || '').trim()
        const trimmedEmail = email.trim()
        const trimmedMobnum = mobnum.trim()
        const trimmedHAddress = haddress.trim()

        // (validations unchanged)
        // ...

        // Normalize DOB to YYYY-MM-DD
        const dobIso = typeof dob === 'string' ? dob : new Date(dob).toISOString().slice(0, 10)
        const sexId = gender === 'male' ? 1 : 2

        const fd = new FormData()

        // tiny helper to append multiple accepted keys with the same value
        const appendAliases = (keys: string[], value: any) => {
            if (value === undefined || value === null || value === '') return
            for (const k of keys) fd.append(k, typeof value === 'string' ? value : String(value))
        }

        // IDs (send both plain and p_* just in case)
        appendAliases(['person_id', 'p_person_id'], person_id)
        appendAliases(['updated_by_id', 'p_updated_by_id'], person_id)

        // Names
        appendAliases(['first_name', 'p_first_name'], trimmedFname)
        appendAliases(['middle_name', 'p_middle_name'], trimmedMname)
        appendAliases(['last_name', 'p_last_name'], trimmedLname)
        appendAliases(['suffix', 'p_suffix'], trimmedSuffix)

        // Birthdate / sex / status IDs
        appendAliases(['birthdate', 'p_birthdate', 'date_of_birth'], dobIso)
        appendAliases(['sex_id', 'p_sex_id'], sexId)
        appendAliases(['civil_status_id', 'p_civil_status_id'], parseInt(civilStatus))
        appendAliases(['nationality_id', 'p_nationality_id'], parseInt(nationality))
        appendAliases(['religion_id', 'p_religion_id'], parseInt(religion))

        // Contact
        appendAliases(['mobile_num', 'p_mobile_num', 'mobile_number'], trimmedMobnum)
        appendAliases(['email'], trimmedEmail)

        // Address — use *_name keys that your backend prints
        appendAliases(['city_name', 'p_city_name', 'city'], city)
        appendAliases(['barangay_name', 'p_barangay_name', 'barangay'], brgy)
        appendAliases(['purok_sitio_name', 'p_purok_sitio_name', 'purok'], puroksitio)
        appendAliases(['street_name', 'p_street_name', 'street'], street)

        try {
            setIsSubmitting(true)
            const resp = await updateUnverifiedBasicInfo(fd)
            console.log('✅ Update response:', resp)
            Alert.alert('Success', 'Profile updated successfully.')

            // ✅ Go back to origin if provided, else to residenthome
            if (returnTo && String(returnTo).trim() !== '') {
                router.replace(String(returnTo))          // or decodeURIComponent if you encode it when sending
            } else {
                router.replace('/residenthome')
            }
        } catch (error: any) {
            console.error('❌ Update API error:', error)
            let code = 'UNKNOWN'
            let reason = 'Something went wrong while saving.'
            if (typeof error?.error === 'string') {
                try {
                    const fixed = error.error.replace(/'/g, '"').replace(/\bNone\b/g, 'null')
                    const parsed = JSON.parse(fixed)
                    code = parsed?.code || code
                    reason = parsed?.message || reason
                } catch { }
            } else if (typeof error === 'object') {
                code = error?.code || code
                reason = error?.message || reason
            }
            Alert.alert('Update Failed', `[${code}] ${reason}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleHomeAddress = () => {
        // Go to map, then into update_residentaddress, which writes store
        // We'll return here with skipPrefill=1 to prevent overwriting.
        router.push({ pathname: '/update_mapaddress', params: { returnTo: '/update_residentaddress' } })
    }

    return (
        <ThemedView safe>
            <ThemedAppBar title="Update Profile" showNotif={false} showProfile={false} />
            {isPrefilling ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator size="large" />
                    <Spacer height={10} />
                    <ThemedText>Loading profile…</ThemedText>
                </View>
            ) : null}

            <ThemedKeyboardAwareScrollView>
                <View pointerEvents={isPrefilling ? 'none' : 'auto'} style={{ opacity: isPrefilling ? 0.5 : 1 }}>
                    <ThemedTextInput placeholder="First Name" value={fname} onChangeText={(v) => setField('fname', v)} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder="Middle Name" value={mname} onChangeText={(v) => setField('mname', v)} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder="Last Name" value={lname} onChangeText={(v) => setField('lname', v)} />
                    <Spacer height={10} />

                    <ThemedDropdown items={suffixOptions} value={suffix || ''} setValue={setSuffixState} placeholder="Suffix (optional)" order={-1} />
                    <Spacer height={10} />

                    <ThemedText subtitle>Sex</ThemedText>
                    <ThemedRadioButton value={gender} onChange={(v) => setField('gender', v)} options={genderOptions} />
                    <Spacer height={10} />

                    <ThemedDatePicker
                        value={dobDate}
                        mode="date"
                        onChange={(picked: Date | string) => {
                            const d = picked instanceof Date ? picked : new Date(picked)
                            if (!isNaN(d.getTime())) setField('dob', d.toISOString().slice(0, 10))
                        }}
                        placeholder="Date of Birth"
                        maximumDate={new Date()}
                    />

                    <Spacer height={10} />
                    <ThemedDropdown items={civilStatusOptions} value={civilStatus} setValue={setCivilStatusState} placeholder="Civil Status" order={0} />
                    <Spacer height={10} />
                    <ThemedDropdown items={nationalityOptions} value={nationality} setValue={setNationalityState} placeholder="Nationality" order={1} />
                    <Spacer height={10} />
                    <ThemedDropdown items={religionOptions} value={religion} setValue={setReligionState} placeholder="Religion" order={2} />
                    <Spacer height={10} />

                    <Pressable onPress={handleHomeAddress}>
                        <ThemedTextInput
                            placeholder="Home Address"
                            multiline
                            numberOfLines={2}
                            value={haddress}
                            onChangeText={(v) => setField('haddress', v)}
                            editable={false}
                            pointerEvents="none"
                        />
                    </Pressable>

                    <Spacer height={10} />
                    <ThemedTextInput placeholder="Mobile Number" value={mobnum} onChangeText={(v) => setField('mobnum', v)} keyboardType="numeric" />
                    <Spacer height={10} />
                    <ThemedTextInput
                        placeholder="Email Address"
                        value={email}
                        onChangeText={(v) => setField('email', v)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <Spacer height={15} />
                    <ThemedButton onPress={handleSubmit} disabled={isSubmitting || isPrefilling}>
                        <ThemedText btn>{isSubmitting ? 'Saving…' : 'Save Changes'}</ThemedText>
                    </ThemedButton>
                    <Spacer height={20} />
                </View>
            </ThemedKeyboardAwareScrollView>
        </ThemedView>
    )
}

export default UpdateProfile

const styles = StyleSheet.create({
    image: { width: '100%', height: 70, alignSelf: 'center' },
    text: { textAlign: 'center' },
    link: { textAlign: 'right' },
})
