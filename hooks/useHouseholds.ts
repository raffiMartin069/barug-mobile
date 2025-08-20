// hooks/useHouseholds.ts
import { useState, useEffect } from 'react'
import { APICall } from '@/api/api'
import { AuthTokenUtil } from '@/utilities/authTokenUtility'
import { Household } from '@/types/household_search'

export const useHouseholds = (searchText: string) => {
    const [households, setHouseholds] = useState<Household[]>([])

    useEffect(() => {
        if (!searchText.trim()) return setHouseholds([])

        const fetchHouseholds = async () => {
            try {
                const token = await AuthTokenUtil.getToken()
                if (!token) throw new Error("No auth token")
                const res = await APICall.get('/api/v1/residents/households/search/', { q: searchText }, token)
                setHouseholds(res.message.map(h => ({
                    label: h.household_head_name,
                    value: h.household_id
                })))
            } catch (err) {
                if (err?.response?.data?.status === 401) {
                    throw err;
                }
                console.error(err)
                setHouseholds([])
            }
        }
        fetchHouseholds()
    }, [searchText])

    return households
}
