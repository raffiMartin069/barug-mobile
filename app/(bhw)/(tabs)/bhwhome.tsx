import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native'

const BhwHome = () => {
  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start'}} safe>
      <ThemedAppBar/>

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

          <View style={[styles.container, {paddingHorizontal: 30, paddingVertical: 10,}]}>
              <ThemedText title>Welcome, firstname!</ThemedText>
              <ThemedImage
                src={require('@/assets/images/default-image.jpg')}
                size={60}
              />
          </View>

          <Spacer height={5}/>

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
                <ThemedText style={styles.statValue}>1,245</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="home" iconColor="#4a5c6a" bgColor="#dfe3e6" />
                <ThemedText style={styles.statLabel}>Households</ThemedText>
                <ThemedText style={styles.statValue}>312</ThemedText>
              </View>

              <View style={styles.subcontainer}>
                <ThemedIcon name="people" iconColor="#4e6151" bgColor="#dce5dc" />
                <ThemedText style={styles.statLabel}>Families</ThemedText>
                <ThemedText style={styles.statValue}>478</ThemedText>
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
})