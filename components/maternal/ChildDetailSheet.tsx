import Spacer from '@/components/Spacer'
import ThemedBottomSheet from '@/components/ThemedBottomSheet'
import ThemedText from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import type { ChildHealthRecord } from '@/types/maternal'
import React from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

/**
 * ChildDetailSheet
 * Encapsulates the bottom-sheet UI for a selected child record (Overview / Immunizations / Monitoring).
 * This component is purely presentational and receives handlers/state from the parent.
 */
export default function ChildDetailSheet({
    visible,
    onClose,
    child,
    tab,
    setTab,
}: {
    visible: boolean
    onClose: () => void
    child: ChildHealthRecord | null
    tab: 'overview' | 'immunizations' | 'monitoring'
    setTab: (t: 'overview' | 'immunizations' | 'monitoring') => void
}) {
    if (!child) return null

    return (
        <ThemedBottomSheet visible={visible} onClose={onClose} heightPercent={0.85}>
            <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }]}> 
                <View>
                    <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>{child.child_name ?? `Child #${child.child_record_id}`}</ThemedText>
                    <ThemedText style={[styles.childMeta, { marginTop: 4 }]}>Born {child.created_at ? child.created_at.split('T')[0] : '—'} • Order: {child.birth_order ?? '—'}</ThemedText>
                </View>
                <Pressable onPress={onClose} style={({ pressed }) => [{ padding: 6, borderRadius: 8 }, pressed && { opacity: 0.7 }] }>
                    <ThemedText style={{ color: Colors.light.icon }}>Close</ThemedText>
                </Pressable>
            </View>

            <View style={styles.tabRow}>
                <Pressable onPress={() => setTab('overview')} style={[styles.tabButton, tab === 'overview' && styles.tabButtonActive]}>
                    <ThemedText style={[styles.tabButtonText, tab === 'overview' && styles.tabButtonTextActive]}>Overview</ThemedText>
                </Pressable>
                <Pressable onPress={() => setTab('immunizations')} style={[styles.tabButton, tab === 'immunizations' && styles.tabButtonActive]}>
                    <ThemedText style={[styles.tabButtonText, tab === 'immunizations' && styles.tabButtonTextActive]}>Immunizations</ThemedText>
                </Pressable>
                <Pressable onPress={() => setTab('monitoring')} style={[styles.tabButton, tab === 'monitoring' && styles.tabButtonActive]}>
                    <ThemedText style={[styles.tabButtonText, tab === 'monitoring' && styles.tabButtonTextActive]}>Monitoring</ThemedText>
                </Pressable>
            </View>

            <Spacer height={8} />

            <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
                {tab === 'overview' && (
                    <View>
                        <ThemedText style={styles.blockText}>Immunizations: {child.immunization_count ?? 0}</ThemedText>
                        <ThemedText style={styles.blockText}>Monitoring logs: {child.monitoring_count ?? 0}</ThemedText>
                        <Spacer height={8} />
                        <ThemedText style={styles.blockTitle}>Quick actions</ThemedText>
                        <ThemedText style={styles.blockText}>Tap the tabs to view immunizations or monitoring logs. You can scroll each list independently.</ThemedText>
                    </View>
                )}

                {tab === 'immunizations' && (
                    <View>
                        {(!child.immunizations || child.immunizations.length === 0) ? (
                            <ThemedText style={styles.blockText}>No immunization records.</ThemedText>
                        ) : (
                            child.immunizations.map((im: any) => (
                                <View key={im.child_immunization_id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.card }}>
                                    <ThemedText style={styles.blockText}>{im.vaccine_type ?? 'Vaccine'}</ThemedText>
                                    <ThemedText style={styles.blockMeta}>{im.immunization_date ?? '—'}</ThemedText>
                                    {im.immunization_stage_name && <ThemedText style={styles.blockText}>Stage: {im.immunization_stage_name}</ThemedText>}
                                </View>
                            ))
                        )}
                    </View>
                )}

                {tab === 'monitoring' && (
                    <View>
                        {(!child.monitoring_logs || child.monitoring_logs.length === 0) ? (
                            <ThemedText style={styles.blockText}>No monitoring logs.</ThemedText>
                        ) : (
                            child.monitoring_logs.map((m: any) => (
                                <View key={m.child_monitoring_id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.light.card }}>
                                    <ThemedText style={styles.blockText}>{m.visit_date ?? '—'}</ThemedText>
                                    <ThemedText style={styles.blockMeta}>Wt: {m.weight_kg ?? '—'} kg • Ht: {m.height_cm ?? '—'} cm</ThemedText>
                                    {m.muac != null && <ThemedText style={styles.blockText}>MUAC: {m.muac}</ThemedText>}
                                    {m.notes && <ThemedText style={styles.blockText}>Notes: {m.notes}</ThemedText>}
                                </View>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
        </ThemedBottomSheet>
    )
}

const styles = StyleSheet.create({
    childMeta: { fontSize: 13, color: Colors.light.icon },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    tabButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: Colors.light.card },
    tabButtonActive: { backgroundColor: Colors.light.tint },
    tabButtonText: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
    tabButtonTextActive: { color: Colors.light.background },
    blockText: { fontSize: 13, color: Colors.light.text },
    blockTitle: { fontSize: 15, fontWeight: '600' },
    blockMeta: { fontSize: 13, color: Colors.light.icon },
})
