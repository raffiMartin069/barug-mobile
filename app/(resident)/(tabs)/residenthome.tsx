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
        // identity
        // resident_id: String(profile?.user_id ?? ''), - NONE
        first_name: profile?.first_name ?? '',
        middle_name: profile?.middle_name ?? '',
        last_name: profile?.last_name ?? '',
        suffix: profile?.suffix ?? '',
        sex: profile?.sex_name ?? profile?.sex ?? '',
        birthdate: profile?.birthdate ?? '',
        civil_status: profile?.civil_status_name ?? profile?.civil_status ?? '',
        nationality: profile?.nationality_name ?? profile?.nationality ?? '',
        religion: profile?.religion_name ?? profile?.religion ?? '',
        // socio-economic
        education: profile?.education_name ?? profile?.education ?? '',
        employment_status: profile?.employment_status_name ?? profile?.employment_status ?? '',
        occupation: profile?.occupation ?? '',
        personal_income: profile?.personal_income_name ?? profile?.personal_income ?? '',
        gov_program: profile?.gov_program_name ?? profile?.gov_program ?? '',
        // address
        street: profile?.street_name ?? profile?.street ?? '',
        purok_sitio: profile?.purok_sitio_name ?? profile?.purok ?? '',
        barangay: profile?.barangay_name ?? profile?.barangay ?? '',
        city: profile?.city_name ?? profile?.city ?? '',
        residency_period: profile?.residency_period ?? '',
        // status + image
        acc_status: profile?.acc_status_name ?? profile?.acc_status ?? '',
        p_person_img: profile?.p_person_img ?? '',
        // household / family
        household_head: profile?.household_head_name ?? '',
        household_num: profile?.household_num ?? '',
        house_type: profile?.house_type_name ?? '',
        house_ownership: profile?.house_ownership_name ?? '',
        family_head: profile?.family_head_name ?? '',
        family_num: profile?.family_num ?? '',
        family_type: profile?.family_type_name ?? profile?.household_type_name ?? '',
        nhts_status: profile?.nhts_status ?? '',
        indigent_status: profile?.indigent_status ?? '',
        source_of_income: profile?.source_of_income ?? '',
        family_monthly_income: profile?.family_monthly_income_name ?? '',
        // Optionally:
        // family_members: JSON.stringify(profile?.family_members ?? []),
      },
    })
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
        onPressProfile={pushProfile}   // ← tap person icon to open profile with params
      />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

          {/* Header: Welcome + Avatar (from fetched profile) */}
          <View style={[styles.container, { paddingHorizontal: 30, paddingVertical: 10 }]}>
            <ThemedText title={true}>
              Welcome, {(profile?.first_name || 'Resident') + '!'}
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

          {/* 🔹 TEMPORARY VERIFY RESIDENCY ACTION — REMOVE WHEN REAL FLOW IS IMPLEMENTED */}
          <ThemedCard>
            <TouchableOpacity
              style={{ alignItems: 'center', paddingVertical: 15 }}
              onPress={() => router.push('/identityprofiling')}
            >
              <ThemedIcon
                name={'checkmark-circle'}
                iconColor={'#2e7d32'}
                bgColor={'#c8e6c9'}
              />
              <ThemedText style={{ marginTop: 10, fontWeight: 'bold' }}>
                Verify Residency
              </ThemedText>
            </TouchableOpacity>
          </ThemedCard>
          {/* 🔹 END OF TEMPORARY VERIFY RESIDENCY ACTION */}

          <Spacer height={5} />

          {/* Make this dynamic */}
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
