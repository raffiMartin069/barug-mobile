import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    View,
    useColorScheme,
} from 'react-native'
import { supabase } from '../../constants/supabase'

// 🎨 Barangay color palette
const COLORS = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#4d0602ff', // deep maroon brand color
}

type Option = {
  label: string
  type: 'resident' | 'business' | 'staff'
  subtitle?: string
  icon: keyof typeof Ionicons.glyphMap
}

export default function ChooseAccount() {
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const scheme = useColorScheme()

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      const { data, error } = await supabase.rpc('me_profile')
      if (error) console.error(error)
      setProfile(data ?? {})
      setLoading(false)
    }
    fetchProfile()
  }, [])

  const options: Option[] = useMemo(() => {
    if (!profile) return []
    const list: Option[] = []

    if (profile.person_id) {
      list.push({
        label: 'Login as Resident',
        type: 'resident',
        subtitle: profile.full_name || undefined,
        icon: 'person',
      })
    }

    if (profile.is_business_owner) {
      list.push({
        label: 'Login as Business Owner',
        type: 'business',
        subtitle: 'Manage your business profile',
        icon: 'briefcase',
      })
    }

    if (profile.staff && Array.isArray(profile.staff) && profile.staff.length > 0) {
      const staffSummary =
        profile.staff.length === 1
          ? `${profile.staff[0].staff_code ?? 'Staff Account'}`
          : `${profile.staff.length} staff accounts`
      list.push({
        label: 'Login as Staff',
        type: 'staff',
        subtitle: staffSummary,
        icon: 'shield-checkmark',
      })
    }

    return list
  }, [profile])

  useEffect(() => {
    if (!loading && options.length === 1) {
      handleChoose(options[0].type)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, options.length])

  const handleChoose = (type: Option['type']) => {
    if (type === 'resident') router.replace('/(resident)/(tabs)/residenthome')
    if (type === 'business') router.replace('/(resident)/(tabs)/residenthome')
    if (type === 'staff') router.replace('/(bhw)/(tabs)/bhwhome')
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
          {/* Header with Logo */}
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

          {/* Account options */}
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
  optionCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
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
