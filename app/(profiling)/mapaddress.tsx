import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedMapAddress from '@/components/ThemedMapAddress'
import ThemedView from '@/components/ThemedView'
import { useSearchParams } from 'expo-router/build/hooks'
import React from 'react'

const MapAddress = () => {
  const params = useSearchParams()
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
    </ThemedView>
  )
}

export default MapAddress