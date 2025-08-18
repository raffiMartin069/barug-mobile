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

import { fetchResidentProfile } from '@/api/residentApi'
import { useProfilingWizard } from '@/store/profilingWizard'

type Opt = { label: string; value: string }

const VerifyPersonalInfo = () => {
  const router = useRouter()
  const { personal, setPersonal } = useProfilingWizard()

  // ---------- Local state (editable) ----------
  const [fname, setFname] = useState('')
  const [mname, setMname] = useState('')
  const [lname, setLname] = useState('')
  const [suffix, setSuffix] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [dob, setDob] = useState<Date | null>(null)
  const [civilStatus, setCivilStatus] = useState<string>('')   // dropdown value
  const [nationality, setNationality] = useState<string>('')   // dropdown value
  const [religion, setReligion] = useState<string>('')         // dropdown value
  const [haddress, setHAddress] = useState('')

  // keep granular address too
  const [street, setStreet] = useState('')
  const [purok, setPurok] = useState('')
  const [barangay, setBarangay] = useState('')
  const [city, setCity] = useState('')

  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')

  // loading / ui states
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)

  // ---------- Helper: map API id/name -> dropdown value ----------
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

  // Build payload for wizard.personal
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
      date_of_birth: dob ? dob.toISOString() : null,
      email: (email || '').trim() || null,
      mobile_number: (mobnum || '').trim() || null,
      sex_id: gender === 'male' ? 1 : 2,
      civil_status_id: toInt(civilStatus),
      nationality_id: toInt(nationality),
      religion_id: toInt(religion),
      // address (both granular and composed)
      street: street || null,
      purok: purok || null,
      barangay: barangay || null,
      city: city || null,
      haddress: haddress || null,
    }
  }

  // ---------- Fetch profile and prefill ----------
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const p = await fetchResidentProfile()
        if (!mounted || !p) return

        // Names
        setFname(p.first_name ?? '')
        setMname(p.middle_name ?? '')
        setLname(p.last_name ?? '')
        setSuffix(p.suffix ?? '')

        // Sex -> 'male' | 'female'
        const sexRaw = (p.sex_name ?? p.sex ?? '').toString().toLowerCase()
        setGender(sexRaw.startsWith('f') ? 'female' : 'male')

        // DOB
        const rawDob = p.birthdate ?? p.date_of_birth ?? ''
        const dobDate = rawDob ? new Date(rawDob) : null
        setDob(dobDate)

        // Dropdown values (IDs preferred, fallback to label)
        setCivilStatus(
          pickOptionValue(p.civil_status_id, p.civil_status ?? p.civil_status_name, civilStatusOptions as Opt[])
        )
        setNationality(
          pickOptionValue(p.nationality_id, p.nationality ?? p.nationality_name, nationalityOptions as Opt[])
        )
        setReligion(
          pickOptionValue(p.religion_id, p.religion ?? p.religion_name, religionOptions as Opt[])
        )

        // Address
        const _street = p.street ?? p.street_name ?? ''
        const _purok = p.purok ?? p.purok_sitio ?? p.purok_sitio_name ?? ''
        const _brgy  = p.barangay ?? p.barangay_name ?? ''
        const _city  = p.city ?? p.city_name ?? ''
        setStreet(_street)
        setPurok(_purok)
        setBarangay(_brgy)
        setCity(_city)

        const addrParts = [_street, _purok, _brgy, _city].filter(Boolean)
        setHAddress(addrParts.join(', '))

        // Contact
        setMobNum(p.mobile_num != null ? String(p.mobile_num) : '')
        setEmail(p.email != null ? String(p.email) : '')

        // Seed wizard.personal with fetched values
        setPersonal({
          ...(personal ?? {}),
          first_name: p.first_name ?? '',
          middle_name: p.middle_name ?? null,
          last_name: p.last_name ?? '',
          suffix: p.suffix ?? null,
          date_of_birth: dobDate ? dobDate.toISOString() : null,
          email: p.email ?? null,
          mobile_number: p.mobile_num != null ? String(p.mobile_num) : null,
          sex_id: sexRaw.startsWith('f') ? 2 : 1,
          civil_status_id: p.civil_status_id ?? undefined,
          nationality_id: p.nationality_id ?? undefined,
          religion_id: p.religion_id ?? undefined,
          street: _street || null,
          purok: _purok || null,
          barangay: _brgy || null,
          city: _city || null,
          haddress: addrParts.join(', ') || null,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Validators ----------
  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  const validateMobileNumber = (n: string) => /^(09\d{9}|\+639\d{9})$/.test(n)

  // Validate then show confirm modal
  const handleContinue = async () => {
    const tF = fname.trim()
    const tM = mname.trim()
    const tL = lname.trim()
    const tS = suffix.trim()
    const tE = email.trim()
    const tMOB = mobnum.trim()
    const tAddr = haddress.trim()

    if (!tF || /[^a-zA-Z\s]/.test(tF)) {
      Alert.alert('Validation Error', 'Please enter a valid first name (letters only).')
      return
    }
    if (!tL || /[^a-zA-Z\s]/.test(tL)) {
      Alert.alert('Validation Error', 'Please enter a valid last name (letters only).')
      return
    }
    if (tM && /[^a-zA-Z\s]/.test(tM)) {
      Alert.alert('Validation Error', 'Middle name must contain letters only.')
      return
    }
    if (tS && !/^(JR|SR|III|IV|V)$/i.test(tS)) {
      Alert.alert('Validation Error', 'Suffix must be JR, SR, III, IV, or V.')
      return
    }
    if (!dob || new Date(dob) > new Date()) {
      Alert.alert('Validation Error', 'Please select a valid date of birth.')
      return
    }
    if (!civilStatus) {
      Alert.alert('Validation Error', 'Please select your civil status.')
      return
    }
    if (!nationality) {
      Alert.alert('Validation Error', 'Please select your nationality.')
      return
    }
    if (!religion) {
      Alert.alert('Validation Error', 'Please select your religion.')
      return
    }
    if (!tAddr) {
      Alert.alert('Validation Error', 'Please set your complete home address.')
      return
    }
    if (!tMOB || !validateMobileNumber(tMOB)) {
      Alert.alert('Validation Error', 'Mobile number must be 09XXXXXXXXX or +639XXXXXXXXX.')
      return
    }
    if (!tE || !validateEmail(tE)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.')
      return
    }

    setConfirmVisible(true)
  }

  const proceedToNext = () => {
    // persist latest edits into wizard.personal
    setPersonal({ ...(personal ?? {}), ...buildPersonalPayload() })

    setConfirmVisible(false)
    setSaving(true)
    try {
      router.push({
        pathname: '/socioeconomicinfo',
        params: {
          fname: fname.trim(),
          mname: mname.trim(),
          lname: lname.trim(),
          suffix: suffix.trim(),
          gender,
          dob: dob?.toISOString?.() ?? '',
          civilStatus,
          nationality,
          religion,
          mobnum: mobnum.trim(),
          email: email.trim(),
        },
      })
    } finally {
      setSaving(false)
    }
  }

  const goEditProfile = () => {
    setConfirmVisible(false)
    router.push({ pathname: '/profile', params: { returnTo: '/verifypersonalinfo' } })
  }

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: {
        returnTo: '/verifypersonalinfo',
        // carry current values
        fname, mname, lname, suffix, gender,
        dob: dob?.toISOString?.() ?? '',
        civilStatus, nationality, religion,
        mobnum, email,
      },
    })
  }

  if (profileLoading) {
    return (
      <ThemedView safe={true} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    )
  }

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Verify Personal Info" showNotif={false} showProfile={false} />
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

          <ThemedText subtitle={true}>Sex</ThemedText>
          <ThemedRadioButton value={gender} onChange={setGender} options={genderOptions} />
          <Spacer height={10} />

          <ThemedDatePicker
            value={dob}
            mode="date"
            onChange={setDob}
            placeholder="Date of Birth"
            maximumDate={new Date()}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={civilStatusOptions}
            value={civilStatus}
            setValue={setCivilStatus}
            placeholder="Civil Status"
            order={0}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={nationalityOptions}
            value={nationality}
            setValue={setNationality}
            placeholder="Nationality"
            order={1}
          />
          <Spacer height={10} />

          <ThemedDropdown
            items={religionOptions}
            value={religion}
            setValue={setReligion}
            placeholder="Religion"
            order={2}
          />
          <Spacer height={10} />

          <Pressable onPress={handleHomeAddress}>
            <ThemedTextInput
              placeholder="Home Address"
              multiline
              numberOfLines={2}
              value={haddress}
              onChangeText={setHAddress}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>
          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Mobile Number"
            value={mobnum}
            onChangeText={setMobNum}
            keyboardType="phone-pad"
          />

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
        <View>
          <ThemedButton onPress={handleContinue} disabled={saving}>
            <ThemedText btn={true}>{saving ? 'Saving...' : 'Continue'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ThemedText title={true} style={{ textAlign: 'center' }}>
              Confirm Personal Information
            </ThemedText>
            <Spacer height={8} />
            <ThemedText style={{ textAlign: 'center' }}>
              Is the personal information you’ve provided correct?{'\n'}
              If not, please update it in your Profile page first.
            </ThemedText>
            <Spacer height={16} />
            <View style={styles.modalActions}>
              <View style={{ flex: 1, marginRight: 6 }}>
                <ThemedButton onPress={goEditProfile}>
                  <ThemedText btn={true}>No, Edit Profile</ThemedText>
                </ThemedButton>
              </View>
              <View style={{ flex: 1, marginLeft: 6 }}>
                <ThemedButton onPress={proceedToNext}>
                  <ThemedText btn={true}>Yes, Continue</ThemedText>
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
  text: { textAlign: 'center' },
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
