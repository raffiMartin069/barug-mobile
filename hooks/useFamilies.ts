import apiClient from "@/api/apiClient"
import { Family } from "@/types/family_search"
import { useState, useEffect } from "react"

export const useFamilies = (householdId: string) => {
    const [families, setFamilies] = useState<Family[]>([])

    useEffect(() => {
        if (!householdId) return setFamilies([])
        /**
         * If something goes wrong when joining a family, is it because of this logic.
         * Currently I am unable to test the new JWT because it was not yet pushed in the 
         * servers develop branch. Once it will be available then I will be able to check
         * of how this endpoint behaves especially when handling JWT.
         *
         * I will leave this for now and revisit it later once the new JWT is available for testing.
         */
        const fetchFamilies = async () => {
            try {
                const res = await apiClient.get('/v1/residents/fetch/families/', { params: { q: householdId } })
                const familyData = res.data?.family_data ?? []
                setFamilies(familyData.map(f => ({
                    label: `${f.person.first_name} ${f.person.middle_name ?? ''} ${f.person.last_name}`,
                    value: f.family_id
                })))
            } catch (err) {
                console.error("useFamilies Hook - Error fetching families:", err.response?.data || err.message)
                setFamilies([]);
            }
        }
        fetchFamilies()
    }, [householdId])
    return families
}
