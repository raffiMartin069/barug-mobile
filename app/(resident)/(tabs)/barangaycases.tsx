// app/(resident)/barangaycases.tsx
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/Colors';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';

import {
  bucketCaseStatus,
  CaseHistoryUI,
  getPersonBarangayCaseHistoryUI,
} from '@/services/barangayCases';
import { useAccountRole } from '@/store/useAccountRole';

const BRAND = Colors.primary;

const NEUTRAL_50 = '#fafafa';
const NEUTRAL_100 = '#f5f5f5';
const NEUTRAL_200 = '#e5e5e5';
const NEUTRAL_400 = '#a3a3a3';
const NEUTRAL_600 = '#525252';
const NEUTRAL_800 = '#262626';
const NEUTRAL_900 = '#171717';

type StatusBucket = ReturnType<typeof bucketCaseStatus>;

const STATUS_CONFIG: Record<StatusBucket, { bg: string; fg: string; icon: string }> = {
  pending: { bg: '#fef3c7', fg: '#92400e', icon: 'time-outline' },
  under_review: { bg: '#e0e7ff', fg: '#3730a3', icon: 'eye-outline' },
  settled: { bg: '#d1fae5', fg: '#065f46', icon: 'checkmark-circle-outline' },
  arbitrated: { bg: '#dbeafe', fg: '#1e40af', icon: 'scale-outline' },
  dismissed: { bg: '#f3f4f6', fg: '#374151', icon: 'close-circle-outline' },
};

const FILTER_STATUS_CONFIG = {
  ongoing: { icon: 'hourglass-outline', label: 'Ongoing' },
  settled: { icon: 'checkmark-circle-outline', label: 'Settled' },
  arbitrated: { icon: 'scale-outline', label: 'Arbitrated' },
  dismissed: { icon: 'close-circle-outline', label: 'Dismissed' },
  repudiated: { icon: 'ban-outline', label: 'Repudiated' },
};

const BarangayCases = () => {
  const router = useRouter();
  const { currentRole, getProfile, ensureLoaded } = useAccountRole();

  const [personId, setPersonId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'settled' | 'arbitrated' | 'dismissed' | 'repudiated'>('all');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'COMPLAINANT' | 'RESPONDENT'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<CaseHistoryUI[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const resident = getProfile?.('resident');
      const fromResident = resident?.person_id;
      const roleProfile = currentRole ? getProfile?.(currentRole) : null;
      const fromRole = roleProfile?.person_id;

      let fromEnsure: number | null = null;
      if (!fromResident && !fromRole) {
        try {
          const fresh = await ensureLoaded?.('resident');
          fromEnsure = fresh?.person_id ?? null;
        } catch (e) {
          console.warn('[BarangayCases] ensureLoaded failed:', e);
        }
      }

      const resolved = fromResident ?? fromRole ?? fromEnsure ?? null;
      if (live) setPersonId(resolved);
    })();
    return () => { live = false; };
  }, [currentRole, getProfile, ensureLoaded]);

  const loadCases = useCallback(async () => {
    if (!personId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      const ui = await getPersonBarangayCaseHistoryUI(personId);
      setRows(ui || []);
    } catch (error) {
      console.error('[BarangayCases] Failed to load cases:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => {
    if (personId !== null) loadCases();
  }, [personId, loadCases]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  }, [loadCases]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || 
        r.case_no.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.complainants || '').toLowerCase().includes(q) ||
        (r.respondents || '').toLowerCase().includes(q);
      
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        const status = (r.settlement_status || '').toUpperCase();
        if (statusFilter === 'ongoing') {
          matchesStatus = r.status_bucket === 'pending' || r.status_bucket === 'under_review';
        } else if (statusFilter === 'repudiated') {
          matchesStatus = status.includes('REPUDIATED');
        } else {
          matchesStatus = r.status_bucket === statusFilter;
        }
      }
      
      const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;
      
      const filedDate = dayjs(r.filed_date);
      const matchesDate = (!startDate || filedDate.isAfter(dayjs(startDate).subtract(1, 'day'))) &&
                          (!endDate || filedDate.isBefore(dayjs(endDate).add(1, 'day')));
      
      return matchesSearch && matchesStatus && matchesRole && matchesDate;
    });
  }, [rows, search, statusFilter, roleFilter, startDate, endDate]);

  const stats = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    rows.forEach((r) => {
      const status = r.settlement_status || 'PENDING';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return statusCounts;
  }, [rows]);

  const renderCaseCard = (c: CaseHistoryUI) => {
    const config = STATUS_CONFIG[c.status_bucket];
    const parties = `${c.complainants || 'No complainant'} vs. ${c.respondents || 'No respondent'}`;

    return (
      <TouchableOpacity
        key={c.id}
        style={styles.caseCard}
        onPress={() => router.push(`/(residentmodals)/(brgycases)/brgycasesdetails/${c.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <View style={[styles.statusIndicator, { backgroundColor: config.fg }]} />
            <View style={styles.cardContent}>
              <ThemedText style={styles.caseTitle} numberOfLines={2}>{c.title}</ThemedText>
              <ThemedText style={styles.caseNumber}>Case #{c.case_no}</ThemedText>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <ThemedText style={[styles.statusText, { color: config.fg }]}>
              {c.settlement_status || 'PENDING'}
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.parties} numberOfLines={2}>{parties}</ThemedText>

        <View style={styles.cardFooter}>
          <View style={styles.metaItem}>
            <ThemedIcon name="calendar-outline" size={12} containerSize={16} bgColor="transparent" />
            <ThemedText style={styles.metaText}>
              Filed {dayjs(c.filed_date).format('MMM DD, YYYY')}
            </ThemedText>
          </View>
          {c.role && (
            <View style={[styles.roleTag, { backgroundColor: `${BRAND}15` }]}>
              <ThemedText style={[styles.roleText, { color: BRAND }]}>{c.role}</ThemedText>
            </View>
          )}
        </View>

        {c.last_progress && (
          <View style={styles.progressSection}>
            <ThemedText style={styles.progressLabel}>Latest Progress:</ThemedText>
            <ThemedText style={styles.progressText}>{c.last_progress}</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView safe style={styles.container}>
        <ThemedAppBar 
          title="Barangay Cases" 
          showNotif={false} 
          showProfile={false}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/resident-records',
                params: { personId: personId }
              })}
              style={{ padding: 8 }}
            >
              <Ionicons name="person-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND} />
          <ThemedText style={styles.loadingText}>Loading cases...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      <ThemedAppBar 
        title="Barangay Cases" 
        showNotif={false} 
        showProfile={false}
        rightAction={
          <TouchableOpacity
            onPress={() => router.push({
              pathname: '/resident-records',
              params: { personId: personId }
            })}
            style={{ padding: 8 }}
          >
            <Ionicons name="person-circle-outline" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <ThemedCard style={styles.headerCard}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <ThemedIcon name="briefcase-outline" size={20} containerSize={40} bgColor={BRAND} />
                </View>
                <View style={styles.headerTextContainer}>
                  <ThemedText style={styles.headerTitle}>Barangay Cases</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>Track and manage your legal cases</ThemedText>
                  <View style={styles.totalCasesContainer}>
                    <ThemedIcon name="folder-outline" size={16} containerSize={20} bgColor="transparent" />
                    <ThemedText style={styles.totalCasesText}>{rows.length} Total Cases</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsSection}>
              <ThemedText style={styles.statsTitle}>Case Status Overview</ThemedText>
              <View style={styles.statsGrid}>
                {Object.entries(stats).map(([status, count]) => {
                  const bucketStatus = bucketCaseStatus(status);
                  const config = STATUS_CONFIG[bucketStatus];
                  return (
                    <View key={status} style={styles.statCard}>
                      <View style={styles.statHeader}>
                        <View style={[styles.statIconContainer, { backgroundColor: config.bg }]}>
                          <ThemedIcon name={config.icon} size={12} containerSize={24} bgColor="transparent" />
                        </View>
                        <ThemedText style={styles.statCount}>{count}</ThemedText>
                      </View>
                      <ThemedText style={styles.statLabel} numberOfLines={2}>{status}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          </ThemedCard>
        </View>

        {/* Search & Filters */}
        <View style={styles.filtersSection}>
          <ThemedTextInput
            placeholder="Search cases, parties, or case numbers..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterButton} onPress={() => setShowStatusModal(true)}>
              <Ionicons name="funnel-outline" size={18} color={NEUTRAL_800} />
              <ThemedText style={styles.filterButtonText}>Status</ThemedText>
              {statusFilter !== 'all' && <View style={styles.filterDot} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButton} onPress={() => setShowRoleModal(true)}>
              <Ionicons name="people-outline" size={18} color={NEUTRAL_800} />
              <ThemedText style={styles.filterButtonText}>Role</ThemedText>
              {roleFilter !== 'ALL' && <View style={styles.filterDot} />}
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterButton} onPress={() => setShowDateModal(true)}>
              <Ionicons name="calendar-outline" size={18} color={NEUTRAL_800} />
              <ThemedText style={styles.filterButtonText}>Date</ThemedText>
              {(startDate || endDate) && <View style={styles.filterDot} />}
            </TouchableOpacity>
          </View>


        </View>

        {/* Cases List */}
        <View style={styles.casesSection}>
          {filtered.length === 0 ? (
            <ThemedCard style={styles.emptyCard}>
              <ThemedIcon name="folder-open-outline" size={48} containerSize={64} bgColor={NEUTRAL_100} />
              <ThemedText style={styles.emptyTitle}>No cases found</ThemedText>
              <ThemedText style={styles.emptyText}>
                {statusFilter === 'all' ? "You don't have any cases yet." : `No cases found for the selected filter.`}
              </ThemedText>
            </ThemedCard>
          ) : (
            filtered.map(renderCaseCard)
          )}
        </View>

        <Spacer height={100} />
      </ScrollView>



      {/* Status Filter Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowStatusModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filter by Status</ThemedText>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color={NEUTRAL_800} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.modalOption, statusFilter === 'all' && styles.modalOptionSelected]} onPress={() => { setStatusFilter('all'); setShowStatusModal(false); }}>
              <Ionicons name="apps-outline" size={20} color={NEUTRAL_800} />
              <ThemedText style={[styles.modalOptionText, statusFilter === 'all' && styles.modalOptionTextSelected]}>All</ThemedText>
              {statusFilter === 'all' && <Ionicons name="checkmark" size={20} color={BRAND} />}
            </TouchableOpacity>
            {Object.entries(FILTER_STATUS_CONFIG).map(([key, config]) => (
              <TouchableOpacity key={key} style={[styles.modalOption, statusFilter === key && styles.modalOptionSelected]} onPress={() => { setStatusFilter(key as any); setShowStatusModal(false); }}>
                <Ionicons name={config.icon as any} size={20} color={NEUTRAL_800} />
                <ThemedText style={[styles.modalOptionText, statusFilter === key && styles.modalOptionTextSelected]}>{config.label}</ThemedText>
                {statusFilter === key && <Ionicons name="checkmark" size={20} color={BRAND} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Role Filter Modal */}
      <Modal visible={showRoleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowRoleModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filter by Role</ThemedText>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color={NEUTRAL_800} />
              </TouchableOpacity>
            </View>
            {(['ALL', 'COMPLAINANT', 'RESPONDENT'] as const).map((role) => (
              <TouchableOpacity key={role} style={[styles.modalOption, roleFilter === role && styles.modalOptionSelected]} onPress={() => { setRoleFilter(role); setShowRoleModal(false); }}>
                <Ionicons name={role === 'ALL' ? 'people-outline' : role === 'COMPLAINANT' ? 'person-outline' : 'shield-outline'} size={20} color={NEUTRAL_800} />
                <ThemedText style={[styles.modalOptionText, roleFilter === role && styles.modalOptionTextSelected]}>{role === 'ALL' ? 'All Roles' : role}</ThemedText>
                {roleFilter === role && <Ionicons name="checkmark" size={20} color={BRAND} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowDateModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Filter by Date</ThemedText>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color={NEUTRAL_800} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.dateCard} onPress={() => setShowStartPicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={BRAND} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.dateLabel}>Start Date</ThemedText>
                <ThemedText style={styles.dateValue}>{startDate ? dayjs(startDate).format('MMM DD, YYYY') : 'Not set'}</ThemedText>
              </View>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker value={startDate || new Date()} mode="date" display="default" onChange={(e, date) => { setShowStartPicker(false); if (date) setStartDate(date); }} />
            )}
            <TouchableOpacity style={styles.dateCard} onPress={() => setShowEndPicker(true)}>
              <Ionicons name="calendar-outline" size={20} color={BRAND} />
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.dateLabel}>End Date</ThemedText>
                <ThemedText style={styles.dateValue}>{endDate ? dayjs(endDate).format('MMM DD, YYYY') : 'Not set'}</ThemedText>
              </View>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker value={endDate || new Date()} mode="date" display="default" onChange={(e, date) => { setShowEndPicker(false); if (date) setEndDate(date); }} />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={() => { setStartDate(null); setEndDate(null); setShowDateModal(false); }}>
                <ThemedText style={styles.clearButtonText}>Clear</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={() => setShowDateModal(false)}>
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default BarangayCases;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEUTRAL_50 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: NEUTRAL_600, fontSize: 14 },

  headerSection: { paddingHorizontal: 8, paddingVertical: 16 },
  headerCard: { borderRadius: 12, padding: 16, borderWidth: 1, borderColor: NEUTRAL_200, backgroundColor: '#fff' },
  headerTop: { marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { marginRight: 12 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: NEUTRAL_900, marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: NEUTRAL_600, marginBottom: 8 },
  totalCasesContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalCasesText: { fontSize: 12, fontWeight: '600', color: BRAND },
  divider: { height: 1, backgroundColor: NEUTRAL_200, marginBottom: 12 },
  statsSection: {},
  statsTitle: { fontSize: 14, fontWeight: '600', color: NEUTRAL_900, marginBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { flex: 1, minWidth: 120, backgroundColor: NEUTRAL_50, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: NEUTRAL_200 },
  statHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  statIconContainer: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statCount: { fontSize: 16, fontWeight: '700', color: NEUTRAL_900 },
  statLabel: { fontSize: 10, color: NEUTRAL_600, fontWeight: '500', lineHeight: 12 },

  filtersSection: { paddingHorizontal: 16, marginBottom: 16 },
  searchInput: { marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: NEUTRAL_100,
    borderWidth: 1,
    borderColor: NEUTRAL_200,
  },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: NEUTRAL_800 },
  filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: BRAND },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: NEUTRAL_900 },
  modalOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 8 },
  modalOptionSelected: { backgroundColor: `${BRAND}10` },
  modalOptionText: { flex: 1, fontSize: 15, fontWeight: '500', color: NEUTRAL_800, textTransform: 'capitalize' },
  modalOptionTextSelected: { color: BRAND, fontWeight: '600' },
  dateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: NEUTRAL_50, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: NEUTRAL_200 },
  dateLabel: { fontSize: 12, color: NEUTRAL_600, marginBottom: 4 },
  dateValue: { fontSize: 15, fontWeight: '600', color: NEUTRAL_900 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  clearButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: NEUTRAL_100, alignItems: 'center' },
  clearButtonText: { fontSize: 15, fontWeight: '600', color: NEUTRAL_800 },
  applyButton: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: BRAND, alignItems: 'center' },
  applyButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  casesSection: { paddingHorizontal: 16 },
  caseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: NEUTRAL_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  statusIndicator: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
  cardContent: { flex: 1 },
  caseTitle: { fontSize: 16, fontWeight: '600', color: NEUTRAL_900, marginBottom: 4 },
  caseNumber: { fontSize: 12, color: NEUTRAL_600 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  parties: { fontSize: 14, color: NEUTRAL_600, lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: NEUTRAL_600 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleText: { fontSize: 10, fontWeight: '600' },
  progressSection: { paddingTop: 8, borderTopWidth: 1, borderTopColor: NEUTRAL_100 },
  progressLabel: { fontSize: 11, color: NEUTRAL_600, marginBottom: 2 },
  progressText: { fontSize: 12, color: NEUTRAL_800, fontWeight: '500' },

  emptyCard: { alignItems: 'center', padding: 32, borderRadius: 12, borderWidth: 1, borderColor: NEUTRAL_200 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: NEUTRAL_900, marginTop: 12 },
  emptyText: { fontSize: 14, color: NEUTRAL_600, textAlign: 'center', marginTop: 4, marginHorizontal: 16 },
  newReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  newReportText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});