// hooks/usePersonSearchByKey.ts
import { PersonSearchService, PersonSearchWithGenderService } from '@/services/personSearch'
import { PersonSearchRequest } from '@/types/householdHead'
import { useCallback, useState } from 'react'


export function usePersonSearchByKey() {
    const [results, setResults] = useState<PersonSearchRequest[]>([])
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

export function usePersonSearchWithGender() {
    const [results, setResults] = useState<PersonSearchRequest[]>([])
    const search = useCallback(async (query: string) => {
        if (!query) {
            setResults([])
            return
        }
        const service = new PersonSearchWithGenderService(query)
        const data = await service.execute()
        setResults(data)
    }, [])
    return { results, search }
}
