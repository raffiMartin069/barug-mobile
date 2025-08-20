import { fetchResidentProfile } from '@/api/residentApi'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const ResidentHome = () => {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      try {
        const data = await fetchResidentProfile()
        if (!mounted) return
        setProfile(data)
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        if (!mounted) return
        setError('Failed to load profile.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadProfile()
    return () => {
      mounted = false
    }
  }, [])

  const pushProfile = () => {
    if (!profile) return
    router.push({
      pathname: '/residentprofile', // make sure this matches your file path
      params: {
        profile: JSON.stringify({
          ...profile,
          // ensure an image is present; your RPC sample had selfie_with_id
          profile_picture: profile?.profile_picture ?? profile?.selfie_with_id ?? null,
        }),
      },
    })
  }

  // ---- Helpers / derived flags ----
  const normalize = (v: any) => (v ?? '').toString().trim().toLowerCase()

  const rawStatus =
    profile?.verification_status_name ??
    profile?.verification_status ??
    profile?.acc_status_name ?? ''

  const status = normalize(rawStatus)

  // Broad heuristics to handle various backend wordings
  const isVerified = status.includes('verified') || profile?.is_verified === true
  const isPending = status.includes('pending')
  const isApproved = status.includes('approved')

  // Email + ID flags (with tolerant field names)
  const isEmailVerified = !!(profile?.is_email_verified ?? profile?.email_verified ?? false)
  const isIdValid = !!(profile?.is_id_valid ?? profile?.id_valid ?? false)

  // Lightweight completeness heuristics for testing
  const socioComplete = !!(
    profile?.employment_status ||
    profile?.employment_status_name ||
    profile?.occupation ||
    profile?.personal_income ||
    profile?.personal_income_name
  )

  const householdLinked = !!(
    profile?.household_num ||
    profile?.household_head_name ||
    profile?.family_num ||
    profile?.family_head_name
  )

  const StatusChip = ({ ok, trueLabel = 'True', falseLabel = 'False' }: { ok: boolean; trueLabel?: string; falseLabel?: string }) => (
    <View style={[styles.badge, { backgroundColor: ok ? '#c8e6c9' : '#ffcdd2' }]}>
      <ThemedText style={styles.badgeText}>{ok ? trueLabel : falseLabel}</ThemedText>
    </View>
  )

  // ---- Dynamic action card based on verification status ----
  const actionCard = (() => {
    if (isVerified) {
      return (
        <ThemedCard>
          <View style={{ alignItems: 'center', paddingVertical: 15 }}>
            <ThemedIcon name="ribbon" iconColor="#6a1b9a" bgColor="#e1bee7" />
            <ThemedText style={{ marginTop: 10, fontWeight: 'bold' }}>
              Congrats — you’re verified!
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: '#555' }}>
              Enjoy full access to barangay services.
            </ThemedText>
          </View>
        </ThemedCard>
      )
    }

    if (isPending) {
      return (
        <ThemedCard>
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 15 }}
            onPress={() => router.push('/identityprofiling')}
          >
            <ThemedIcon name="checkmark-circle" iconColor="#2e7d32" bgColor="#c8e6c9" />
            <ThemedText style={{ marginTop: 10, fontWeight: 'bold' }}>
              Verify Residency
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: '#555' }}>
              Status: Pending Verification
            </ThemedText>
          </TouchableOpacity>
        </ThemedCard>
      )

    }

    if (isApproved) {
      return (
        <ThemedCard>
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 15 }}
            onPress={() => router.push('/joinhousefam')}
          >
            <ThemedIcon name="home" iconColor="#1e88e5" bgColor="#bbdefb" />
            <ThemedText style={{ marginTop: 10, fontWeight: 'bold' }}>
              Join Household
            </ThemedText>
            <ThemedText style={{ fontSize: 12, color: '#555' }}>
              Your verification was approved. Complete household linking.
            </ThemedText>
          </TouchableOpacity>
        </ThemedCard>
      )
    }


    return null
  })()

  // ---- Handlers for the new test buttons ----
  const handleVerifyEmail = () => {
    // For testing, just navigate to a screen where you’ll wire the API call
    router.push({
      pathname: '/verifyemail',
      params: { email: profile?.email ?? '' },
    })
  }

  const handleVerifyID = () => {
    router.push('/identityprofiling')
  }

  const handleOpenSocio = () => {
    router.push('/identityprofiling')
  }

  const handleOpenHousehold = () => {
    router.push('/profiling/household')
  }

  if (loading) {
    return (
      <ThemedView safe={true} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe={true}>
      <ThemedAppBar
        title={'Barangay Sto. Niño'}
        showBack={false}
        showNotif={true}
        showProfile={true}
        onPressProfile={pushProfile}
      />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          {/* Header: Welcome + Avatar */}
          <View style={[styles.container, { paddingHorizontal: 30, paddingVertical: 10 }]}>
            <ThemedText title={true}>
              Welcome, {(profile?.first_name ? `${profile.first_name}` : 'Resident') + '!'}
            </ThemedText>
            <ThemedImage
              src={
                profile?.p_person_img
                  ? { uri: profile.p_person_img }
                  : require('@/assets/images/default-image.jpg')
              }
              size={60}
            />
          </View>

          {/* Dynamic Action Card */}
          {actionCard}

          <Spacer height={10} />

          <ThemedCard>
            <TouchableOpacity
              style={{ alignItems: 'center', paddingVertical: 15 }}
              onPress={() => router.push('/updateprofile')}  // Navigate to update profile page
            >
              <ThemedIcon name="pencil" iconColor="#2e7d32" bgColor="#c8e6c9" />
              <ThemedText style={{ marginTop: 10, fontWeight: 'bold' }}>Update Profile</ThemedText>
              <ThemedText style={{ fontSize: 12, color: '#555' }}>
                Modify your profile details and preferences.
              </ThemedText>
            </TouchableOpacity>
          </ThemedCard>
          <Spacer height={10} />

          {/* ===== Test: Verification & Profiling ===== */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Test: Verification & Profiling 2</ThemedText>

            {/* Row: Verify Email */}
            <View style={styles.testRow}>
              <ThemedIcon name="mail" iconColor="#1565c0" bgColor="#bbdefb" shape="square" containerSize={44} size={18} />
              <View style={styles.testDetails}>
                <ThemedText style={styles.activityTitle}>Verify Email</ThemedText>
                <ThemedText style={styles.activitySubtext}>
                  is_email_verified: {String(isEmailVerified)}
                </ThemedText>
              </View>
              <StatusChip ok={isEmailVerified} trueLabel="Verified" falseLabel="Unverified" />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedButton label="Open Email Verification" onPress={handleVerifyEmail} />
            </View>

            <Spacer height={12} />
            <ThemedDivider />
            <Spacer height={12} />

            {/* Row: Verify ID */}
            <View style={styles.testRow}>
              <ThemedIcon name="card" iconColor="#2e7d32" bgColor="#c8e6c9" shape="square" containerSize={44} size={18} />
              <View style={styles.testDetails}>
                <ThemedText style={styles.activityTitle}>Verify ID</ThemedText>
                <ThemedText style={styles.activitySubtext}>
                  is_id_valid: {String(isIdValid)}
                </ThemedText>
              </View>
              <StatusChip ok={isIdValid} trueLabel="Valid" falseLabel="Not valid" />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedButton label="Open ID Verification" onPress={handleVerifyID} />
            </View>

            <Spacer height={12} />
            <ThemedDivider />
            <Spacer height={12} />

            {/* Row: Profiling Step 1 - Socio */}
            <View style={styles.testRow}>
              <ThemedIcon name="list" iconColor="#6b4c3b" bgColor="#f2e5d7" shape="square" containerSize={44} size={18} />
              <View style={styles.testDetails}>
                <ThemedText style={styles.activityTitle}>Profiling Step 1 — Socioeconomic</ThemedText>
                <ThemedText style={styles.activitySubtext}>
                  is_id_valid: {String(isIdValid)}
                </ThemedText>
                <ThemedText style={styles.activitySubtext}>
                  complete: {String(socioComplete)}
                </ThemedText>

              </View>
              <StatusChip ok={socioComplete} trueLabel="Complete" falseLabel="Incomplete" />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedButton label="Open Socio Profiling" onPress={handleOpenSocio} />
            </View>

            <Spacer height={12} />
            <ThemedDivider />
            <Spacer height={12} />

            {/* Row: Profiling Step 2 - Household */}
            <View style={styles.testRow}>
              <ThemedIcon name="home" iconColor="#4e6151" bgColor="#dce5dc" shape="square" containerSize={44} size={18} />
              <View style={styles.testDetails}>
                <ThemedText style={styles.activityTitle}>Profiling Step 2 — Household</ThemedText>
                <ThemedText style={styles.activitySubtext}>
                  linked: {String(householdLinked)}
                </ThemedText>
              </View>
              <StatusChip ok={householdLinked} trueLabel="Linked" falseLabel="Unlinked" />
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <ThemedButton label="Open Household Profiling" onPress={handleOpenHousehold} />
            </View>
          </ThemedCard>

          <Spacer height={10} />

          {/* Activities (sample static) */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Activities</ThemedText>

            <View style={styles.activityItem}>
              <ThemedIcon
                name={'newspaper'}
                iconColor={'#6b4c3b'}
                bgColor={'#f2e5d7'}
                shape='square'
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>Document Request</ThemedText>
                <ThemedText style={styles.activitySubtext}>Requested on: June 10, 2023</ThemedText>
                <ThemedText style={styles.activitySubtext}>Reference #: BRG-2023-0042</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#c8e6c9' }]}>
                <ThemedText style={styles.badgeText}>Approved</ThemedText>
              </View>
            </View>

            <Spacer height={15} />
            <ThemedDivider />
            <Spacer height={15} />

            <View style={styles.activityItem}>
              <ThemedIcon
                name={'receipt'}
                iconColor={'#4a5c6a'}
                bgColor={'#dfe3e6'}
                shape='square'
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>Blotter Report</ThemedText>
                <ThemedText style={styles.activitySubtext}>Filed on: June 15, 2023</ThemedText>
                <ThemedText style={styles.activitySubtext}>Reference #: BLT-2023-0018</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#ffe082' }]}>
                <ThemedText style={styles.badgeText}>Processing</ThemedText>
              </View>
            </View>

            <Spacer height={15} />
            <ThemedDivider />
            <Spacer height={15} />

            <View style={styles.activityItem}>
              <ThemedIcon
                name={'folder-open'}
                iconColor={'#4e6151'}
                bgColor={'#dce5dc'}
                shape='square'
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>Barangay Case</ThemedText>
                <ThemedText style={styles.activitySubtext}>Hearing Date: June 25, 2023</ThemedText>
                <ThemedText style={styles.activitySubtext}>Case #: BC-2023-0007</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#b3e5fc' }]}>
                <ThemedText style={styles.badgeText}>Scheduled</ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20} />

          {/* Services */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle={true}>Services</ThemedText>
            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <TouchableOpacity onPress={() => router.push('/requestdoc')}>
                  <ThemedIcon
                    name={'newspaper'}
                    iconColor={'#6b4c3b'}
                    bgColor={'#f2e5d7'}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Request a Document</ThemedText>
              </View>
              <View style={styles.subcontainer}>
                <TouchableOpacity onPress={() => router.push('/fileblotterreport')}>
                  <ThemedIcon
                    name={'receipt'}
                    iconColor={'#4a5c6a'}
                    bgColor={'#dfe3e6'}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>File a Blotter Report</ThemedText>
              </View>
              <View style={styles.subcontainer}>
                <TouchableOpacity onPress={() => router.push('/barangaycases')}>
                  <ThemedIcon
                    name={'folder-open'}
                    iconColor={'#4e6151'}
                    bgColor={'#dce5dc'}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Barangay Cases</ThemedText>
              </View>
            </View>
          </ThemedCard>

          {error ? (
            <>
              <Spacer height={15} />
              <ThemedText style={{ textAlign: 'center' }}>{error}</ThemedText>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/chatbot')}>
        <ThemedIcon
          name={'chatbubbles'}
          bgColor="#310101"
          size={24}
        />
      </TouchableOpacity>
    </ThemedView>
  )
}

export default ResidentHome

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subcontainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: 90,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  icontext: {
    textAlign: 'center',
    paddingTop: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10
  },
  activityDetails: {
    flex: 1,
    paddingHorizontal: 10
  },
  activityTitle: {
    fontWeight: 'bold'
  },
  activitySubtext: {
    fontSize: 12,
    color: '#555'
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  testDetails: {
    flex: 1,
    paddingHorizontal: 6,
  },
})
