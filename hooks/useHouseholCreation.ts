import { MembershipException } from '@/exception/membershipExcption'
import { HouseholdCreation as Repo } from '@/repository/householCreation'
import { HouseholdCreationService } from '@/services/householdCreation'
import { useGeolocationStore } from '@/store/geolocationStore'
import { useHouseholdCreationStore } from '@/store/householdCreationStore'
import { GeolocationType } from '@/types/geolocation'
import { HouseholdCreation } from '@/types/householdCreation'
import { HouseholdCreationRequest } from '@/types/request/householdCreationRequest'
import { Alert } from 'react-native'

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
            if (err instanceof MembershipException) {
                Alert.alert('Information', err.message)
                return;
            }
            console.error(err)
            return;
        }
    }
    return { saveHousehold }
}
