<<<<<<< HEAD
=======
// app/.../mapaddress.tsx
>>>>>>> origin/develop
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedMapAddress from '@/components/ThemedMapAddress'
import ThemedView from '@/components/ThemedView'
import { useSearchParams } from 'expo-router/build/hooks'
import React from 'react'

const MapAddress = () => {
  const params = useSearchParams()
<<<<<<< HEAD
  const routeTo = params.get('returnTo') || '/homeaddress'

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
          title='Map'
          showNotif={false}
          showProfile={false}
        />
        <ThemedMapAddress
            route={routeTo}
        />
=======
  // Default back to ResidentAddress
  const routeTo = params.get('returnTo') ?? '/residentaddress'

  return (
    <ThemedView safe>
      <ThemedAppBar title='Map sa mapaddress.tsx' showNotif={false} showProfile={false} />
      {/* ThemedMapAddress should navigate ONLY when user confirms selection */}
      <ThemedMapAddress route={routeTo} />
>>>>>>> origin/develop
    </ThemedView>
  )
}

<<<<<<< HEAD
export default MapAddress
=======
export default MapAddress
>>>>>>> origin/develop
