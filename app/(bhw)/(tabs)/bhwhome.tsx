import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { supabase } from '@/constants/supabase'
import { useStaffPuroks } from '@/hooks/useStaffPuroks'
import CommunityService from '@/repository/CommunityService'
import { useAccountRole } from '@/store/useAccountRole'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, BackHandler, KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native'

const BhwHome = () => {
  const router = useRouter()
  const { getProfile } = useAccountRole()
  const residentProfile = getProfile('resident')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [residentsCount, setResidentsCount] = useState<number | null>(null)
  const [householdsCount, setHouseholdsCount] = useState<number | null>(null)
  const [familiesCount, setFamiliesCount] = useState<number | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  
  // Get assigned puroks using hook
  const { assignments: assignedPuroks } = useStaffPuroks()

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
      console.error('[BhwHome] Failed to load profile image:', error)
      setProfileImage(null)
    }
  }, [])

  // Load profile image when component mounts
  useEffect(() => {
    if (residentProfile?.person_id) {
      loadProfileImage(residentProfile.person_id)
    }
  }, [residentProfile?.person_id, loadProfileImage])

  // Load community stats
  useEffect(() => {
    let mounted = true
    const svc = new CommunityService()

    const load = async () => {
      try {
        setStatsLoading(true)
        const stats = await svc.getCommunityStats()
        if (!mounted) return
        setResidentsCount(stats.residentsCount)
        setHouseholdsCount(stats.householdsCount)
        setFamiliesCount(stats.familiesCount)
      } catch (err) {
        console.error('[BhwHome] failed to load community stats:', err)
      } finally {
        if (mounted) setStatsLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (router.canGoBack()) {
        router.back()
        return true
      }
      
      Alert.alert('Exit App', 'Do you want to exit the app?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() }
      ])
      return true
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)
    return () => backHandler.remove()
  }, [router])

  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start'}} safe>
      <ThemedAppBar showBack={false}/>

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

          <View style={[styles.container, {paddingHorizontal: 30, paddingVertical: 10,}]}>
              <ThemedText title>Welcome, {residentProfile?.first_name || 'Staff'}!</ThemedText>
              <View style={styles.profileImageContainer}>
                <ThemedImage
                  src={
                    profileImage
                      ? { uri: profileImage.startsWith('http') 
                          ? profileImage 
                          : `https://wkactspmojbvuzghmjcj.supabase.co/storage/v1/object/public/profile-pictures/${profileImage}` }
                      : require('@/assets/images/default-image.jpg')
                  }
                  size={62}
                  style={styles.profileImage}
                />
              </View>
          </View>

          <Spacer height={5}/>

          {/* Assigned Puroks */}
          {assignedPuroks.length > 0 && (
            <>
              <ThemedCard>
                <ThemedText style={styles.text} subtitle>Assigned Puroks</ThemedText>
                <View style={styles.purokContainer}>
                  {assignedPuroks.map((assignment: any) => (
                    <View key={assignment.staff_purok_id} style={styles.purokChip}>
                      <ThemedIcon
                        name="location"
                        iconColor="#561C24"
                        bgColor="#f5e6e8"
                        size={16}
                        containerSize={32}
                      />
                      <View style={styles.purokInfo}>
                        <ThemedText style={styles.purokName}>{assignment.purok_sitio_name}</ThemedText>
                        <ThemedText style={styles.purokCode}>{assignment.purok_sitio_code}</ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              </ThemedCard>
              <Spacer height={20}/>
            </>
          )}

          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Activities</ThemedText>

            {/* Quarterly house-to-house */}
            <View style={styles.activityItem}>
              <ThemedIcon
                name={'home'}
                iconColor={'#4a5c6a'}
                bgColor={'#dfe3e6'}
                shape='square'
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>Quarterly House-to-House Visit</ThemedText>
                <ThemedText style={styles.activitySubtext}>Next Round: Oct 15–31</ThemedText>
                <ThemedText style={styles.activitySubtext}>Scope: HH profiling updates & vital checks</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#ffe082' }]}>
                <ThemedText style={styles.badgeText}>Upcoming</ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20}/>

          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Community Stats</ThemedText>

            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <ThemedIcon name="person" iconColor="#6b4c3b" bgColor="#f2e5d7" />
                <ThemedText style={styles.statLabel}>Residents</ThemedText>
                <ThemedText style={styles.statValue}>{statsLoading ? '...' : (residentsCount !== null ? residentsCount.toLocaleString() : '—')}</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="home" iconColor="#4a5c6a" bgColor="#dfe3e6" />
                <ThemedText style={styles.statLabel}>Households</ThemedText>
                <ThemedText style={styles.statValue}>{statsLoading ? '...' : (householdsCount !== null ? householdsCount.toLocaleString() : '—')}</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="people" iconColor="#4e6151" bgColor="#dce5dc" />
                <ThemedText style={styles.statLabel}>Families</ThemedText>
                <ThemedText style={styles.statValue}>{statsLoading ? '...' : (familiesCount !== null ? familiesCount.toLocaleString() : '—')}</ThemedText>
              </View>
            </View>
          </ThemedCard>

        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

export default BhwHome

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
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
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
  // add to both ResidentHome & BhwHome styles
  statLabel: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
  profileImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
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
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  purokContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  purokChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  purokInfo: {
    flexDirection: 'column',
  },
  purokName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  purokCode: {
    fontSize: 11,
    color: '#6b7280',
  },
})