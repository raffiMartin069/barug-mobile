import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useAccountRole } from '@/store/useAccountRole'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

const Settings = () => {
  const router = useRouter()
  const { getProfile, currentRole } = useAccountRole()
  const profile = getProfile('resident')
  
  const settingsData = useMemo(() => {
    const sections = [
      {
        title: 'My Account',
        options: [
          { label: 'My Profile', route: '/residentprofile' },
          { label: 'Change MPIN', route: '/change-mpin' },
        ],
      },
    ]
    
    // Only show Business section if user is a business owner AND using business role
    if (profile?.is_business_owner && currentRole === 'business') {
      sections.push({
        title: 'Business',
        options: [
          { label: 'Profile', route: '/residentprofile' },
        ],
      })
    }
    
    sections.push({
      title: 'Support',
      options: [
        { label: 'Help Center', route: '/help-center' },
        { label: 'About', route: '/about' },
      ],
    })
    
    return sections
  }, [profile, currentRole])
  return (
    <ThemedView safe>
      <ThemedAppBar title="Account Settings" />
      <ThemedKeyboardAwareScrollView>
        {settingsData.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <ThemedText subtitle={true} style={styles.sectionTitle}>{section.title}</ThemedText>
            {section.options.map((item, index) => (
              <Pressable
                key={index}
                style={styles.itemRow}
                onPress={() => {router.push(item.route)}}
              >
                <ThemedText style={styles.itemLabel}>{item.label}</ThemedText>
                <Ionicons name="chevron-forward" size={20} />
              </Pressable>
            ))}
          </View>
        ))}

        <ThemedButton submit={false}>
          <ThemedText non_btn={true}>Logout</ThemedText>
        </ThemedButton>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default Settings

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  itemLabel: {
    fontSize: 16,
  },
})
