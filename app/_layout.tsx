// app/_layout.tsx
import { Stack, router, useSegments } from 'expo-router'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../constants/supabase'

export default function RootLayout() {
  const segments = useSegments()
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [session, setSession] = useState<any>(null) // debug display
  const [mpinSet, setMpinSet] = useState<boolean | null>(null) // null = unknown/loading

  const fetchMe = useCallback(async () => {
    if (!authed) { setMpinSet(null); return }
    const { data, error } = await supabase.rpc('me_profile')
    if (error) {
      // If profile fails, be conservative and send back to phone later
      setMpinSet(null)
      return
    }
    setMpinSet(!!data?.mpin_set)
  }, [authed])

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setAuthed(!!session)
      setReady(true)
    }
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      setSession(session)
      setAuthed(!!session)
      // whenever auth changes, refresh mpin flag
      if (session) await fetchMe()
      else setMpinSet(null)
    })
    init()
    return () => sub.subscription.unsubscribe()
  }, [fetchMe])

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === '(auth)'
    const leaf = inAuth ? segments[1] : ''

    // Not logged in → stay/redirect to phone
    if (!authed) {
      if (!inAuth || leaf !== 'phone') router.replace('/(auth)/phone')
      return
    }

    // Logged in: ensure we know mpin status
    if (mpinSet === null) {
      // first time or refetch
      fetchMe()
      return
    }

    // If MPIN not set → force setup flow (can still OTP via /verify if needed)
    if (mpinSet === false) {
      if (!inAuth || (leaf !== 'setup-mpin' && leaf !== 'verify')) {
        router.replace('/(auth)/setup-mpin')
      }
      return
    }

    // MPIN is set → require MPIN screen if user is inside (auth)
    if (mpinSet === true && inAuth) {
      if (leaf !== 'enter-mpin') {
        router.replace('/(auth)/enter-mpin')
      }
      return
    }

    // Otherwise, allow normal navigation (resident tabs, etc.)
  }, [segments, ready, authed, mpinSet, fetchMe])

  const logoutNow = async () => {
    await supabase.auth.signOut()
    router.replace('/(auth)/phone')
  }

  // Small floating debug bar
  const shortUid = session?.user?.id ? String(session.user.id).slice(0, 8) : '—'

  // Show a tiny loader while determining mpin status after login
  if (authed && mpinSet === null) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }} />
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      </>
    )
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {/* Debug overlay — remove in production */}
      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={[styles.devBar, { backgroundColor: authed ? '#065f46' : '#7c2d12' }]}>
          <Text style={styles.devText}>
            {authed ? `Session: ON  (uid: ${shortUid})  MPIN: ${mpinSet ? 'SET' : 'NOT SET'}` : 'Session: OFF'}
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
    paddingTop: 40,
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
