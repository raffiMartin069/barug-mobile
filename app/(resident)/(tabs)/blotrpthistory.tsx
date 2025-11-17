// app/(resident)/blotrpthistory.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import dayjs from 'dayjs';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAccountRole } from '@/store/useAccountRole';
import {
  getPersonBlotterReportHistory,
  PersonBlotterHistoryRow,
} from '@/services/blotterReport';

type UiStatus = 'pending' | 'under_investigation' | 'resolved' | 'dismissed';

type BlotterReportUI = {
  id: string;
  subject: string;
  description: string;
  incident_date: string;  // 'YYYY-MM-DD'
  incident_time: string;  // 'HH:mm'
  created_at: string;     // ISO
  status: string;         // Raw status_name from DB
  respondents?: string[];
  location?: string;
  role?: 'COMPLAINANT' | 'RESPONDENT';
  linked_case_num?: string | null;
};

const accent = '#6d2932';
const statusColors: Record<UiStatus, string> = {
  pending: '#f59e0b',
  under_investigation: '#3b82f6',
  resolved: '#10b981',
  dismissed: '#6b7280',
};
const statusLabels: Record<UiStatus, string> = {
  pending: 'Pending',
  under_investigation: 'Under Review',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
};

// Map DB status names to compact UI buckets
function mapDbStatusToUi(statusName: string | null): UiStatus {
  const s = (statusName || '').toUpperCase();
  if (!s) return 'pending';
  if (s.includes('SETTLED') || s.includes('RESOLVED')) return 'resolved';
  if (s.includes('DISMISS')) return 'dismissed';
  if (s.includes('FOR CASE FILING') || s.includes('PENDING')) return 'pending';
  if (s.includes('ESCALATED TO CASE') || s.includes('UNDER INVESTIGATION') || s.includes('INVESTIGATING')) return 'under_investigation';
  return 'under_investigation';
}

// Keep only the latest row per blotter_report_id (by status_date or date_time_reported)
function squashLatest(rows: PersonBlotterHistoryRow[]): PersonBlotterHistoryRow[] {
  const byId = new Map<number, PersonBlotterHistoryRow>();
  for (const r of rows) {
    const curr = byId.get(r.blotter_report_id);
    if (!curr) {
      byId.set(r.blotter_report_id, r);
      continue;
    }
    const currTs = dayjs(curr.status_date ?? curr.date_time_reported);
    const nextTs = dayjs(r.status_date ?? r.date_time_reported);
    if (nextTs.isAfter(currTs)) byId.set(r.blotter_report_id, r);
  }
  return Array.from(byId.values());
}

export default function BlotterReportHistory() {
  const router = useRouter();
  const { currentRole, getProfile, ensureLoaded } = useAccountRole();

  // Optional override (?person_id=123) — handy for QA
  const { person_id: personIdParam } = useLocalSearchParams<{ person_id?: string }>();

  const [personId, setPersonId] = useState<number | null>(null);
  const [rawRows, setRawRows] = useState<PersonBlotterHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  // Resolve personId once on mount (or when role changes)
  useEffect(() => {
    let live = true;
    (async () => {
      // 1) From route param
      const fromParam = personIdParam ? Number(personIdParam) : NaN;

      // 2) From cached profiles
      const resident = getProfile?.('resident');
      const fromResident = resident?.person_id;

      const roleProfile = currentRole ? getProfile?.(currentRole) : null;
      const fromRole = roleProfile?.person_id;

      // 3) If still not found, try to load the resident profile
      let fromEnsure: number | null = null;
      if (
        !(Number.isFinite(fromParam) && !Number.isNaN(fromParam)) &&
        !fromResident &&
        !fromRole
      ) {
        try {
          const fresh = await ensureLoaded?.('resident');
          fromEnsure = fresh?.person_id ?? null;
        } catch (e) {
          console.warn('[BlotterHistory] ensureLoaded(resident) failed:', e);
        }
      }

      const resolved =
        (Number.isFinite(fromParam) && !Number.isNaN(fromParam) ? Number(fromParam) : null) ??
        fromResident ??
        fromRole ??
        fromEnsure ??
        null;

      console.log('[BlotterHistory] Resolved person_id:', resolved, {
        fromParam,
        fromResident,
        fromRole,
        fromEnsure,
        currentRole,
      });

      if (live) setPersonId(resolved);
    })();
    return () => { live = false; };
  }, [currentRole, getProfile, ensureLoaded, personIdParam]);

  // Fetch history
  const loadReports = useCallback(async () => {
    if (!personId) {
      console.warn('[BlotterHistory] No person_id resolved. Skipping fetch.');
      setRawRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log('[BlotterHistory] Fetching history for person_id =', personId, '…');

    try {
      const rows = await getPersonBlotterReportHistory(personId);
      console.log('[BlotterHistory] RPC returned rows:', rows?.length ?? 0);
      if (rows?.length) {
        console.log('[BlotterHistory] Sample row:', rows[0]);
      }
      setRawRows(rows || []);
    } catch (error) {
      console.error('[BlotterHistory] Failed to load reports:', error);
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [personId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [loadReports]);

  // Trigger once personId is resolved
  useEffect(() => {
    if (personId !== null) loadReports();
  }, [personId, loadReports]);

  // Consolidate duplicates per report and map to UI shape
  const reports: BlotterReportUI[] = useMemo(() => {
    const latestOnly = squashLatest(rawRows);
    latestOnly.sort(
      (a, b) => dayjs(b.date_time_reported).valueOf() - dayjs(a.date_time_reported).valueOf()
    );

    return latestOnly.map((r) => ({
      id: String(r.blotter_report_id),
      subject: r.incident_subject || '(No subject)',
      description: r.incident_desc || '',
      incident_date: r.incident_date,
      incident_time: (r.incident_time || '').slice(0, 5), // 'HH:mm'
      created_at: r.date_time_reported,
      status: r.status_name || 'PENDING',
      role: r.role_in_report,
      linked_case_num: r.linked_case_num,
    }));
  }, [rawRows]);

  const filteredReports = reports.filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return mapDbStatusToUi(report.status) === 'pending';
    if (filter === 'resolved') return mapDbStatusToUi(report.status) === 'resolved';
    return true;
  });

  const getStatusIcon = (status: UiStatus) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'under_investigation': return 'search-outline';
      case 'resolved': return 'checkmark-circle-outline';
      case 'dismissed': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderReportItem = ({ item }: { item: BlotterReportUI }) => (
    <ThemedCard style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.reportSubject}>{item.subject}</ThemedText>
          <ThemedText muted style={styles.reportDate}>
            {dayjs(item.incident_date).format('MMM DD, YYYY')} at {item.incident_time}
          </ThemedText>
          <View style={{ flexDirection: 'row', marginTop: 6, gap: 8 }}>
            {item.role && (
              <View style={styles.pill}>
                <ThemedText style={styles.pillText}>{item.role}</ThemedText>
              </View>
            )}
            {item.linked_case_num && (
              <View style={styles.pillAlt}>
                <ThemedIcon name="briefcase-outline" size={12} containerSize={16} bgColor="transparent" />
                <ThemedText style={styles.pillAltText}>{item.linked_case_num}</ThemedText>
              </View>
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[mapDbStatusToUi(item.status)] }]}>
          <ThemedIcon name={getStatusIcon(mapDbStatusToUi(item.status))} size={12} containerSize={16} bgColor="transparent" />
          <ThemedText style={styles.statusText}>
            {item.status}
          </ThemedText>
        </View>
      </View>

      {!!item.description && (
        <ThemedText style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>
      )}

      <View style={styles.reportFooter}>
        <ThemedText muted style={styles.createdDate}>
          Filed on {dayjs(item.created_at).format('MMM DD, YYYY')}
        </ThemedText>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => {
            console.log('[BlotterHistory] Navigate to details for report_id:', item.id);
            router.push(`/(residentmodals)/blotter-report-detail?reportId=${item.id}`);
          }}
        >
          <ThemedText style={styles.viewButtonText}>View Details</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedCard>
  );

  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar title="Blotter Report History" showNotif={false} showProfile={false} />

      <View style={styles.container}>
        {/* Header Stats */}
        <ThemedCard style={styles.statsCard}>
          <View style={styles.row}>
            <ThemedIcon name="document-text-outline" bgColor={accent} size={20} containerSize={28} />
            <ThemedText style={styles.title}>Your Reports</ThemedText>
          </View>
          <ThemedText muted style={{ marginTop: 4 }}>
            Track the status of your filed blotter reports
          </ThemedText>

          <Spacer height={12} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{reports.length}</ThemedText>
              <ThemedText muted style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {reports.filter((r) => mapDbStatusToUi(r.status) === 'pending').length}
              </ThemedText>
              <ThemedText muted style={styles.statLabel}>Pending</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>
                {reports.filter((r) => mapDbStatusToUi(r.status) === 'resolved').length}
              </ThemedText>
              <ThemedText muted style={styles.statLabel}>Resolved</ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'resolved'] as const).map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterTab,
                filter === filterOption && styles.filterTabActive,
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <ThemedText
                style={[
                  styles.filterTabText,
                  filter === filterOption && styles.filterTabTextActive,
                ]}
              >
                {filterOption === 'all'
                  ? 'All'
                  : filterOption === 'pending'
                  ? 'Pending'
                  : 'Resolved'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <Spacer height={16} />

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

        <Spacer height={16} />

        {/* Reports List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={accent} />
            <ThemedText muted style={{ marginTop: 12 }}>Loading reports...</ThemedText>
          </View>
        ) : filteredReports.length === 0 ? (
          <ThemedCard style={styles.emptyCard}>
            <ThemedIcon name="document-outline" size={48} containerSize={64} bgColor="#f3f4f6" />
            <ThemedText style={styles.emptyTitle}>No reports found</ThemedText>
            <ThemedText muted style={styles.emptyText}>
              {filter === 'all'
                ? "You haven't filed any blotter reports yet."
                : `No ${filter} reports found.`}
            </ThemedText>
            <TouchableOpacity
              style={styles.fileReportButton}
              onPress={() => router.push('/(residentmodals)/fileblotterreport')}
            >
              <ThemedIcon name="add" size={16} containerSize={20} />
              <ThemedText style={styles.fileReportButtonText}>File New Report</ThemedText>
            </TouchableOpacity>
          </ThemedCard>
        ) : (
          <FlatList
            data={filteredReports}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            ItemSeparatorComponent={() => <Spacer height={12} />}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { paddingLeft: 10, fontSize: 16, fontWeight: '700' },

  // Stats Card
  statsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '800', color: accent },
  statLabel: { fontSize: 12, marginTop: 2 },

  // Filter Tabs
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  filterTabTextActive: { color: accent },

  // Report Cards
  reportCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportSubject: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  reportDate: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600', color: '#fff', marginLeft: 4 },
  reportDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
    marginBottom: 8,
  },

  // Pills
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(109,41,50,0.08)',
  },
  pillText: { fontSize: 11, fontWeight: '700', color: accent },
  pillAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    gap: 6,
  },
  pillAltText: { fontSize: 11, fontWeight: '700', color: '#3730a3' },

  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  createdDate: { fontSize: 11 },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(109,41,50,0.08)',
    borderRadius: 8,
  },
  viewButtonText: { fontSize: 12, fontWeight: '600', color: accent },

  // Loading & Empty States
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12, color: '#1f2937' },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 4, marginHorizontal: 24 },
  fileReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  fileReportButtonText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
  
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
