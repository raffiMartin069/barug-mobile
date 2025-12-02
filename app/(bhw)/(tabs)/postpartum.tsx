import CenteredModal from '@/components/custom/CenteredModal'
import CustomDropdown from '@/components/maternal/CustomDropdown'
import MaternalCard from '@/components/maternal/MaternalCard'
import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedIcon from '@/components/ThemedIcon'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import { showToast } from '@/components/Toast'
import { Colors } from '@/constants/Colors'
import { PostpartumVisitException } from '@/exception/PostpartumVisitException'
import { useNiceModal } from '@/hooks/NiceModalProvider'
import { useEmojiRemover } from '@/hooks/useEmojiRemover'
import type { PostpartumScheduleDisplay } from '@/repository/MaternalRepository'
import { MaternalService } from '@/services/MaternalService'
import { useAccountRole } from '@/store/useAccountRole'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Easing, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native'

// Default friendly messages for known RPC error codes returned by the postpartum RPC.
// The repository currently throws PostpartumVisitException with the RPC message; we
// try to extract a code from the error or the message and map it to a friendly text.
const POSTPARTUM_ERROR_MESSAGES: Record<string, string> = {
    P6060: 'Postpartum header is missing. Create a postpartum header for this patient before saving a check.',
    P6256: 'No postpartum header found. Please create a postpartum record first.',
    P6057: 'Invalid data provided. Please review the entries and try again.',
    P6167: 'Required postpartum data is missing. Please complete all required fields.',
    P6168: 'The postpartum record is in an invalid state for this action.',
    P6124: 'Unable to save due to a data conflict. Try again.',
    P6169: 'A postpartum visit for today already exists.',
    P6171: 'A postpartum row for today already exists. You can open the existing record instead.',
}

function getFriendlyPostpartumMessage(err: any) {
    if (!err) return 'An error occurred while saving the postpartum check.'
    // prefer an explicit code property if present
    const code = err?.code ?? (typeof err?.message === 'string' ? (err.message.match(/P\d{4}/)?.[0]) : null)
    if (code && POSTPARTUM_ERROR_MESSAGES[code]) return POSTPARTUM_ERROR_MESSAGES[code]
    return err?.message ?? 'An error occurred while saving the postpartum check.'
}

const PostpartumTab = () => {
    const [loading, setLoading] = useState<boolean>(true)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [items, setItems] = useState<PostpartumScheduleDisplay[]>([])
    const [error, setError] = useState<string | null>(null)

    const service = useMemo(() => new MaternalService(), [])
    const roleStore = useAccountRole()
    const { showModal } = useNiceModal()
    const { isValid: isEmojiValid, err: emojiErr } = useEmojiRemover()
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState<string>('')
    const [searchText, setSearchText] = useState<string>('')
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

    const onSaveCheck = useCallback(async () => {
        if (!selected) return
        const maternalRecordId = Number(selected.maternal_record_id)
        if (!Number.isFinite(maternalRecordId)) return

        // Validate all required fields are present
        const lochialTrimmed = (lochial ?? '').trim()
        const bpSysTrimmed = (bpSys ?? '').trim()
        const bpDiaTrimmed = (bpDia ?? '').trim()

        // Check for required fields
        if (!lochialTrimmed) {
            Alert.alert('Validation Error', 'Lochial discharges field is required.')
            return
        }

        if (!bpSysTrimmed) {
            Alert.alert('Validation Error', 'BP Systolic is required.')
            return
        }

        if (!bpDiaTrimmed) {
            Alert.alert('Validation Error', 'BP Diastolic is required.')
            return
        }

        if (feedingTypeId === null || feedingTypeId === undefined) {
            Alert.alert('Validation Error', 'Feeding type is required.')
            return
        }

        // Validate no emojis in text fields
        if (!isEmojiValid({ lochial: lochialTrimmed, bpSys: bpSysTrimmed, bpDia: bpDiaTrimmed })) {
            Alert.alert('Validation Error', emojiErr ?? 'Emojis are not allowed in any field.')
            return
        }

        // Validate BP values are numeric and within reasonable ranges
        const bpSysN = Number(bpSysTrimmed)
        const bpDiaN = Number(bpDiaTrimmed)

        if (!Number.isFinite(bpSysN) || bpSysN <= 0) {
            Alert.alert('Validation Error', 'BP Systolic must be a valid positive number.')
            return
        }

        if (!Number.isFinite(bpDiaN) || bpDiaN <= 0) {
            Alert.alert('Validation Error', 'BP Diastolic must be a valid positive number.')
            return
        }

        // Validate reasonable BP ranges (40-250 for systolic, 30-200 for diastolic)
        if (bpSysN < 40 || bpSysN > 250) {
            Alert.alert('Validation Error', 'BP Systolic must be between 40 and 250 mmHg.')
            return
        }

        if (bpDiaN < 30 || bpDiaN > 200) {
            Alert.alert('Validation Error', 'BP Diastolic must be between 30 and 200 mmHg.')
            return
        }

        // Validate systolic is greater than diastolic
        if (bpSysN <= bpDiaN) {
            Alert.alert('Validation Error', 'BP Systolic must be greater than BP Diastolic.')
            return
        }

        // Sanitize lochial text (remove extra whitespace, trim)
        const lochialSanitized = lochialTrimmed.replace(/\s+/g, ' ')

        const staffId = roleStore.staffId ?? (roleStore.getProfile ? roleStore.getProfile('resident')?.staff_id ?? null : null)
        // fallback for testing when session doesn't provide a staff id
        const staffIdFinal = staffId ?? 15
        if (staffId == null) console.warn('[Postpartum] using fallback staffId=15 for testing')

        try {
            setSaving(true)
            const res = await service.createOrGetTodayPostpartumVisit({
                maternalRecordId,
                staffId: staffIdFinal,
                lochial: lochialSanitized,
                bpSystolic: bpSysN,
                bpDiastolic: bpDiaN,
                feedingTypeId: feedingTypeId,
            })
            console.log('createOrGetTodayPostpartumVisit result', res)

            await load()

            // show success toast
            try {
                showToast('Postpartum check saved')
            } catch {
                // silent if toast not available
            }

            setModalVisible(false)
            setSelected(null)
            setShowCheckForm(false)
            setLochial('')
            setBpSys('')
            setBpDia('')
            setFeedingTypeId(null)
        } catch (err: any) {
            console.error('save postpartum check', err)
            if (err instanceof PostpartumVisitException) {
                // show alert to user with the domain-friendly message and Retry/Close actions
                const friendly = getFriendlyPostpartumMessage(err)

                Alert.alert(
                    'Unable to save postpartum check',
                    friendly,
                    [
                        {
                            text: 'Retry',
                            onPress: () => onSaveCheck(),
                        },
                        {
                            text: 'Close',
                            style: 'cancel',
                        },
                    ],
                    { cancelable: true }
                )
            } else {
                setError(err?.message ?? String(err))
            }
        } finally {
            setSaving(false)
        }
    }, [selected, lochial, bpSys, bpDia, feedingTypeId, roleStore, service, load, isEmojiValid, emojiErr])

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

    const searchPending = (searchText ?? '').trim() !== (searchQuery ?? '').trim()

    // animated fade for the small spinner
    const spinnerOpacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(spinnerOpacity, {
            toValue: searchPending ? 1 : 0,
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start()
    }, [searchPending, spinnerOpacity])

    // debounce searchText -> searchQuery
    React.useEffect(() => {
        const t = setTimeout(() => setSearchQuery(searchText), 300)
        return () => clearTimeout(t)
    }, [searchText])

    return (
        <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
            <ThemedAppBar title="Postpartum" />
            <ThemedView style={styles.container}>
                {/* Search and sort controls */}
                <View style={styles.controlsStack}>
                    <View style={styles.searchRow}>
                        <ThemedTextInput
                            value={searchText}
                            onChangeText={setSearchText}
                            placeholder="Search name, record # or purpose"
                            style={{ flex: 1, paddingRight: 56, paddingLeft: 18 }}
                        />
                        {searchPending ? (
                            <Animated.View pointerEvents="none" style={[styles.searchSpinner, { opacity: spinnerOpacity }]}> 
                                <ActivityIndicator size="small" color={Colors.primary} />
                            </Animated.View>
                        ) : null}
                        <View pointerEvents="box-none" style={styles.searchIcon}>
                            <ThemedIcon name="search" size={16} iconColor="#6b7280" containerSize={32} />
                        </View>

                        {/* clear button removed - using inline icons inside input */}
                    </View>

                    <View style={{ height: 8 }} />

                    <View style={styles.sortRowContainer}>
                        <View style={styles.dropdownWithIcon}>
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
                            <Pressable style={styles.dropdownIcon} accessibilityRole="button">
                                <ThemedIcon name="funnel" size={14} iconColor="#6b7280" containerSize={32} />
                            </Pressable>
                        </View>
                    </View>
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
                            refreshControl={searchPending ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                            <Pressable
                                onPress={() => {
                                    if (saving) return
                                    showModal({
                                        title: 'Save Postpartum Check',
                                        message: 'Do you want to save this postpartum check?',
                                        variant: 'warn',
                                        primaryText: 'Save',
                                        secondaryText: 'Cancel',
                                        onPrimary: async () => { await onSaveCheck() },
                                    })
                                }}
                                style={[styles.modalCheckBtn, saving ? { opacity: 0.6 } : null]}
                                accessibilityRole="button"
                                disabled={saving}
                            >
                                {saving ? (<ActivityIndicator color="#fff" />) : (<ThemedText style={styles.modalCheckText}>Save Check</ThemedText>)}
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
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    clearBtn: {
        marginLeft: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    clearText: {
        color: Colors.primary,
        fontWeight: '700',
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
    sortRowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterButton: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    dropdownWithIcon: {
        flex: 1,
        position: 'relative',
        marginLeft: 0,
    },
    dropdownIcon: {
        position: 'absolute',
        right: 8,
        top: '50%',
        marginTop: -16,
        zIndex: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIcon: {
        position: 'absolute',
        right: 8,
        top: '50%',
        marginTop: -16,
        zIndex: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchSpinner: {
        position: 'absolute',
        left: 8,
        top: '50%',
        marginTop: -10,
        zIndex: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
})
