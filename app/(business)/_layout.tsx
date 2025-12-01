// app/(business)/_layout.tsx
import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import {
  Platform,
  StyleSheet,
  TouchableNativeFeedback,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'

export default function BusinessLayout() {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme ?? 'light'] ?? Colors.light

  const TabButton = (props: any) => {
    const content = <View style={styles.tabButton}>{props.children}</View>
    return Platform.OS === 'android' ? (
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple((theme.tabIconSelected ?? '#000') + '33', false, 30)}
        useForeground
        onPress={props.onPress}
      >
        {content}
      </TouchableNativeFeedback>
    ) : (
      <TouchableOpacity activeOpacity={0.7} onPress={props.onPress} style={styles.tabButton}>
        {props.children}
      </TouchableOpacity>
    )
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.background, height: 100 },
        tabBarActiveTintColor: theme.tabIconSelected,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarButton: (p) => <TabButton {...p} />,
      }}
    >
      <Tabs.Screen
        name="(tabs)/businesshome"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(tabs)/businesses"
        options={{
          title: 'Businesses',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={20} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="(tabs)/activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="(tabs)/paymenthistory"
        options={{
          title: 'Transaction History',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
