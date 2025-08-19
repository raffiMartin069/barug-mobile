import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(profiling)'/>
      <Stack.Screen name='(auth)'/>
    </Stack>
  )
}
