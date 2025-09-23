import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'

const ThemedAppBar = ({
  style = null,
  title = '',
  unreadCount = 0,
  showBack = true,
  showNotif = true,
  showProfile = true,
  showSettings = false,
  ...props
}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const navigation = useNavigation()
  const router = useRouter()
  const ACCENT = theme.link

  // Toggle the mocked notification dropdown
  const [showNotifCard, setShowNotifCard] = useState(false)

  // Mock payload (adjust freely or wire up later)
  const mockNotif = {
    id: 'notid',
    title: 'Mock Notification',
    headline: 'Welcome, KIMBERLY!',
    body: 'This is a sample notification preview.',
    time: 'Just now',
    // Optional sample avatar; replace uri with your profile photo if desired
    avatarUri: undefined,
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.link }, style]}>
      {showBack && (
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={theme.background} />
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.title, { color: theme.background }, !showBack && styles.leftSection]}>
        {title}
      </Text>

      <View style={styles.rightSection}>
        {showNotif && (
          <TouchableOpacity onPress={() => setShowNotifCard(s => !s)}>
            <Ionicons name="notifications" size={20} color={theme.background} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {showProfile && (
          <TouchableOpacity onPress={() => router.push('/residentprofile')}>
            <Ionicons name="person" size={20} color={theme.background} />
          </TouchableOpacity>
        )}

        {showSettings && (
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={20} color={theme.background} />
          </TouchableOpacity>
        )}
      </View>

      {/* Polished mock notification dropdown */}
      {showNotifCard && (
        <View style={[styles.notifCard, styles.cardShadow]}>
          {/* Header row */}
          <View style={styles.notifHeaderRow}>
            <View style={styles.notifHeaderLeft}>
              <Ionicons name="notifications-outline" size={18} color={ACCENT} />
              <Text style={styles.notifTitle}>{mockNotif.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowNotifCard(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Content row */}
          <View style={styles.notifContentRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.notifHeadline, { color: '#111' }]}>{mockNotif.headline}</Text>
              <Text style={styles.notifBody}>{mockNotif.body}</Text>
              <Text style={styles.notifTime}>{mockNotif.time}</Text>
            </View>

            {/* Avatar (mock) */}
            <View style={[styles.avatarRing, { borderColor: ACCENT }]}>
              {mockNotif.avatarUri ? (
                <Image source={{ uri: mockNotif.avatarUri }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person-circle" size={44} color={ACCENT} />
              )}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.notifActions}>
            <TouchableOpacity
              style={[styles.ctaPrimary, { backgroundColor: ACCENT }]}
              onPress={() => {
                // Example: route somewhere later
                // router.push('/(residentmodals)/requestdoc')
                setShowNotifCard(false)
              }}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Go to Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctaSecondary} onPress={() => setShowNotifCard(false)}>
              <Text style={styles.ctaSecondaryText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

export default ThemedAppBar

const styles = StyleSheet.create({
  container: {
    position: 'relative',          // needed for dropdown positioning
    zIndex: 20,                    // keep above page content
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 4,                  // Android shadow
    shadowColor: '#000',           // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Dropdown card
  notifCard: {
    position: 'absolute',
    top: 60,              // just below the app bar
    right: 12,
    width: 320,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 14,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 50,
  },
  cardShadow: {
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Header
  notifHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  closeBtn: {
    padding: 6,
    marginRight: -4,
  },

  // Content
  notifContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  notifHeadline: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 13,
    color: '#333',
  },
  notifTime: {
    fontSize: 12,
    color: '#777',
    marginTop: 8,
  },

  // Avatar
  avatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  // Actions
  notifActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ctaPrimaryText: {
    color: '#fff',
    fontWeight: '800',
  },
  ctaSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f3f3',
  },
  ctaSecondaryText: {
    color: '#111',
    fontWeight: '700',
  },
})
