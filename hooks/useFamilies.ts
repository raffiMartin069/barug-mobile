import { APICall } from "@/api/api"
import { Family } from "@/types/family_search"
import { AuthTokenUtil } from "@/utilities/authTokenUtility"
import { useState, useEffect } from "react"

// hooks/useFamilies.ts
export const useFamilies = (householdId: string) => {
    const [families, setFamilies] = useState<Family[]>([])

    useEffect(() => {
        if (!householdId) return setFamilies([])

        const fetchFamilies = async () => {
            try {
                const token = await AuthTokenUtil.getToken()
                if (!token) throw new Error("No auth token")
                const res = await APICall.get('/api/v1/residents/fetch/families/', { q: householdId }, token)
                setFamilies(res.message.family_data.map(f => ({
                    label: `${f.person.first_name} ${f.person.middle_name ?? ''} ${f.person.last_name}`,
                    value: f.family_id
                })))
            } catch (err) {
                console.error(err)
                setFamilies([])
            }
        }

        fetchFamilies()
    }, [householdId])

    return families
}
