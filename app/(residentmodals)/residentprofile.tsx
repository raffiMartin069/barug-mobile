  // app/residentprofile.tsx
  import NiceModal, { type ModalVariant } from '@/components/NiceModal'
  import Spacer from '@/components/Spacer'
  import ThemedAppBar from '@/components/ThemedAppBar'
  import ThemedButton from '@/components/ThemedButton'
  import ThemedCard from '@/components/ThemedCard'
  import ThemedChip from '@/components/ThemedChip'
  import ThemedDivider from '@/components/ThemedDivider'
  import ThemedImage from '@/components/ThemedImage'
  import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
  import ThemedText from '@/components/ThemedText'
  import ThemedView from '@/components/ThemedView'
  import { supabase } from '@/constants/supabase'
  import { useAccountRole } from '@/store/useAccountRole'
  import { Ionicons } from '@expo/vector-icons'
  import AsyncStorage from '@react-native-async-storage/async-storage'
  import { useLocalSearchParams, useRouter } from 'expo-router'
  import React, { useCallback, useEffect, useMemo, useState } from 'react'
  import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

  export const options = { href: null }
  const UNLOCKED_SESSION_KEY = 'unlocked_session'
  const ACCENT = '#561C24'

  const COLOR = {
    primary: '#4A0E0E',
    primaryText: '#FFFFFF',
    border: '#EAEAEA',
    surface: '#FFFFFF',
    text: '#222222',
    hint: '#6B7280',
    chipBg: '#F9F1F1',
    chipBorder: '#E9D8D8',
    chipXBg: '#F1E2E2',
    warn: '#B71C1C',
    add: '#0B5ED7',
    mutedSurface: '#FEFCFC',
    badgeAddBg: '#E8F1FF',
    badgeAddText: '#0B5ED7',
    badgeRemBg: '#FFEAEA',
    badgeRemText: '#B71C1C',
    arrow: '#6B7280',
  }

  /* -------- DEBUG HELPERS (screen) -------- */
  const EXPECTED_HOUSEHOLD_FIELDS = [
    'household_head_first_name',
    'household_head_middle_name',
    'household_head_last_name',
    'household_head_suffix',
    'household_num',
    'house_type',
    'house_ownership',
  ]
  const EXPECTED_FAMILY_FIELDS = [
    'family_head_first_name',
    'family_head_middle_name',
    'family_head_last_name',
    'family_head_suffix',
    'family_num',
    'household_type',
    'nhts_status',
    'indigent_status',
    'source_of_income',
    'family_monthly_income',
  ]

  function summarize(obj: any) {
    if (!obj || typeof obj !== 'object') return obj
    const keys = Object.keys(obj)
    return { keysCount: keys.length, sampleKeys: keys.slice(0, 20) }
  }

  function debugProfileAt(prefix: string, profile: any) {
    console.log(`[ResidentProfile][${prefix}] profile summary:`, summarize(profile))
    const name = [profile?.first_name, profile?.middle_name, profile?.last_name, profile?.suffix].filter(Boolean).join(' ')
    console.table({
      person_id: profile?.person_id,
      person_code: profile?.person_code,
      name,
      sex: profile?.sex,
      birthdate: profile?.birthdate,
    })

    const hhPick = Object.fromEntries(EXPECTED_HOUSEHOLD_FIELDS.map(k => [k, profile?.[k]]))
    console.log(`[ResidentProfile][${prefix}] HOUSEHOLD:`)
    console.table(hhPick)
    const famPick = Object.fromEntries(EXPECTED_FAMILY_FIELDS.map(k => [k, profile?.[k]]))
    console.log(`[ResidentProfile][${prefix}] FAMILY:`)
    console.table(famPick)

    const hhMissing = EXPECTED_HOUSEHOLD_FIELDS.filter(k => profile?.[k] === undefined)
    const famMissing = EXPECTED_FAMILY_FIELDS.filter(k => profile?.[k] === undefined)
    if (hhMissing.length) console.warn(`[ResidentProfile][${prefix}] Missing household fields:`, hhMissing)
    if (famMissing.length) console.warn(`[ResidentProfile][${prefix}] Missing family fields:`, famMissing)
  }

  /** Small helper so every label/value line looks consistent and wraps nicely */
  const InfoRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <View style={styles.row}>
      <ThemedText style={[styles.label]} subtitle>{label}</ThemedText>
      <ThemedText style={styles.value} subtitle>{value ?? '—'}</ThemedText>
    </View>
  )

  export default function ResidentProfile() {
    const router = useRouter()
    const familyMembers = useMemo(
      () => [
        { name: 'Maria Lourdes A. Cruz' },
        { name: 'Renzo Gabriel A. Cruz' },
        { name: 'Andrei A. Cruz' },
      ],
      []
    )

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
    const role = currentRole ?? 'no role'
    const isStaff = role === 'staff'
    const isBusiness = role === 'business'
    const roleLabel = isStaff ? 'Staff' : isBusiness ? 'Business Owner' : 'Resident'

    const parsedFromParams = (() => {
      if (!params?.profile) return null
      try { return JSON.parse(String(params.profile)) } catch { return null }
    })()

    const cached = getProfile(role)
    const initial = parsedFromParams ?? cached ?? null

    const [profile, setProfile] = useState<any | null>(initial)
    const [loading, setLoading] = useState(!initial)
    const [profileImage, setProfileImage] = useState<string | null>(null)

    // Staff profile for optional display
    const staffProfile = getProfile('staff')
    const staffFullName = useMemo(() => {
      const fn = [
        staffProfile?.first_name,
        staffProfile?.middle_name,
        staffProfile?.last_name,
        staffProfile?.suffix,
      ].filter(Boolean).join(' ')
      return fn || '—'
    }, [staffProfile])

    // Check if user has multiple roles available
    const hasMultipleRoles = useMemo(() => {
      let roleCount = 0
      if (profile?.person_id) roleCount++
      if (profile?.is_business_owner) roleCount++
      if (profile?.is_bhw && (profile?.staff_id || staffId)) roleCount++
      return roleCount > 1
    }, [profile, staffId])

    // Boot logs
    useEffect(() => {
      console.log('[ResidentProfile] BOOT', {
        role,
        isStaff,
        isBusiness,
        hasParsedFromParams: !!parsedFromParams,
        hasCached: !!cached,
      })
      if (parsedFromParams) debugProfileAt('from-params', parsedFromParams)
      if (cached) debugProfileAt('from-cache', cached)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // SWR-ish refresh
    useEffect(() => {
      let live = true
      ;(async () => {
        console.log('[ResidentProfile] ensureLoaded(resident) …')
        const fresh = await ensureLoaded('resident')
        if (!live) return
        if (fresh) {
          console.log('[ResidentProfile] ensureLoaded returned fresh details ✓')
          debugProfileAt('after-ensureLoaded', fresh)
          setProfile(fresh)
        } else {
          console.warn('[ResidentProfile] ensureLoaded returned null — using initial/cached if any')
        }
        setLoading(false)
      })()
      return () => { live = false }
    }, [role, ensureLoaded])

    // Load profile image
    const loadProfileImage = useCallback(async (personId: number) => {
      try {
        const { data, error } = await supabase
          .from('person')
          .select('person_img')
          .eq('person_id', personId)
          .single()
        
        if (error) throw error
        setProfileImage(data?.person_img || null)
      } catch (error) {
        console.error('[ResidentProfile] Failed to load profile image:', error)
        setProfileImage(null)
      }
    }, [])

    // Log every time profile changes
    useEffect(() => {
      if (profile) {
        debugProfileAt('render-profile', profile)
        if (profile.person_id) {
          loadProfileImage(profile.person_id)
        }
      }
    }, [profile, loadProfileImage])

    const fullName = useMemo(() => {
      const fn = [profile?.first_name, profile?.middle_name, profile?.last_name, profile?.suffix]
        .filter(Boolean)
        .join(' ')
      return fn || '—'
    }, [profile])

    const address = useMemo(() => {
      const parts = [
        profile?.street_name,
        profile?.purok_sitio_name,
        profile?.barangay_name,
        profile?.city_name,
      ].filter(Boolean).join(', ')
      return parts || '—'
    }, [profile])

    const peso = (v?: string | number | null) =>
      v == null || v === ''
        ? '—'
        : `₱${Number(v).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`

    const openModal = (
      title: string,
      message = '',
      variant: ModalVariant = 'info',
      opts?: {
        primaryText?: string
        onPrimary?: () => void
        secondaryText?: string
        onSecondary?: () => void
      }
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
              await AsyncStorage.removeItem(UNLOCKED_SESSION_KEY)
              await supabase.auth.signOut()
            } catch (error) {
              console.error('Logout error:', error)
            } finally {
              clearAll()
              setTimeout(() => {
                router.push('/(auth)/phone')
              }, 100)
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
          onPrimary: async () => { router.replace('/(auth)/choose-account') },
          secondaryText: 'Cancel',
        }
      )
    }

    const handlePictureTap = () => {
      openModal(
        'Profile Picture',
        'What would you like to do with your profile picture?',
        'info',
        {
          primaryText: 'Edit Picture',
          onPrimary: () => {
            router.push('/upload-picture')
          },
          secondaryText: 'Cancel',
        }
      )
    }

    const updatePersonImage = async (imageUrl: string) => {
      try {
        const { error } = await supabase
          .from('persons')
          .update({ person_img: imageUrl })
          .eq('person_id', profile?.person_id)
        
        if (error) throw error
        
        // Update local profile state and refresh from server
        const fresh = await ensureLoaded('resident')
        if (fresh) setProfile(fresh)
        
        console.log('Profile picture updated successfully')
      } catch (error) {
        console.error('Error updating profile picture:', error)
        openModal('Error', 'Failed to update profile picture. Please try again.', 'warn')
      }
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
        <ThemedAppBar title="Profile" showProfile={false} showNotif={false} showSettings />

        <ThemedKeyboardAwareScrollView>
          <Spacer height={16} />

          {/* HEADER CARD */}
          <ThemedCard style={[styles.cardPad, styles.shadow]}>
            <View style={{ alignItems: 'center' }}>
              <Pressable onPress={handlePictureTap}>
                <View style={styles.profileImageContainer}>
                  <ThemedImage
                    src={
                      profileImage
                        ? { uri: profileImage.startsWith('http') 
                            ? profileImage 
                            : `https://wkactspmojbvuzghmjcj.supabase.co/storage/v1/object/public/profile-pictures/${profileImage}` }
                        : require('@/assets/images/default-image.jpg')
                    }
                    size={82}
                    style={styles.profileImage}
                  />
                </View>
              </Pressable>

              <Spacer height={10} />
              <ThemedText style={styles.name} title>{fullName}</ThemedText>

              <View style={styles.badgesRow}>
                <ThemedChip label={roleLabel} filled style={[styles.badge, isStaff && styles.staffBadge]} />
                {!isStaff && (
                  <ThemedChip label={`ID: ${profile?.person_id ?? '—'}`} filled={false} style={styles.badge} />
                )}
                {isStaff && (
                  <ThemedChip
                    label={`Staff ID: ${staffId ?? profile?.staff_id ?? '—'}`}
                    filled={false}
                    style={[styles.badge, styles.staffIdBadge]}
                  />
                )}
              </View>
            </View>

            <Spacer height={6} />
            <ThemedDivider />
            <Spacer height={2} />

            <InfoRow label="Sex:" value={profile?.sex ?? '—'} />
            <InfoRow
              label="Date of Birth:"
              value={profile?.birthdate ? new Date(profile.birthdate).toLocaleDateString('en-PH') : '—'}
            />
            <InfoRow label="Civil Status:" value={profile?.civil_status ?? '—'} />
            <InfoRow label="Nationality:" value={profile?.nationality ?? '—'} />
            <InfoRow 
              label="Account Status:" 
              value={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons 
                    name='checkmark-circle' 
                    size={16} 
                    color='#22C55E' 
                  />
                  <ThemedText style={{ color: '#22C55E', fontWeight: '600' }}>
                    {profile?.person_status_name || 'ACTIVE'}
                  </ThemedText>
                </View>
              } 
            />
            <InfoRow 
              label="ID Status:" 
              value={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons 
                    name={profile?.is_id_valid ? 'checkmark-circle' : 'close-circle'} 
                    size={16} 
                    color={profile?.is_id_valid ? '#22C55E' : '#EF4444'} 
                  />
                  <ThemedText style={{ color: profile?.is_id_valid ? '#22C55E' : '#EF4444', fontWeight: '600' }}>
                    {profile?.is_id_valid ? 'Verified' : 'Not Verified'}
                  </ThemedText>
                </View>
              } 
            />

            {!isStaff ? (
              <InfoRow label="Religion:" value={profile?.religion ?? '—'} />
            ) : (
              <>
                <InfoRow label="Position:" value="HEALTH WORKER" />
              </>
            )}
          </ThemedCard>

          <Spacer height={18} />

          {isStaff && (
            <>
              <ThemedCard style={[styles.cardPad, styles.shadow]}>
                <ThemedText style={styles.sectionTitle} title>Tools</ThemedText>
                <Spacer height={8} />
                <View style={[styles.toolsGrid, { alignContent: 'center' }]}>
                  <Pressable style={styles.tool} onPress={() => {}}>
                    <View style={styles.toolIconWrap}><Ionicons name="id-card-outline" size={22} color={ACCENT} /></View>
                    <ThemedText style={styles.toolLabel}>Verify IDs</ThemedText>
                  </Pressable>
                  <Pressable style={styles.tool} onPress={() => {}}>
                    <View style={styles.toolIconWrap}><Ionicons name="people-outline" size={22} color={ACCENT} /></View>
                    <ThemedText style={styles.toolLabel}>Residents</ThemedText>
                  </Pressable>
                  <Pressable style={styles.tool} onPress={() => {}}>
                    <View style={styles.toolIconWrap}><Ionicons name="home-outline" size={22} color={ACCENT} /></View>
                    <ThemedText style={styles.toolLabel}>Households</ThemedText>
                  </Pressable>
                  <Pressable style={styles.tool} onPress={() => {}}>
                    <View style={styles.toolIconWrap}><Ionicons name="document-text-outline" size={22} color={ACCENT} /></View>
                    <ThemedText style={styles.toolLabel}>Doc Requests</ThemedText>
                  </Pressable>
                </View>
              </ThemedCard>
              <Spacer height={18} />
            </>
          )}

          {!isStaff && (
            <>
              {/* SOCIOECONOMIC */}
              <ThemedCard style={styles.cardPad}>
                <ThemedText style={styles.sectionTitle} title>Socioeconomic</ThemedText>
                <Spacer height={6} />
                <ThemedDivider />
                <Spacer height={2} />

                <InfoRow label="Educational Attainment:" value={profile?.education ?? '—'} />
                <InfoRow label="Employment Status:" value={profile?.employment_status ?? '—'} />
                <InfoRow label="Occupation:" value={profile?.occupation ?? '—'} />
                <InfoRow label="Monthly Personal Income:" value={profile?.personal_monthly_income ?? '—'} />
                <InfoRow 
                  label="Government Programs:" 
                  value={
                    profile?.government_programs?.length > 0 
                      ? profile.government_programs.join(', ') 
                      : '—'
                  } 
                />
              </ThemedCard>

              <Spacer height={18} />

              {/* ADDRESS */}
              <ThemedCard style={styles.cardPad}>
                <ThemedText style={styles.sectionTitle} title>Address</ThemedText>
                <Spacer height={6} />
                <ThemedDivider />
                <Spacer height={2} />

                <InfoRow label="Home Address:" value={address} />
                <InfoRow label="Residency Period:" value={profile?.residency_period ?? '—'} />
                <InfoRow label="Residential Status:" value={profile?.residential_status ?? '—'} />
              </ThemedCard>

              <Spacer height={18} />

              {/* HOUSEHOLD & FAMILY */}
              <ThemedCard style={styles.cardPad}>
                <ThemedText style={styles.sectionTitle} title>Household Information</ThemedText>
                <Spacer height={6} />
                <ThemedDivider />
                <Spacer height={2} />

                <InfoRow
                  label="Household Head:"
                  value={
                    [
                      profile?.household_head_first_name,
                      profile?.household_head_middle_name,
                      profile?.household_head_last_name,
                      profile?.household_head_suffix,
                    ].filter(Boolean).join(' ') || '—'
                  }
                />
                <InfoRow label="Household Number:" value={profile?.household_num ?? '—'} />
                <InfoRow label="House Type:" value={profile?.house_type ?? '—'} />
                <InfoRow label="House Ownership:" value={profile?.house_ownership ?? '—'} />

                <Spacer height={12} />
                <ThemedDivider />
                <Spacer height={10} />

                <ThemedText style={styles.sectionTitle} title>Family Information</ThemedText>
                <Spacer height={6} />
                <ThemedDivider />
                <Spacer height={2} />

                <InfoRow
                  label="Family Head:"
                  value={
                    [
                      profile?.family_head_first_name,
                      profile?.family_head_middle_name,
                      profile?.family_head_last_name,
                      profile?.family_head_suffix,
                    ].filter(Boolean).join(' ') || '—'
                  }
                />
                <InfoRow label="Family Number:" value={profile?.family_num ?? '—'} />
                <InfoRow label="Household Type:" value={profile?.household_type ?? '—'} />
                <InfoRow label="NHTS:" value={profile?.nhts_status ?? '—'} />
                <InfoRow label="Indigent:" value={profile?.indigent_status ?? '—'} />
                <InfoRow label="Source of Income:" value={profile?.source_of_income ?? '—'} />
                <InfoRow label="Family Monthly Income:" value={profile?.family_monthly_income ?? '—'} />

                <Spacer height={12} />
                <ThemedDivider />
                <Spacer height={10} />

                <ThemedText style={styles.sectionTitle} title>Family Members</ThemedText>
                <Spacer height={6} />

                <View style={styles.chipsWrap}>
                  {familyMembers.map((m, idx) => (
                    <ThemedChip key={`${m.name}-${idx}`} label={m.name} filled={false} style={styles.memberChip} />
                  ))}
                </View>
              </ThemedCard>

              <Spacer height={12} />
            </>
          )}

          {/* Switch Account / Logout */}
          {hasMultipleRoles && (
            <>
              <View style={styles.actionsPad}>
                <ThemedButton submit={false} onPress={confirmSwitchAccount}>
                  <ThemedText non_btn>Switch Account</ThemedText>
                </ThemedButton>
              </View>
              <Spacer height={8} />
            </>
          )}

          <View style={styles.actionsPad}>
            <ThemedButton submit={false} onPress={confirmLogout} style={{ backgroundColor: COLOR.primary }}>
              <ThemedText btn style={{ color: COLOR.primaryText }}>Logout</ThemedText>
            </ThemedButton>
          </View>

          <Spacer height={24} />
        </ThemedKeyboardAwareScrollView>

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
    cardPad: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: '#fff' },
    shadow: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    name: { fontSize: 18, fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
    badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, justifyContent: 'center' },
    badge: { marginRight: 6, marginBottom: 6 },
    staffBadge: { backgroundColor: ACCENT },
    staffIdBadge: { borderColor: ACCENT },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, gap: 12 },
    label: { flexShrink: 0, width: '48%', fontWeight: '600', opacity: 0.8 },
    value: { flex: 1, textAlign: 'right', lineHeight: 20 },
    toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 12, justifyContent: 'space-between' },
    tool: { width: '48%', minHeight: 96, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center', gap: 8 },
    toolIconWrap: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#561C24', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 6, backgroundColor: '#fff' },
    toolLabel: { fontWeight: '700', textAlign: 'center' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    memberChip: { marginRight: 6, marginBottom: 6 },
    linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    linkTitle: { fontSize: 16, fontWeight: '700' },
    linkSub: { color: 'gray', flexWrap: 'wrap' },
    actionsPad: { paddingHorizontal: 15 },
    profileImageContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      borderWidth: 2,
      borderColor: '#561C24',
      backgroundColor: '#fff',
      shadowColor: '#561C24',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    profileImage: {
      width: 82,
      height: 82,
      borderRadius: 41,
    },
  })