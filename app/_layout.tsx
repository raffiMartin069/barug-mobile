// app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack } from 'expo-router'
import React, { useEffect } from 'react'
import { ActivityIndicator, LogBox, StyleSheet, View } from 'react-native'
import { NiceModalProvider } from '../hooks/NiceModalProvider'
import useDeepLinks from '../hooks/useDeepLinks'
import { useRouteGuard } from '../hooks/useRouteGuard'

// 🔔 Notifications: global handler so foreground notifications show an alert
import * as Notifications from 'expo-notifications'
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// (Optional but helpful) Silence Expo Go SDK 53 push warning so it doesn't redbox
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go'
])

export default function RootLayout() {
  useDeepLinks()  // <- listen for barug://receipt?id=...
  const { ready, authed, mpinSet, session } = useRouteGuard()

  const shortUid = session?.user?.id ? String(session.user.id).slice(0, 8) : '—'
  const waiting = authed && mpinSet === null

  // ✅ Create the default Android notification channel once
  useEffect(() => {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: true,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    }).catch(() => {})
  }, [])

  // 🔎 DEV: log all AsyncStorage contents once on mount
  useEffect(() => {
    if (!__DEV__) return // don’t do this in production

    ;(async () => {
      try {
        const keys = await AsyncStorage.getAllKeys()
        const entries = await AsyncStorage.multiGet(keys)
        // console.log('🔎 [AsyncStorage dump]:')
        entries.forEach(([k, v]) => {
          // console.log(`  ${k}:`, v)
        })
      } catch (err) {
        console.warn('Failed to read AsyncStorage:', err)
      }
    })()
  }, [])

  return (
    <NiceModalProvider>
      <>
        <Stack screenOptions={{ headerShown: false }} />
        {waiting && (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        )}
      </>
    </NiceModalProvider>
  )
}

const styles = StyleSheet.create({
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
})