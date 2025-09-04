import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { useGeolocationStore } from '@/store/geolocationStore'
import { GeolocationType } from '@/types/geolocation'
import { useRouter } from 'expo-router'
import { useSearchParams } from 'expo-router/build/hooks'
import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

const HomeAddress = () => {
  const params = useSearchParams()
  const street = params.get("street") ?? "";
  const brgy = params.get("brgy") ?? "";
  const city = params.get("city") ?? "";
  const lat = params.get("lat") ?? "";
  const lng = params.get("lng") ?? "";
  const sitio = params.get("purok_name") ?? "";
  const sitioCode = params.get("purok_code") ?? "";

  const [hnum, setHNum] = useState('')
  const [streetState, setStreet] = useState(street)
  const [puroksitio, setPurokSitio] = useState(sitio)
  const [brgyState, setBrgy] = useState(brgy)
  const [cityState, setCity] = useState(city)

    const setHouseNumber = useGeolocationStore((state: GeolocationType) => state.setHouseNumber)
    const setHomeStreet = useGeolocationStore((state: GeolocationType) => state.setStreet)
    const setHomeSitio = useGeolocationStore((state: GeolocationType) => state.setPurokSitio)
    const setHomeBarangay = useGeolocationStore((state: GeolocationType) => state.setBarangay)
    const setHomeCity = useGeolocationStore((state: GeolocationType) => state.setCity)
    const setLat = useGeolocationStore((state: GeolocationType) => state.setLat)
    const setLng = useGeolocationStore((state: GeolocationType) => state.setLng)
    const setSitioCode = useGeolocationStore((state: GeolocationType) => state.setPurokSitioCode)

    useEffect(() => {
        setHouseNumber(hnum)
        setHomeStreet(streetState)
        setHomeSitio(puroksitio)
        setHomeBarangay(brgyState)
        setHomeCity(cityState)
        setLat(lat)
        setLng(lng)
        setSitioCode(sitioCode)
    }, [
        hnum, streetState, puroksitio, 
        brgyState, cityState, lat, 
        lng, sitioCode, setHouseNumber, setHomeStreet, 
        setHomeSitio, setHomeBarangay, setHomeCity, 
        setLat, setLng, setSitioCode
    ])

  const router = useRouter()

  const submitAddress = () => {
    router.push({
        pathname: '/createhousehold',
        params: {
            hnum: hnum,
            street: streetState,
            puroksitio: puroksitio,
            brgy: brgyState,
            city: cityState,
        }
    })
  }

  return (
    <ThemedView safe={true}>
        <ThemedAppBar
            title='Home Address'
            showNotif={false}
            showProfile={false}
        />
        <ThemedKeyboardAwareScrollView>
            <View>
                <ThemedTextInput
                    placeholder='House Number BHW'
                    value={hnum}
                    onChangeText={setHNum}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='Street'
                    value={streetState}
                    onChangeText={setStreet}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='Purok or Sitio'
                    value={puroksitio}
                    onChangeText={setPurokSitio}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='Barangay'
                    value={brgyState}
                    onChangeText={setBrgy}
                />
                <Spacer height={10}/>
                <ThemedTextInput
                    placeholder='City'
                    value={cityState}
                    onChangeText={setCity}
                />
            </View>
            <Spacer height={15}/>
            <View>
                <ThemedButton onPress={submitAddress}>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>
            </View>
        </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default HomeAddress

const styles = StyleSheet.create({
    text: {
        textAlign: 'center',
    },
})