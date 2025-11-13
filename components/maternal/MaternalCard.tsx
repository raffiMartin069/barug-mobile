import ThemedText from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  title?: string
  meta1?: string
  meta2?: string
  pillLabel?: string | null
  onPress?: () => void
  onCheck?: () => void
}

const MaternalCard = ({ title = '', meta1 = '', meta2 = '', pillLabel = null, onPress, onCheck }: Props) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {pillLabel ? <View style={styles.pill}><Text style={styles.pillText}>{pillLabel}</Text></View> : null}
      </View>

      <View style={styles.body}>
        {meta1 ? <ThemedText style={styles.meta}>{meta1}</ThemedText> : null}
        {meta2 ? <ThemedText style={styles.meta}>{meta2}</ThemedText> : null}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionGhost} onPress={onPress} accessibilityRole="button">
          <Text style={styles.actionGhostText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionPrimary} onPress={onCheck} accessibilityRole="button">
          <Text style={styles.actionPrimaryText}>Check</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

export default MaternalCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  pill: { backgroundColor: Colors.warning, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  body: { marginTop: 8 },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  actions: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  actionGhost: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: Colors.light.card },
  actionGhostText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  actionPrimary: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.primary },
  actionPrimaryText: { fontSize: 13, fontWeight: '700', color: '#fff' },
})
