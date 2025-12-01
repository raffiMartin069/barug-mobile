  // app/(resident)/(tabs)/residenthome.tsx
  import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
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

    const [notifRefreshKey, setNotifRefreshKey] = useState(0)

    const onRefresh = useCallback(async () => {
      setRefreshing(true)
      try {
        if (details?.person_id) {
          await Promise.all([
            loadRecentActivities(details.person_id),
            loadIdValidationRequest(details.person_id),
            loadProfileImage(details.person_id)
          ])
          setNotifRefreshKey(k => k + 1)
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
          notificationRefreshTrigger={notifRefreshKey}
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
            <View style={styles.heroSection}>
              <View style={styles.heroContent}>
                <View style={styles.profileImageContainer}>
                  <ThemedImage
                    src={
                      profileImage
                        ? { uri: profileImage.startsWith('http') 
                            ? profileImage 
                            : `https://wkactspmojbvuzghmjcj.supabase.co/storage/v1/object/public/profile-pictures/${profileImage}` }
                        : require('@/assets/images/default-image.jpg')
                    }
                    size={70}
                    style={styles.profileImage}
                  />
                </View>
                <View style={styles.heroText}>
                  <ThemedText style={styles.welcomeText}>Welcome back,</ThemedText>
                  <ThemedText style={styles.nameText}>{details?.first_name ?? fullName}!</ThemedText>
                </View>
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

            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Recent Activities</ThemedText>
            </View>
            <ThemedCard style={styles.activityCard}>
              
              {activitiesLoading ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color="#6d2932" />
                  <ThemedText style={{ marginTop: 8, fontSize: 12, color: '#666' }}>Loading activities...</ThemedText>
                </View>
              ) : recentActivities.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <ThemedIcon name="time-outline" size={32} containerSize={64} bgColor="#f3f4f6" iconColor="#9ca3af" />
                  <ThemedText style={{ marginTop: 12, fontSize: 15, fontWeight: '600', color: '#4b5563' }}>No recent activities</ThemedText>
                  <ThemedText style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center', marginTop: 4, paddingHorizontal: 32 }}>Your recent reports and cases will appear here</ThemedText>
                </View>
              ) : (
                recentActivities.map((activity, index) => {
                  const getStatusColor = (status: string, type: string) => {
                    const s = status.toUpperCase()
                    if (type === 'document') {
                      if (s.includes('FOR_TREASURER_REVIEW')) return { bg: '#fef3c7', fg: '#92400e' }
                      if (s.includes('PAID')) return { bg: '#dbeafe', fg: '#1e40af' }
                      if (s.includes('FOR_PRINTING')) return { bg: '#e0e7ff', fg: '#3730a3' }
                      if (s.includes('RELEASED')) return { bg: '#d1fae5', fg: '#065f46' }
                      if (s.includes('DECLINED')) return { bg: '#fecaca', fg: '#7f1d1d' }
                    } else {
                      if (s.includes('PENDING')) return { bg: '#fef3c7', fg: '#92400e' }
                      if (s.includes('SETTLED') || s.includes('RESOLVED')) return { bg: '#d1fae5', fg: '#065f46' }
                      if (s.includes('ESCALATED')) return { bg: '#dbeafe', fg: '#1e40af' }
                      if (s.includes('DISMISSED')) return { bg: '#fecaca', fg: '#7f1d1d' }
                    }
                    return { bg: '#f3f4f6', fg: '#6b7280' }
                  }

                  const statusColors = getStatusColor(activity.status, activity.type)

                  return (
                    <View key={index} style={styles.activityItemWrapper}>
                      <View style={styles.activityItem}>
                        <View style={styles.activityIconWrapper}>
                          <ThemedIcon
                            name={activity.icon}
                            iconColor={'#310101'}
                            bgColor={'#31010115'}
                            shape='square'
                            containerSize={48}
                            size={22}
                          />
                        </View>
                        <View style={styles.activityDetails}>
                          <View style={styles.activityHeader}>
                            <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                            <View style={[styles.badge, { backgroundColor: statusColors.bg }]}>
                              <ThemedText style={[styles.badgeText, { color: statusColors.fg }]}>{activity.status}</ThemedText>
                            </View>
                          </View>
                          <ThemedText style={styles.activitySubtitle}>{activity.subtitle}</ThemedText>
                          <View style={styles.activityMeta}>
                            <ThemedText style={styles.activityReference}>{activity.reference}</ThemedText>
                          </View>
                          <ThemedText style={styles.activityDate}>{activity.dateOnly} • {activity.timeOnly}</ThemedText>
                        </View>
                      </View>
                      {index < recentActivities.length - 1 && <View style={styles.activityDivider} />}
                    </View>
                  )
                })
              )}
            </ThemedCard>


            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Quick Services</ThemedText>
            </View>
            <View style={styles.servicesGrid}>
              <TouchableOpacity style={[styles.serviceCard, { backgroundColor: '#fef3c7' }]} onPress={() => router.push('/requestdoc')} activeOpacity={0.7}>
                <View style={styles.serviceIconContainer}>
                  <ThemedIcon name={'newspaper'} iconColor={'#92400e'} bgColor={'#fde68a'} size={28} containerSize={60} />
                </View>
                <ThemedText style={styles.serviceTitle}>Request Document</ThemedText>
                {/* <ThemedText style={styles.serviceSubtitle}>Get barangay certificates</ThemedText> */}
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.serviceCard, { backgroundColor: '#dbeafe' }]} onPress={() => router.push('/fileblotterreport')} activeOpacity={0.7}>
                <View style={styles.serviceIconContainer}>
                  <ThemedIcon name={'receipt'} iconColor={'#1e40af'} bgColor={'#bfdbfe'} size={28} containerSize={60} />
                </View>
                <ThemedText style={styles.serviceTitle}>File Report</ThemedText>
                <ThemedText style={styles.serviceSubtitle}>Submit blotter report</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.serviceCard, { backgroundColor: '#d1fae5' }]} onPress={() => router.push('/barangaycases')} activeOpacity={0.7}>
                <View style={styles.serviceIconContainer}>
                  <ThemedIcon name={'folder-open'} iconColor={'#065f46'} bgColor={'#a7f3d0'} size={28} containerSize={60} />
                </View>
                <ThemedText style={styles.serviceTitle}>View Cases</ThemedText>
                <ThemedText style={styles.serviceSubtitle}>Track your cases</ThemedText>
              </TouchableOpacity>
            </View>
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
    fab: { position: 'absolute', bottom: 20, right: 20, zIndex: 999 },
    
    heroSection: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#31010108' },
    heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    heroText: { flex: 1 },
    welcomeText: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
    nameText: { fontSize: 24, fontWeight: '700', color: '#310101' },
    
    profileImageContainer: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 3,
      borderColor: '#310101',
      backgroundColor: '#fff',
      shadowColor: '#310101',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    profileImage: { width: 70, height: 70, borderRadius: 35 },
    
    sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
    
    activityCard: { marginHorizontal: 16, marginBottom: 16, paddingVertical: 8 },
    activityItemWrapper: { paddingVertical: 4 },
    activityItem: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
    activityIconWrapper: { paddingTop: 2 },
    activityDetails: { flex: 1 },
    activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8 },
    activityTitle: { fontWeight: '700', fontSize: 14, color: '#1f2937', flex: 1 },
    activitySubtitle: { fontSize: 13, color: '#4b5563', marginBottom: 6, lineHeight: 18 },
    activityMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 },
    activityReference: { fontSize: 11, fontWeight: '600', color: '#310101', backgroundColor: '#31010110', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    activityDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
    activityDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 8 },
    badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    
    servicesGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 20 },
    serviceCard: {
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    serviceIconContainer: { marginBottom: 8 },
    serviceTitle: { fontSize: 12, fontWeight: '700', color: '#1f2937', textAlign: 'center', marginBottom: 2 },
    serviceSubtitle: { fontSize: 10, color: '#6b7280', textAlign: 'center', lineHeight: 13 },
    
    verifyCard: { borderWidth: 2, borderColor: '#4b0404b2', marginHorizontal: 16 },
    verifyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    verifyTitle: { fontWeight: 'bold', fontSize: 16 },
    verifySubtext: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  })