import { useState, useEffect } from 'react'
import { AuthTokenUtil } from '@/utilities/authTokenUtility'
import { Household } from '@/types/household_search'
import { Alert } from 'react-native'
import apiClient from '@/api/apiClient'

export const useHouseholds = (searchText: string) => {
    const [households, setHouseholds] = useState<Household[]>([])

    useEffect(() => {
        if (!searchText.trim()) return setHouseholds([])

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
