// app/residentprofile.tsx
import NiceModal, { type ModalVariant } from '@/components/NiceModal'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedImage from '@/components/ThemedImage'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { supabase } from '@/constants/supabase'
import { useAccountRole } from '@/store/useAccountRole'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

export const options = { href: null }

// keep in sync with your guard/sessionUnlock
const UNLOCKED_SESSION_KEY = 'unlocked_session'

export default function ResidentProfile() {
  const router = useRouter()
  const { currentRole, staffId, getProfile, ensureLoaded, clearAll } = useAccountRole()

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('')
  const [modalMsg, setModalMsg] = useState('')
  const [modalVariant, setModalVariant] = useState<ModalVariant>('info')
  const [modalPrimary, setModalPrimary] = useState<(() => void) | undefined>(undefined)
  const [modalSecondary, setModalSecondary] = useState<(() => void) | undefined>(undefined)
  const [modalPrimaryText, setModalPrimaryText] = useState('Got it')
  const [modalSecondaryText, setModalSecondaryText] = useState<string | undefined>(undefined)

  // Data (from params or cached store)
  const params = useLocalSearchParams<{ profile?: string }>()
  const role = currentRole ?? 'resident'

  const parsedFromParams = (() => {
    if (!params?.profile) return null
    try { return JSON.parse(String(params.profile)) } catch { return null }
  })()

  const cached = getProfile(role)
  const initial = parsedFromParams ?? cached ?? null

  const [profile, setProfile] = useState<any | null>(initial)
  const [loading, setLoading] = useState(!initial)

  // SWR: ensure profile is present/fresh (store decides via TTL; no fetch if fresh)
  useEffect(() => {
    let live = true
    ;(async () => {
      const fresh = await ensureLoaded('resident') // you can branch by role when staff/business are implemented
      if (!live) return
      if (fresh) setProfile(fresh)
      setLoading(false)
    })()
    return () => { live = false }
  }, [role, ensureLoaded])

  const fullName = useMemo(() => {
    const fn = [profile?.first_name, profile?.middle_name, profile?.last_name, profile?.suffix]
      .filter(Boolean)
      .join(' ')
    return fn || '—'
  }, [profile])

  const address = useMemo(() => {
    const parts = [profile?.street_name, profile?.purok_sitio_name, profile?.barangay_name, profile?.city_name]
      .filter(Boolean)
      .join(', ')
    return parts || '—'
  }, [profile])

  const peso = (v?: string | number | null) =>
    v == null || v === '' ? '—' : `₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const openModal = (
    title: string,
    message = '',
    variant: ModalVariant = 'info',
    opts?: { primaryText?: string; onPrimary?: () => void; secondaryText?: string; onSecondary?: () => void }
  ) => {
    setModalTitle(title)
    setModalMsg(message)
    setModalVariant(variant)
    setModalPrimary(() => opts?.onPrimary)
    setModalSecondary(() => opts?.onSecondary)
    setModalPrimaryText(opts?.primaryText ?? 'Got it')
    setModalSecondaryText(opts?.secondaryText)
    setModalOpen(true)
  }

  const confirmLogout = () => {
    openModal(
      'Sign Out',
      'Signing out will end your current session. OTP will be required next login. Continue?',
      'warn',
      {
        primaryText: 'Sign out',
        onPrimary: async () => {
          try {
            await AsyncStorage.removeItem(UNLOCKED_SESSION_KEY) // lock app again
          } catch {}
          try {
            await supabase.auth.signOut()
          } finally {
            clearAll() // wipe cached profiles/role from store (and AsyncStorage via persist)
            router.dismissAll()
            router.replace('/(auth)/phone')
          }
        },
        secondaryText: 'Cancel',
      }
    )
  }

  const confirmSwitchAccount = () => {
    openModal(
      'Switch to another account',
      'Would you like to switch to a different account role?',
      'warn',
      {
        primaryText: 'Switch',
        onPrimary: async () => {
          router.replace('/(auth)/choose-account')
        },
        secondaryText: 'Cancel',
      }
    )
  }

  if (loading || !profile) {
    return (
      <ThemedView safe style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
        <ThemedText style={{ marginTop: 8 }}>Loading…</ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
      <ThemedAppBar title='Profile' showProfile={false} showNotif={false} showSettings={true} />

      <ThemedKeyboardAwareScrollView>
        <Spacer height={20} />

        <ThemedCard>
          <View style={{ alignItems: 'center' }}>
            <ThemedImage
              // change to { uri: profile?.profile_picture } if you store a URL
              src={require('@/assets/images/default-image.jpg')}
              size={90}
            />
          </View>

          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Resident ID:</ThemedText>
            <ThemedText subtitle>
              {profile?.person_id ?? '—'}  role: {role}{staffId && role === 'staff' ? ` (staffId: ${staffId})` : ''}
            </ThemedText>
          </View>

          {role === 'staff' && (
            <View style={styles.row}>
              <ThemedText style={styles.bold} subtitle>Staff ID:</ThemedText>
              <ThemedText subtitle>{staffId ?? profile?.staff_id ?? '—'}</ThemedText>
            </View>
          )}

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Name:</ThemedText>
            <ThemedText subtitle>{fullName}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Sex:</ThemedText>
            <ThemedText subtitle>{profile?.sex ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Date of Birth:</ThemedText>
            <ThemedText subtitle>
              {profile?.birthdate ? new Date(profile.birthdate).toLocaleDateString('en-PH') : '—'}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Civil Status:</ThemedText>
            <ThemedText subtitle>{profile?.civil_status ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Nationality:</ThemedText>
            <ThemedText subtitle>{profile?.nationality ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Religion:</ThemedText>
            <ThemedText subtitle>{profile?.religion ?? '—'}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Educational Attainment:</ThemedText>
            <ThemedText subtitle>{profile?.education ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Employment Status:</ThemedText>
            <ThemedText subtitle>{profile?.employment_status ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Occupation:</ThemedText>
            <ThemedText subtitle>{profile?.occupation ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Monthly Personal Income:</ThemedText>
            <ThemedText subtitle>{peso(profile?.personal_monthly_income)}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Government Program:</ThemedText>
            <ThemedText subtitle>{profile?.gov_program ?? '—'}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Home Address:</ThemedText>
            <ThemedText subtitle>{address}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Residency Period:</ThemedText>
            <ThemedText subtitle>{profile?.residency_period ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Residential Status:</ThemedText>
            <ThemedText subtitle>{profile?.residential_status ?? '—'}</ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={30} />

        <ThemedCard>
          <ThemedText title>Household Information</ThemedText>

          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Household Head:</ThemedText>
            <ThemedText subtitle>
              {[profile?.household_head_first_name, profile?.household_head_middle_name, profile?.household_head_last_name, profile?.household_head_suffix]
                .filter(Boolean)
                .join(' ') || '—'}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Household Number:</ThemedText>
            <ThemedText subtitle>{profile?.household_num ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>House Type:</ThemedText>
            <ThemedText subtitle>{profile?.house_type ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>House Ownership:</ThemedText>
            <ThemedText subtitle>{profile?.house_ownership ?? '—'}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <ThemedText title>Family Information</ThemedText>

          <Spacer height={10} />

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Family Head:</ThemedText>
            <ThemedText subtitle>
              {[profile?.family_head_first_name, profile?.family_head_middle_name, profile?.family_head_last_name, profile?.family_head_suffix]
                .filter(Boolean)
                .join(' ') || '—'}
            </ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Family Number:</ThemedText>
            <ThemedText subtitle>{profile?.family_num ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Household Type:</ThemedText>
            <ThemedText subtitle>{profile?.household_type ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>NHTS:</ThemedText>
            <ThemedText subtitle>{profile?.nhts_status ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Indigent:</ThemedText>
            <ThemedText subtitle>{profile?.indigent_status ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Source of Income:</ThemedText>
            <ThemedText subtitle>{profile?.source_of_income ?? '—'}</ThemedText>
          </View>

          <View style={styles.row}>
            <ThemedText style={styles.bold} subtitle>Family Monthly Income:</ThemedText>
            <ThemedText subtitle>{profile?.family_monthly_income ?? '—'}</ThemedText>
          </View>

          <Spacer height={15} />
          <ThemedDivider />
          <Spacer height={15} />

          <ThemedText title>Family Members</ThemedText>

          <Spacer height={10} />

          <View style={styles.familyList}>
            {(profile?.other_family_members ?? []).map((name: string, idx: number) => (
              <View key={idx} style={styles.familyCard}>
                <ThemedText subtitle>{name}</ThemedText>
              </View>
            ))}
            {(!profile?.other_family_members || profile.other_family_members.length === 0) && (
              <ThemedText subtitle>—</ThemedText>
            )}
          </View>

          <Spacer height={15} />
        </ThemedCard>

        <Spacer height={15} />

        {/* Switch Account / Logout */}
        <View style={{ paddingHorizontal: 15 }}>
          <ThemedButton submit={false} onPress={confirmSwitchAccount}>
            <ThemedText non_btn>Switch Account</ThemedText>
          </ThemedButton>
        </View>

        <Spacer height={10} />

        <View style={{ paddingHorizontal: 15 }}>
          <ThemedButton submit={false} onPress={confirmLogout}>
            <ThemedText non_btn>Logout</ThemedText>
          </ThemedButton>
        </View>

        <Spacer height={20} />
      </ThemedKeyboardAwareScrollView>

      {/* Shared NiceModal (single instance) */}
      <NiceModal
        visible={modalOpen}
        title={modalTitle}
        message={modalMsg}
        variant={modalVariant}
        primaryText={modalPrimaryText}
        secondaryText={modalSecondaryText}
        onPrimary={() => { modalPrimary?.(); setModalOpen(false) }}
        onSecondary={() => { modalSecondary?.(); setModalOpen(false) }}
        onClose={() => setModalOpen(false)}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 5 },
  bold: { fontWeight: '600' },
  familyList: { gap: 10 },
  familyCard: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8 },
})
