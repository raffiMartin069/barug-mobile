import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
 
import StatusBadge from '@/components/custom/StatusBadge'
import ChildDetailSheet from '@/components/maternal/ChildDetailSheet'
import ChildList from '@/components/maternal/ChildList'
import TrimesterProgressBar from '@/components/maternal/TrimesterProgressBar'
import ThemedCard from '@/components/ThemedCard'
import ThemedDivider from '@/components/ThemedDivider'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Colors } from '@/constants/Colors'
import { default as useMaternalTracker } from '@/hooks/useMaternalTracker'
import {
    MaternalRecordBundle,
    MaternalScheduleGroup,
    PostpartumSchedule,
    PrenatalSchedule,
} from '@/types/maternal'
import { Ionicons } from '@expo/vector-icons'
import dayjs from 'dayjs'
import React, { useMemo } from 'react'
import {
    ActivityIndicator,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native'

type ScheduleGroup = MaternalScheduleGroup<PostpartumSchedule | PrenatalSchedule>

const MaternalTracker = () => {
    // use a dedicated hook to keep data/state logic out of the UI
    const cachedProfile: any = null
    const initialPersonId = useMemo(() => Number(cachedProfile?.person_id ?? cachedProfile?.details?.person_id ?? 0), [])

    const {
        
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
    onRefresh,
    } = useMaternalTracker(initialPersonId)

    // Small animated progress bar for trimester percent.
    

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
        const status = (r.record_status_name ?? '').toLowerCase()
        const bmi = (r.bmi_status_name ?? '').toLowerCase()

        const badges: React.ReactNode[] = []

        // Risk / status
        if (status.includes('high') || status.includes('risk') || status.includes('critical')) {
            badges.push(<StatusBadge key="risk" label="High risk" variant="warning" icon="warning" />)
        } else {
            badges.push(<StatusBadge key="ok" label={`Status: ${r.record_status_name ?? '—'}`} variant="neutral" />)
        }

        // BMI
        if (bmi.includes('under') || bmi.includes('thin')) {
            badges.push(<StatusBadge key="bmi-uw" label="Underweight" variant="warning" icon="remove" />)
        } else if (bmi.includes('over') || bmi.includes('obese')) {
            badges.push(<StatusBadge key="bmi-ow" label="High BMI" variant="warning" icon="warning" />)
        } else if (bmi) {
            badges.push(<StatusBadge key="bmi-ok" label={r.bmi_status_name ?? '—'} variant="positive" icon="checkmark" />)
        }

        // EDC
        const edc = getEdcFromRecord(r)
        if (edc) {
            badges.push(<StatusBadge key="edc" label={`EDC ${formatDate(edc)}`} variant="info" icon="calendar" />)
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
                <Ionicons name="chevron-back" size={18} color={Colors.light.text} />
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
                <Ionicons name="chevron-forward" size={18} color={Colors.light.text} />
            </TouchableOpacity>
        </View>
    )

    // toggleRecord and onRefresh are provided by the useMaternalTracker hook

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
                                <View key={`tri-latest-${tri}-${idx}`} accessibilityLabel={`Trimester ${tri} progress ${label}`}>
                                    <StatusBadge label={`T${tri} • ${label}`} variant="info" icon="bar-chart" />
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
                            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={Colors.light.icon} />
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

                        {record.child_health_records && record.child_health_records.length > 0 && (
                            <View style={styles.block}>
                                <ThemedText style={styles.blockTitle}>Child Health Records</ThemedText>
                                {record.child_health_records.map((child) => (
                                    <View key={child.child_record_id} style={{ marginTop: 6 }}>
                                        <ThemedText style={styles.blockText}>
                                            Child Record #{child.child_record_id} • Born: {formatDate(child.created_at)}
                                        </ThemedText>
                                        <ThemedText style={styles.blockText}>
                                            Birth order: {child.birth_order ?? '—'} • Immunizations: {child.immunization_count ?? 0} • Monitoring logs: {child.monitoring_count ?? 0}
                                        </ThemedText>
                                    </View>
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
                                <Ionicons name="close" size={20} color={Colors.light.icon} />
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
                                            <ThemedText style={{ color: Colors.light.icon }}>{completed != null && expected != null ? `${completed}/${expected}` : '—'}</ThemedText>
                                        </View>
                                        <View style={{ marginTop: 8 }}>
                                            <TrimesterProgressBar percent={percent} />
                                        </View>
                                        {note ? <ThemedText style={{ marginTop: 8, color: Colors.light.icon }}>{note}</ThemedText> : null}
                                    </View>
                                )
                            })}
                        </ScrollView>

                        <Spacer height={12} />
                        <Pressable onPress={() => setDetailModalVisible(false)} style={({ pressed }) => [styles.modalCloseButton, pressed && { opacity: 0.8 }]}>
                            <ThemedText style={{ color: Colors.light.background, fontWeight: '700' }}>Close</ThemedText>
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

                    {/* Mother-level child health records (fetched by mother person id) */}
                    {childRecords && childRecords.length > 0 && (
                        <ThemedCard>
                            <View style={styles.sectionHeader}>
                                <ThemedText style={styles.sectionTitle}>Children</ThemedText>
                            </View>
                            <Spacer height={12} />
                            <ChildList
                                items={childRecords}
                                onSelect={(child) => {
                                    setSelectedChild(child)
                                    setChildTab('overview')
                                    setChildModalVisible(true)
                                }}
                            />
                        </ThemedCard>
                    )}

                    {/* Child detail sheet (extracted) */}
                    {selectedChild && (
                        <ChildDetailSheet
                            visible={childModalVisible}
                            onClose={() => {
                                setChildModalVisible(false)
                                setSelectedChild(null)
                            }}
                            child={selectedChild}
                            tab={childTab}
                            setTab={setChildTab}
                        />
                    )}

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
        color: Colors.light.icon,
        fontSize: 14,
    },
    errorText: {
        color: Colors.warning,
        fontSize: 14,
        fontWeight: '600',
    },
    errorCard: {
        borderColor: Colors.warning,
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
        color: Colors.light.text,
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
        color: Colors.light.icon,
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
        color: Colors.light.icon,
    },
    recordSummaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    fieldLabel: {
        fontSize: 12,
        color: Colors.light.icon,
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
        color: Colors.light.text,
    },
    visitCard: {
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.light.card,
        borderRadius: 12,
        padding: 10,
        gap: 4,
    },
    highlightsRow: {
        marginTop: 8,
        paddingHorizontal: 2,
    },
    childRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.card,
    },
    childAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.light.tint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    childName: {
        fontSize: 15,
        fontWeight: '700',
    },
    childMeta: {
        fontSize: 13,
        color: Colors.light.icon,
    },
    countRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginBottom: 6,
    },
    smallBadge: {
        backgroundColor: Colors.light.card,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    smallBadgeSecondary: {
        backgroundColor: Colors.light.card,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginLeft: 6,
    },
    smallBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.tint,
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
        backgroundColor: Colors.light.card,
    },
    pageButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    pageIndicator: {
        fontSize: 13,
        color: Colors.light.text,
        fontWeight: '600',
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: { width: '100%', maxHeight: '80%', borderRadius: 16, backgroundColor: Colors.light.background, padding: 18 },
    detailRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.light.card },
    tabRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
    tabButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: Colors.light.card },
    tabButtonActive: { backgroundColor: Colors.light.tint },
    tabButtonText: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
    tabButtonTextActive: { color: Colors.light.background },
    blockMeta: { fontSize: 13, color: Colors.light.icon },
    modalCloseButton: { marginTop: 8, backgroundColor: Colors.light.tint, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})