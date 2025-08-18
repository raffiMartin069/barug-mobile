import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedMapAddress from '@/components/ThemedMapAddress';
import ThemedView from '@/components/ThemedView';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

type Params = { returnTo?: string };

const MapAddress2 = () => {
  const { returnTo = '/homeaddress2' } = useLocalSearchParams<Params>();
  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Map 2" showNotif={false} showProfile={false} />
      <ThemedMapAddress route={returnTo} />
    </ThemedView>
  );
};

export default MapAddress2;
