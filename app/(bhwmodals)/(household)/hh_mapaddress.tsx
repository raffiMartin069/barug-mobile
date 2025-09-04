// app/.../mapaddress.tsx
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedMapAddress from '@/components/ThemedMapAddress'
import ThemedView from '@/components/ThemedView'
import { useSearchParams } from 'expo-router/build/hooks'
import React from 'react'

const MapAddress = () => {
  const params = useSearchParams()
  // Default back to ResidentAddress
  const routeTo = params.get('returnTo') ?? '/homeaddress'

  return (
    <ThemedView safe>
      <ThemedAppBar title='Map sa hh_mapaddress.tsx' showNotif={false} showProfile={false} />
      {/* ThemedMapAddress should navigate ONLY when user confirms selection */}
      <ThemedMapAddress route={routeTo} />
    </ThemedView>
  )
}

export default MapAddress
