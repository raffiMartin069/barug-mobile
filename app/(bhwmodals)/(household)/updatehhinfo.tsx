import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { houseOwnership } from '@/constants/houseOwnership'
import { houseType } from '@/constants/houseType'
import { HouseholdException } from '@/exception/HouseholdException'
import { useNiceModal } from '@/hooks/NiceModalProvider'
import { HouseholdCommand } from '@/repository/commands/HouseholdCommand'
import { HouseholdRepository } from '@/repository/householdRepository'
import { HouseholdService } from '@/services/HouseholdService'
import { useGeolocationStore } from '@/store/geolocationStore'
import { useAccountRole } from '@/store/useAccountRole'
import { useBasicHouseholdInfoStore } from '@/store/useBasicHouseholdInfoStore'
import { useDynamicRouteStore } from '@/store/useDynamicRouteStore'
import { HouseholdUpdateType } from '@/types/request/householdUpdateType'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

const UpdateHhInfo = () => {
  const router = useRouter()
  const params = useLocalSearchParams<{
    id?: string
    householdNum?: string
    householdHeadName?: string
    address?: string
    houseType?: string
    houseOwnership?: string
  }>()

  // Context / read-only (we use `houseHoldNumber` and `houseHead` from the store below)

  // Editable fields (prefill from params if provided)
  const [hAddress, setHAddress] = useState(params.address ?? '')
  const [housetype, setHouseType] = useState<string>(params.houseType ?? '')
  const [houseownership, setHouseOwnership] = useState<string>(params.houseOwnership ?? '')

  const houseHoldNumber = useBasicHouseholdInfoStore((state) => state.householdNumber);
  const houseHead = useBasicHouseholdInfoStore((state) => state.householdHead);

  const setReturnPath = useDynamicRouteStore((state) => state.setReturnTo);

  const getFullAddress = useGeolocationStore((state) => state.getFullAddress);

  const profile = useAccountRole((s) => s.getProfile('resident'))
  const addedById = profile?.person_id ?? useAccountRole.getState().staffId ?? null

  const street = useGeolocationStore((state) => state.street);
  const barangay = useGeolocationStore((state) => state.barangay);
  const city = useGeolocationStore((state) => state.city);
  const lat = useGeolocationStore((state) => state.lat);
  const lng = useGeolocationStore((state) => state.lng);
  const sitio = useGeolocationStore((state) => state.purokSitio);
  const purokSitioCode = useGeolocationStore((state) => state.purokSitioCode);

  const setStreet = useGeolocationStore((state) => state.setStreet);
  const setBarangay = useGeolocationStore((state) => state.setBarangay);
  const setCity = useGeolocationStore((state) => state.setCity);
  const setLat = useGeolocationStore((state) => state.setLat);
  const setLng = useGeolocationStore((state) => state.setLng);
  const setPurokSitio = useGeolocationStore((state) => state.setPurokSitio);
  const setPurokSitioCode = useGeolocationStore((state) => state.setPurokSitioCode);

  useEffect(() => {
    let mounted = true
    const loadHouseholdDetails = async () => {
      if (!houseHoldNumber) return

      // If the geolocation store already has values (user returned from map), don't overwrite
      if (street || barangay || city || sitio) {
        const existing = getFullAddress()
        if (existing) setHAddress(existing)
        return
      }

      const household_cmd = new HouseholdCommand()
      const details = await household_cmd.FetchActiveHouseholdByHouseholdNumber(houseHoldNumber)
      if (!mounted || !details) return

      setStreet(details.addresss.street ?? '')
      setBarangay(details.addresss.barangay ?? '')
      setCity(details.addresss.city ?? '')
      setLat(details.addresss.latitude ?? '')
      setLng(details.addresss.longitude ?? '')
      setPurokSitio(details.addresss.purok_sitio.purok_sitio_name ?? '')
      setPurokSitioCode(details.addresss.purok_sitio.purok_sitio_code ?? '')

      const addrParts = [
        details.household_num,
        details.addresss.street,
        details.addresss.purok_sitio?.purok_sitio_name,
        details.addresss.barangay,
        details.addresss.city,
      ].filter(Boolean)
      const composed = addrParts.join(', ')

      // Only set hAddress if store doesn't already have a full address
      if (!getFullAddress()) setHAddress(composed)
    }

    loadHouseholdDetails()
    return () => { mounted = false }
  }, [houseHoldNumber, street, barangay, city, sitio, getFullAddress, setStreet, setBarangay, setCity, setLat, setLng, setPurokSitio, setPurokSitioCode])



  const householdService = new HouseholdService(new HouseholdRepository());
  const { showModal } = useNiceModal()

  // Using shared `houseType` and `houseOwnership` constants for dropdowns

  const handleHomeAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: { returnTo: '/homeaddress' }, // keep your existing flow
    })
  }

  // Keep `hAddress` updated when the user picks an address on the map
  useEffect(() => {
    const full = getFullAddress()
    if (full) setHAddress(full)
  }, [street, barangay, city, sitio, purokSitioCode, getFullAddress])

  const canSubmit = !!hAddress && !!housetype && !!houseownership

  const onSubmit = () => {
    if (!canSubmit) return

    const updateInfo = async () => {
      try {
        const updateRequest: HouseholdUpdateType = {
          p_performed_by: parseInt(addedById ?? '1'),
          p_household_id: houseHoldNumber ? parseInt(houseHoldNumber) : 0,
          p_reason: "N/A",
          p_house_type_id: parseInt(housetype),
          p_house_ownership_id: parseInt(houseownership),
          p_city: city,
          p_barangay: barangay,
          p_street: street,
          p_purok_sitio_name: sitio,
          p_latitude: lat,
          p_longitude: lng,
        };
        const result = await householdService.ExecuteUpdateHouseholdInformation(updateRequest);

        if (!result) {
          showModal({ title: 'Error', message: 'Failed to update household information. Please try again.', variant: 'error', primaryText: 'OK' })
          return;
        }

        showModal({ title: 'Success', message: 'Household information updated successfully.', variant: 'success', primaryText: 'OK', onPrimary: () => {
          router.push({ pathname: '/designation' })
        } })

        // clear the store values after successful update
        setStreet('');
        setBarangay('');
        setCity('');
        setLat(null);
        setLng(null);
        setPurokSitio('');
        setPurokSitioCode('');

      } catch (error) {
        if (!(error instanceof HouseholdException)) {
          console.error("Unexpected error:", error);
          showModal({ title: 'Error', message: 'An unexpected error occurred. Please try again.', variant: 'error', primaryText: 'OK' })
          return;
        }
        showModal({ title: 'Error', message: String(error?.message ?? 'An error occurred'), variant: 'error', primaryText: 'OK' })
        return;
      }
    }
    updateInfo();
  }

  return (
    <ThemedView safe>
      <ThemedAppBar
        title="Update Household Information"
        showNotif={true}
        showProfile={true}
      />

      <ThemedKeyboardAwareScrollView>
        <View>
          {/* --- Context: Household Number & Head (text only) --- */}
          <ThemedText style={styles.label}>Household Number</ThemedText>
          <ThemedText style={styles.value}>{houseHoldNumber || '—'}</ThemedText>

          <Spacer height={10} />

          <ThemedText style={styles.label}>Household Head</ThemedText>
          <ThemedText style={styles.value}>{houseHead || '—'}</ThemedText>

          <Spacer height={14} />

          {/* --- Editable fields (same as CreateHousehold minus head picker) --- */}
          <ThemedText style={styles.label}>Home Address</ThemedText>
          <Pressable onPress={() => {
            setReturnPath("/updatehhinfo");
            handleHomeAddress()
          }}>
            <ThemedTextInput
              placeholder="Home Address"
              value={hAddress}
              onChangeText={setHAddress}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          <Spacer height={10} />

          <ThemedDropdown
            items={houseType}
            value={housetype}
            setValue={setHouseType}
            placeholder="House Type"
            order={0}
          />

          <Spacer height={10} />

          <ThemedDropdown
            items={houseOwnership}
            value={houseownership}
            setValue={setHouseOwnership}
            placeholder="House Ownership"
            order={1}
          />

          <Spacer height={15} />

          <ThemedButton disabled={!canSubmit} onPress={() => showModal({
            title: 'Update Household Information',
            message: 'Are you sure you want to save these changes?',
            variant: 'info',
            primaryText: 'Save',
            secondaryText: 'Cancel',
            onPrimary: () => { onSubmit() },
          })} label={undefined}>
            <ThemedText btn>Save Changes</ThemedText>
          </ThemedButton>

        </View>

      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default UpdateHhInfo

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
})
