import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDatePicker from '@/components/ThemedDatePicker'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedRadioButton from '@/components/ThemedRadioButton'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from 'react-native'

import {
    civilStatusOptions,
    genderOptions,
    nationalityOptions,
    religionOptions,
} from '@/constants/formoptions'

import { fetchResidentProfile, updateUnverifiedBasicInfo } from '@/api/residentApi'
import { useProfilingWizard } from '@/store/profilingWizard'

type Opt = { label: string; value: string }

const VerifyPersonalInfo = () => {
    const router = useRouter()
    const { personal, setPersonal } = useProfilingWizard()

    // ---------- Local state ----------
    const [fname, setFname] = useState('')
    const [mname, setMname] = useState('')
    const [lname, setLname] = useState('')
    const [suffix, setSuffix] = useState('')
    const [gender, setGender] = useState<'male' | 'female'>('male')
    const [dob, setDob] = useState<Date | null>(null)
    const [civilStatus, setCivilStatus] = useState<string>('')
    const [nationality, setNationality] = useState<string>('')
    const [religion, setReligion] = useState<string>('')
    const [haddress, setHAddress] = useState('')

    const [street, setStreet] = useState('')
    const [purok, setPurok] = useState('')
    const [barangay, setBarangay] = useState('')
    const [city, setCity] = useState('')

    const [mobnum, setMobNum] = useState('')
    const [email, setEmail] = useState('')

    const [profileLoading, setProfileLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [confirmVisible, setConfirmVisible] = useState(false)

    // ---------- Helpers ----------
    const pickOptionValue = (idLike: any, nameLike: any, options: Opt[]) => {
        if (idLike !== undefined && idLike !== null && idLike !== '') {
            const idStr = String(idLike)
            if (options.some(o => String(o.value) === idStr)) return idStr
        }
        if (nameLike) {
            const label = String(nameLike).trim().toLowerCase()
            const hit = options.find(o => o.label.trim().toLowerCase() === label)
            if (hit) return String(hit.value)
        }
        return ''
    }

    const buildPersonalPayload = () => {
        const toInt = (s: string) => {
            const n = parseInt(s || '0', 10)
            return Number.isFinite(n) && n > 0 ? n : undefined
        }

        return {
            first_name: fname.trim(),
            middle_name: mname.trim() || null,
            last_name: lname.trim(),
            suffix: suffix.trim() || null,
            date_of_birth: dob ? dob.toISOString().split('T')[0] : null, // YYYY-MM-DD
            email: (email || '').trim() || null,
            mobile_number: (mobnum || '').trim() || null,
            sex_id: gender === 'male' ? 1 : 2,
            civil_status_id: toInt(civilStatus),
            nationality_id: toInt(nationality),
            religion_id: toInt(religion),
            street: street || null,
            purok: purok || null,
            barangay: barangay || null,
            city: city || null,
            haddress: haddress || null,
        }
    }

    // ---------- Fetch profile ----------
    useEffect(() => {
        let mounted = true
            ; (async () => {
                try {
                    const p = await fetchResidentProfile()
                    if (!mounted || !p) return

                    setFname(p.first_name ?? '')
                    setMname(p.middle_name ?? '')
                    setLname(p.last_name ?? '')
                    setSuffix(p.suffix ?? '')

                    const sexRaw = (p.sex_name ?? p.sex ?? '').toString().toLowerCase()
                    setGender(sexRaw.startsWith('f') ? 'female' : 'male')

                    const rawDob = p.birthdate ?? p.date_of_birth ?? ''
                    setDob(rawDob ? new Date(rawDob) : null)

                    setCivilStatus(pickOptionValue(p.civil_status_id, p.civil_status, civilStatusOptions))
                    setNationality(pickOptionValue(p.nationality_id, p.nationality, nationalityOptions))
                    setReligion(pickOptionValue(p.religion_id, p.religion, religionOptions))

                    const _street = p.street ?? p.street_name ?? ''
                    const _purok = p.purok ?? p.purok_sitio ?? ''
                    const _brgy = p.barangay ?? ''
                    const _city = p.city ?? ''
                    setStreet(_street)
                    setPurok(_purok)
                    setBarangay(_brgy)
                    setCity(_city)

                    const addrParts = [_street, _purok, _brgy, _city].filter(Boolean)
                    setHAddress(addrParts.join(', '))

                    setMobNum(p.mobile_num != null ? String(p.mobile_num) : '')
                    setEmail(p.email != null ? String(p.email) : '')

                    setPersonal({
                        ...(personal ?? {}),
                        ...buildPersonalPayload(),
                    })
                } catch (e) {
                    console.error('Failed to load resident profile:', e)
                    Alert.alert('Error', 'Failed to load your profile. Please try again.')
                } finally {
                    if (mounted) setProfileLoading(false)
                }
            })()
        return () => {
            mounted = false
        }
    }, [])

    // ---------- Validators ----------
    const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
    const validateMobileNumber = (n: string) => /^(09\d{9}|\+639\d{9})$/.test(n)

    const handleContinue = () => {
        // validation rules (same as before)...
        if (!fname.trim() || /[^a-zA-Z\s]/.test(fname.trim())) {
            Alert.alert('Validation Error', 'Please enter a valid first name.')
            return
        }
        if (!lname.trim() || /[^a-zA-Z\s]/.test(lname.trim())) {
            Alert.alert('Validation Error', 'Please enter a valid last name.')
            return
        }
        if (!dob || new Date(dob) > new Date()) {
            Alert.alert('Validation Error', 'Please select a valid date of birth.')
            return
        }
        if (!civilStatus || !nationality || !religion || !haddress.trim()) {
            Alert.alert('Validation Error', 'Please complete all required fields.')
            return
        }
        if (!mobnum.trim() || !validateMobileNumber(mobnum.trim())) {
            Alert.alert('Validation Error', 'Invalid mobile number.')
            return
        }
        if (!email.trim() || !validateEmail(email.trim())) {
            Alert.alert('Validation Error', 'Invalid email address.')
            return
        }

        setConfirmVisible(true)
    }

    // ---------- API Submit + Next ----------
    const proceedToNext = async () => {
        setSaving(true)
        try {
            const payload = buildPersonalPayload()
            const formData = new FormData()
            Object.entries(payload).forEach(([k, v]) => {
                if (v !== undefined && v !== null) {
                    formData.append(k, String(v))
                }
            })

            const res = await updateUnverifiedBasicInfo(formData)
            console.log('Update success:', res)
            router.push({ pathname: '/socioeconomicinfo' })

            // persist to wizard state
            setPersonal({ ...(personal ?? {}), ...payload })

        } catch (err: any) {
            console.log('Submit failed:', err)
            console.log('Error', err?.message || 'Failed to update information. Please try again.')
            Alert.alert('Error', err?.message || 'Failed to update information. Please try again.')
        } finally {
            setConfirmVisible(false)
            setSaving(false)
        }
    }

    const goEditProfile = () => {
    setConfirmVisible(false);
    };

    const handleHomeAddress = () => {
        router.push({ pathname: '/mapaddress', params: { returnTo: '/verifypersonalinfo' } })
    }

    if (profileLoading) {
        return (
            <ThemedView safe style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </ThemedView>
        )
    }

    return (
        <ThemedView safe>
            <ThemedAppBar title="Update Personal Info" showNotif={false} showProfile={false} />
            <ThemedProgressBar step={1} totalStep={4} />

            <ThemedKeyboardAwareScrollView>
                <View>
                    <ThemedTextInput placeholder="First Name" value={fname} onChangeText={setFname} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder="Middle Name" value={mname} onChangeText={setMname} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder="Last Name" value={lname} onChangeText={setLname} />
                    <Spacer height={10} />
                    <ThemedTextInput placeholder="Suffix" value={suffix} onChangeText={setSuffix} />
                    <Spacer height={10} />

                    <ThemedText subtitle>Sex</ThemedText>
                    <ThemedRadioButton value={gender} onChange={setGender} options={genderOptions} />
                    <Spacer height={10} />

                    <ThemedDatePicker value={dob} mode="date" onChange={setDob} placeholder="Date of Birth" maximumDate={new Date()} />
                    <Spacer height={10} />

                    <ThemedDropdown items={civilStatusOptions} value={civilStatus} setValue={setCivilStatus} placeholder="Civil Status" order={0} />
                    <Spacer height={10} />
                    <ThemedDropdown items={nationalityOptions} value={nationality} setValue={setNationality} placeholder="Nationality" order={1} />
                    <Spacer height={10} />
                    <ThemedDropdown items={religionOptions} value={religion} setValue={setReligion} placeholder="Religion" order={2} />
                    <Spacer height={10} />

                    <Pressable onPress={handleHomeAddress}>
                        <ThemedTextInput placeholder="Home Address" multiline numberOfLines={2} value={haddress} editable={false} />
                    </Pressable>
                    <Spacer height={10} />

                    <ThemedTextInput placeholder="Mobile Number" value={mobnum} onChangeText={setMobNum} keyboardType="phone-pad" />
                    <Spacer height={10} />

                    <ThemedTextInput
                        placeholder="Email Address"
                        value={`Current Email: ${email}`}
                        onChangeText={setEmail}
                        color="gray"
                        keyboardType="email-address"
                        editable={false}
                    />
                </View>

                <Spacer height={15} />
                <ThemedButton onPress={handleContinue} disabled={saving}>
                    <ThemedText btn>{saving ? 'Saving...' : 'Continue'}</ThemedText>
                </ThemedButton>
            </ThemedKeyboardAwareScrollView>

            {/* Confirmation Modal */}
<Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <ThemedText title style={{ textAlign: 'center' }}>
        Confirm Account Update
      </ThemedText>
      <Spacer height={8} />
      <ThemedText style={{ textAlign: 'center' }}>
        Please review your details carefully.{'\n'}
        By selecting <ThemedText style={{ fontWeight: '600' }}>“Yes, Confirm”</ThemedText>, 
        you acknowledge and authorize the immediate update of your account information.
      </ThemedText>
      <Spacer height={16} />
      <View style={styles.modalActions}>
        <View style={{ flex: 1, marginRight: 6 }}>
          <ThemedButton onPress={goEditProfile} variant="outline">
            <ThemedText btn>No, Go Back</ThemedText>
          </ThemedButton>
        </View>
        <View style={{ flex: 1, marginLeft: 6 }}>
          <ThemedButton onPress={proceedToNext}>
            <ThemedText btn>Yes, Confirm</ThemedText>
          </ThemedButton>
        </View>
      </View>
    </View>
  </View>
</Modal>

        </ThemedView>
    )
}

export default VerifyPersonalInfo

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        elevation: 4,
    },
    modalActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
})
