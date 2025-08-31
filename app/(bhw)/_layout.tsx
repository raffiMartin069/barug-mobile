import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import React from 'react'
import { Platform, StyleSheet, TouchableNativeFeedback, TouchableOpacity, useColorScheme, View } from 'react-native'

const BhwLayout = () => {
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
                name='(tabs)/bhwhome'
                options={{title: 'Home', tabBarIcon: ({focused}) => (
                    <Ionicons
                    name={focused ? 'home' : 'home-outline'}
                    size={20}
                    color={focused ? theme.tabIconSelected : theme.tabIconDefault}
                    />
                )}}
            />

            <Tabs.Screen
                name='(tabs)/profiling'
                options={{title: 'Profiling', tabBarIcon: ({focused}) => (
                    <Ionicons
                    name={focused ? 'people' : 'people-outline'}
                    size={20}
                    color={focused ? theme.tabIconSelected : theme.tabIconDefault}
                    />
                )}}
            />

        </Tabs>
    </>
  )
}

export default BhwLayout

const styles = StyleSheet.create({
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
})