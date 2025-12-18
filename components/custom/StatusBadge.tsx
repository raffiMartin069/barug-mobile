import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

type Variant = 'neutral' | 'positive' | 'warning' | 'info'

export default function StatusBadge({
    label,
    variant = 'neutral',
    size = 'md',
    icon,
    accessibilityLabel,
}: {
    label: string
    variant?: Variant
    size?: 'sm' | 'md'
    icon?: keyof typeof Ionicons.glyphMap | null
    accessibilityLabel?: string
}) {
    // Visual mapping
    const bg = Colors.light.card
    const color = variant === 'warning' ? Colors.warning : variant === 'positive' ? Colors.light.tint : variant === 'info' ? Colors.light.tint : Colors.light.text

    return (
        <View
            accessibilityRole="text"
            accessibilityLabel={accessibilityLabel ?? label}
            style={[styles.badge, size === 'sm' ? styles.smBadge : styles.mdBadge, { backgroundColor: bg }]}
        >
            {icon ? <Ionicons name={icon as any} size={size === 'sm' ? 12 : 16} color={color} style={{ marginRight: 6 }} /> : null}
            <Text style={[styles.text, { color }]}>{label}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    badge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignSelf: 'flex-start',
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    mdBadge: {},
    smBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
})
