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
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

export const options = { href: null }

// keep in sync with your guard/sessionUnlock
const UNLOCKED_SESSION_KEY = 'unlocked_session'

// brand accent (matches your maroon header)
const ACCENT = '#561C24'

/* ===== Theme ===== */
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

/** Small helper so every label/value line looks consistent and wraps nicely */
const InfoRow = ({
  label,
  value,
}: {
  label: string
  value?: React.ReactNode
}) => (
  <View style={styles.row}>
    <ThemedText style={[styles.label]} subtitle>
      {label}
    </ThemedText>
    <ThemedText style={styles.value} subtitle>
      {value ?? '—'}
    </ThemedText>
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
  const role = currentRole ?? 'resident'
  const isStaff = role === 'staff'

  const parsedFromParams = (() => {
    if (!params?.profile) return null
    try {
      return JSON.parse(String(params.profile))
    } catch {
      return null
    }
  })()

  const cached = getProfile(role)
  const initial = parsedFromParams ?? cached ?? null

  const [profile, setProfile] = useState<any | null>(initial)
  const [loading, setLoading] = useState(!initial)

  // Optional: staff profile for name/role display if available
  const staffProfile = getProfile('staff')
  const staffFullName = useMemo(() => {
    const fn = [
      staffProfile?.first_name,
      staffProfile?.middle_name,
      staffProfile?.last_name,
      staffProfile?.suffix,
    ]
      .filter(Boolean)
      .join(' ')
    return fn || '—'
  }, [staffProfile])

  // SWR-ish refresh
  useEffect(() => {
    let live = true
      ; (async () => {
        const fresh = await ensureLoaded('resident') // keep using resident payload
        if (!live) return
        if (fresh) setProfile(fresh)
        setLoading(false)
      })()
    return () => {
      live = false
    }
  }, [role, ensureLoaded])

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
    ]
      .filter(Boolean)
      .join(', ')
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
          } catch { }
          try {
            await supabase.auth.signOut()
          } finally {
            clearAll()
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
      <ThemedAppBar title="Profile" showProfile={false} showNotif={false} showSettings />

      <ThemedKeyboardAwareScrollView>
        <Spacer height={16} />

        {/* HEADER CARD */}
        <ThemedCard style={[styles.cardPad, styles.shadow]}>
          <View style={{ alignItems: 'center' }}>
            <View>
              <ThemedImage
                src={
                  profile?.profile_picture
                    ? {
                      uri: 'https://wkactspmojbvuzghmjcj.supabase.co/storage/v1/object/public/id-uploads/person/df2bd136-11c9-4136-9f59-6bb86e60143d/2x2.png',
                    }
                    : require('@/assets/images/default-image.jpg')
                }
                size={50}
              />
            </View>

            <Spacer height={10} />
            <ThemedText style={styles.name} title>
              {fullName}
            </ThemedText>

            <View style={styles.badgesRow}>
              <ThemedChip label={isStaff ? 'Staff' : 'Resident'} filled style={[styles.badge, isStaff && styles.staffBadge]} />
              {!isStaff && (
                <ThemedChip
                  label={`ID: ${profile?.person_id ?? '—'}`}
                  filled={false}
                  style={styles.badge}
                />
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

          {/* If current role is staff: swap Religion row -> Staff Name, and add Role/Position */}
          {!isStaff ? (
            <InfoRow label="Religion:" value={profile?.religion ?? '—'} />
          ) : (
            <>
              <InfoRow
                label="Position:"
                value="HEALTH WORKER"
                // value={profile?.role_name || staffProfile?.position || currentRole || '—'}
              />
            </>
          )}
        </ThemedCard>

        <Spacer height={18} />

        {/* Staff-only: Tools grid for faster actions */}
        {isStaff && (
          <>
            <ThemedCard style={[styles.cardPad, styles.shadow]}>
              <ThemedText style={styles.sectionTitle} title>
                Tools
              </ThemedText>
              <Spacer height={8} />
              <View style={[styles.toolsGrid, { alignContent: 'center' }]}>
                <Pressable
                  style={styles.tool}
                  onPress={() =>
                    openModal('Verify IDs', 'Open the identity verification queue.', 'info', {
                      primaryText: 'Close',
                    })
                  }
                >
                  <View style={styles.toolIconWrap}>
                    <Ionicons name="id-card-outline" size={22} color={ACCENT} />
                  </View>
                  <ThemedText style={styles.toolLabel}>Verify IDs</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.tool}
                  onPress={() =>
                    openModal('Residents', 'Manage residents & profiles.', 'info', {
                      primaryText: 'Close',
                    })
                  }
                >
                  <View style={styles.toolIconWrap}>
                    <Ionicons name="people-outline" size={22} color={ACCENT} />
                  </View>
                  <ThemedText style={styles.toolLabel}>Residents</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.tool}
                  onPress={() =>
                    openModal('Households', 'View & update household records.', 'info', {
                      primaryText: 'Close',
                    })
                  }
                >
                  <View style={styles.toolIconWrap}>
                    <Ionicons name="home-outline" size={22} color={ACCENT} />
                  </View>
                  <ThemedText style={styles.toolLabel}>Households</ThemedText>
                </Pressable>

                <Pressable
                  style={styles.tool}
                  onPress={() =>
                    openModal('Doc Requests', 'Process document requests.', 'info', {
                      primaryText: 'Close',
                    })
                  }
                >
                  <View style={styles.toolIconWrap}>
                    <Ionicons name="document-text-outline" size={22} color={ACCENT} />
                  </View>
                  <ThemedText style={styles.toolLabel}>Doc Requests</ThemedText>
                </Pressable>
              </View>
            </ThemedCard>

            <Spacer height={18} />
          </>
        )}

        {/* Resident-only blocks remain the same */}
        {!isStaff && (
          <>
            {/* SOCIOECONOMIC */}
            <ThemedCard style={styles.cardPad}>
              <ThemedText style={styles.sectionTitle} title>
                Socioeconomic
              </ThemedText>
              <Spacer height={6} />
              <ThemedDivider />
              <Spacer height={2} />

              <InfoRow label="Educational Attainment:" value={profile?.education ?? '—'} />
              <InfoRow label="Employment Status:" value={profile?.employment_status ?? '—'} />
              <InfoRow label="Occupation:" value={profile?.occupation ?? '—'} />
              <InfoRow label="Monthly Personal Income:" value={peso(profile?.personal_monthly_income)} />
              <InfoRow label="Government Program:" value={profile?.gov_program ?? '—'} />
            </ThemedCard>

            <Spacer height={18} />

            {/* ADDRESS */}
            <ThemedCard style={styles.cardPad}>
              <ThemedText style={styles.sectionTitle} title>
                Address
              </ThemedText>
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
              <ThemedText style={styles.sectionTitle} title>
                Household Information
              </ThemedText>
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
                  ]
                    .filter(Boolean)
                    .join(' ') || '—'
                }
              />
              <InfoRow label="Household Number:" value={profile?.household_num ?? '—'} />
              <InfoRow label="House Type:" value={profile?.house_type ?? '—'} />
              <InfoRow label="House Ownership:" value={profile?.house_ownership ?? '—'} />

              <Spacer height={12} />
              <ThemedDivider />
              <Spacer height={10} />

              <ThemedText style={styles.sectionTitle} title>
                Family Information
              </ThemedText>
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
                  ]
                    .filter(Boolean)
                    .join(' ') || '—'
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

              <ThemedText style={styles.sectionTitle} title>
                Family Members
              </ThemedText>
              <Spacer height={6} />

              <View style={styles.chipsWrap}>
                {familyMembers.map((m, idx) => (
                  <ThemedChip key={`${m.name}-${idx}`} label={m.name} filled={false} style={styles.memberChip} />
                ))}
              </View>
            </ThemedCard>

            <Spacer />

            {/* OTHER SERVICES */}
            <ThemedCard style={styles.cardPad}>
              <ThemedText style={styles.sectionTitle} title>
                Other Services
              </ThemedText>
              <Spacer height={6} />
              <ThemedDivider />
              <Spacer height={2} />
              <Pressable onPress={() => router.push('/businessinfo')} style={styles.linkRow}>
                <View style={{ flexShrink: 1 }}>
                  <ThemedText style={styles.linkTitle}>Business Profile</ThemedText>
                  <ThemedText style={styles.linkSub}>Apply for a Business Profile</ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={18} />
              </Pressable>
            </ThemedCard>

            <Spacer height={12} />
          </>
        )}

        {/* Switch Account / Logout */}
        <View style={styles.actionsPad}>
          <ThemedButton submit={false} onPress={confirmSwitchAccount}>
            <ThemedText non_btn>Switch Account</ThemedText>
          </ThemedButton>
        </View>

        <Spacer height={8} />

        <View style={styles.actionsPad}>
          <ThemedButton submit={false} onPress={confirmLogout} style={{ backgroundColor: COLOR.primary }}>
            <ThemedText btn style={{ color: COLOR.primaryText }}>Logout</ThemedText>
          </ThemedButton>
        </View>

        <Spacer height={24} />
      </ThemedKeyboardAwareScrollView>

      {/* Shared NiceModal (single instance) */}
      <NiceModal
        visible={modalOpen}
        title={modalTitle}
        message={modalMsg}
        variant={modalVariant}
        primaryText={modalPrimaryText}
        secondaryText={modalSecondaryText}
        onPrimary={() => {
          modalPrimary?.()
          setModalOpen(false)
        }}
        onSecondary={() => {
          modalSecondary?.()
          setModalOpen(false)
        }}
        onClose={() => setModalOpen(false)}
      />
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  cardPad: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  shadow: {
    // soft card shadow
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    justifyContent: 'center',
  },
  badge: {
    marginRight: 6,
    marginBottom: 6,
  },
  staffBadge: {
    // darker fill looks good with your maroon
    backgroundColor: ACCENT,
  },
  staffIdBadge: {
    borderColor: ACCENT,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 12,
  },
  label: {
    flexShrink: 0,
    width: '48%',
    fontWeight: '600',
    opacity: 0.8,
  },
  value: {
    flex: 1,
    textAlign: 'right',
    lineHeight: 20,
  },

  // Tools grid (staff)
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 12,
    justifyContent: 'space-between',
  },
  // center the content inside each tile
  tool: {
    width: '48%',
    minHeight: 96,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    alignItems: 'center',       // ⬅️ center horizontally
    justifyContent: 'center',   // ⬅️ center vertically
    gap: 8,                     // if your RN version doesn’t support gap, remove and keep marginBottom on the icon
  },

  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#561C24',
    alignItems: 'center',       // ⬅️ center icon
    justifyContent: 'center',
    alignSelf: 'center',        // ⬅️ ensure the circle itself is centered in the tile
    marginBottom: 6,            // works even if `gap` isn’t supported
    backgroundColor: '#fff',
  },

  toolLabel: {
    fontWeight: '700',
    textAlign: 'center',        // ⬅️ center label text
  },


  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    marginRight: 6,
    marginBottom: 6,
  },

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkTitle: { fontSize: 16, fontWeight: '700' },
  linkSub: { color: 'gray', flexWrap: 'wrap' },

  actionsPad: { paddingHorizontal: 15 },
})
