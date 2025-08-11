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
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native'

import {
    civilStatusOptions,
    genderOptions,
    nationalityOptions,
    religionOptions,
} from '@/constants/formoptions'

import { fetchResidentProfile } from '@/api/residentApi'

type Opt = { label: string; value: string }

const VerifyPersonalInfo = () => {
  const router = useRouter()

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
  const [mobnum, setMobNum] = useState('')
  const [email, setEmail] = useState('')

  // loading states
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ---------- Helper: map API id/name -> dropdown value ----------
  const pickOptionValue = (idLike: any, nameLike: any, options: Opt[]) => {
    // 1) Prefer *_id if present
    if (idLike !== undefined && idLike !== null && idLike !== '') {
      const idStr = String(idLike)
      if (options.some(o => String(o.value) === idStr)) return idStr
    }
    // 2) Fallback: match by label (case-insensitive)
    if (nameLike) {
      const label = String(nameLike).trim().toLowerCase()
      const hit = options.find(o => o.label.trim().toLowerCase() === label)
      if (hit) return String(hit.value)
    }
    return ''
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
        setDob(rawDob ? new Date(rawDob) : null)

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
        const street = p.street ?? p.street_name ?? ''
        const purok = p.purok ?? p.purok_sitio ?? p.purok_sitio_name ?? ''
        const brgy = p.barangay ?? p.barangay_name ?? ''
        const city = p.city ?? p.city_name ?? ''
        const addrParts = [street, purok, brgy, city].filter(Boolean)
        setHAddress(addrParts.join(', '))

        // Contact (force to string to avoid RN warning)
        setMobNum(p.mobile_num != null ? String(p.mobile_num) : '');
        // Email (force to string to avoid RN warning)
        setEmail(p.email != null ? String(p.email) : '')
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

  const handleContinue = async () => {
    // Trim
    const tF = fname.trim()
    const tM = mname.trim()
    const tL = lname.trim()
    const tS = suffix.trim()
    const tE = email.trim()
    const tMOB = mobnum.trim()
    const tAddr = haddress.trim()

    // Validate
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

    setSaving(true)
    try {
      router.push({
        pathname: '/socioeconomicinfo', // TODO: change if different
        params: {
          fname: tF,
          mname: tM,
          lname: tL,
          suffix: tS,
          gender,
          dob: dob?.toISOString?.() ?? '',
          civilStatus,
          nationality,
          religion,
          mobnum: tMOB,
          email: tE,
        },
      })
    } finally {
      setSaving(false)
    }
  }

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: {
        returnTo: '/verifypersonalinfo',
        // pass current selections so they persist on return
        fname, mname, lname, suffix, gender, dob: dob?.toISOString?.() ?? '', civilStatus, nationality, religion, mobnum, email,
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
      <ThemedProgressBar step={1} totalStep={3} />

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
            onChangeText={setEmail} // will be ignored if editable={false}
            color="gray"
            keyboardType="email-address"
            editable={false} // makes it read-only
          />
        </View>

        <Spacer height={15} />
        <View>
          <ThemedButton onPress={handleContinue} disabled={saving}>
            <ThemedText btn={true}>{saving ? 'Saving...' : 'Continue'}</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default VerifyPersonalInfo

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
})
