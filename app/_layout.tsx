// app/_layout.tsx
import { Stack, router, useSegments } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../constants/supabase'

export default function RootLayout() {
  const segments = useSegments()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [session, setSession] = useState<any>(null) // debug display

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setAuthed(!!session)
      setReady(true)
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      setAuthed(!!session)
    })
    init()
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === '(auth)'

    if (!authed && !inAuth) {
      router.replace('/(auth)/phone') // no session → OTP flow
    }

    if (authed && inAuth) {
      // session already restored → go to MPIN gate by default
      const leaf = segments[1]
      if (leaf !== 'enter-mpin' && leaf !== 'setup-mpin' && leaf !== 'verify' && leaf !== 'phone') {
        router.replace('/(auth)/enter-mpin')
      }
    }
  }, [segments, ready, authed])

  const logoutNow = async () => {
    await supabase.auth.signOut()
    router.replace('/(auth)/phone')
  }

  // Small floating debug bar
  const shortUid = session?.user?.id ? String(session.user.id).slice(0, 8) : '—'

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />

      {/* Debug overlay — remove in production */}
      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={[styles.devBar, { backgroundColor: authed ? '#065f46' : '#7c2d12' }]}>
          <Text style={styles.devText}>
            {authed ? `Session: ON  (uid: ${shortUid})` : 'Session: OFF'}
          </Text>
          {authed ? (
            <TouchableOpacity onPress={logoutNow} style={styles.btn}>
              <Text style={styles.btnText}>Logout</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.devText, { opacity: 0.75 }]}>login to create session</Text>
          )}
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    alignItems: 'flex-end',
    paddingTop: 40, // leave room for status bar
    paddingRight: 10,
  },
  devBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  devText: { color: 'white', fontSize: 12, fontWeight: '600' },
  btn: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
  },
  btnText: { color: 'white', fontSize: 12, fontWeight: '700' },
})
