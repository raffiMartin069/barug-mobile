import { fetchResidentProfile } from '@/api/residentApi'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
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
      pathname: '/residentprofile',
      params: {
        profile: JSON.stringify({
          ...profile,
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
  const isVerified = status.includes('approved') || profile?.is_verified === true

  // Email + ID flags (with tolerant field names)
  const isIdValid = !!(profile?.is_id_valid ?? profile?.id_valid ?? false)

  // (Optional) household info – not used in the new logic, but kept for possible UI display
  const householdLinked = !!(
    profile?.household_num ||
    profile?.household_head_name ||
    profile?.family_num ||
    profile?.family_head_name
  )

  // ---- Dynamic action card per your requirement ----
  const actionCard = (() => {
    // 1) Unverified → prompt to start profiling (/socioeconomicinfo)
    if (!isVerified) {
      return (
        <ThemedCard>
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 15 }}
            onPress={() => router.push('/verify_personalinfo')}
          >
            <ThemedIcon name="checkmark-circle" iconColor="#2e7d32" bgColor="#c8e6c9" />
            <ThemedText style={{ marginTop: 10, fontWeight: 'bold', textAlign: 'center' }}>
              Be a verified resident now and complete the profiling process
            </ThemedText>
          </TouchableOpacity>
        </ThemedCard>
      )
    }

    // 2) Verified + valid ID → prompt to complete household profiling (/joinhousefam)
    if (isVerified && isIdValid) {
      return (
        <ThemedCard>
          <TouchableOpacity
            style={{ alignItems: 'center', paddingVertical: 15 }}
            onPress={() => router.push('/verify_personalinfo')}
          >
            <ThemedIcon name="home" iconColor="#1e88e5" bgColor="#bbdefb" />
            <ThemedText style={{ marginTop: 10, fontWeight: 'bold', textAlign: 'center' }}>
              Step 3: You're now close to being a verified resident, please complete household profiling
            </ThemedText>
          </TouchableOpacity>
        </ThemedCard>
      )
    }

    // Otherwise, no action card (e.g., verified but ID not valid yet)
    return null
  })()

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

          {/* Simplified Dynamic Action Card */}
          {actionCard}

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
})
