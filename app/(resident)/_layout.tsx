import { Colors } from '@/constants/Colors'
import { useAccountRole } from '@/store/useAccountRole'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StyleSheet, TouchableNativeFeedback, TouchableOpacity, useColorScheme, View } from 'react-native'

const ResidentLayout = () => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const roleStore = useAccountRole()
  const profile = roleStore.getProfile('resident')
  const hasMaternalRecord = profile?.has_maternal_record === true

  const age = React.useMemo(() => {
    if (!profile?.birthdate) return 0
    const today = new Date()
    const birthDate = new Date(profile.birthdate)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }, [profile?.birthdate])

  const [idValidationRequest, setIdValidationRequest] = React.useState<any>(null)

  React.useEffect(() => {
    if (profile?.person_id) {
      const loadIdValidation = async () => {
        try {
          const { supabase } = await import('@/constants/supabase')
          const { data } = await supabase.rpc('get_id_validation_requests')
          const userRequest = data?.find((req: any) => req.requester_person_id === profile.person_id)
          setIdValidationRequest(userRequest || null)
        } catch (error) {
          console.error('[ResidentLayout] Failed to load ID validation:', error)
        }
      }
      loadIdValidation()
    }
  }, [profile?.person_id])

  const isVerified = profile?.is_id_valid === true && idValidationRequest?.latest_status === 'APPROVED'
  const canAccessBlotterAndCases = age >= 18 && isVerified

  return (
    <>
        <Tabs
            screenOptions={{
                headerShown: false,
                    tabBarStyle: {backgroundColor: theme.background, height: 100},
                    tabBarActiveTintColor: theme.tabIconSelected,
                    tabBarInactiveTintColor: theme.tabIconDefault,
                    tabBarButton: (props) => (
                        Platform.OS === 'android' ? (
                        <TouchableNativeFeedback
                            background={TouchableNativeFeedback.Ripple(
                            theme.tabIconSelected + '33',
                            false,
                            30
                            )}
                            useForeground={true}
                            onPress={props.onPress}
                        >
                            <View style={styles.tabButton}>{props.children}</View>
                        </TouchableNativeFeedback>
                        ) : (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={props.onPress}
                            style={styles.tabButton}
                        >
                            {props.children}
                        </TouchableOpacity>
                        )
                    ),
            }}
        >

        <Tabs.Screen
          name='(tabs)/residenthome'
          options={{title:'Home', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

        <Tabs.Screen
          name='(tabs)/docreqhistory'
          options={{title:'Document Request', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'newspaper' : 'newspaper-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

        <Tabs.Screen
          name='(tabs)/blotrpthistory'
          options={{
            title:'Blotter Report',
            href: canAccessBlotterAndCases ? '/(resident)/(tabs)/blotrpthistory' : null,
            tabBarIcon: ({focused}) => (
              <Ionicons
                name={focused ? 'receipt' : 'receipt-outline'}
                size={20}
                color={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />
            )
          }}
        />

        <Tabs.Screen
          name='(tabs)/barangaycases'
          options={{
            title:'Barangay Cases',
            href: canAccessBlotterAndCases ? '/(resident)/(tabs)/barangaycases' : null,
            tabBarIcon: ({focused}) => (
              <Ionicons
                name={focused ? 'folder-open' : 'folder-open-outline'}
                size={20}
                color={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />
            )
          }}
        />

        <Tabs.Screen
          name='(tabs)/maternal_tracker'
          options={{
            title:'Maternal Tracker',
            href: hasMaternalRecord ? '/(resident)/(tabs)/maternal_tracker' : null,
            tabBarIcon: ({focused}) => (
              <Ionicons
                name={focused ? 'medical' : 'medical-outline'}
                size={20}
                color={focused ? theme.tabIconSelected : theme.tabIconDefault}
              />
            )
          }}
        />

        </Tabs>
    </>
  )
}

export default ResidentLayout

const styles = StyleSheet.create({
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})