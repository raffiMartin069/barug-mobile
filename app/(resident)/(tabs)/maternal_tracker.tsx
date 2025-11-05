import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { DEV_SKIP_SESSION } from '@/constants/dev'
import { MaternalService } from '@/services/MaternalService'
import { useAccountRole } from '@/store/useAccountRole'
import {
    MaternalRecordBundle,
    MaternalScheduleGroup,
    PostpartumSchedule,
    PrenatalSchedule,
    TrimesterTrackerItem,
} from '@/types/maternal'
import { Ionicons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Animated,
    Easing,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native'

type ScheduleGroup = MaternalScheduleGroup<PostpartumSchedule | PrenatalSchedule>

const emptyScheduleGroup: ScheduleGroup = { latest: null, history: [] }

const MaternalTracker = () => {
    const currentRole = useAccountRole((state) => state.currentRole)
    const getProfile = useAccountRole((state) => state.getProfile)
    // Session/profile loader disabled for development
    // const ensureLoaded = useAccountRole((state) => state.ensureLoaded)

    const role = currentRole ?? 'resident'
    const cachedProfile: any = getProfile(role)
    const initialPersonId = useMemo(() => {
        return Number(cachedProfile?.person_id ?? cachedProfile?.details?.person_id ?? 0)
    }, [cachedProfile])

    // Default to cached profile if present. In development, DEV_SKIP_SESSION allows
    // bypassing session/profile and uses a local test person id (177) for faster iteration.
    const [personId, setPersonId] = useState<number>(initialPersonId || (DEV_SKIP_SESSION ? 177 : 0))
    const [loading, setLoading] = useState<boolean>(true)
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [postpartum, setPostpartum] = useState<ScheduleGroup>(emptyScheduleGroup)
    const [prenatal, setPrenatal] = useState<ScheduleGroup>(emptyScheduleGroup)
    const [records, setRecords] = useState<MaternalRecordBundle[]>([])
    const [latestTracker, setLatestTracker] = useState<TrimesterTrackerItem[]>([])
    const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false)
    const [expandedRecords, setExpandedRecords] = useState<Set<number>>(() => new Set())
    // Pagination
    const PAGE_SIZE = 3
    const [currentPage, setCurrentPage] = useState<number>(1)

    useEffect(() => {
        if (initialPersonId && initialPersonId !== personId) {
            setPersonId(initialPersonId)
        }
    }, [initialPersonId, personId])

    const service = useMemo(() => new MaternalService(), [])
    const ensureLoaded = useAccountRole((state) => state.ensureLoaded)

    // Small animated progress bar for trimester percent.
    const TrimesterProgressBar: React.FC<{ percent: number }> = ({ percent }) => {
        const animated = useMemo(() => new Animated.Value(0), [])
        useEffect(() => {
            animated.setValue(0)
            Animated.timing(animated, {
                toValue: Math.max(0, Math.min(100, percent)),
                duration: 700,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }).start()
        }, [percent, animated])

        const widthInterpolated = animated.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
        })

        return (
            <View style={{ width: 80, height: 8, backgroundColor: '#e6eef7', borderRadius: 6, overflow: 'hidden' }}>
                <Animated.View style={{ height: '100%', backgroundColor: '#60a5fa', width: widthInterpolated }} />
            </View>
        )
    }

    useEffect(() => {
        // If we already have a personId, do nothing. In development we may explicitly
        // allow skipping the session/profile load via DEV_SKIP_SESSION.
        if (personId) return

        let cancelled = false
        // if (DEV_SKIP_SESSION) {
        //     // local dev shortcut
        //     setPersonId(177)
        //     setLoading(false)
        //     return
        // }

        ; (async () => {
            try {
                const details: any = await ensureLoaded('resident')
                if (cancelled) return
                const id = Number(details?.person_id ?? details?.details?.person_id ?? 0)
                if (id) setPersonId(id)
                else {
                    setError('Profile does not have a linked person record.')
                    setLoading(false)
                }
            } catch (err) {
                if (cancelled) return
                console.warn('[MaternalTracker] failed to ensure profile:', err)
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
                // console.log(bundle);
                // console.log(`[MaternalTracker] fetched maternal data for person #${personId}:`, bundle)
                setPostpartum(bundle.postpartum)
                setPrenatal(bundle.prenatal)
                setRecords(bundle.records)
                setLatestTracker(bundle.latestTracker ?? [])
            } catch (err: any) {
                console.error('[MaternalTracker] fetch error:', err)
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
            ; (async () => {
                await fetchAll('initial')
                if (cancelled) return
            })()
        return () => {
            cancelled = true
        }
    }, [personId, fetchAll])

    useEffect(() => {
        // whenever records change, reset to first page to avoid empty pages
        setCurrentPage(1)
    }, [records])

    // paginated slice of records
    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return records.slice(start, start + PAGE_SIZE)
    }, [records, currentPage])

    const getEdcFromRecord = (r: MaternalRecordBundle) => {
        // try present pregnancy at record level first
        const recPreg = r.record_level_present_pregnancy?.[0]
        if (recPreg?.edc) return recPreg.edc
        // otherwise try latest ANC visit present pregnancy
        const latestVisit = r.anc_visits?.slice().sort((a, b) => (b.visit_date ?? '').localeCompare(a.visit_date ?? ''))[0]
        const visitPreg = latestVisit?.present_pregnancy_status
        return visitPreg?.edc ?? null
    }

    const renderHighlights = (r: MaternalRecordBundle) => {
        const badges: React.ReactNode[] = []
        const status = (r.record_status_name ?? '').toLowerCase()
        const bmi = (r.bmi_status_name ?? '').toLowerCase()

        // Risk badge
        if (status.includes('high') || status.includes('risk') || status.includes('critical')) {
            badges.push(
                <View key="risk" style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#b91c1c' }]}>High risk</ThemedText>
                </View>
            )
        } else {
            badges.push(
                <View key="ok" style={[styles.badge, { backgroundColor: '#ecfccb' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#365314' }]}>Status: {r.record_status_name ?? '—'}</ThemedText>
                </View>
            )
        }

        // BMI badge
        if (bmi.includes('under') || bmi.includes('thin')) {
            badges.push(
                <View key="bmi-uw" style={[styles.badge, { backgroundColor: '#fff7ed' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#92400e' }]}>Underweight</ThemedText>
                </View>
            )
        } else if (bmi.includes('over') || bmi.includes('obese')) {
            badges.push(
                <View key="bmi-ow" style={[styles.badge, { backgroundColor: '#fff1f2' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#991b1b' }]}>High BMI</ThemedText>
                </View>
            )
        } else if (bmi) {
            badges.push(
                <View key="bmi-ok" style={[styles.badge, { backgroundColor: '#ecfccb' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#365314' }]}>{r.bmi_status_name}</ThemedText>
                </View>
            )
        }

        // EDC / next date
        const edc = getEdcFromRecord(r)
        if (edc) {
            badges.push(
                <View key="edc" style={[styles.badge, { backgroundColor: '#eef2ff' }]}>
                    <ThemedText style={[styles.badgeText, { color: '#3730a3' }]}>EDC {formatDate(edc)}</ThemedText>
                </View>
            )
        }

        return (
            <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{badges}</View>
            </View>
        )
    }

    const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE))

    const renderPaginationControls = () => (
        <View style={styles.paginationContainer}>
            <TouchableOpacity
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                style={[styles.pageButton, currentPage <= 1 && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel="Previous page"
            >
                <Ionicons name="chevron-back" size={18} color="#111827" />
                <ThemedText style={styles.pageButtonText}>Prev</ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.pageIndicator}>
                Page {currentPage} of {totalPages}
            </ThemedText>

            <TouchableOpacity
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                style={[styles.pageButton, currentPage >= totalPages && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel="Next page"
            >
                <ThemedText style={styles.pageButtonText}>Next</ThemedText>
                <Ionicons name="chevron-forward" size={18} color="#111827" />
            </TouchableOpacity>
        </View>
    )

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

    const formatDate = (value: string | null | undefined, fallback = '—') => {
        if (!value) return fallback
        const parsed = dayjs(value)
        return parsed.isValid() ? parsed.format('MMM D, YYYY') : value
    }

    const formatDateTime = (date: string | null, time: string | null) => {
        if (!date) return '—'
        if (!time) return formatDate(date)
        const candidate = dayjs(`${date}T${time}`)
        return candidate.isValid() ? candidate.format('MMM D, YYYY • h:mm A') : `${date} ${time}`
    }

    const formatNumber = (value: number | null | undefined, suffix = '') => {
        if (value == null) return '—'
        return `${Number(value).toLocaleString()}${suffix}`
    }

    const formatBoolean = (value: boolean | null | undefined) => {
        if (value == null) return '—'
        return value ? 'Yes' : 'No'
    }

    const renderScheduleRow = (item: PostpartumSchedule | PrenatalSchedule) => (
        <View key={item.id} style={styles.scheduleRow}>
            <View style={{ flex: 1 }}>
                <ThemedText style={styles.scheduleDate}>{formatDateTime(item.scheduled_date, item.scheduled_time)}</ThemedText>
                {item.visit_purpose && (
                    <ThemedText style={styles.schedulePurpose}>{item.visit_purpose}</ThemedText>
                )}
                <ThemedText style={styles.scheduleMeta}>
                    Status: {item.status_name ?? (item.status_id ? `#${item.status_id}` : 'Not set')}
                </ThemedText>
                {item.notes && (
                    <ThemedText style={styles.scheduleMeta}>Notes: {item.notes}</ThemedText>
                )}
            </View>
        </View>
    )

    const renderScheduleSection = (
        title: string,
        group: ScheduleGroup,
        emptyMessage: string
    ) => (
        <ThemedCard>
            <View style={styles.sectionHeader}>
                <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
            </View>
            <Spacer height={12} />
            {group.latest ? (
                <>
                    <ThemedText style={styles.sectionSubtitle}>Latest</ThemedText>
                    <Spacer height={6} />
                    {renderScheduleRow(group.latest)}
                    {group.history.length > 0 && (
                        <>
                            <Spacer height={12} />
                            <ThemedDivider />
                            <Spacer height={12} />
                            <ThemedText style={styles.sectionSubtitle}>History</ThemedText>
                            <Spacer height={6} />
                            {group.history.map(renderScheduleRow)}
                        </>
                    )}
                </>
            ) : (
                <ThemedText style={styles.muted}>{emptyMessage}</ThemedText>
            )}
        </ThemedCard>
    )

    const renderLatestTrackerCard = () => {
        if (!latestTracker || latestTracker.length === 0) return null

        return (
            <TouchableOpacity activeOpacity={0.9} onPress={() => setDetailModalVisible(true)}>
                <ThemedCard>
                    <View style={styles.sectionHeader}>
                        <ThemedText style={styles.sectionTitle}>Trimester Tracker</ThemedText>
                    </View>
                    <Spacer height={12} />
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }} accessible>
                        {latestTracker.map((t: any, idx: number) => {
                            const tri = t?.trimester ?? t?.trimester_stage ?? idx + 1
                            const completed = t?.completed_visits ?? t?.completed ?? null
                            const expected = t?.expected_visits ?? t?.expected ?? null
                            const label = typeof completed === 'number' && typeof expected === 'number' ? `${completed}/${expected}` : completed != null ? `${completed}` : '—'
                            const percent = typeof t?.progress_percent === 'number'
                                ? Number(t.progress_percent)
                                : (typeof completed === 'number' && typeof expected === 'number' && expected > 0
                                    ? Math.round((completed / expected) * 100)
                                    : 0)

                            return (
                                <View key={`tri-latest-${tri}-${idx}`} style={[styles.badge, { backgroundColor: '#f0f9ff' }]} accessibilityLabel={`Trimester ${tri} progress ${label}`}>
                                    <ThemedText style={[styles.badgeText, { color: '#0369a1' }]}>T{tri} • {label}</ThemedText>
                                    <View style={{ marginTop: 6 }}>
                                        <TrimesterProgressBar percent={percent} />
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </ThemedCard>
            </TouchableOpacity>
        )
    }

    const renderRecordBundle = (record: MaternalRecordBundle) => {
        const expanded = expandedRecords.has(record.maternal_record_id)
        return (
            <ThemedCard key={record.maternal_record_id} style={styles.recordCard}>
                <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleRecord(record.maternal_record_id)}
                    accessibilityRole="button"
                >
                    <View style={styles.recordHeader}>
                        <View>
                            <ThemedText style={styles.recordTitle}>Record #{record.maternal_record_id}</ThemedText>
                            <ThemedText style={styles.recordSubTitle}>
                                Created {formatDate(record.created_at)}
                            </ThemedText>
                        </View>
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={'#4b5563'} />
                    </View>
                </TouchableOpacity>

                {/* Highlights row: quick glance info for mothers */}
                <View style={styles.highlightsRow}>
                    {renderHighlights(record)}
                </View>

                <Spacer height={10} />
                <View style={styles.recordSummaryRow}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.fieldLabel}>Weight</ThemedText>
                        <ThemedText style={styles.fieldValue}>{formatNumber(record.weight, ' kg')}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.fieldLabel}>Height</ThemedText>
                        <ThemedText style={styles.fieldValue}>{formatNumber(record.height, ' cm')}</ThemedText>
                    </View>
                </View>
                <Spacer height={6} />
                <View style={styles.recordSummaryRow}>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.fieldLabel}>BMI Status</ThemedText>
                        <ThemedText style={styles.fieldValue}>{record.bmi_status_name ?? '—'}</ThemedText>
                    </View>
                    <View style={{ flex: 1 }}>
                        <ThemedText style={styles.fieldLabel}>Record Status</ThemedText>
                        <ThemedText style={styles.fieldValue}>{record.record_status_name ?? '—'}</ThemedText>
                    </View>
                </View>

                {expanded && (
                    <>
                        <Spacer height={14} />
                        <ThemedDivider />
                        <Spacer height={14} />

                        {record.medical_history && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Medical History</ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Previous illness: {record.medical_history.previous_illness ?? '—'}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Previous hospitalization: {record.medical_history.previous_hospitalization ?? '—'}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Pregnancy complications: {record.medical_history.previous_preg_complication ?? '—'}
                                </ThemedText>
                            </View>
                        )}

                        {record.obstetric_history && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Obstetric History</ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Children born alive: {formatNumber(record.obstetric_history.num_children_born_alive)}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Children living: {formatNumber(record.obstetric_history.num_children_living)}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Abortions: {formatNumber(record.obstetric_history.num_abortion)}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Stillbirths: {formatNumber(record.obstetric_history.num_stillbirth)}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Large babies: {formatNumber(record.obstetric_history.num_large_babies)}
                                </ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Has diabetes: {formatBoolean(record.obstetric_history.has_diabetes)}
                                </ThemedText>
                            </View>
                        )}

                        {record.tt_vaccine_records.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>TT Vaccine Records</ThemedText>
                                {record.tt_vaccine_records.map((tt) => (
                                    <ThemedText key={tt.tt_id} style={styles.blockText}>
                                        {formatDate(tt.date_given)} • Type #{tt.tt_type_id}
                                    </ThemedText>
                                ))}
                            </View>
                        )}

                        {record.record_level_plan_and_baseline.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Plans & Baseline (Record Level)</ThemedText>
                                {record.record_level_plan_and_baseline.map((plan) => (
                                    <ThemedText key={plan.plan_and_baseline_id} style={styles.blockText}>
                                        Delivery plan: {plan.place_of_delivery_plan ?? '—'} • New born screening:{' '}
                                        {formatBoolean(plan.new_born_screening_plan)}
                                    </ThemedText>
                                ))}
                            </View>
                        )}

                        {record.anc_visits.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>ANC Visits</ThemedText>
                                {record.anc_visits.map((visit) => (
                                    <View key={visit.anc_visit_id} style={styles.visitCard}>
                                        <ThemedText style={styles.blockText}>
                                            Visit #{visit.visit_no ?? '—'} • {formatDate(visit.visit_date)}
                                        </ThemedText>
                                        <ThemedText style={styles.blockText}>
                                            Trimester: {visit.trimester_stage.trimester_stage_name ?? '—'} | Status:{' '}
                                            {visit.visit_status.record_status_name ?? '—'}
                                        </ThemedText>
                                        {visit.anc_row && (
                                            <ThemedText style={styles.blockText}>
                                                Vital signs: {formatNumber(visit.anc_row.weight_kg, ' kg')} • BP {formatNumber(visit.anc_row.bp_systolic)} / {formatNumber(visit.anc_row.bp_diastolic)} • AOG {formatNumber(visit.anc_row.aog_weeks)}w {formatNumber(visit.anc_row.aog_days)}d
                                            </ThemedText>
                                        )}
                                        {visit.plan_and_baseline && (
                                            <ThemedText style={styles.blockText}>
                                                Delivery plan: {visit.plan_and_baseline.place_of_delivery_plan ?? '—'}
                                            </ThemedText>
                                        )}
                                        {visit.present_pregnancy_status && (
                                            <ThemedText style={styles.blockText}>
                                                Gravida {formatNumber(visit.present_pregnancy_status.gravida)} | Para {formatNumber(visit.present_pregnancy_status.para)} | LMP {formatDate(visit.present_pregnancy_status.lmp)} | EDC {formatDate(visit.present_pregnancy_status.edc)}
                                            </ThemedText>
                                        )}
                                        {visit.lab_results.length > 0 && (
                                            <ThemedText style={styles.blockText}>
                                                Lab results: {visit.lab_results.length}
                                            </ThemedText>
                                        )}
                                        {visit.checklists.length > 0 && (
                                            <ThemedText style={styles.blockText}>
                                                Checklist items: {visit.checklists.length}
                                            </ThemedText>
                                        )}
                                        {visit.risk_responses.length > 0 && (
                                            <ThemedText style={styles.blockText}>
                                                Risks noted: {visit.risk_responses.length}
                                            </ThemedText>
                                        )}
                                        {visit.micronutrients.length > 0 && (
                                            <ThemedText style={styles.blockText}>
                                                Micronutrient entries: {visit.micronutrients.length}
                                            </ThemedText>
                                        )}
                                        {visit.previous_pregnancies.length > 0 && (
                                            <ThemedText style={styles.blockText}>
                                                Prior pregnancies logged: {visit.previous_pregnancies.length}
                                            </ThemedText>
                                        )}
                                        {visit.anc_row?.notes && (
                                            <ThemedText style={styles.blockText}>
                                                Notes: {visit.anc_row.notes}
                                            </ThemedText>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}

                        {record.record_level_present_pregnancy.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Present Pregnancy (Record Level)</ThemedText>
                                {record.record_level_present_pregnancy.map((status) => (
                                    <ThemedText key={status.preg_status_id} style={styles.blockText}>
                                        Gravida {formatNumber(status.gravida)} | Para {formatNumber(status.para)} | LMP {formatDate(status.lmp)} | EDC {formatDate(status.edc)}
                                    </ThemedText>
                                ))}
                            </View>
                        )}

                        {record.record_level_micronutrients.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Micronutrients (Record Level)</ThemedText>
                                {record.record_level_micronutrients.map((micro) => (
                                    <ThemedText key={micro.micronutrients_id} style={styles.blockText}>
                                        Iron {formatDate(micro.iron_start_date)} - {formatDate(micro.iron_end_date)} • Deworming {formatDate(micro.deworming_given_date)}
                                    </ThemedText>
                                ))}
                            </View>
                        )}

                        {record.record_level_previous_pregnancy.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Previous Pregnancies</ThemedText>
                                {record.record_level_previous_pregnancy.map((prev) => (
                                    <ThemedText key={prev.previous_pregnancy_info_id} style={styles.blockText}>
                                        {formatDate(prev.date_of_deliveries)} • Outcome: {prev.outcome ?? '—'} • Baby weight:{' '}
                                        {formatNumber(prev.baby_weight, ' kg')}
                                    </ThemedText>
                                ))}
                            </View>
                        )}

                        {record.record_level_checklists.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Checklist Items (Record Level)</ThemedText>
                                <ThemedText style={styles.blockText}>
                                    Total items: {record.record_level_checklists.length}
                                </ThemedText>
                            </View>
                        )}

                        {record.record_level_lab_results.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Lab Results (Record Level)</ThemedText>
                                {record.record_level_lab_results.map((lab) => (
                                    <ThemedText key={lab.lab_result_id} style={styles.blockText}>
                                        Test #{lab.lab_test_id} on {formatDate(lab.date_tested)}
                                    </ThemedText>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ThemedCard>
        )
    }

    // Detailed modal content for the latest tracker
    const renderDetailModal = () => {
        return (
            <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
                            <ThemedText style={{ fontSize: 18, fontWeight: '700' }}>Detailed Trimester Tracker</ThemedText>
                            <Pressable onPress={() => setDetailModalVisible(false)} style={({ pressed }) => [{ padding: 6, borderRadius: 8 }, pressed && { opacity: 0.7 }]}>
                                <Ionicons name="close" size={20} color="#374151" />
                            </Pressable>
                        </View>

                        <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: 12 }}>
                            {latestTracker.map((t: any, idx: number) => {
                                const tri = t?.trimester ?? t?.trimester_stage ?? idx + 1
                                const completed = t?.completed_visits ?? t?.completed ?? null
                                const expected = t?.expected_visits ?? t?.expected ?? null
                                const percent = typeof t?.progress_percent === 'number'
                                    ? Number(t.progress_percent)
                                    : (typeof completed === 'number' && typeof expected === 'number' && expected > 0
                                        ? Math.round((completed / expected) * 100)
                                        : 0)
                                const note = t?.note ?? t?.trimester_label ?? null

                                return (
                                    <View key={`detail-tri-${tri}-${idx}`} style={styles.detailRow}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <ThemedText style={{ fontWeight: '700' }}>Trimester {tri}</ThemedText>
                                            <ThemedText style={{ color: '#374151' }}>{completed != null && expected != null ? `${completed}/${expected}` : '—'}</ThemedText>
                                        </View>
                                        <View style={{ marginTop: 8 }}>
                                            <TrimesterProgressBar percent={percent} />
                                        </View>
                                        {note ? <ThemedText style={{ marginTop: 8, color: '#4b5563' }}>{note}</ThemedText> : null}
                                    </View>
                                )
                            })}
                        </ScrollView>

                        <Spacer height={12} />
                        <Pressable onPress={() => setDetailModalVisible(false)} style={({ pressed }) => [styles.modalCloseButton, pressed && { opacity: 0.8 }]}>
                            <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Close</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        )
    }

    return (
        <ThemedView safe style={{ flex: 1 }}>
            <ThemedAppBar title="Maternal Health Tracker" />

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator />
                    <Spacer height={8} />
                    <ThemedText style={styles.muted}>Fetching maternal records…</ThemedText>
                    {error && (
                        <>
                            <Spacer height={6} />
                            <ThemedText style={styles.errorText}>{error}</ThemedText>
                        </>
                    )}
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 48, paddingTop: 12, gap: 20 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    showsVerticalScrollIndicator={false}
                >
                    {error && (
                        <ThemedCard style={styles.errorCard}>
                            <ThemedText style={styles.errorText}>{error}</ThemedText>
                        </ThemedCard>
                    )}

                    {renderLatestTrackerCard()}
                    {renderDetailModal()}

                    {renderScheduleSection('Postpartum Schedule', postpartum, 'No postpartum schedule found.')}
                    {renderScheduleSection('Prenatal Schedule', prenatal, 'No prenatal schedule found.')}

                    <ThemedCard>
                        <View style={styles.sectionHeader}>
                            <ThemedText style={styles.sectionTitle}>Maternal Records</ThemedText>
                        </View>
                        <Spacer height={12} />
                        {records.length === 0 ? (
                            <ThemedText style={styles.muted}>No maternal health records available.</ThemedText>
                        ) : (
                            <View style={{ gap: 16 }}>
                                {paginatedRecords.map(renderRecordBundle)}
                                {records.length > PAGE_SIZE && (
                                    <View style={{ marginTop: 8 }}>
                                        {renderPaginationControls()}
                                    </View>
                                )}
                            </View>
                        )}
                    </ThemedCard>
                </ScrollView>
            )}
        </ThemedView>
    )
}

export default MaternalTracker

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    muted: {
        color: '#6b7280',
        fontSize: 14,
    },
    errorText: {
        color: '#b91c1c',
        fontSize: 14,
        fontWeight: '600',
    },
    errorCard: {
        borderColor: '#f87171',
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    sectionSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    scheduleRow: {
        paddingVertical: 8,
    },
    scheduleDate: {
        fontSize: 15,
        fontWeight: '600',
    },
    schedulePurpose: {
        fontSize: 14,
        marginTop: 2,
    },
    scheduleMeta: {
        fontSize: 13,
        color: '#6b7280',
        marginTop: 2,
    },
    recordCard: {
        width: '100%',
        alignSelf: 'stretch',
    },
    recordHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recordTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    recordSubTitle: {
        fontSize: 13,
        color: '#6b7280',
    },
    recordSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    fieldLabel: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    block: {
        gap: 4,
    },
    blockTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    blockText: {
        fontSize: 13,
        color: '#374151',
    },
    visitCard: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 10,
        gap: 4,
    },
    highlightsRow: {
        marginTop: 8,
        paddingHorizontal: 2,
    },
    badge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 6,
        backgroundColor: 'transparent',
    },
    pageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        backgroundColor: '#f3f4f6',
    },
    pageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    pageIndicator: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: { width: '100%', maxHeight: '80%', borderRadius: 16, backgroundColor: '#fff', padding: 18 },
    detailRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
    modalCloseButton: { marginTop: 8, backgroundColor: '#0b5cf6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})