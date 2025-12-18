import { DEV_SKIP_SESSION } from '@/constants/dev'
import { useAccountRole } from '@/store/useAccountRole'
import React, { createContext, useCallback, useContext, useState } from 'react'

type Profile = any

type SessionContextValue = {
    profile: Profile | null
    isLoading: boolean
    error: string | null
    ensureLoaded: (role?: string) => Promise<Profile | null>
    getProfile: (role?: string) => Profile | null
    isDevBypass: () => boolean
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

export function SessionProvider({ children, initialProfile }: { children: React.ReactNode; initialProfile?: Profile }) {
    const account = useAccountRole((s) => s)
    const [profile, setProfile] = useState<Profile | null>(initialProfile ?? (account.getProfile ? account.getProfile(account.currentRole ?? 'resident') : null))
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const ensureLoaded = useCallback(async (role?: string) => {
        // Use account store to load profile if available.
        try {
            setIsLoading(true)
            const details = await account.ensureLoaded((role ?? account.currentRole ?? 'resident') as any)
            const p = details ?? null
            setProfile(p)
            setIsLoading(false)
            return p
        } catch (err: any) {
            setError(err?.message ? String(err.message) : 'Failed to load profile')
            setIsLoading(false)
            return null
        }
    }, [account])

    const getProfile = useCallback((role?: string) => {
        return account.getProfile ? account.getProfile((role ?? account.currentRole ?? 'resident') as any) : profile
    }, [account, profile])

    const isDevBypass = useCallback(() => Boolean(DEV_SKIP_SESSION), [])

    const value: SessionContextValue = {
        profile,
        isLoading,
        error,
        ensureLoaded,
        getProfile,
        isDevBypass,
    }

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
    const ctx = useContext(SessionContext)
    const account = useAccountRole((s) => s)
    // If a provider exists, return it. Otherwise, provide a lightweight fallback backed by useAccountRole.
    if (ctx) return ctx

    return {
        profile: account.getProfile ? account.getProfile(account.currentRole ?? 'resident') : null,
        isLoading: false,
        error: null,
        ensureLoaded: async (role?: string) => {
            try {
                const details = await account.ensureLoaded((role ?? account.currentRole ?? 'resident') as any)
                return details ?? null
            } catch {
                return null
            }
        },
    getProfile: (role?: string) => (account.getProfile ? account.getProfile((role ?? account.currentRole ?? 'resident') as any) : null),
        isDevBypass: () => Boolean(DEV_SKIP_SESSION),
    }
}

export default SessionProvider
