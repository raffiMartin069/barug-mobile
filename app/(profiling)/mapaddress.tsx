import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedMapAddress from '@/components/ThemedMapAddress';
import ThemedView from '@/components/ThemedView';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

type Params = { returnTo?: string };

const MapAddress = () => {
  const { returnTo = '/homeaddress' } = useLocalSearchParams<Params>();
  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Map" showNotif={false} showProfile={false} />
      <ThemedMapAddress route={returnTo} />
    </ThemedView>
  );
};

export default MapAddress;
