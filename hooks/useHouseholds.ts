import { useState, useEffect } from 'react'
import { APICall } from '@/api/api'
import { AuthTokenUtil } from '@/utilities/authTokenUtility'
import { Household } from '@/types/household_search'
import { Alert } from 'react-native'

export const useHouseholds = (searchText: string) => {
    const [households, setHouseholds] = useState<Household[]>([])

    useEffect(() => {
        if (!searchText.trim()) return setHouseholds([])

        const fetchHouseholds = async () => {
            try {
                const token = await AuthTokenUtil.getToken()
                if (!token) {
                    console.warn('Token is not set!');
                    return []
                }
                const res = await APICall.get('/api/v1/residents/households/search/', { q: searchText }, token)
                setHouseholds(res.message.map(h => ({
                    label: h.household_head_name,
                    value: h.household_id
                })))
            } catch (err) {
                console.error("useHousehold Hook - Error fetching households");
                if (err.status === 401) {
                    Alert.alert("Session expired", err.data.error)
                } 
                setHouseholds([]);
            }
        }
        fetchHouseholds()
    }, [searchText])

    return households
}
