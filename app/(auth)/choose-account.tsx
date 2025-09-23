// app/(auth)/choose-account.tsx
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useAccountRole } from '@/store/useAccountRole'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'

const COLORS = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#4d0602ff',
}

type Option = {
  label: string
  type: 'resident' | 'business' | 'staff'
  subtitle?: string
  icon: keyof typeof Ionicons.glyphMap
}

export default function ChooseAccount() {
  const router = useRouter()
  const store = useAccountRole()

  const cached = store.getProfile('resident')
  const [details, setDetails] = useState<any | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached)

  // Ensure we have a fresh resident profile (store handles TTL)
  useEffect(() => {
    let live = true
      ; (async () => {
        try {
          const fresh = await store.ensureLoaded('resident')
          if (!live) return
          if (fresh) setDetails(fresh)

          // If we learned staff_id here and store doesn't have it yet, set it
          if (fresh?.is_staff && fresh?.staff_id && store.staffId !== fresh.staff_id) {
            store.setStaff(fresh.staff_id)
            // But keep currentRole resident to start
            store.setResident()
          }

          // Debug: show persisted role-store snapshot
          try {
            const raw = await AsyncStorage.getItem('role-store-v1')
            // if (raw) console.log('[ChooseAccount] role-store-v1:', JSON.parse(raw))
          } catch { }
        } finally {
          if (live) setLoading(false)
        }
      })()
    return () => { live = false }
  }, [store])

  const fullName = useMemo(() => {
    if (!details) return undefined
    const parts = [details.first_name, details.middle_name, details.last_name, details.suffix]
      .filter(Boolean)
      .join(' ')
    return parts || undefined
  }, [details])

  const options: Option[] = useMemo(() => {
    const list: Option[] = []

    if (details?.person_id) {
      list.push({
        label: 'Login as Resident',
        type: 'resident',
        subtitle: fullName,
        icon: 'person',
      })
    }

    if (details?.is_business_owner) {
      list.push({
        label: 'Login as Business Owner',
        type: 'business',
        subtitle: 'Manage your business profile',
        icon: 'briefcase',
      })
    }

    if ((details?.is_staff && (details?.staff_id || store.staffId))) {
      list.push({
        label: 'Login as Staff',
        type: 'staff',
        subtitle: `Staff ID: ${details?.staff_id ?? store.staffId}`,
        icon: 'shield-checkmark',
      })
    }

    return list
  }, [details, fullName, store.staffId])

  // Auto-forward if only one role
  useEffect(() => {
    if (!loading && options.length === 1) {
      handleChoose(options[0].type)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, options.length])

  const handleChoose = (type: Option['type']) => {
    if (type === 'resident') {
      store.setResident()
      return router.replace('/(resident)/(tabs)/residenthome')
    }
    if (type === 'business') {
      // ✅ set the correct role
      store.setBusiness()
      // Point this to your business owner home (adjust path to your routes)
      return router.replace('/(business)/(tabs)/businesshome')
    }
    if (type === 'staff') {
      const sid = details?.staff_id ?? store.staffId
      if (sid) {
        store.setStaff(sid)
        return router.replace('/(bhw)/(tabs)/bhwhome')
      }
    }
  }

  if (loading) {
    return (
      <ThemedView safe style={[styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
        <ThemedText style={{ marginTop: 10, color: COLORS.text }}>
          Loading profile…
        </ThemedText>
      </ThemedView>
    )
  }

  return (
    <ThemedView safe style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View style={styles.cardContainer}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Image
              source={require('@/assets/images/icon-.png')}
              style={{ width: '100%', height: 70, alignSelf: 'center' }}
              resizeMode="contain"
            />
            <ThemedText style={[styles.title, { color: COLORS.text }]}>
              Choose Account
            </ThemedText>
            <ThemedText style={[styles.subtitleHeader, { color: COLORS.muted }]}>
              Continue as one of your linked roles
            </ThemedText>
          </View>

          <View style={{ gap: 12 }}>
            {options.map((opt) => (
              <Pressable
                key={opt.type}
                onPress={() => handleChoose(opt.type)}
                android_ripple={{ color: COLORS.border }}
                style={({ pressed }) => [
                  styles.optionCard,
                  {
                    borderColor: COLORS.border,
                    backgroundColor: '#FFFFFF',
                    opacity: pressed ? 0.96 : 1,
                  },
                ]}
              >
                <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: COLORS.primary + '22' }]}>
                    <Ionicons name={opt.icon} size={22} color={COLORS.primary} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.optionLabel, { color: COLORS.text }]}>
                      {opt.label}
                    </ThemedText>
                    {!!opt.subtitle && (
                      <ThemedText style={[styles.optionSubtitle, { color: COLORS.muted }]}>
                        {opt.subtitle}
                      </ThemedText>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                </View>
              </Pressable>
            ))}

            {options.length === 0 && (
              <View style={[styles.empty, { borderColor: COLORS.border, backgroundColor: '#fff' }]}>
                <Ionicons name="information-circle" size={18} color={COLORS.muted} />
                <ThemedText style={[styles.emptyText, { color: COLORS.muted }]}>
                  No account types available for this user.
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitleHeader: { fontSize: 14, textAlign: 'center', marginTop: 4 },
  optionCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  optionSubtitle: { marginTop: 2, fontSize: 12 },
  empty: {
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 13 },
})
