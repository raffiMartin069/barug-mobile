  // app/(resident)/(tabs)/residenthome.tsx
  import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { supabase } from '@/constants/supabase'
import { getPersonBlotterReportHistory } from '@/services/blotterReport'
import { fetchMyDocRequests } from '@/services/documentRequest'
import { useAccountRole } from '@/store/useAccountRole'
import dayjs from 'dayjs'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

  const ResidentHome = () => {
    const router = useRouter()
    const roleStore = useAccountRole()

    // Use currentRole if set; default to 'resident'
    const role = roleStore.currentRole ?? 'resident'

    // Pull the cached profile immediately (no network)
    const cached = roleStore.getProfile(role)

    const [loading, setLoading] = useState(!cached)
    const [details, setDetails] = useState<any | null>(cached ?? null)
    const [recentActivities, setRecentActivities] = useState<any[]>([])
    const [activitiesLoading, setActivitiesLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [idValidationRequest, setIdValidationRequest] = useState<any | null>(null)
    const [idValidationLoading, setIdValidationLoading] = useState(false)
    const [profileImage, setProfileImage] = useState<string | null>(null)

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

    // Load recent activities (both document requests and blotter reports)
    const loadRecentActivities = useCallback(async (personId: number) => {
      try {
        setActivitiesLoading(true)
        const [docRequests, blotterReports] = await Promise.all([
          fetchMyDocRequests(personId, { limit: 3 }).catch(() => []),
          getPersonBlotterReportHistory(personId).catch(() => [])
        ])

        const activities = []

        // Add document requests
        docRequests.forEach(req => {
          activities.push({
            type: 'document',
            title: 'Document Request',
            subtitle: req.doc_types?.join(', ') || 'Document Request',
            date: req.created_at,
            dateOnly: dayjs(req.created_at).format('MMMM DD, YYYY'),
            timeOnly: dayjs(req.created_at).format('h:mm A'),
            reference: `#${req.request_code}`,
            status: req.status || 'PENDING',
            icon: 'newspaper',
            iconColor: '#6b4c3b',
            iconBg: '#f2e5d7',
            amount: req.amount_due
          })
        })

        // Add blotter reports (last 3)
        blotterReports.slice(0, 3).forEach(report => {
          activities.push({
            type: 'blotter',
            title: 'Blotter Report',
            subtitle: report.incident_subject || 'Report Filed',
            date: report.date_time_reported,
            dateOnly: dayjs(report.date_time_reported).format('MMMM DD, YYYY'),
            timeOnly: dayjs(report.date_time_reported).format('h:mm A'),
            reference: `Report #${report.blotter_report_id}`,
            status: report.status_name || 'PENDING',
            icon: 'receipt',
            iconColor: '#4a5c6a',
            iconBg: '#dfe3e6'
          })
        })

        // Sort by date (most recent first) and take top 3
        activities.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
        setRecentActivities(activities.slice(0, 3))
      } catch (error) {
        console.error('[ResidentHome] Failed to load activities:', error)
        setRecentActivities([])
      } finally {
        setActivitiesLoading(false)
      }
    }, [])

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
        console.error('[ResidentHome] Failed to load profile image:', error)
        setProfileImage(null)
      }
    }, [])

    // Load ID validation request status
    const loadIdValidationRequest = useCallback(async (personId: number) => {
      try {
        setIdValidationLoading(true)
        const { data, error } = await supabase.rpc('get_id_validation_requests')
        if (error) throw error
        
        const userRequest = data?.find((req: any) => req.requester_person_id === personId)
        setIdValidationRequest(userRequest || null)
      } catch (error) {
        console.error('[ResidentHome] Failed to load ID validation request:', error)
        setIdValidationRequest(null)
      } finally {
        setIdValidationLoading(false)
      }
    }, [])

    const onRefresh = useCallback(async () => {
      setRefreshing(true)
      try {
        if (details?.person_id) {
          await Promise.all([
            loadRecentActivities(details.person_id),
            loadIdValidationRequest(details.person_id),
            loadProfileImage(details.person_id)
          ])
        }
      } catch (error) {
        console.error('[ResidentHome] Refresh failed:', error)
      } finally {
        setRefreshing(false)
      }
    }, [details?.person_id, loadRecentActivities, loadIdValidationRequest, loadProfileImage])

    // 🔄 Ensure data is loaded (use cache since choose-account already forced fresh)
    useEffect(() => {
      let live = true
      ;(async () => {
        const fresh = await roleStore.ensureLoaded('resident')
        if (!live) return
        if (fresh) {
          console.log('[ResidentHome] Profile loaded:', {
            person_id: fresh.person_id,
            has_maternal_record: fresh.has_maternal_record,
          })
          setDetails(fresh)
          if (fresh.person_id) {
            loadRecentActivities(fresh.person_id)
            loadIdValidationRequest(fresh.person_id)
            loadProfileImage(fresh.person_id)
          }
        }
        setLoading(false)
      })()
      return () => { live = false }
    }, [role, roleStore.ensureLoaded, loadRecentActivities, loadProfileImage])

    const fullName = useMemo(() => {
      const fn = [details?.first_name, details?.middle_name, details?.last_name, details?.suffix]
        .filter(Boolean)
        .join(' ')
      return fn || 'Resident'
    }, [details])

    const pushProfile = () => {
      router.push({
        pathname: '/residentprofile',
        params: { profile: JSON.stringify(details ?? {}) },
      })
    }

    if (loading) {
      return (
        <ThemedView safe style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <ThemedText style={{ marginTop: 8 }}>Loading…</ThemedText>
        </ThemedView>
      )
    }

    return (
      <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
        <ThemedAppBar
          title={'Barangay Sto. Niño'}
          showBack={false}
          showNotif={true}
          showProfile={true}
          onPressProfile={pushProfile}
        />

        <KeyboardAvoidingView>
          <ScrollView 
            contentContainerStyle={{ paddingBottom: 50 }} 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#310101']}
                tintColor={'#310101'}
              />
            }
          >
            <View style={[styles.container, { paddingHorizontal: 30, paddingVertical: 10 }]}>
              <ThemedText title={true}>
                Welcome, {details?.first_name ?? fullName}!
              </ThemedText>
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

            <Spacer height={5} />

            {/* Full Verification prompt — show only if NOT yet fully verified */}
            {details?.is_id_valid === false && (
              <>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (idValidationRequest) {
                      // Show validation details modal or navigate to status page
                      router.push({
                        pathname: '/(bhwmodals)/(person)/validationstatus',
                        params: { personId: details.person_id }
                      })
                    } else {
                      // Navigate to ID submission
                      router.push('/(bhwmodals)/(person)/validid')
                    }
                  }}
                >
                  <ThemedCard style={styles.verifyCard}>
                    <View style={styles.verifyRow}>
                      <ThemedIcon
                        name={idValidationRequest ? "time" : "shield-checkmark"}
                        iconColor={idValidationRequest?.latest_status === 'REJECTED' ? "#dc2626" : "#7c2d12"}
                        bgColor={idValidationRequest?.latest_status === 'REJECTED' ? "#fecaca" : "#fde68a"}
                        shape="square"
                        containerSize={50}
                        size={20}
                      />
                      <View style={{ flex: 1, paddingHorizontal: 8 }}>
                        <ThemedText style={styles.verifyTitle}>
                          {idValidationRequest ? 'ID Verification Status' : 'Full Verification'}
                        </ThemedText>
                        <ThemedText style={styles.verifySubtext}>
                          {idValidationRequest 
                            ? `Status: ${idValidationRequest.latest_status}${idValidationRequest.latest_status === 'REJECTED' ? ' - Tap to resubmit' : ''}` 
                            : 'Please submit a valid ID to access the Request Document feature.'}
                        </ThemedText>
                        {idValidationRequest?.latest_remarks && (
                          <ThemedText style={[styles.verifySubtext, { color: '#dc2626', marginTop: 2 }]}>
                            Reason: {idValidationRequest.latest_remarks}
                          </ThemedText>
                        )}
                      </View>
                      <ThemedIcon name="chevron-forward" bgColor="transparent" size={20} />
                    </View>
                  </ThemedCard>
                </TouchableOpacity>

                <Spacer height={15} />
              </>
            )}

            <ThemedCard>
              <ThemedText style={styles.text} subtitle={true}>Recent Activities</ThemedText>
              
              {activitiesLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#6d2932" />
                  <ThemedText style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Loading activities...</ThemedText>
                </View>
              ) : recentActivities.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ThemedIcon name="time-outline" size={24} containerSize={40} bgColor="#f3f4f6" />
                  <ThemedText style={{ marginTop: 8, fontSize: 14, color: '#666' }}>No recent activities</ThemedText>
                  <ThemedText style={{ fontSize: 12, color: '#999', textAlign: 'center', marginTop: 4 }}>Your recent reports and cases will appear here</ThemedText>
                </View>
              ) : (
                recentActivities.map((activity, index) => {
                  const getStatusColor = (status: string, type: string) => {
                    const s = status.toUpperCase()
                    if (type === 'document') {
                      if (s.includes('FOR_TREASURER_REVIEW')) return '#fde68a'
                      if (s.includes('PAID')) return '#dbeafe'
                      if (s.includes('FOR_PRINTING')) return '#e0e7ff'
                      if (s.includes('RELEASED')) return '#d1fae5'
                      if (s.includes('DECLINED')) return '#fecaca'
                    } else {
                      if (s.includes('PENDING')) return '#ffe082'
                      if (s.includes('SETTLED') || s.includes('RESOLVED')) return '#c8e6c9'
                      if (s.includes('ESCALATED')) return '#b3e5fc'
                      if (s.includes('DISMISSED')) return '#ffcdd2'
                    }
                    return '#e0e0e0'
                  }

                  return (
                    <React.Fragment key={index}>
                      <View style={styles.activityItem}>
                        <ThemedIcon
                          name={activity.icon}
                          iconColor={activity.iconColor}
                          bgColor={activity.iconBg}
                          shape='square'
                          containerSize={50}
                          size={20}
                        />
                        <View style={styles.activityDetails}>
                          <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                          <ThemedText style={styles.activitySubtext}>{activity.subtitle}</ThemedText>
                          <ThemedText style={styles.activitySubtext}>Filed on: {activity.dateOnly}</ThemedText>
                          <ThemedText style={styles.activitySubtext}>Time Filed: {activity.timeOnly}</ThemedText>
                          <ThemedText style={styles.activitySubtext}>{activity.reference}</ThemedText>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(activity.status, activity.type) }]}>
                          <ThemedText style={styles.badgeText}>{activity.status}</ThemedText>
                        </View>
                      </View>
                      {index < recentActivities.length - 1 && (
                        <>
                          <Spacer height={15} />
                          <ThemedDivider />
                          <Spacer height={15} />
                        </>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </ThemedCard>
            <Spacer height={20} />

            <ThemedCard>
              <ThemedText style={styles.text} subtitle={true}>Services</ThemedText>
              <View style={styles.container}>
                <View style={styles.subcontainer}>
                  <TouchableOpacity onPress={() => router.push('/requestdoc')}>
                    <ThemedIcon name={'newspaper'} iconColor={'#6b4c3b'} bgColor={'#f2e5d7'} />
                  </TouchableOpacity>
                  <ThemedText style={styles.icontext}>Request a Document</ThemedText>
                </View>
                <View style={styles.subcontainer}>
                  <TouchableOpacity onPress={() => router.push('/fileblotterreport')}>
                    <ThemedIcon name={'receipt'} iconColor={'#4a5c6a'} bgColor={'#dfe3e6'} />
                  </TouchableOpacity>
                  <ThemedText style={styles.icontext}>File a Blotter Report</ThemedText>
                </View>
                <View style={styles.subcontainer}>
                  <TouchableOpacity onPress={() => router.push('/barangaycases')}>
                    <ThemedIcon name={'folder-open'} iconColor={'#4e6151'} bgColor={'#dce5dc'} />
                  </TouchableOpacity>
                  <ThemedText style={styles.icontext}>Barangay Cases</ThemedText>
                </View>
              </View>
            </ThemedCard>
          </ScrollView>
        </KeyboardAvoidingView>

        <TouchableOpacity style={styles.fab} onPress={() => router.push('/chatbot')}>
          <ThemedIcon name={'chatbubbles'} bgColor="#310101" size={24} />
        </TouchableOpacity>
      </ThemedView>
    )
  }

  export default ResidentHome

  const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    subcontainer: { alignItems: 'center', justifyContent: 'center', marginVertical: 10, width: 90 },
    fab: { position: 'absolute', bottom: 20, right: 20, zIndex: 999 },
    text: { textAlign: 'center', fontWeight: 'bold' },
    icontext: { textAlign: 'center', paddingTop: 10 },
    activityItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 10 },
    activityDetails: { flex: 1, paddingHorizontal: 10 },
    activityTitle: { fontWeight: 'bold' },
    activitySubtext: { fontSize: 12, color: '#555' },
    badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#333' },
    verifyCard: { borderWidth: 2, borderColor: '#4b0404b2' },
    verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    verifyTitle: { fontWeight: 'bold', fontSize: 16 },
    verifySubtext: { fontSize: 12, color: '#6b7280', marginTop: 2 },
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
  })