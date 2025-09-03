// hooks/useRouteGuard.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router, usePathname, useSegments } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../constants/supabase'

const JUST_SET_MPIN = 'just_set_mpin'
const FORCE_SETUP_ONCE = 'force_setup_once'
const LOCAL_MPIN_NOT_SET = 'local_mpin_not_set'
const UNLOCKED_SESSION = 'unlocked_session'

type GuardState = {
  ready: boolean
  authed: boolean
  mpinSet: boolean | null
  session: any
  logoutNow: () => Promise<void>
}

export function useRouteGuard(): GuardState {
  const pathname = usePathname()
  const segments = useSegments() as unknown as string[]
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [mpinSet, setMpinSet] = useState<boolean | null>(null)

  // single-flight redirect to avoid churn
  const lastTargetRef = useRef<string | null>(null)
  const redirectingRef = useRef(false)
  const safeReplace = useCallback((target: string) => {
    if (redirectingRef.current) return
    if (pathname === target || lastTargetRef.current === target) return
    redirectingRef.current = true
    lastTargetRef.current = target
    router.replace(target)
    // release lock on next tick
    setTimeout(() => { redirectingRef.current = false }, 0)
  }, [pathname])

  const fetchMe = useCallback(async () => {
    const { data, error } = await supabase.rpc('me_profile')
    setMpinSet(error ? null : !!data?.mpin_set)
  }, [])

  // session wiring
  useEffect(() => {
    let mounted = true
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(session)
      setAuthed(!!session)
      if (session) await fetchMe()
      setReady(true)
    }
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return
      setSession(s)
      setAuthed(!!s)
      if (s) await fetchMe()
      else setMpinSet(null)
    })
    init()
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [fetchMe])

  // computed route info
  const inAuth = useMemo(() => segments?.[0] === '(auth)', [segments])
  const leaf = useMemo(() => {
    const parts = (pathname || '').split('?')[0].split('#')[0].split('/').filter(Boolean)
    return parts[parts.length - 1] || ''
  }, [pathname])

  const unauthAllowed = useMemo(
    () => new Set(['phone', 'verify', 'email-verify', 'forgot-mpin']),
    []
  )
  const authAllowedWhenLocked = useMemo(
    () => new Set(['enter-mpin', 'forgot-mpin', 'change-mpin', 'setup-mpin']),
    []
  )

  // main guard
  useEffect(() => {
    if (!ready) return

    // 1) No session → restrict to auth + allowed leaves
    if (!authed) {
      if (!inAuth || !unauthAllowed.has(leaf)) {
        safeReplace('/(auth)/phone')
      }
      return
    }

    // 2) Just forced to setup after a reset
    (async () => {
      const forceSetup = await AsyncStorage.getItem(FORCE_SETUP_ONCE)
      if (forceSetup) {
        await AsyncStorage.removeItem(FORCE_SETUP_ONCE)
        if (!inAuth || leaf !== 'setup-mpin') safeReplace('/(auth)/setup-mpin')
        return
      }

      // 3) Unknown mpin state → fetch & hold (no redirects)
      if (mpinSet === null) {
        await fetchMe()
        return
      }

      const [localNotSet, justSet, unlocked] = await Promise.all([
        AsyncStorage.getItem(LOCAL_MPIN_NOT_SET),
        AsyncStorage.getItem(JUST_SET_MPIN),
        AsyncStorage.getItem(UNLOCKED_SESSION),
      ])

      if (justSet) {
        // Let state settle once after setting MPIN
        await AsyncStorage.removeItem(JUST_SET_MPIN)
        return
      }

      // 4) MPIN not set (server or local) → force setup
      if (mpinSet === false || localNotSet) {
        if (!(inAuth && leaf === 'setup-mpin')) safeReplace('/(auth)/setup-mpin')
        return
      }

      // 5) MPIN set but session not unlocked → require enter-mpin
      if (mpinSet === true && !unlocked) {
        const onAllowedAuth = inAuth && authAllowedWhenLocked.has(leaf)
        if (!onAllowedAuth) safeReplace('/(auth)/enter-mpin')
        return
      }

      // 6) Unlocked & inside auth → send to app
      if (mpinSet === true && unlocked && inAuth) {
        safeReplace('/(resident)/(tabs)/residenthome')
        return
      }
      // else: already in the app; proceed silently
    })()
  }, [ready, authed, mpinSet, inAuth, leaf, safeReplace, fetchMe, unauthAllowed, authAllowedWhenLocked])

  const logoutNow = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(UNLOCKED_SESSION)
      await supabase.auth.signOut()
    } finally {
      safeReplace('/(auth)/phone')
    }
  }, [safeReplace])

  return { ready, authed, mpinSet, session, logoutNow }
}
