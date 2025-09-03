import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedItemCard from '@/components/ThemedItemCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React from 'react'
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native'

const STATUS_UI: Record<
  'pending' | 'ready' | 'completed' | 'declined',
  { label: string; bg: string; fg: string }
> = {
  pending:   { label: 'Pending',   bg: '#fde68a', fg: '#92400e' },
  ready:     { label: 'Ready',     bg: '#d1fae5', fg: '#065f46' },
  completed: { label: 'Completed', bg: '#e5e7eb', fg: '#374151' },
  declined:  { label: 'Declined',  bg: '#fecaca', fg: '#7f1d1d' },
}

type RequestItem = {
  id: string
  title: string
  requestNo: string
  requestedAt: string
  status: keyof typeof STATUS_UI
}

// ✅ History-only dataset (completed/declined)
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

const RequestHistory = () => {
  return (
    // ⬇️ no `safe` here so the app bar sits flush (no white strip)
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title="Request History" />

      <KeyboardAvoidingView>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer />

          <ThemedCard>
            <View style={styles.headerRow}>
              <ThemedText style={styles.title}>Request History</ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {HISTORY_REQUESTS.length === 0 && (
              <ThemedText style={styles.empty}>No past requests yet.</ThemedText>
            )}

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
    </ThemedView>
  )
}

export default RequestHistory

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  empty: { textAlign: 'center', opacity: 0.6, paddingVertical: 8 },
})
