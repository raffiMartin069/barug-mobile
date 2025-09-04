import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedImage from '@/components/ThemedImage'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { fetchResidentPlus } from '@/services/profile'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const ResidentHome = () => {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<any | null>(null)
  const [isStaff, setIsStaff] = useState(false)

  useEffect(() => {
    let live = true
    ;(async () => {
      setLoading(true)
      try {
        const { details, is_staff } = await fetchResidentPlus()
        if (!live) return
        setDetails(details)
        setIsStaff(!!is_staff)
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => { live = false }
  }, [])

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
          <View style={[styles.container, { paddingHorizontal: 30, paddingVertical: 10 }]}>
            <ThemedText title={true}>Welcome, {details?.first_name ?? fullName}! ID: {details?.person_id}</ThemedText>
            <ThemedImage
              // if you store a URL in profile_picture, you can switch to {uri: details?.profile_picture}
              src={require('@/assets/images/default-image.jpg')}
              size={60}
            />
          </View>

          <Spacer height={5} />

          {/* Full Verification prompt — show only if NOT yet fully verified */}
          {details?.is_id_valid === false && (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(bhwmodals)/(person)/validid')}
              >
                <ThemedCard style={styles.verifyCard}>
                  <View style={styles.verifyRow}>
                    <ThemedIcon
                      name="shield-checkmark"
                      iconColor="#7c2d12"
                      bgColor="#fde68a"
                      shape="square"
                      containerSize={50}
                      size={20}
                    />
                    <View style={{ flex: 1, paddingHorizontal: 8 }}>
                      <ThemedText style={styles.verifyTitle}>Full Verification</ThemedText>
                      <ThemedText style={styles.verifySubtext}>
                        Please submit a valid ID to access the Request Document feature.
                      </ThemedText>
                    </View>
                    <ThemedIcon name="chevron-forward" bgColor="transparent" size={20} />
                  </View>
                </ThemedCard>
              </TouchableOpacity>

              <Spacer height={15} />
            </>
          )}

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
})
