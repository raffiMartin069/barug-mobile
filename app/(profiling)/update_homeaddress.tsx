import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedButton from '@/components/ThemedButton';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

type AddrParams = { street?: string; brgy?: string; city?: string };

const HomeAddress2 = () => {
  const router = useRouter();
  const { street = '', brgy = '', city = '' } = useLocalSearchParams<AddrParams>();

  const [hnum, setHNum] = useState('');
  const [streetState, setStreet] = useState(street);
  const [puroksitio, setPurokSitio] = useState('');
  const [brgyState, setBrgy] = useState(brgy);
  const [cityState, setCity] = useState(city);

  const submitAddress = () => {
    router.navigate({
      pathname: '/update_profile',
      params: { hnum, street: streetState, puroksitio, brgy: brgyState, city: cityState },
    });
  };

  return (
    <ThemedView safe={true}>
      <ThemedAppBar title="Home Address" showNotif={false} showProfile={false} />
      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedTextInput placeholder="House Number" value={hnum} onChangeText={setHNum} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Street" value={streetState} onChangeText={setStreet} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Purok or Sitio" value={puroksitio} onChangeText={setPurokSitio} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="Barangay" value={brgyState} onChangeText={setBrgy} />
          <Spacer height={10} />
          <ThemedTextInput placeholder="City" value={cityState} onChangeText={setCity} />
        </View>
        <Spacer height={15} />
        <View>
          <ThemedButton onPress={submitAddress}>
            <ThemedText btn={true}>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
};

export default HomeAddress2;

const styles = StyleSheet.create({
  text: { textAlign: 'center' },
});
