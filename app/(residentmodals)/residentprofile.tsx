import { logout } from '@/api/authApi'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedImage from '@/components/ThemedImage'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

export const options = {
  href: null,
}

type AnyObj = Record<string, any>

const ResidentProfile = () => {
  const router = useRouter()
  const params = useLocalSearchParams()

  // 1) Normalize expo-router params (string|string[]|undefined -> string)
  const normalizedParams: AnyObj = useMemo(() => {
    return Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : (v ?? '')]),
    )
  }, [params])

  // 2) Accept a JSON payload in one of several keys, or just use the flat params
  const data: AnyObj = useMemo(() => {
    const candidates = ['profile', 'data', 'row', 'item']
    for (const key of candidates) {
      const raw = normalizedParams[key]
      if (typeof raw === 'string') {
        const s = raw.trim()
        if (s.startsWith('{') || s.startsWith('[')) {
          try {
            const parsed = JSON.parse(s)
            return Array.isArray(parsed) ? (parsed[0] ?? {}) : parsed
          } catch { }
        }
      }
    }
    // fallback: use normalized params directly
    return normalizedParams
  }, [normalizedParams])

  // 3) Helpers
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login'); // go back to login page
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to logout');
    }
  };

  const fmt = (v: any) => (v === null || v === undefined || `${v}`.trim() === '' ? '—' : `${v}`)
  const yesNo = (v: any) => {
    if (typeof v === 'boolean') return v ? 'YES' : 'NO'
    const s = `${v}`.toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(s)) return 'YES'
    if (['false', '0', 'no', 'n'].includes(s)) return 'NO'
    return '—'
  }
  const formatDate = (iso?: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return fmt(iso)
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const nameOf = (a?: string | null, b?: string | null, c?: string | null, sfx?: string | null) =>
    [a, b, c, sfx].filter(Boolean).join(' ')

  // 4) Map fields from your RPC
  const personId = data.person_id
  const personCode = data.person_code

  const fullName = nameOf(data.first_name, data.middle_name, data.last_name, data.suffix)
  
  const verifiedName = nameOf(
    data.verified_first_name,
    data.verified_middle_name,
    data.verified_last_name,
    data.verified_suffix,
  )

  const address = [data.street_name, data.purok_sitio_name, data.barangay_name, data.city_name]
    .filter(Boolean)
    .join(', ')


  // Address parts (with tolerant fallbacks)
  const street = data.street_name ?? data.street ?? ''
  const purok = data.purok_sitio_name ?? data.purok_sitio ?? data.purok ?? ''
  const barangay = data.barangay_name ?? data.barangay ?? ''
  const city = data.city_name ?? data.city ?? ''

  const hhHead = nameOf(
    data.household_head_first_name,
    data.household_head_middle_name,
    data.household_head_last_name,
    data.household_head_suffix,
  )
  const famHead = nameOf(
    data.family_head_first_name,
    data.family_head_middle_name,
    data.family_head_last_name,
    data.family_head_suffix,
  )

  const photoUri =
    data.profile_picture ||
    data.selfie_with_id ||
    null

  // If other_family_members may be JSON or CSV, parse smartly
  const familyMembers: string[] = useMemo(() => {
    const raw = data.other_family_members
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((x) => `${x}`)
    if (typeof raw === 'string') {
      const s = raw.trim()
      if (s.startsWith('[')) {
        try {
          const arr = JSON.parse(s)
          if (Array.isArray(arr)) return arr.map((x) => `${x}`)
        } catch { }
      }
      return s.split(',').map((x) => x.trim()).filter(Boolean)
    }
    return []
  }, [data.other_family_members])

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar title="Profile" showProfile={false} showNotif={false} showSettings={true} />

      <ThemedKeyboardAwareScrollView>
        <Spacer height={20} />

        <ThemedCard>
          <View style={{ alignItems: 'center' }}>
            <ThemedImage
              src={
                photoUri
                  ? { uri: photoUri }
                  : require('@/assets/images/default-image.jpg')
              }
              size={90}
            />
          </View>

          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Resident ID:</ThemedText>
            <ThemedText subtitle={true}>{fmt(personId)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Person Code:</ThemedText>
            <ThemedText subtitle={true}>{fmt(personCode)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Name:</ThemedText>
            <ThemedText subtitle={true}>{fmt(fullName)}</ThemedText>
          </View>

          {verifiedName && verifiedName !== fullName ? (
            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle={true}>Verified Name:</ThemedText>
              <ThemedText subtitle={true}>{fmt(verifiedName)}</ThemedText>
            </View>
          ) : null}

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Sex:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.sex)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Date of Birth:</ThemedText>
            <ThemedText subtitle={true}>{formatDate(data.birthdate)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Civil Status:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.civil_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Nationality:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.nationality)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Religion:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.religion)}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Educational Attainment:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.education)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Employment Status:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.employment_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Occupation:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.occupation)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Government Program:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.gov_program)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Monthly Income:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.monthly_income)}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Street:</ThemedText>
            <ThemedText subtitle={true}>{fmt(street)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Purok/Sitio:</ThemedText>
            <ThemedText subtitle={true}>{fmt(purok)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Barangay:</ThemedText>
            <ThemedText subtitle={true}>{fmt(barangay)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>City:</ThemedText>
            <ThemedText subtitle={true}>{fmt(city)}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Residency Status:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.residential_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Residency Period:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.residency_period)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Account Status:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.acc_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Verification Status:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.verification_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Verified On:</ThemedText>
            <ThemedText subtitle={true}>{formatDate(data.verification_date)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Registration Method:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.registration_method)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Email Verified:</ThemedText>
            <ThemedText subtitle={true}>{yesNo(data.is_email_verified)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Valid ID On File:</ThemedText>
            <ThemedText subtitle={true}>{yesNo(data.is_id_valid)}</ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={30} />

        <ThemedCard>
          <ThemedText title={true}>Household Information</ThemedText>
          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Head:</ThemedText>
            <ThemedText subtitle={true}>{fmt(hhHead)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Household Number:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.household_num)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Type:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.house_type)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>House Ownership:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.house_ownership)}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <ThemedText title={true}>Family Information</ThemedText>
          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Head:</ThemedText>
            <ThemedText subtitle={true}>{fmt(famHead)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Number:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.family_num)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Type:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.family_type || data.household_type)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>NHTS:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.nhts_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Indigent:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.indigent_status)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Source of Income:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.source_of_income)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle={true}>Family Monthly Income:</ThemedText>
            <ThemedText subtitle={true}>{fmt(data.family_monthly_income)}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <ThemedText title={true}>Family Members</ThemedText>
          <Spacer height={10} />

          <View style={styles.familyList}>
            {familyMembers.length === 0 ? (
              <View style={styles.familyCard}>
                <ThemedText subtitle={true}>No other members listed.</ThemedText>
              </View>
            ) : (
              familyMembers.map((name, idx) => (
                <View key={`${name}-${idx}`} style={styles.familyCard}>
                  <ThemedText subtitle={true}>{name}</ThemedText>
                </View>
              ))
            )}
          </View>

          <Spacer height={15} />

          <View>
            <ThemedButton
              submit={false}
              onPress={() =>
                router.push({
                  pathname: '/update_profile',
                  params: {
                    profile: JSON.stringify(data), // ← pass the whole profile you already have
                    person_id: String(personId ?? ''), // optional but useful for update payload
                    street,
                    purok,
                    brgy: barangay,
                    city,
                  },
                })
              }
            >
              <ThemedText non_btn={true}>Update Profile</ThemedText>
            </ThemedButton>
          </View>


          <View>
            <ThemedButton submit={false} onPress={() => router.push('/request')}>
              <ThemedText non_btn={true}>Request House-to-House Visit</ThemedText>
            </ThemedButton>
          </View>

        </ThemedCard>

        <Spacer height={15} />

        <View style={{ paddingHorizontal: 15 }}>
          <ThemedButton onPress={handleLogout}>
            <ThemedText non_btn={true}>Logout</ThemedText>
          </ThemedButton>
        </View>
        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default ResidentProfile

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  bold: {
    fontWeight: '600',
  },
  familyList: {
    gap: 10,
  },
  familyCard: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
})
