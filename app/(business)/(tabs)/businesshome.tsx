// app/(business)/BusinessHome.tsx
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const BusinessHome = () => {
  const router = useRouter()

  return (
    <ThemedView style={{ flex: 1, justifyContent: 'flex-start' }} safe>
      <ThemedAppBar showBack={false} />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={[styles.container, { paddingHorizontal: 30, paddingVertical: 10 }]}>
            <ThemedText title>Welcome, Owner!</ThemedText>
            <ThemedImage src={require('@/assets/images/default-image.jpg')} size={60} />
          </View>

          <Spacer height={5} />

          {/* Business Stats — grid like Services */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Business Stats</ThemedText>

            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <ThemedIcon name="briefcase" iconColor="#3B82F6" bgColor="#E0ECFF" />
                <ThemedText style={styles.statLabel}>Registered</ThemedText>
                <ThemedText style={styles.statValue}>2</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="document-text" iconColor="#16A34A" bgColor="#DFF5E0" />
                <ThemedText style={styles.statLabel}>Active Clearances</ThemedText>
                <ThemedText style={styles.statValue}>1</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="time" iconColor="#8B5CF6" bgColor="#EEE8FD" />
                <ThemedText style={styles.statLabel}>Pending Requests</ThemedText>
                <ThemedText style={styles.statValue}>3</ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20} />

          {/* Quick Actions — same layout as Services */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Quick Actions</ThemedText>

            <View style={styles.container}>
              <View style={styles.subcontainer}>
                <TouchableOpacity onPress={() => router.push('/')}>
                  <ThemedIcon name="newspaper" iconColor="#6b4c3b" bgColor="#f2e5d7" />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Apply/Renew Clearance</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <TouchableOpacity onPress={() => router.push('/')}>
                  <ThemedIcon name="create" iconColor="#4a5c6a" bgColor="#dfe3e6" />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>Update Business Info</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <TouchableOpacity onPress={() => router.push('/')}>
                  <ThemedIcon name="folder-open" iconColor="#4e6151" bgColor="#dce5dc" />
                </TouchableOpacity>
                <ThemedText style={styles.icontext}>View Requests</ThemedText>
              </View>
            </View>
          </ThemedCard>

          <Spacer height={20} />

          {/* Recent Activity — same row look as your Activities */}
          <ThemedCard>
            <ThemedText style={styles.text} subtitle>Recent Activity</ThemedText>

            <View style={styles.activityItem}>
              <ThemedIcon
                name="document-text"
                iconColor="#6b4c3b"
                bgColor="#f2e5d7"
                shape="square"
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>Business Clearance Renewal</ThemedText>
                <ThemedText style={styles.activitySubtext}>Submitted: Sep 8, 2025</ThemedText>
                <ThemedText style={styles.activitySubtext}>Ref: BCLR-2025-0142</ThemedText>
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
                name="create"
                iconColor="#4a5c6a"
                bgColor="#dfe3e6"
                shape="square"
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>Business Profile Update</ThemedText>
                <ThemedText style={styles.activitySubtext}>Updated: Sep 5, 2025</ThemedText>
                <ThemedText style={styles.activitySubtext}>Fields: Address, Operating Hours</ThemedText>
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
                name="cash"
                iconColor="#4e6151"
                bgColor="#dce5dc"
                shape="square"
                containerSize={50}
                size={20}
              />
              <View style={styles.activityDetails}>
                <ThemedText style={styles.activityTitle}>OR #102938 — Clearance Fee</ThemedText>
                <ThemedText style={styles.activitySubtext}>Posted: Sep 3, 2025</ThemedText>
                <ThemedText style={styles.activitySubtext}>Amount: ₱500.00</ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: '#b3e5fc' }]}>
                <ThemedText style={styles.badgeText}>Paid</ThemedText>
              </View>
            </View>
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
    width: 90,
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
})
