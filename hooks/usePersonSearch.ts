// hooks/usePersonSearchByKey.ts
import { PersonSearchService, PersonSearchWithGenderService } from '@/services/personSearch'
import { PersonSearchRequest } from '@/types/householdHead'
import { useCallback, useState } from 'react'


export function usePersonSearchByKey() {
    const [results, setResults] = useState<PersonSearchRequest[]>([])
    const search = useCallback(async (query: string, statusFilter?: 'ACTIVE' | 'INACTIVE' | 'ALL') => {
        if (!query) {
            setResults([])
            return
        }
        const service = new PersonSearchService(query, statusFilter)
        const data = await service.execute()
        // Replace results instead of accumulating
        setResults(data)
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
