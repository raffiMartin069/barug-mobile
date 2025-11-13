import StatusBadge from '@/components/maternal/StatusBadge'
import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import { Colors } from '@/constants/Colors'
import type { ChildHealthRecord } from '@/types/maternal'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

/**
 * ChildList
 * Presentational list of child health records. Kept intentionally small —
 * accepts an array of child record summaries and a callback when an item
 * is selected.
 *
 * Props:
 * - children: ChildHealthRecord[]
 * - onSelect: (child) => void
 */
export default function ChildList({ items = [], onSelect }: { items: ChildHealthRecord[]; onSelect: (c: ChildHealthRecord) => void }) {
    /**
     * items: array of child records to render
     */
    return (
        <View>
            {items.map((child) => (
                <TouchableOpacity
                    key={child.child_record_id}
                    activeOpacity={0.9}
                    onPress={() => onSelect(child)}
                >
                    <View style={styles.childRow}>
                        <View style={styles.childAvatar}>
                            <Ionicons name="person" size={20} color={Colors.light.background} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <ThemedText style={styles.childName}>{child.child_name ?? `Child #${child.child_record_id}`}</ThemedText>
                            <ThemedText style={styles.childMeta}>Born {child.created_at ? child.created_at.split('T')[0] : '—'} • Order: {child.birth_order ?? '—'}</ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <View style={styles.countRow}>
                                <StatusBadge size="sm" label={`${child.immunization_count ?? 0}`} variant="info" accessibilityLabel={`Immunizations ${child.immunization_count ?? 0}`} />
                                <View style={{ width: 8 }} />
                                <StatusBadge size="sm" label={`${child.monitoring_count ?? 0}`} variant="neutral" accessibilityLabel={`Monitoring logs ${child.monitoring_count ?? 0}`} />
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Colors.light.icon} />
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
            <Spacer height={6} />
        </View>
    )
}

const styles = StyleSheet.create({
    childRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.card,
    },
    childAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.tint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    childName: {
        fontSize: 15,
        fontWeight: '700',
    },
    childMeta: {
        fontSize: 13,
        color: Colors.light.icon,
    },
    countRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginBottom: 6,
    },
    smallBadge: {
        backgroundColor: Colors.light.card,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    smallBadgeSecondary: {
        backgroundColor: Colors.light.card,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginLeft: 6,
    },
    smallBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.tint,
    },
})
