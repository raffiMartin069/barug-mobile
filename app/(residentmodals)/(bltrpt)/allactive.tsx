// app/(residentmodals)/(bltrpt)/allactive.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedDivider from '@/components/ThemedDivider';
import ThemedItemCard from '@/components/ThemedItemCard';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';

// ✅ your Supabase client
import { supabase } from '@/supabase';
// ✅ base URL for Django pages (for “Open full timeline”)
import { API_BASE } from '@/services/config';

/* ---------------- Types ---------------- */

type DbSettlement = { settlement_status_name: string | null };
type DbCase = {
  blotter_case_id: number;
  blotter_case_name: string | null;
  blotter_case_num: string | null;
  date_filed: string | null; // ISO
  settlement_status?: DbSettlement | null; // via FK select
};

type DbSubmission = {
  submission_id: number;
  status: string | null;
  submitted_at: string | null;
  kp_form: { form_code: string | null; form_name: string | null } | null;
};

type BlotterItem = {
  id: number;
  caseTitle: string;
  caseNo: string;
  filedAtISO: string | null;
  filedAtHuman: string;
  statusName: string; // UPPERCASE
};

type TimelineEntry = {
  tsISO: string | null;
  tsHuman: string;
  label: string;
  detail?: string | null;
};

/* ---------------- UI constants ---------------- */

const STATUS_UI: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:   { label: 'Pending',   bg: '#fde68a', fg: '#92400e' },
  MEDIATION: { label: 'Mediation', bg: '#e0e7ff', fg: '#1e3a8a' },
  SCHEDULED: { label: 'Scheduled', bg: '#d1fae5', fg: '#065f46' },
  SETTLED:   { label: 'Settled',   bg: '#bbf7d0', fg: '#166534' },
  DISMISSED: { label: 'Dismissed', bg: '#fee2e2', fg: '#991b1b' },
};
const FALLBACK_STATUS = { label: 'Filed', bg: '#e5e7eb', fg: '#111827' };

/* ---------------- Helpers ---------------- */

function fmtDateHuman(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long', day: '2-digit' }).format(d);
  } catch {
    return iso || '—';
  }
}

/* ---------------- Data fetchers ---------------- */

async function fetchActiveCases(limit = 100): Promise<BlotterItem[]> {
  const { data, error } = await supabase
    .from<DbCase>('blotter_case')
    .select(
      'blotter_case_id, blotter_case_name, blotter_case_num, date_filed, settlement_status:settlement_status_id ( settlement_status_name )'
    )
    .order('blotter_case_id', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[ActiveCases] supabase error:', error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.blotter_case_id,
    caseTitle: (r.blotter_case_name || '').trim() || '(Untitled Case)',
    caseNo: (r.blotter_case_num || '').trim() || '—',
    filedAtISO: r.date_filed,
    filedAtHuman: fmtDateHuman(r.date_filed),
    statusName: (r.settlement_status?.settlement_status_name || 'PENDING').trim().toUpperCase(),
  }));
}

/** Build a lightweight, inline timeline from Supabase:
 *  - Case filed (date_filed)
 *  - Any submitted KP forms (from blotter_kp_submission JOIN kp_form)
 */
async function fetchCaseTimeline(caseId: number): Promise<TimelineEntry[]> {
  const entries: TimelineEntry[] = [];

  // 1) Filed
  const { data: c, error: errCase } = await supabase
    .from<DbCase>('blotter_case')
    .select('date_filed')
    .eq('blotter_case_id', caseId)
    .maybeSingle();

  if (!errCase && c?.date_filed) {
    entries.push({
      tsISO: c.date_filed,
      tsHuman: fmtDateHuman(c.date_filed),
      label: 'Case Filed',
      detail: null,
    });
  }

  // 2) Submitted forms
  const { data: subs, error: errSubs } = await supabase
    .from<DbSubmission>('blotter_kp_submission')
    .select('submission_id, status, submitted_at, kp_form:form_id(form_code, form_name)')
    .eq('blotter_case_id', caseId)
    .order('submitted_at', { ascending: true });

  if (!errSubs && Array.isArray(subs)) {
    for (const s of subs) {
      if (s.submitted_at) {
        const code = s.kp_form?.form_code?.toUpperCase() || '';
        const name = s.kp_form?.form_name || '';
        const status = (s.status || '').toUpperCase();
        entries.push({
          tsISO: s.submitted_at,
          tsHuman: fmtDateHuman(s.submitted_at),
          label: code ? `${code} Submitted` : 'Form Submitted',
          detail: [name, status && `(${status})`].filter(Boolean).join(' '),
        });
      }
    }
  }

  // Sort by time ascending and return
  return entries.sort((a, b) => {
    const ta = a.tsISO ? +new Date(a.tsISO) : 0;
    const tb = b.tsISO ? +new Date(b.tsISO) : 0;
    return ta - tb;
  });
}

/* ---------------- Filters ---------------- */

const FILTERS = [
  { key: 'all',        label: 'All' },
  { key: 'PENDING',    label: 'Pending' },
  { key: 'MEDIATION',  label: 'Mediation' },
  { key: 'SCHEDULED',  label: 'Scheduled' },
  { key: 'SETTLED',    label: 'Settled' },
  { key: 'DISMISSED',  label: 'Dismissed' },
] as const;
type FilterKey = typeof FILTERS[number]['key'] | 'all';

/* ---------------- Component ---------------- */

const AllActive = () => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<BlotterItem[]>([]);

  // inline timeline state
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [timelineLoading, setTimelineLoading] = useState<Record<number, boolean>>({});
  const [timelineCache, setTimelineCache] = useState<Record<number, TimelineEntry[]>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const data = await fetchActiveCases(100);
      if (alive) setRows(data);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const textOk = !q || r.caseTitle.toLowerCase().includes(q) || r.caseNo.toLowerCase().includes(q);
      const statusOk = activeFilter === 'all' || r.statusName === activeFilter;
      return textOk && statusOk;
    });
  }, [rows, search, activeFilter]);

  const openTimelinePage = (caseId: number) => {
    const base = API_BASE?.replace(/\/+$/, '') || '';
    const url = `${base}/lupon_mem/cases/${caseId}/timeline/`;
    Linking.openURL(url).catch((e) => console.warn('openURL failed:', e));
  };

  const toggleExpand = async (caseId: number) => {
    const isOpen = !!expanded[caseId];
    if (isOpen) {
      setExpanded((p) => ({ ...p, [caseId]: false }));
      return;
    }

    // expand + fetch if not cached
    setExpanded((p) => ({ ...p, [caseId]: true }));
    if (!timelineCache[caseId]) {
      setTimelineLoading((p) => ({ ...p, [caseId]: true }));
      try {
        const data = await fetchCaseTimeline(caseId);
        setTimelineCache((p) => ({ ...p, [caseId]: data }));
      } catch (e) {
        console.warn('[timeline] fetch failed', e);
        setTimelineCache((p) => ({ ...p, [caseId]: [] }));
      } finally {
        setTimelineLoading((p) => ({ ...p, [caseId]: false }));
      }
    }
  };

  return (
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title="Active Blotter Reportssssss" />
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })}>
        <ScrollView contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <Spacer />

          {/* Search + filter chips */}
          <View style={{ paddingHorizontal: 40 }}>
            <ThemedTextInput
              placeholder="Search case no., title..."
              value={search}
              onChangeText={setSearch}
            />
            <Spacer height={10} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {FILTERS.map((f) => {
                  const selected = f.key === activeFilter;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      activeOpacity={0.7}
                      onPress={() => setActiveFilter(f.key)}
                      style={[styles.chip, selected && styles.chipSelected]}
                    >
                      <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {f.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          <Spacer />

          <ThemedCard>
            <View style={styles.headerRow}>
              <ThemedText style={styles.title}>Active Blotter Reportsssss</ThemedText>
            </View>

            <Spacer height={10} />
            <ThemedDivider />
            <Spacer height={10} />

            {loading && (
              <View style={{ paddingVertical: 12, alignItems: 'center' }}>
                <ActivityIndicator />
                <Spacer height={6} />
                <ThemedText muted>Loading cases…</ThemedText>
              </View>
            )}

            {!loading && filtered.length === 0 && (
              <ThemedText style={styles.empty}>No active blotter reports right now.</ThemedText>
            )}

            {!loading && filtered.map((item) => {
              const ui = STATUS_UI[item.statusName] || FALLBACK_STATUS;
              const isOpen = !!expanded[item.id];
              const isBusy = !!timelineLoading[item.id];
              const timeline = timelineCache[item.id] || [];

              return (
                <View key={item.id} style={{ marginBottom: 12 }}>
                  <ThemedItemCard
                    title={item.caseTitle}
                    meta1={`Case #: ${item.caseNo}`}
                    meta2={`Filed: ${item.filedAtHuman}`}
                    showPill
                    pillLabel={ui.label}
                    pillBgColor={ui.bg}
                    pillTextColor={ui.fg}
                    pillSize="sm"
                    onPress={() => toggleExpand(item.id)} // tap card to view inline timeline
                  />

                  {/* Inline timeline */}
                  {isOpen && (
                    <View style={styles.timelineWrap}>
                      <View style={styles.timelineHeader}>
                        <ThemedText style={{ fontWeight: '700' }}>Timeline</ThemedText>
                        <TouchableOpacity onPress={() => openTimelinePage(item.id)} activeOpacity={0.8}>
                          <ThemedText style={styles.link}>Open full timeline ↗</ThemedText>
                        </TouchableOpacity>
                      </View>

                      {isBusy && (
                        <View style={{ paddingVertical: 8, alignItems: 'center' }}>
                          <ActivityIndicator />
                          <Spacer height={6} />
                          <ThemedText muted>Loading timeline…</ThemedText>
                        </View>
                      )}

                      {!isBusy && timeline.length === 0 && (
                        <ThemedText muted style={{ paddingVertical: 6 }}>No events yet.</ThemedText>
                      )}

                      {!isBusy && timeline.map((ev, idx) => (
                        <View key={idx} style={styles.eventRow}>
                          <View style={styles.dot} />
                          <View style={{ flex: 1 }}>
                            <ThemedText style={styles.eventLabel}>{ev.label}</ThemedText>
                            <ThemedText muted style={styles.eventMeta}>{ev.tsHuman}</ThemedText>
                            {!!ev.detail && <ThemedText style={styles.eventDetail}>{ev.detail}</ThemedText>}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ThemedCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

export default AllActive;

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  empty: { textAlign: 'center', opacity: 0.6, paddingVertical: 8 },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  chipSelected: { borderColor: '#310101' },
  chipText: { fontSize: 12 },
  chipTextSelected: { color: '#310101', fontWeight: '600' },

  timelineWrap: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#fff',
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  link: { color: '#1e40af', fontWeight: '600' },
  eventRow: { flexDirection: 'row', gap: 10, paddingVertical: 6, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#310101', marginTop: 7 },
  eventLabel: { fontWeight: '700' },
  eventMeta: { fontSize: 12, marginTop: 2 },
  eventDetail: { marginTop: 2 },
});
