// app/(business)/BusinessHome.tsx
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { supabase } from '@/constants/supabase'
import { useBusinessStats } from '@/hooks/useBusinessStats'
import { useExpiringBusinesses } from '@/hooks/useExpiringBusinesses'
import { useRecentActivity } from '@/hooks/useRecentActivity'
import { useAccountRole } from '@/store/useAccountRole'
import { useRouter } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, BackHandler, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const BusinessHome = () => {
  const router = useRouter()
  const { getProfile } = useAccountRole()
  const businessProfile = getProfile('business')
  const residentProfile = getProfile('resident')
  const profile = businessProfile || residentProfile
  const [profileImage, setProfileImage] = useState<string | null>(null)
  
  // Fetch business stats
  const { stats, loading: statsLoading } = useBusinessStats(profile?.person_id)
  
  // Fetch expiring businesses
  const { expiringBusinesses, loading: expiringLoading } = useExpiringBusinesses(profile?.person_id)
  
  // Fetch recent activity
  const { activities, loading: activitiesLoading } = useRecentActivity(profile?.person_id, 5)

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
      console.error('[BusinessHome] Failed to load profile image:', error)
      setProfileImage(null)
    }
  }, [])

  // Load profile image when component mounts
  useEffect(() => {
    const personId = businessProfile?.person_id || residentProfile?.person_id
    if (personId) {
      loadProfileImage(personId)
    }
  }, [businessProfile?.person_id, residentProfile?.person_id, loadProfileImage])

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
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
      <ThemedAppBar showBack={false} />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={[styles.container, { paddingHorizontal: 30, paddingVertical: 10 }]}>
            <ThemedText title>Welcome, {profile?.first_name || 'Owner'}!</ThemedText>
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

          {/* Business Stats — grid like Services */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Business Stats</ThemedText>

            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <ThemedIcon name="hourglass" iconColor="#724d24ff" bgColor="#eeede8ff" containerSize={45} size={20} />
                <ThemedText style={styles.statLabel}>Pending</ThemedText>
                <ThemedText style={styles.statValue}>
                  {statsLoading ? '...' : stats.pending_count}
                </ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="briefcase" iconColor="#6b4c3b" bgColor="#f2e5d7" containerSize={45} size={20} />
                <ThemedText style={styles.statLabel}>Active</ThemedText>
                <ThemedText style={styles.statValue}>
                  {statsLoading ? '...' : stats.active_count}
                </ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="document-text" iconColor="#4a5c6a" bgColor="#dfe3e6" containerSize={45} size={20} />
                <ThemedText style={styles.statLabel}>Expired</ThemedText>
                <ThemedText style={styles.statValue}>
                  {statsLoading ? '...' : stats.expired_count}
                </ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="time" iconColor="#4e6151" bgColor="#dce5dc" containerSize={45} size={20} />
                <ThemedText style={styles.statLabel}>Closed</ThemedText>
                <ThemedText style={styles.statValue}>
                  {statsLoading ? '...' : stats.closed_count}
                </ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20} />

          {/* Expiring Businesses Alert */}
          {!expiringLoading && expiringBusinesses.length > 0 && (
            <>
              <ThemedCard>
                <View style={styles.cardHeader}>
                  <ThemedIcon 
                    name="warning" 
                    iconColor="#291414ff" 
                    bgColor="#f3eaeaff" 
                    containerSize={40}
                    size={20}
                  />
                  <ThemedText style={[styles.text, { marginLeft: 10 }]} subtitle>
                    Businesses Expiring Soon
                  </ThemedText>
                </View>
                
                <Spacer height={10} />
                
                {expiringBusinesses.slice(0, 3).map((business) => {
                  const urgencyColors = {
                    critical: { bg: '#FEE2E2', text: '#DC2626', badge: '#EF4444' },
                    warning: { bg: '#FEF3C7', text: '#D97706', badge: '#F59E0B' },
                    info: { bg: '#DBEAFE', text: '#2563EB', badge: '#3B82F6' },
                  };
                  const colors = urgencyColors[business.urgency];
                  
                  return (
                    <View key={business.business_id}>
                      <View style={[styles.expiringItem, { backgroundColor: colors.bg }]}>
                        <View style={{ flex: 1 }}>
                          <ThemedText style={[styles.expiringBusinessName, { color: colors.text }]}>
                            {business.business_name}
                          </ThemedText>
                          <ThemedText style={styles.expiringDetails}>
                            Expires: Dec 31, {business.expiry_year}
                          </ThemedText>
                          <ThemedText style={styles.expiringDetails}>
                            Renew by: Jan 20, {business.expiry_year + 1}
                          </ThemedText>
                        </View>
                        <View style={styles.expiringRight}>
                          <View style={[styles.urgencyBadge, { backgroundColor: colors.badge }]}>
                            <ThemedText style={styles.urgencyBadgeText}>
                              {business.days_until_deadline < 0 
                                ? 'OVERDUE' 
                                : `${business.days_until_deadline} days`}
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                      <Spacer height={10} />
                    </View>
                  );
                })}
                
                {expiringBusinesses.length > 3 && (
                  <TouchableOpacity onPress={() => router.push('/(business)/(tabs)/businesses')}>
                    <ThemedText style={styles.viewAllText}>
                      View all {expiringBusinesses.length} expiring businesses →
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </ThemedCard>
              
              <Spacer height={20} />
            </>
          )}

          <Spacer height={20} />

          {/* Recent Activity */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Recent Activity</ThemedText>

            <ScrollView 
              style={styles.activityScrollView}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {activitiesLoading ? (
                <View style={styles.loadingContainer}>
                  <ThemedText style={styles.loadingText}>Loading activities...</ThemedText>
                </View>
              ) : activities.length === 0 ? (
                <View style={styles.emptyActivityContainer}>
                  <ThemedIcon
                    name="calendar-outline"
                    iconColor="#9CA3AF"
                    bgColor="#F3F4F6"
                    containerSize={60}
                    size={30}
                  />
                  <ThemedText style={styles.emptyActivityText}>No recent activity</ThemedText>
                  <ThemedText style={styles.emptyActivitySubtext}>
                    Your business activities will appear here
                  </ThemedText>
                </View>
              ) : (
                <>
                  {activities.map((activity, index) => (
                    <React.Fragment key={activity.activity_id}>
                      {index > 0 && (
                        <>
                          <Spacer height={15} />
                          <ThemedDivider />
                          <Spacer height={15} />
                        </>
                      )}
                      <View style={styles.activityItem}>
                        <ThemedIcon
                          name={activity.icon.name as any}
                          iconColor={activity.icon.color}
                          bgColor={activity.icon.bgColor}
                          shape="square"
                          containerSize={50}
                          size={20}
                        />
                        <View style={styles.activityDetails}>
                          <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                          <ThemedText style={styles.activitySubtext}>
                            {activity.business_name}
                          </ThemedText>
                          <ThemedText style={styles.activitySubtext}>
                            {new Date(activity.timestamp).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </ThemedText>
                          {activity.reference && (
                            <ThemedText style={styles.activitySubtext}>
                              Ref: {activity.reference}
                            </ThemedText>
                          )}
                        {activity.amount && (
                          <ThemedText style={styles.activitySubtext}>
                            Amount: ₱{activity.amount.toLocaleString()}
                          </ThemedText>
                        )}
                      </View>
                      <View style={[styles.badge, { backgroundColor: activity.badge.color }]}>
                        <ThemedText style={styles.badgeText}>{activity.badge.text}</ThemedText>
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </>
            )}
            </ScrollView>
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  )
}

export default BusinessHome

const styles = StyleSheet.create({
  // reused grid
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subcontainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: 70,
  },
  text: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  icontext: {
    textAlign: 'center',
    paddingTop: 10,
  },

  // stats text
  statLabel: {
    textAlign: 'center',
    marginTop: 6,
    fontSize: 10,
    color: '#6B7280',
  },
  statValue: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  // activity row
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  activityDetails: {
    flex: 1,
    paddingHorizontal: 10,
  },
  activityTitle: {
    fontWeight: 'bold',
  },
  activitySubtext: {
    fontSize: 12,
    color: '#555',
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
  // Expiring businesses styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiringItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  expiringBusinessName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  expiringDetails: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  expiringRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  urgencyBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  urgencyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  viewAllText: {
    textAlign: 'center',
    color: '#561C24',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 5,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyActivityContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyActivityText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
    color: '#6B7280',
  },
  emptyActivitySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  activityScrollView: {
    maxHeight: 250,
  },
})