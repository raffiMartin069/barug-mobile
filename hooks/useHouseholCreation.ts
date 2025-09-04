import { Alert } from 'react-native'
import { HouseholdCreation as Repo } from '@/repository/householCreation'
import { HouseholdCreationService } from '@/services/householdCreation'
import { HouseholdCreationRequest } from '@/types/request/householdCreationRequest'
import { useGeolocationStore } from '@/store/geolocationStore'
import { useHouseholdCreationStore } from '@/store/householdCreationStore'
import { GeolocationType } from '@/types/geolocation'
import { HouseholdCreation } from '@/types/householdCreation'

export function useHouseholdCreation() {
    const service = new HouseholdCreationService(new Repo())
    const clearGeolocation = useGeolocationStore((state: GeolocationType) => state.clear)
    const clearHouseholdCreation = useHouseholdCreationStore((state: HouseholdCreation) => state.clear)
    const saveHousehold = async (data: HouseholdCreationRequest) => {
        try {
            const result = await service.execute(data)
            if (!result || result.length === 0) {
                Alert.alert('Unable to process', 'Household creation failed, please try again later.')
                return;
            }
            Alert.alert('Success', `Household created successfully`)
            clearGeolocation()
            clearHouseholdCreation()
            return result;
        } catch (err: any) {
            Alert.alert('Information', `Household creation failed: ${err.message}`)
            return;
        }
    }
    return { saveHousehold }
}
