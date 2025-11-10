// app/(resident)/barangaycases.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import dayjs from 'dayjs';
import { Link, useRouter } from 'expo-router';

// If your ThemedIcon already wraps Ionicons, keep using it.
// Otherwise you can import Ionicons directly like this:
// import { Ionicons } from '@expo/vector-icons';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedItemCard from '@/components/ThemedItemCard';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';

import { useAccountRole } from '@/store/useAccountRole';
import {
  CaseHistoryUI,
  getPersonBarangayCaseHistoryUI,
  bucketCaseStatus,
} from '@/services/barangayCases';

/* ================================
   SYSTEM THEME (brand-locked)
   ================================ */
const BRAND = '#6d2932';       // maroon
const BRAND_700 = '#5a222a';   // deep maroon
const GOLD = '#D4AF37';        // gold accent
const INK = '#0f172a';         // dark text
const MUTED = '#64748b';       // muted text
const CARD = '#ffffff';
const WASH = '#faf9f8';
const RING = 'rgba(109,41,50,.14)';

/* ================================
   Status Buckets
   ================================ */
type StatusBucket = ReturnType<typeof bucketCaseStatus>;

const STATUS_UI: Record<StatusBucket, { label: string; bg: string; fg: string; icon: string }> = {
  pending:      { label: 'Pending',      bg: '#fff7ed', fg: '#9a3412', icon: 'time-outline' },            // warm light
  under_review: { label: 'Under Review', bg: '#eef2ff', fg: '#3730a3', icon: 'search-outline' },          // indigo
  settled:      { label: 'Settled',      bg: '#ecfdf5', fg: '#065f46', icon: 'checkmark-circle-outline' },// green
  arbitrated:   { label: 'Arbitrated',   bg: '#ecfeff', fg: '#155e75', icon: 'scale-outline' },           // cyan
  dismissed:    { label: 'Dismissed',    bg: '#f3f4f6', fg: '#374151', icon: 'close-circle-outline' },    // gray
};

const STATUS_FILTERS =
  [{ key: 'all', label: 'All', icon: 'list-outline' } as const].concat(
    (Object.keys(STATUS_UI) as StatusBucket[]).map((k) => ({
      key: k,
      label: STATUS_UI[k].label,
      icon: STATUS_UI[k].icon,
    }))
  );
type StatusFilterKey = 'all' | StatusBucket;

/* ================================
   Screen
   ================================ */
const BarangayCases = () => {
  const router = useRouter();
  const { currentRole, getProfile, ensureLoaded } = useAccountRole();

  const [personId, setPersonId] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterKey>('all');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'COMPLAINANT' | 'RESPONDENT'>('ALL');
  const [sortLatestFirst, setSortLatestFirst] = useState(true);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<CaseHistoryUI[]>([]);

  /* person_id resolution (same pattern as your Blotter History) */
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
          console.warn('[BarangayCases] ensureLoaded(resident) failed:', e);
        }
      }

      const resolved = fromResident ?? fromRole ?? fromEnsure ?? null;
      console.log('[BarangayCases] Resolved person_id:', resolved, { currentRole, fromResident, fromRole, fromEnsure });

      if (live) setPersonId(resolved);
    })();
    return () => {
      live = false;
    };
  }, [currentRole, getProfile, ensureLoaded]);

  /* Fetch data via RPC service */
  const loadCases = useCallback(async () => {
    if (!personId) {
      console.warn('[BarangayCases] No person_id. Skipping fetch.');
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log('[BarangayCases] Fetching case history for person_id =', personId, '…');

    try {
      const ui = await getPersonBarangayCaseHistoryUI(personId);
      console.log('[BarangayCases] RPC returned rows:', ui?.length ?? 0);
      if (ui?.length) console.log('[BarangayCases] Sample row:', ui[0]);
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

  /* Search + filters + sort */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const passStatus = (b: StatusBucket) => statusFilter === 'all' || statusFilter === b;
    const passRole = (role: string | undefined) => roleFilter === 'ALL' || role === roleFilter;

    const items = rows.filter((r) => {
      const matchesQ =
        !q ||
        r.case_no.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        (r.complainants || '').toLowerCase().includes(q) ||
        (r.respondents || '').toLowerCase().includes(q) ||
        (r.role || '').toLowerCase().includes(q) ||
        (r.case_nature || '').toLowerCase().includes(q) ||
        (r.complaint_title || '').toLowerCase().includes(q);

      return matchesQ && passStatus(r.status_bucket) && passRole(r.role);
    });

    items.sort((a, b) => {
      const aTs = dayjs(a.last_progress_date || a.filed_date).valueOf();
      const bTs = dayjs(b.last_progress_date || b.filed_date).valueOf();
      return sortLatestFirst ? bTs - aTs : aTs - bTs;
    });

    return items;
  }, [rows, search, statusFilter, roleFilter, sortLatestFirst]);

  /* Stats */
  const total = rows.length;
  const byBucketCount = useMemo(() => {
    const out: Record<StatusBucket, number> = {
      pending: 0,
      under_review: 0,
      settled: 0,
      arbitrated: 0,
      dismissed: 0,
    };
    rows.forEach((r) => {
      out[r.status_bucket] = (out[r.status_bucket] ?? 0) + 1;
    });
    return out;
  }, [rows]);

  /* Card Renderer */
  const renderCaseCard = (c: CaseHistoryUI) => {
    const ui = STATUS_UI[c.status_bucket];
    const parties = `${c.complainants || '(No complainant)'} vs. ${c.respondents || '(No respondent)'}`;
    const filedAt = `${dayjs(c.filed_date).format('MMM DD, YYYY')} • ${c.filed_time}`;
    const meta2 = c.last_progress
      ? `${c.last_progress} • ${c.last_progress_date ? dayjs(c.last_progress_date).format('MMM DD, YYYY, h:mm A') : ''}`
      : `Filed: ${filedAt}`;

    return (
      <View key={c.id} style={{ marginBottom: 14 }}>
        <ThemedItemCard
          title={c.title || '(No title)'}
          subtitle={parties}
          meta1={`Case #: ${c.case_no}`}
          meta2={meta2}
          meta3={c.role ? `Your Role: ${c.role}` : undefined}
          showPill
          pillLabel={ui.label}
          pillBgColor={ui.bg}
          pillTextColor={ui.fg}
          pillSize="sm"
          leftIcon={
            <ThemedIcon
              name="briefcase-outline"
              size={18}
              containerSize={28}
              bgColor="rgba(109,41,50,.10)"
            />
          }
          rightIcon={
            <ThemedIcon
              name={ui.icon}
              size={16}
              containerSize={24}
              bgColor="transparent"
            />
          }
          route={{ pathname: '/cases/details/[id]', params: { id: c.id } }} // adjust to your actual case route
        />
      </View>
    );
  };

  /* Header & Controls */
  const ListHeader = () => (
    <>
      {/* HERO */}
      <View style={styles.heroOuter}>
        <View style={styles.hero}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedIcon
              name="briefcase-outline"
              size={22}
              containerSize={36}
              bgColor="rgba(0,0,0,.18)"
            />
            <ThemedText style={styles.heroTitle}>\d*s</ThemedText>
          </View>
          <ThemedText style={styles.heroSubtitle}>
            A clean overview of your active and historical cases.
          </ThemedText>

          <Spacer height={12} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{total}</ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{byBucketCount.pending}</ThemedText>
              <ThemedText style={styles.statLabel}>Pending</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{byBucketCount.under_review}</ThemedText>
              <ThemedText style={styles.statLabel}>Under Review</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{byBucketCount.settled}</ThemedText>
              <ThemedText style={styles.statLabel}>Settled</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{byBucketCount.arbitrated}</ThemedText>
              <ThemedText style={styles.statLabel}>Arbitrated</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statNumber}>{byBucketCount.dismissed}</ThemedText>
              <ThemedText style={styles.statLabel}>Dismissed</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* CONTROLS */}
      <View style={styles.controlsWrap}>
        <ThemedTextInput
          placeholder="Search case no., parties, title, nature, or role…"
          value={search}
          onChangeText={setSearch}
        />

        <Spacer height={10} />

        {/* Status + Role chips (sticky-look via card) */}
        <ThemedCard style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipRow}>
              {STATUS_FILTERS.map((f) => {
                const selected = f.key === statusFilter;
                return (
                  <TouchableOpacity
                    key={f.key}
                    activeOpacity={0.88}
                    onPress={() => setStatusFilter(f.key as StatusFilterKey)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <ThemedIcon
                      name={f.icon}
                      size={14}
                      containerSize={20}
                      bgColor="transparent"
                    />
                    <ThemedText
                      style={[styles.chipText, selected && styles.chipTextSelected]}
                    >
                      {f.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}

              {(['ALL', 'COMPLAINANT', 'RESPONDENT'] as const).map((opt) => {
                const selected = opt === roleFilter;
                return (
                  <TouchableOpacity
                    key={opt}
                    activeOpacity={0.88}
                    onPress={() => setRoleFilter(opt)}
                    style={[styles.chipAlt, selected && styles.chipAltSelected]}
                  >
                    <ThemedIcon
                      name={
                        opt === 'ALL'
                          ? 'people-outline'
                          : opt === 'COMPLAINANT'
                          ? 'person-circle-outline'
                          : 'shield-outline'
                      }
                      size={14}
                      containerSize={20}
                      bgColor="transparent"
                    />
                    <ThemedText
                      style={[styles.chipAltText, selected && styles.chipAltTextSelected]}
                    >
                      {opt === 'ALL' ? 'All Roles' : opt}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                onPress={() => setSortLatestFirst((s) => !s)}
                activeOpacity={0.9}
                style={styles.sortChip}
              >
                <ThemedIcon
                  name={sortLatestFirst ? 'swap-vertical-outline' : 'swap-vertical'}
                  size={14}
                  containerSize={20}
                  bgColor="transparent"
                />
                <ThemedText style={styles.sortChipText}>
                  {sortLatestFirst ? 'Newest first' : 'Oldest first'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedCard>
      </View>

      {/* SECTION HEADER */}
      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <ThemedCard style={styles.sectionCard}>
          <View style={styles.row}>
            <ThemedText style={styles.title}>Your Cases</ThemedText>
            <ThemedText link>
              <Link href={'/'}>Back</Link>
            </ThemedText>
          </View>
          <Spacer height={8} />
          <ThemedDivider />
          <Spacer height={6} />
        </ThemedCard>
      </View>
    </>
  );

  return (
    <ThemedView style={{ flex: 1, backgroundColor: WASH }} safe>
      <ThemedAppBar title="\d*s" showNotif={false} showProfile={false} />

      <KeyboardAvoidingView>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND} />
            <ThemedText style={{ marginTop: 12, color: MUTED }}>
              Loading cases…
            </ThemedText>
          </View>
        ) : filtered.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 70 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <Spacer />
            <ListHeader />
            <View style={{ paddingHorizontal: 16 }}>
              <ThemedCard style={styles.emptyCard}>
                <ThemedIcon
                  name="briefcase-outline"
                  size={48}
                  containerSize={64}
                  bgColor="rgba(109,41,50,.10)"
                />
                <ThemedText style={styles.emptyTitle}>No cases found</ThemedText>
                <ThemedText style={styles.emptyText}>
                  {statusFilter === 'all'
                    ? "You don't have any \d*s yet."
                    : `No ${STATUS_UI[statusFilter as StatusBucket]?.label || 'matching'} cases found.`}
                </ThemedText>
                <TouchableOpacity
                  style={styles.fileReportButton}
                  onPress={() => router.push('/(residentmodals)/fileblotterreport')}
                >
                  <ThemedIcon name="add" size={16} containerSize={20} />
                  <ThemedText style={styles.fileReportButtonText}>File New Report</ThemedText>
                </TouchableOpacity>
              </ThemedCard>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 70 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND]} />
            }
            showsVerticalScrollIndicator={false}
          >
            <Spacer />
            <ListHeader />
            <View style={{ paddingHorizontal: 16 }}>
              {filtered.map((c) => renderCaseCard(c))}
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(residentmodals)/fileblotterreport')}
        activeOpacity={0.92}
      >
        <ThemedIcon name="add" size={22} containerSize={44} bgColor={GOLD} />
      </TouchableOpacity>
    </ThemedView>
  );
};

export default BarangayCases;

/* ================================
   Styles
   ================================ */
const styles = StyleSheet.create({
  heroOuter: { paddingHorizontal: 16 },
  hero: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: RING,
    backgroundColor: CARD,
    overflow: 'hidden',
  },

  heroTitle: {
    paddingLeft: 10,
    fontSize: 20,
    fontWeight: '900',
    color: BRAND,
    letterSpacing: 0.2,
  },
  heroSubtitle: { marginTop: 6, color: MUTED },

  statsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 6,
    flexWrap: 'wrap',
  },
  statItem: { alignItems: 'center', minWidth: 84 },
  statNumber: { fontSize: 18, fontWeight: '900', color: BRAND },
  statLabel: { fontSize: 11, marginTop: 2, color: MUTED },

  controlsWrap: { paddingHorizontal: 16, marginTop: 12 },

  filterBar: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RING,
    backgroundColor: CARD,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },

  chipRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '700' },
  chipTextSelected: { color: BRAND, fontWeight: '900' },

  chipAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dfe3f0',
    marginRight: 8,
    backgroundColor: '#eef2ff',
  },
  chipAltSelected: {
    borderColor: '#3730a3',
    backgroundColor: '#fff',
    shadowColor: '#3730a3',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  chipAltText: { fontSize: 12, color: '#3730a3', fontWeight: '800' },
  chipAltTextSelected: { color: INK },

  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  sortChipText: { fontSize: 12, fontWeight: '800', color: INK },

  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: RING,
    backgroundColor: CARD,
  },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '900', color: INK },

  // EMPTY / LOADING
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: RING,
    backgroundColor: CARD,
  },
  emptyTitle: { fontSize: 18, fontWeight: '900', marginTop: 12, color: INK },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginHorizontal: 24,
    color: MUTED,
  },
  fileReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  fileReportButtonText: { color: '#fff', fontWeight: '900', marginLeft: 6 },

  // FAB
  fab: { position: 'absolute', bottom: 20, right: 20, zIndex: 999 },
});
