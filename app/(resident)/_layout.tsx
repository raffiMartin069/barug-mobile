import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StyleSheet, TouchableNativeFeedback, TouchableOpacity, useColorScheme, View } from 'react-native'

const Residentlayout = () => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

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
                  theme.tabIconSelected + '33', // ripple color with alpha
                  false, // not borderless
                  30 // 👈 Ripple radius
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
          name='residenthome'
          options={{title:'Home', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

         <Tabs.Screen
          name='requestdoc'
          options={{title:'Request a Document', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

        <Tabs.Screen
          name='docreqhistory'
          options={{title:'Document Request History', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'newspaper' : 'newspaper-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

        <Tabs.Screen
          name='fileblotterreport'
          options={{title:'File Blotter Report', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

        <Tabs.Screen
          name='blotrpthistory'
          options={{title:'Blotter Report History', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'list' : 'list-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />

        <Tabs.Screen
          name='barangaycases'
          options={{title:'Barangay Cases', tabBarIcon: ({focused}) => (
            <Ionicons
              name={focused ? 'folder-open' : 'folder-open-outline'}
              size={20}
              color={focused ? theme.tabIconSelected : theme.tabIconDefault}
            />
          )}}
        />
      </Tabs>
    </>
  )
}

export default Residentlayout

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})