import { Stack } from 'expo-router'
import React from 'react'

const _layout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
        {/* <Stack.Screen name='personalinfo'/> */}
        <Stack.Screen name='joinhousefam'/>
    </Stack>
  )
}

export default _layout