// app/(resident)/barangaycases.tsx
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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

const BRAND = '#6d2932';
const BRAND_LIGHT = '#8b4a56';
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

const BarangayCases = () => {
  const router = useRouter();
  const { currentRole, getProfile, ensureLoaded } = useAccountRole();

  const [personId, setPersonId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusBucket>('all');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'COMPLAINANT' | 'RESPONDENT'>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<CaseHistoryUI[]>([]);

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
      
      const matchesStatus = statusFilter === 'all' || r.status_bucket === statusFilter;
      const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [rows, search, statusFilter, roleFilter]);

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
        <ThemedAppBar title="Barangay Cases" showNotif={false} showProfile={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={BRAND} />
          <ThemedText style={styles.loadingText}>Loading cases...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView safe style={styles.container}>
      <ThemedAppBar title="Barangay Cases" showNotif={false} showProfile={false} />
      
      {/* My Records Button */}
      {/* <View style={styles.recordsButtonContainer}>
        <TouchableOpacity
          style={styles.recordsButton}
          onPress={() => router.push({
            pathname: '/resident-records',
            params: { personId: personId }
          })}
        >
          <ThemedIcon name="person-circle-outline" size={16} containerSize={20} bgColor="transparent" iconColor="#fff" />
          <ThemedText style={styles.recordsButtonText}>View My Records</ThemedText>
        </TouchableOpacity>
      </View> */}

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

        {/* My Records Button */}
        <View style={styles.recordsButtonContainer}>
          <TouchableOpacity
            style={styles.recordsButton}
            onPress={() => router.push({
              pathname: '/resident-records',
              params: { personId: personId }
            })}
          >
            <ThemedIcon name="person-circle-outline" size={16} containerSize={20} bgColor="transparent" iconColor="#fff" />
            <ThemedText style={styles.recordsButtonText}>View My Records</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Search & Filters */}
        <View style={styles.filtersSection}>
          <ThemedTextInput
            placeholder="Search cases, parties, or case numbers..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            <View style={styles.filtersRow}>
              <TouchableOpacity
                style={[styles.filterChip, statusFilter === 'all' && styles.filterChipSelected]}
                onPress={() => setStatusFilter('all')}
              >
                <ThemedIcon name="apps-outline" size={14} containerSize={18} bgColor="transparent" />
                <ThemedText style={[styles.filterText, statusFilter === 'all' && styles.filterTextSelected]}>
                  All
                </ThemedText>
              </TouchableOpacity>

              {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const selected = statusFilter === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                    onPress={() => setStatusFilter(key as StatusBucket)}
                  >
                    <ThemedIcon name={config.icon} size={14} containerSize={18} bgColor="transparent" />
                    <ThemedText style={[styles.filterText, selected && styles.filterTextSelected]}>
                      {key.replace('_', ' ')}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleFiltersScroll}>
            <View style={styles.filtersRow}>
              {(['ALL', 'COMPLAINANT', 'RESPONDENT'] as const).map((role) => {
                const selected = role === roleFilter;
                return (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleChip, selected && styles.roleChipSelected]}
                    onPress={() => setRoleFilter(role)}
                  >
                    <ThemedIcon
                      name={role === 'ALL' ? 'people-outline' : role === 'COMPLAINANT' ? 'person-outline' : 'shield-outline'}
                      size={14}
                      containerSize={18}
                      bgColor="transparent"
                    />
                    <ThemedText style={[styles.roleFilterText, selected && styles.roleFilterTextSelected]}>
                      {role === 'ALL' ? 'All Roles' : role}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
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
              <TouchableOpacity
                style={styles.newReportButton}
                onPress={() => router.push('/(residentmodals)/fileblotterreport')}
              >
                <ThemedIcon name="add-outline" size={16} containerSize={20} bgColor="transparent" />
                <ThemedText style={styles.newReportText}>File New Report</ThemedText>
              </TouchableOpacity>
            </ThemedCard>
          ) : (
            filtered.map(renderCaseCard)
          )}
        </View>

        <Spacer height={100} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(residentmodals)/fileblotterreport')}
        activeOpacity={0.8}
      >
        <ThemedIcon name="add-outline" size={24} containerSize={56} bgColor={BRAND} />
      </TouchableOpacity>
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
  filtersScroll: { marginBottom: 8 },
  roleFiltersScroll: {},
  filtersRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: NEUTRAL_100,
    borderWidth: 1,
    borderColor: NEUTRAL_200,
  },
  filterChipSelected: { backgroundColor: BRAND, borderColor: BRAND },
  filterText: { fontSize: 12, fontWeight: '600', color: NEUTRAL_600, textTransform: 'capitalize' },
  filterTextSelected: { color: '#fff' },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: `${BRAND}10`,
    borderWidth: 1,
    borderColor: `${BRAND}30`,
  },
  roleChipSelected: { backgroundColor: BRAND_LIGHT, borderColor: BRAND_LIGHT },
  roleFilterText: { fontSize: 12, fontWeight: '600', color: BRAND },
  roleFilterTextSelected: { color: '#fff' },

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
  
  recordsButtonContainer: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 3 },
  recordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#310101',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  recordsButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});