// components/ThemedAppBar.tsx
import { useNotifications } from '@/hooks/useNotifications'
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRouter } from 'expo-router'
import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useAccountRole } from '@/store/useAccountRole'

type Props = {
  style?: any
  title?: string
  unreadCount?: number // kept for compat, but we’ll prefer the hook’s unread
  showBack?: boolean
  showNotif?: boolean
  showProfile?: boolean
  showSettings?: boolean
  rightAction?: React.ReactNode
  onPressBack?: () => void
}

const ThemedAppBar = ({
  style = null,
  title = '',
  unreadCount = 0,
  showBack = true,
  showNotif = true,
  showProfile = true,
  showSettings = false,
  rightAction,
  onPressBack,
}: Props) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme ?? 'light'] ?? Colors.light
  const navigation = useNavigation()
  const router = useRouter()
  const ACCENT = theme.link

  const [showNotifCard, setShowNotifCard] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const roleStore = useAccountRole()
  const role = roleStore.currentRole ?? 'resident'
  const profile = roleStore.getProfile(role)
  const personId = profile?.person_id || null
  const staffId = profile?.staff_id || null
  const userTypeId = role === 'resident' ? 1 : 2

  React.useEffect(() => {
    if (refreshTrigger > 0) refresh()
  }, [refreshTrigger])

  const { items, unread, markAllRead, refresh } = useNotifications({
    userTypeId,
    personId,
    staffId,
  })

  return (
    <View style={[styles.container, { backgroundColor: theme.link }, style]}>
      {/* Left */}
      <View style={styles.leftSection}>
        {showBack ? (
          <TouchableOpacity onPress={onPressBack || (() => navigation.goBack())} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={20} color={theme.background} />
          </TouchableOpacity>
        ) : (
          // keep equal space so the title stays centered
          <View style={{ width: 24, height: 24 }} />
        )}
      </View>

      {/* Center */}
      <View style={styles.centerSection}>
        <Text style={[styles.title, { color: theme.background }]} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.rightSection}>
        {rightAction}
        {/* change badge to show {unread} instead of prop unreadCount */}
        {showNotif && (
          <TouchableOpacity
            onPress={() => setShowNotifCard((s) => !s)}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={{ padding: 6 }}
          >
            <Ionicons name="notifications" size={20} color={theme.background} />
            {(unread ?? unreadCount) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {(unread ?? unreadCount) > 99 ? '99+' : (unread ?? unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {showProfile && (
          <TouchableOpacity
            onPress={() => router.push('/residentprofile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={{ padding: 6 }}
          >
            <Ionicons name="person" size={20} color={theme.background} />
          </TouchableOpacity>
        )}

        {showSettings && (
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            style={{ padding: 6 }}
          >
            <Ionicons name="settings-outline" size={20} color={theme.background} />
          </TouchableOpacity>
        )}
      </View>

      {/* Polished notification dropdown */}
      {showNotifCard && (
        <View style={[styles.notifCard, styles.cardShadow]}>
          <View style={styles.notifHeaderRow}>
            <View style={styles.notifHeaderLeft}>
              <Ionicons name="notifications-outline" size={18} color={ACCENT} />
              <Text style={styles.notifTitle}>Notifications</Text>
            </View>
            <TouchableOpacity onPress={() => setShowNotifCard(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#333" />
            </TouchableOpacity>
          </View>

          {/* list preview (top 5) */}
          <View>
            {items.slice(0, 5).map((n) => (
              <TouchableOpacity
                key={n.notification_id}
                style={{ paddingVertical: 8 }}
                onPress={() => {
                  setShowNotifCard(false)
                  // router.push(n.deep_link || '/')
                }}
              >
                <Text style={{ fontWeight: '700', color: '#111' }}>{n.title}</Text>
                <Text style={{ color: '#333', marginTop: 2 }} numberOfLines={2}>
                  {n.body}
                </Text>
                <Text style={{ color: '#777', fontSize: 12, marginTop: 4 }}>
                  {new Date(n.created_at).toLocaleString()}
                  {!n.is_read ? ' • Unread' : ''}
                </Text>
              </TouchableOpacity>
            ))}
            {items.length === 0 && <Text style={{ color: '#666' }}>No notifications</Text>}
          </View>

          <View style={styles.notifActions}>
            <TouchableOpacity
              style={[styles.ctaPrimary, { backgroundColor: ACCENT }]}
              onPress={() => {
                setShowNotifCard(false)
                router.push('/(residentmodals)/notifications')
              }}
            >
              <Ionicons name="list-outline" size={16} color="#fff" />
              <Text style={styles.ctaPrimaryText}>View all</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ctaSecondary} onPress={markAllRead}>
              <Text style={styles.ctaSecondaryText}>Mark all read</Text>
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
    position: 'relative',
    zIndex: 20,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  leftSection: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0, // allow text to elide properly
  },
  rightSection: {
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
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
    top: 60,
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
