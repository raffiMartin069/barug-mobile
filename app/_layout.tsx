// app/_layout.tsx
import { Stack } from 'expo-router'
import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { NiceModalProvider } from '../hooks/NiceModalProvider'
import { useRouteGuard } from '../hooks/useRouteGuard'

export default function RootLayout() {
  const { ready, authed, mpinSet, session, logoutNow } = useRouteGuard()

  const shortUid = session?.user?.id ? String(session.user.id).slice(0, 8) : '—'
  const waiting = authed && mpinSet === null

  return (
    <NiceModalProvider>
      <>
        <Stack screenOptions={{ headerShown: false }} />
        {waiting && (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        )}
        {/* debug overlay */}
        {/* <View pointerEvents="box-none" style={styles.overlay}>
          <View style={[styles.devBar, { backgroundColor: authed ? '#065f46' : '#7c2d12' }]}>
            <Text style={styles.devText}>
              {authed ? `Session: ON (uid: ${shortUid})  MPIN: ${mpinSet ? 'SET' : 'NOT SET'}` : 'Session: OFF'}
            </Text>
            {authed ? (
              <TouchableOpacity onPress={logoutNow} style={styles.btn}>
                <Text style={styles.btnText}>Logout</Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.devText, { opacity: 0.75 }]}>login to create session</Text>
            )}
          </View>
        </View> */}
      </>
    </NiceModalProvider>
  )
}

const styles = StyleSheet.create({
  center: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'flex-end', paddingTop: 40, paddingRight: 10 },
  devBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  devText: { color: 'white', fontSize: 12, fontWeight: '600' },
  btn: { marginLeft: 6, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 },
  btnText: { color: 'white', fontSize: 12, fontWeight: '700' },
})
