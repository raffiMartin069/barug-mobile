import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'

const ThemedAppBar = ({style = null, title = '', unreadCount = 0, showBack = true, showNotif = true, showProfile = true, showSettings = false, ...props}) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const navigation = useNavigation()
  const router = useRouter()

  return (
    <View style={[styles.container, {backgroundColor: theme.link}, style]}>
      {showBack && (
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name='arrow-back' size={20} color={theme.background}/>
          </TouchableOpacity>
        </View>
      )}
      <Text style={[styles.title, {color: theme.background}, !showBack && styles.leftSection]}>{title}</Text>
      
      <View style={styles.rightSection}>
        {showNotif && (
          <TouchableOpacity onPress={() => router.push('/notifications')}>
              <Ionicons name='notifications' size={20} color={theme.background}/>
              {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
  
        {showProfile && (
          <TouchableOpacity onPress={() => router.push('/residentprofile')}>
              <Ionicons name='person' size={20} color={theme.background}/>
          </TouchableOpacity>
        )}

        {showSettings && (
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name='settings-outline' size={20} color={theme.background}/>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default ThemedAppBar

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
})