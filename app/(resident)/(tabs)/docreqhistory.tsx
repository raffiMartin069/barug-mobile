import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedItemCard from '@/components/ThemedItemCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useRouter } from 'expo-router'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

const STATUS_UI: Record<
  'pending' | 'ready' | 'completed' | 'declined',
  { label: string; bg: string; fg: string }
> = {
  pending: { label: 'Pending', bg: '#fde68a', fg: '#92400e' }, // amber
  ready: { label: 'Ready', bg: '#d1fae5', fg: '#065f46' }, // green
  completed: { label: 'Completed', bg: '#e5e7eb', fg: '#374151' }, // gray
  declined: { label: 'Declined', bg: '#fecaca', fg: '#7f1d1d' }, // red
}


type RequestItem = {
  id: string
  title: string
  requestNo: string
  requestedAt: string
  status: keyof typeof STATUS_UI
}

const ACTIVE_REQUESTS: RequestItem[] = [
  {
    id: '1',
    title: 'Barangay Clearance',
    requestNo: 'REQ-BCLR-20250602-001',
    requestedAt: 'June 15, 2023',
    status: 'pending',
  },
  {
    id: '2',
    title: 'Certificate of Indigency',
    requestNo: 'REQ-INDG-20250602-002',
    requestedAt: 'June 18, 2023',
    status: 'ready',
  },
]

const HISTORY_REQUESTS: RequestItem[] = [
  {
    id: '3',
    title: 'Certificate of Residency',
    requestNo: 'REQ-RES-20250520-010',
    requestedAt: 'May 20, 2023',
    status: 'completed',
  },
  {
    id: '4',
    title: 'Barangay Clearance',
    requestNo: 'REQ-BCLR-20250511-004',
    requestedAt: 'May 11, 2023',
    status: 'declined',
  },
]

const DocReqHistory = () => {
  const router = useRouter()

  return (
    <ThemedView style={{flex: 1, justifyContent: 'flex-start',}} safe>

      <ThemedAppBar
        title='Document Requests'
      />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>

          <Spacer height={15}/>

          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Active Requests</ThemedText>
              <ThemedText link>View All</ThemedText>
            </View>

            <Spacer height={10}/>

            <ThemedDivider/>

            <Spacer height={10}/>

            {ACTIVE_REQUESTS.map((req) => {
              const ui = STATUS_UI[req.status]
              return (
                <View key={req.id} style={{ marginBottom: 10 }}>
                  <ThemedItemCard
                    title={req.title}
                    meta1={`Request #: ${req.requestNo}`}
                    meta2={`Requested: ${req.requestedAt}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize="sm"
                    route={{ pathname: '/request/[id]', params: { id: req.id } }}
                  />
                </View>
              )
            })}
          </ThemedCard>

          <Spacer height={20}/>

          <ThemedCard>
            <View style={styles.row}>
              <ThemedText style={styles.title}>Request History</ThemedText>
              <ThemedText link>View All</ThemedText>
            </View>

            <Spacer height={10}/>

            <ThemedDivider/>

            <Spacer height={10}/>

            {HISTORY_REQUESTS.map((req) => {
              const ui = STATUS_UI[req.status]
              return (
                <View key={req.id} style={{ marginBottom: 10 }}>
                  <ThemedItemCard
                    title={req.title}
                    meta1={`Request #: ${req.requestNo}`}
                    meta2={`Requested: ${req.requestedAt}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize="sm"
                    route={{ pathname: '/request/[id]', params: { id: req.id } }}
                  />
                </View>
              )
            })}
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/requestdoc')}>
        <ThemedIcon
          name={'add'}
          bgColor="#310101"
          size={24}
        />
      </TouchableOpacity>

    </ThemedView>
  )
}

export default DocReqHistory

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  title: {
    fontSize: 20, 
    fontWeight: 'bold'
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 999,
  },
  // ActiveRequestItem styles
  itemWrap: {
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaLine: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  itemFooter: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  ghostBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#310101',
    backgroundColor: 'transparent',
  },
  ghostBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#310101',
  },
})