import { DEV_SKIP_SESSION } from '@/constants/dev'
import { useSession } from '@/providers/SessionProvider'
import { MaternalService } from '@/services/MaternalService'
import {
    ChildHealthRecord,
    MaternalRecordBundle,
    MaternalScheduleGroup,
    PostpartumSchedule,
    PrenatalSchedule,
    TrimesterTrackerItem,
} from '@/types/maternal'
import { useCallback, useEffect, useMemo, useState } from 'react'

type ScheduleGroup = MaternalScheduleGroup<PostpartumSchedule | PrenatalSchedule>

const emptyScheduleGroup: ScheduleGroup = { latest: null, history: [] }

function useMaternalTracker(initialPersonIdFromProfile?: number) {
    const session = useSession()
    const role = 'resident'
    const cachedProfile: any = session.getProfile ? session.getProfile(role) : null
    const ensureLoaded = session.ensureLoaded
    const initialFromCache = initialPersonIdFromProfile ?? Number(cachedProfile?.person_id ?? cachedProfile?.details?.person_id ?? 0)

    const [personId, setPersonId] = useState<number>(initialFromCache || (DEV_SKIP_SESSION ? 177 : 0))
    const [loading, setLoading] = useState<boolean>(true)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [postpartum, setPostpartum] = useState<ScheduleGroup>(emptyScheduleGroup)
    const [prenatal, setPrenatal] = useState<ScheduleGroup>(emptyScheduleGroup)
    const [records, setRecords] = useState<MaternalRecordBundle[]>([])
    const [childRecords, setChildRecords] = useState<ChildHealthRecord[]>([])
    const [selectedChild, setSelectedChild] = useState<ChildHealthRecord | null>(null)
    const [childModalVisible, setChildModalVisible] = useState<boolean>(false)
    const [childTab, setChildTab] = useState<'overview' | 'immunizations' | 'monitoring'>('overview')
    const [latestTracker, setLatestTracker] = useState<TrimesterTrackerItem[]>([])
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false)
    const [expandedRecords, setExpandedRecords] = useState<Set<number>>(() => new Set())

    // Pagination
    const PAGE_SIZE = 3
    const [currentPage, setCurrentPage] = useState<number>(1)

    useEffect(() => {
        if (initialFromCache && initialFromCache !== personId) {
            setPersonId(initialFromCache)
        }
    }, [initialFromCache, personId])

    const service = useMemo(() => new MaternalService(), [])

    useEffect(() => {
        if (personId) return

        let cancelled = false
        ;(async () => {
            try {
                const details: any = await ensureLoaded('resident')
                if (cancelled) return
                const id = Number(details?.person_id ?? details?.details?.person_id ?? 0)
                if (id) setPersonId(id)
                else {
                    setError('Profile does not have a linked person record.')
                    setLoading(false)
                }
            } catch {
                if (cancelled) return
                setError('Unable to load profile information.')
                setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [ensureLoaded, personId])

    const fetchAll = useCallback(
        async (mode: 'initial' | 'refresh' = 'initial') => {
            if (!personId) return
            if (mode === 'refresh') setRefreshing(true)
            else setLoading(true)
            setError(null)
            try {
                const bundle = await service.fetchAllForPerson(personId)
                setPostpartum(bundle.postpartum)
                setPrenatal(bundle.prenatal)
                setRecords(bundle.records)
                setLatestTracker(bundle.latestTracker ?? [])
                setChildRecords((bundle as any).childRecords ?? [])
            } catch (err: any) {
                const message = err?.message ? String(err.message) : 'Failed to load maternal data.'
                setError(message)
            } finally {
                if (mode === 'refresh') setRefreshing(false)
                else setLoading(false)
            }
        },
        [personId, service]
    )

    useEffect(() => {
        if (!personId) return
        let cancelled = false
        ;(async () => {
            await fetchAll('initial')
            if (cancelled) return
        })()
        return () => {
            cancelled = true
        }
    }, [personId, fetchAll])

    useEffect(() => setCurrentPage(1), [records])

    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return records.slice(start, start + PAGE_SIZE)
    }, [records, currentPage])

    const toggleRecord = useCallback((recordId: number) => {
        setExpandedRecords((prev) => {
            const next = new Set(prev)
            if (next.has(recordId)) next.delete(recordId)
            else next.add(recordId)
            return next
        })
    }, [])

    const onRefresh = useCallback(() => {
        fetchAll('refresh')
    }, [fetchAll])

    return {
        personId,
        setPersonId,
        loading,
        refreshing,
        error,
        postpartum,
        prenatal,
        records,
        childRecords,
        selectedChild,
        setSelectedChild,
        childModalVisible,
        setChildModalVisible,
        childTab,
        setChildTab,
        latestTracker,
        detailModalVisible,
        setDetailModalVisible,
        expandedRecords,
        toggleRecord,
        PAGE_SIZE,
        currentPage,
        setCurrentPage,
        paginatedRecords,
        fetchAll,
        onRefresh,
    }
}

export default useMaternalTracker
