import { useState, useEffect } from 'react'
import { AuthTokenUtil } from '@/utilities/authTokenUtility'
import { Household } from '@/types/household_search'
import { Alert } from 'react-native'
import apiClient from '@/api/apiClient'

export const useHouseholds = (searchText: string) => {
    const [households, setHouseholds] = useState<Household[]>([])

    useEffect(() => {
        if (!searchText.trim()) return setHouseholds([])
        /**
       * If something goes wrong when joining a family, is it because of this logic.
       * Currently I am unable to test the new JWT because it was not yet pushed in the 
       * servers develop branch. Once it will be available then I will be able to check
       * of how this endpoint behaves especially when handling JWT.
       *
       * I will leave this for now and revisit it later once the new JWT is available for testing.
       */
        const fetchHouseholds = async () => {
            try {
                const res = await apiClient.get('/v1/residents/households/search/', { params: { q: searchText } });
                setHouseholds(res.data.message.map((h: any) => ({
                    label: h.household_head_name,
                    value: h.household_id,
                })))

            } catch (err) {
                console.error("useHousehold Hook - Error fetching households");
                if (err.response?.status === 401) {
                    Alert.alert("Session expired", err.response.data?.error || 'Please log in again.')
                }

                setHouseholds([]);
            }
        }
        fetchHouseholds()
    }, [searchText])
    return households
}
