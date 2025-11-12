import CenteredModal from '@/components/maternal/CenteredModal'
import CustomDropdown from '@/components/maternal/CustomDropdown'
import MaternalCard from '@/components/maternal/MaternalCard'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { Colors } from '@/constants/Colors'
import type { PostpartumScheduleDisplay } from '@/repository/MaternalRepository'
import { MaternalService } from '@/services/MaternalService'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'

const PostpartumTab = () => {
    const [loading, setLoading] = useState<boolean>(true)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [items, setItems] = useState<PostpartumScheduleDisplay[]>([])
    const [error, setError] = useState<string | null>(null)

    const service = useMemo(() => new MaternalService(), [])
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [sortBy, setSortBy] = useState<'name' | 'earliest' | 'oldest'>('earliest')
    // form state for "Check" action
    const [showCheckForm, setShowCheckForm] = useState(false)
    const [lochial, setLochial] = useState<string>('')
    const [bpSys, setBpSys] = useState<string>('')
    const [bpDia, setBpDia] = useState<string>('')
    const [feedingTypeId, setFeedingTypeId] = useState<number | null>(null)

    const load = useCallback(async () => {
        setError(null)
        try {
            setLoading(true)
            const rows = await service.fetchLatestPendingPostpartumSchedules()
            setItems(rows)
        } catch (err: any) {
            console.error('fetch postpartum', err)
            setError(err?.message ?? String(err))
        } finally {
            setLoading(false)
        }
    }, [service])

    useEffect(() => {
        load()
    }, [load])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            const rows = await service.fetchLatestPendingPostpartumSchedules()
            setItems(rows)
        } catch (err: any) {
            console.error('refresh postpartum', err)
            setError(err?.message ?? String(err))
        } finally {
            setRefreshing(false)
        }
    }, [service])

    const renderEmpty = () => (
        <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyTitle}>No pending postpartum visits</ThemedText>
            <Spacer height={8} />
            <ThemedText style={styles.emptySubtitle}>You are all caught up — no PENDING postpartum schedules found.</ThemedText>
        </ThemedView>
    )

    const [modalVisible, setModalVisible] = useState(false)
    const [selected, setSelected] = useState<PostpartumScheduleDisplay | null>(null)

    const onOpen = (item: PostpartumScheduleDisplay, showCheck = false) => {
        setSelected(item)
        setShowCheckForm(showCheck)
        setModalVisible(true)
    }

    const onClose = () => {
        setModalVisible(false)
        setSelected(null)
        setShowCheckForm(false)
        // clear form
        setLochial('')
        setBpSys('')
        setBpDia('')
        setFeedingTypeId(null)
    }

    const onSaveCheck = useCallback(() => {
        // placeholder for persistence - currently just log and close
        console.log('save check', { lochial, bpSys, bpDia, feedingTypeId, selected })
        // reset and close
        setModalVisible(false)
        setSelected(null)
        setShowCheckForm(false)
        setLochial('')
        setBpSys('')
        setBpDia('')
        setFeedingTypeId(null)
    }, [lochial, bpSys, bpDia, feedingTypeId, selected])

    const renderItem = ({ item }: { item: PostpartumScheduleDisplay }) => {
        // prefer full patient name; repository provides `person_name` when available
        const title = item.person_name ?? `Record #${item.maternal_record_id}`
        const meta1 = item.scheduled_date ? `${item.scheduled_date}${item.scheduled_time ? ` • ${item.scheduled_time}` : ''}` : 'No date'
        const meta2 = item.visit_purpose ?? item.notes ?? ''

        return (
            <View style={{ marginBottom: 10 }}>
                <MaternalCard
                    title={title}
                    meta1={meta1}
                    meta2={meta2}
                    pillLabel={item.status_name ?? (item.status_id ? `#${item.status_id}` : '—')}
                    onPress={() => onOpen(item, false)}
                    onCheck={() => onOpen(item, true)}
                />
            </View>
        )
    }

    const displayedItems = useMemo(() => {
        const q = (searchQuery ?? '').trim().toLowerCase()
        let filtered = items.filter((it) => {
            if (!q) return true
            const name = (it.person_name ?? '').toLowerCase()
            const id = String(it.maternal_record_id ?? '')
            const purpose = (it.visit_purpose ?? it.notes ?? '').toLowerCase()
            return name.includes(q) || id.includes(q) || purpose.includes(q)
        })

        const byDate = (a: PostpartumScheduleDisplay, b: PostpartumScheduleDisplay) => {
            const da = a.scheduled_date ? Date.parse(a.scheduled_date) : 0
            const db = b.scheduled_date ? Date.parse(b.scheduled_date) : 0
            return da - db
        }

        if (sortBy === 'name') {
            filtered = filtered.sort((a, b) => {
                const an = (a.person_name ?? '').toLowerCase()
                const bn = (b.person_name ?? '').toLowerCase()
                return an.localeCompare(bn)
            })
        } else if (sortBy === 'earliest') {
            filtered = filtered.sort(byDate)
        } else if (sortBy === 'oldest') {
            filtered = filtered.sort((a, b) => byDate(b, a))
        }

        return filtered
    }, [items, searchQuery, sortBy])

    return (
        <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
            <ThemedAppBar title="Postpartum" />
            <ThemedView style={styles.container}>
                {/* Search and sort controls */}
                <View style={styles.controlsStack}>
                    <ThemedTextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search name, record # or purpose"
                    />

                    <View style={{ height: 8 }} />

                    <CustomDropdown
                        items={[
                            { label: 'Name (A–Z)', value: 'name' },
                            { label: 'Earliest', value: 'earliest' },
                            { label: 'Newest', value: 'oldest' },
                        ]}
                        value={sortBy}
                        setValue={(v: any) => setSortBy(v)}
                        placeholder="Sort"
                    />
                </View>

                <View style={styles.content}>
                    {loading ? (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : error ? (
                        <ThemedView style={styles.errorBox}>
                            <ThemedText style={styles.errorText}>Error loading data</ThemedText>
                            <Spacer height={6} />
                            <ThemedText style={styles.errorDetails}>{error}</ThemedText>
                        </ThemedView>
                    ) : (
                        <FlatList
                            data={displayedItems}
                            keyExtractor={(i) => String(i.schedule_id)}
                            renderItem={renderItem}
                            ListEmptyComponent={renderEmpty}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                            contentContainerStyle={items.length ? undefined : { flex: 1 }}
                        />
                    )}
                </View>

                {/* Details modal (custom centered modal) */}
                <CenteredModal
                    visible={modalVisible}
                    title={selected?.person_name ?? `Record #${selected?.maternal_record_id ?? ''}`}
                    onClose={onClose}
                    footer={
                        showCheckForm ? (
                            <Pressable onPress={onSaveCheck} style={styles.modalCheckBtn} accessibilityRole="button">
                                <ThemedText style={styles.modalCheckText}>Save Check</ThemedText>
                            </Pressable>
                        ) : null
                    }
                >
                    {/* modal body: details or check form */}
                    {!showCheckForm && (
                        <>
                            <ThemedText style={styles.modalLabel}>Scheduled</ThemedText>
                            <ThemedText style={styles.modalValue}>{selected ? `${selected.scheduled_date ?? '—'}${selected?.scheduled_time ? ` • ${selected.scheduled_time}` : ''}` : '—'}</ThemedText>
                            <Spacer height={8} />
                            <ThemedText style={styles.modalLabel}>Purpose</ThemedText>
                            <ThemedText style={styles.modalValue}>{selected?.visit_purpose ?? selected?.notes ?? '—'}</ThemedText>
                            <Spacer height={8} />
                            <ThemedText style={styles.modalLabel}>Status</ThemedText>
                            <ThemedText style={styles.modalValue}>{selected?.status_name ?? (selected?.status_id ? `#${selected.status_id}` : '—')}</ThemedText>
                        </>
                    )}

                    {showCheckForm && (
                        <View style={{ marginTop: 6 }}>
                            <ThemedText style={{ fontWeight: '700' }}>Lochial discharges</ThemedText>
                            <Spacer height={6} />
                            <ThemedTextInput value={lochial} onChangeText={setLochial} placeholder="Describe lochial discharges" />
                            <Spacer height={8} />

                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={{ fontWeight: '700' }}>BP Systolic</ThemedText>
                                    <Spacer height={6} />
                                    <ThemedTextInput value={bpSys} onChangeText={setBpSys} keyboardType="numeric" placeholder="e.g. 120" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText style={{ fontWeight: '700' }}>BP Diastolic</ThemedText>
                                    <Spacer height={6} />
                                    <ThemedTextInput value={bpDia} onChangeText={setBpDia} keyboardType="numeric" placeholder="e.g. 80" />
                                </View>
                            </View>

                            <Spacer height={8} />
                            <ThemedText style={{ fontWeight: '700' }}>Feeding type</ThemedText>
                            <Spacer height={6} />
                            <CustomDropdown
                                items={[
                                    { label: 'Exclusive breastfeeding', value: 1 },
                                    { label: 'Mixed feeding', value: 2 },
                                    { label: 'Formula feeding', value: 3 },
                                ]}
                                value={feedingTypeId}
                                setValue={(v: any) => setFeedingTypeId(v)}
                                placeholder="Select feeding type"
                            />
                        </View>
                    )}
                </CenteredModal>
            </ThemedView>
        </ThemedView>
    )
}

export default PostpartumTab

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    controlsStack: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 6,
    },
    searchInput: {
        marginBottom: 6,
    },
    sortRow: {
        width: 200,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    modalSafe: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        marginHorizontal: 20,
        borderRadius: 10,
        minWidth: '80%',
    },
    modalScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    innerModalBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '85%',
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalLabel: {
        marginTop: 6,
        fontSize: 12,
        color: '#6b7280',
    },
    modalValue: {
        marginTop: 2,
        fontSize: 14,
    },
    modalCloseBtn: {
        marginTop: 12,
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#fff',
        fontWeight: '700',
    },
    modalCheckBtn: {
        marginTop: 0,
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCheckText: {
        color: '#fff',
        fontWeight: '700',
    },
    content: {
        padding: 12,
        flex: 1,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: 10,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptySubtitle: {
        fontSize: 13,
        color: '#6b7280',
        textAlign: 'center',
    },
    errorBox: {
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#fee2e2',
    },
    errorText: {
        fontWeight: '700',
        color: '#991b1b',
    },
    errorDetails: {
        marginTop: 6,
        color: '#991b1b',
    },
})
