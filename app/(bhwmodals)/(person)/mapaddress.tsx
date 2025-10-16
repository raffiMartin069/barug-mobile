// app/.../mapaddress.tsx
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedMapAddress from '@/components/ThemedMapAddress'
import ThemedView from '@/components/ThemedView'
import { useLocalSearchParams } from 'expo-router'
import React from 'react'

const MapAddress = () => {
  const params = useLocalSearchParams()
  // Default back to ResidentAddress
  const routeTo = params.returnTo ?? '/residentaddress';

  return (
    <ThemedView safe>
      <ThemedAppBar title='Map sa mapaddress.tsx' showNotif={false} showProfile={false} />
      {/* ThemedMapAddress should navigate ONLY when user confirms selection */}
      <ThemedMapAddress route={routeTo} />
    </ThemedView>
  )
}

export default MapAddress
