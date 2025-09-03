import { Colors } from '@/constants/Colors'
import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import ThemedPill from './ThemedPill'
import ThemedText from './ThemedText'

const ThemedItemCard = ({style = null, title, meta1, meta2, showPill=false, pillLabel, pillBgColor, pillTextColor, pillSize, route, ...props}) => {
   const colorScheme = useColorScheme()
   const theme = Colors[colorScheme] ?? Colors.light

   const router = useRouter()
   const handlePress = () => {
    if (route) {
      if (typeof route === 'string') {
        router.push(route as any)
      } else {
        router.push(route)
      }
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.card }, style]} {...props}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {showPill && pillLabel && (
          <ThemedPill
            label={pillLabel}
            bgColor={pillBgColor}
            textColor={pillTextColor}
            size={pillSize}
          />
        )}
      </View>

      {/* Meta lines */}
      <View style={{ marginTop: 4 }}>
        <ThemedText style={styles.meta}>{meta1}</ThemedText>
        {meta2 ? <ThemedText style={styles.meta}>{meta2}</ThemedText> : null}
      </View>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.ghostBtn} onPress={handlePress}>
          <Text style={styles.ghostBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default ThemedItemCard

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    meta: {
        fontSize: 12,
        color: '#6b7280',
        marginTop: 2,
    },
    footer: {
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