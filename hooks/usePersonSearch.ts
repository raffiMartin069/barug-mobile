// hooks/usePersonSearchByKey.ts
import { useState, useCallback } from 'react'
import { PersonSearchService } from '@/services/personSearch'
import { HouseholdHead } from '@/types/householdHead'


export function usePersonSearchByKey() {
    const [results, setResults] = useState<HouseholdHead[]>([])
    const search = useCallback(async (query: string) => {
        if (!query) return
        const service = new PersonSearchService(query)
        const data = await service.execute()
        setResults((prev) => {
            const ids = new Set(prev.map((p) => p.person_id))
            const newItems = data.filter((p) => !ids.has(p.person_id))
            return [...prev, ...newItems]
        })
    }, [])
    return { results, search }
}
