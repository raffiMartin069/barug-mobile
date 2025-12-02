import CenteredModal from '@/components/custom/CenteredModal';
import ThemedAppBar from '@/components/ThemedAppBar';
// ThemedButton not required here; modal actions provide buttons.
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedChip from '@/components/ThemedChip';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import { useNiceModal } from '@/hooks/NiceModalProvider';
import { useSession } from '@/providers/SessionProvider';
import { ChildHealthCommands } from '@/repository/commands/ChildHealthCommands';
import ChildHealthQueryClass from '@/repository/queries/ChildHealthQuery';
import ChildVisitQuery, { ChildMonitoringLogDto } from '@/repository/queries/ChildVisitQuery';
import ChildVisitScheduleQuery from '@/repository/queries/ChildVisitScheduleQuery';
import { StaffRepository } from '@/repository/StaffRepository';
import validateChildVisitData, { ChildVisitDomainException } from '@/repository/validators/ChildVisitValidator';
import { useAccountRole } from '@/store/useAccountRole';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

const query = new ChildHealthQueryClass();
const commands = new ChildHealthCommands();
const visitQuery = new ChildVisitScheduleQuery();
const childVisitQuery = new ChildVisitQuery();
const staffRepo = new StaffRepository();

// Format an ISO date/time (or parsable date string) into a short date + 12-hour time
function formatDateTime12(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  const datePart = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart} ${timePart}`;
}

const MinimalCard = ({ item, onSaved }: { item: any; onSaved?: () => void }) => {
  // Show minimal fields: child id, child name (person), birthdate, family_num if available
  const name = item.person ? `${item.person.first_name ?? ''} ${item.person.last_name ?? ''}`.trim() : 'Unknown';
  // If person.birthdate is present, show it as-is (usually date-only). Otherwise format created_at to date + 12-hour time.
  const birth = item.person?.birthdate
    ? String(item.person.birthdate)
    : item.created_at
    ? formatDateTime12(item.created_at)
    : null;
  const familyNum = item.family?.family_num ?? null;
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'menu' | 'profile' | 'visit' | 'logList' | 'logDetail'>('menu');
  
  // monitoring log states
  const [monitoringLogs, setMonitoringLogs] = useState<ChildMonitoringLogDto[]>([]);
  const [selectedLog, setSelectedLog] = useState<ChildMonitoringLogDto | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 5;

  // visit form state
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [temp, setTemp] = useState('');
  const [height, setHeight] = useState('');
  const [notes, setNotes] = useState('');

  const session = useSession()
  const staffId = useAccountRole((s) => s.staffId)
  const { showModal } = useNiceModal()

  // Load monitoring logs when user clicks "Monitoring Log"
  const handleLoadMonitoringLogs = React.useCallback(async () => {
    setLoadingLogs(true);
    setLogPage(1); // Reset to first page
    try {
      const logs = await childVisitQuery.GetMonitoringLogsByChildRecordId(item.child_record_id);
      setMonitoringLogs(logs ?? []);
      setViewMode('logList');
    } catch (err) {
      console.error('Failed to load monitoring logs', err);
      showModal({ title: 'Error', message: 'Failed to load monitoring logs', variant: 'error' });
    } finally {
      setLoadingLogs(false);
    }
  }, [item.child_record_id, showModal]);

  const handleSaveVisit = React.useCallback(async () => {
    // validate payload using centralized validator (throws ChildVisitDomainException on validation errors)
    const rawPayload = {
      child_record_id: item.child_record_id,
      age: age ?? '',
      weight: weight ?? '',
      temp: temp ?? '',
      height: height ?? '',
      findings: null,
      notes: notes ?? null,
      visit_date: new Date().toISOString(),
    };

    let validated;
    try {
      validated = await validateChildVisitData(rawPayload, visitQuery);
    } catch (err: any) {
      if (err instanceof ChildVisitDomainException || err?.name === 'ChildVisitDomainException' || err?.code) {
        // domain validation error from validator
        showModal({ title: 'Validation error', message: String(err.message ?? 'Validation failed'), variant: 'error' });
        return;
      }
      console.error('Validation failed unexpectedly', err);
      showModal({ title: 'Validation error', message: 'Validation failed unexpectedly.', variant: 'error' });
      return;
    }
    try {
      // determine assessed_by id: prefer store staffId; otherwise try to resolve staff by current person's id
      let assessedBy: number | null = null;
      if (staffId) {
        assessedBy = staffId;
      } else if (session?.profile?.person_id) {
        try {
          const staffRec = await staffRepo.GetStaffByPersonId(Number(session.profile.person_id));
          if (staffRec && staffRec.staff_id) {
            assessedBy = Number(staffRec.staff_id);
          }
        } catch (e) {
          console.error('Failed to resolve staff by person id:', e);
        }
      }

      // fallback to whoever added the record or a safe default
      if (!assessedBy) assessedBy = item.added_by_id ?? 1;

      await commands.AddMonitoringLogUniqueDate({
        p_child_record_id: Number(item.child_record_id),
        p_assessed_by_id: assessedBy,
        p_check_date: new Date().toISOString(),
        p_age: validated.age,
        p_weight: validated.weight,
        p_temperature: validated.temp,
        p_height: validated.height,
        p_findings: validated.findings ?? null,
        p_notes: validated.notes ?? null,
      });

      // success — rpcRes may contain payload; notify user
      showModal({ title: 'Saved', message: 'Visit saved successfully.', variant: 'success' });
      setOpen(false);
      setViewMode('menu');
      setAge(''); setWeight(''); setTemp(''); setHeight(''); setNotes('');

      // notify parent to refresh the list
      try { onSaved && onSaved() } catch {}
    } catch (err: any) {
      // If this is a domain error we converted to ChildMonitoringException, show its message
      if (err?.name === 'ChildMonitoringException') {
        showModal({ title: 'Save failed', message: String(err.message ?? ''), variant: 'error' })
        return;
      }

      console.error('Error saving visit', err);
      showModal({ title: 'Save failed', message: 'An unexpected error occurred.', variant: 'error' })
    }
  }, [item, age, weight, temp, height, notes, onSaved, staffId, session?.profile?.person_id, showModal]);

  const modalActions = React.useMemo(() => {
    if (viewMode === 'menu') {
      return [
        { label: 'View Child Information', onPress: () => setViewMode('profile'), submit: false },
        { label: 'Add Monitoring', onPress: () => setViewMode('visit'), submit: false },
        { label: 'Monitoring Log', onPress: handleLoadMonitoringLogs, submit: false },
      ];
    }

    if (viewMode === 'profile') {
      return [
        { label: 'Back', onPress: () => setViewMode('menu'), submit: false },
      ];
    }

    if (viewMode === 'visit') {
      return [
        { label: 'Save', onPress: handleSaveVisit, submit: true },
        { label: 'Cancel', onPress: () => setViewMode('menu'), submit: false },
      ];
    }

    if (viewMode === 'logList') {
      return [
        { label: 'Back', onPress: () => setViewMode('menu'), submit: false },
      ];
    }

    if (viewMode === 'logDetail') {
      return [
        { label: 'Back to List', onPress: () => setViewMode('logList'), submit: false },
      ];
    }

    return [];
  }, [viewMode, handleSaveVisit, handleLoadMonitoringLogs]);

  // Paginate monitoring logs
  const totalLogPages = Math.max(1, Math.ceil(monitoringLogs.length / logsPerPage));
  const displayedLogs = React.useMemo(() => {
    const start = (logPage - 1) * logsPerPage;
    return monitoringLogs.slice(start, start + logsPerPage);
  }, [monitoringLogs, logPage, logsPerPage]);

  return (
    <ThemedCard style={[styles.card, { position: 'relative' }]}> 
      <View>
        <ThemedText style={styles.title}>{name}</ThemedText>
        {birth ? <ThemedText muted style={styles.meta}>DOB: {String(birth)}</ThemedText> : null}
        {familyNum ? <ThemedText muted style={styles.meta}>Family: {familyNum}</ThemedText> : null}
        {item.delivery_place_type && item.delivery_place_type.delivery_place_type_name ? (
          <ThemedText muted style={styles.meta}>Delivery: {String(item.delivery_place_type.delivery_place_type_name)}</ThemedText>
        ) : item.delivery_place_type_id ? (
          <ThemedText muted style={styles.meta}>Delivery: {String(item.delivery_place_type_id)}</ThemedText>
        ) : null}
      </View>

      {/* Chip positioned middle-right - pass onPress directly into ThemedChip to avoid nested Pressable issues */}
      <View style={styles.chipWrap}>
        <ThemedChip
          label={'…'}
          filled={false}
          onPress={() => { setViewMode('menu'); setOpen(true); }}
          style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}
        />
      </View>

      {/* CenteredModal: menu -> profile or visit or logList or logDetail */}
      <CenteredModal
        visible={open}
        title={
          viewMode === 'profile' ? name 
          : viewMode === 'visit' ? 'New Visit' 
          : viewMode === 'logList' ? 'Monitoring Dates'
          : viewMode === 'logDetail' ? 'Monitoring Details'
          : 'Actions'
        }
        actions={modalActions}
        onClose={() => { setOpen(false); setViewMode('menu'); setSelectedLog(null); }}
        contentStyle={{ padding: 12 }}
        titleStyle={{ marginBottom: 6 }}
      >
        {viewMode === 'menu' && (
          <View>
            <ThemedText muted>Select an action below</ThemedText>
          </View>
        )}

        {viewMode === 'logList' && (
          <View>
            {loadingLogs ? (
              <ActivityIndicator size="small" />
            ) : monitoringLogs.length === 0 ? (
              <ThemedText muted>No monitoring logs found.</ThemedText>
            ) : (
              <View>
                <ThemedText muted style={{ marginBottom: 12, fontSize: 12 }}>
                  Showing {displayedLogs.length} of {monitoringLogs.length} records
                </ThemedText>
                
                {displayedLogs.map((log) => {
                  const dateObj = log.check_date ? new Date(log.check_date) : null;
                  const dateStr = dateObj ? dateObj.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: '2-digit', 
                    year: 'numeric' 
                  }) : 'Unknown Date';
                  
                  return (
                    <Pressable
                      key={log.child_monitoring_id}
                      onPress={() => {
                        setSelectedLog(log);
                        setViewMode('logDetail');
                      }}
                    >
                      <ThemedCard style={{ marginBottom: 8, padding: 12 }}>
                        <ThemedText style={{ fontWeight: '600', fontSize: 14 }}>{dateStr}</ThemedText>
                        <ThemedText muted style={{ fontSize: 12, marginTop: 2 }}>
                          Weight: {log.weight ?? 'N/A'} kg • Temp: {log.temperature ?? 'N/A'} °C
                        </ThemedText>
                      </ThemedCard>
                    </Pressable>
                  );
                })}

                {/* Pagination controls for logs */}
                {totalLogPages > 1 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 12, gap: 8 }}>
                    <ThemedButton 
                      label="Prev" 
                      onPress={() => setLogPage((p) => Math.max(1, p - 1))}
                      disabled={logPage === 1}
                    />
                    <ThemedText style={{ fontSize: 12 }}>Page {logPage} / {totalLogPages}</ThemedText>
                    <ThemedButton 
                      label="Next" 
                      onPress={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                      disabled={logPage === totalLogPages}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {viewMode === 'logDetail' && selectedLog && (
          <View>
            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Check Date</ThemedText>
              <ThemedText muted>{selectedLog.check_date ? new Date(selectedLog.check_date).toLocaleDateString() : 'N/A'}</ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Age</ThemedText>
              <ThemedText muted>{selectedLog.age !== null && selectedLog.age !== undefined ? String(selectedLog.age) : 'N/A'}</ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Weight (kg)</ThemedText>
              <ThemedText muted>{selectedLog.weight !== null && selectedLog.weight !== undefined ? String(selectedLog.weight) : 'N/A'}</ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Temperature (°C)</ThemedText>
              <ThemedText muted>{selectedLog.temperature !== null && selectedLog.temperature !== undefined ? String(selectedLog.temperature) : 'N/A'}</ThemedText>
            </View>

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Height (cm)</ThemedText>
              <ThemedText muted>{selectedLog.height !== null && selectedLog.height !== undefined ? String(selectedLog.height) : 'N/A'}</ThemedText>
            </View>

            {selectedLog.findings && (
              <View style={{ marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '700' }}>Findings</ThemedText>
                <ThemedText muted>{selectedLog.findings}</ThemedText>
              </View>
            )}

            {selectedLog.notes && (
              <View style={{ marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '700' }}>Notes</ThemedText>
                <ThemedText muted>{selectedLog.notes}</ThemedText>
              </View>
            )}

            <View style={{ marginBottom: 8 }}>
              <ThemedText style={{ fontWeight: '700' }}>Monitoring ID</ThemedText>
              <ThemedText muted>{selectedLog.child_monitoring_id}</ThemedText>
            </View>

            {selectedLog.visit_id && (
              <View style={{ marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '700' }}>Visit ID</ThemedText>
                <ThemedText muted>{selectedLog.visit_id}</ThemedText>
              </View>
            )}
          </View>
        )}

        {viewMode === 'profile' && (
            <View>
              {/* helper to render a label/value row */}
              {/**/}
              <View style={{ marginBottom: 8 }}>
                <ThemedText style={{ fontWeight: '700' }}>Child ID</ThemedText>
                <ThemedText muted>{String(item.child_record_id ?? '')}</ThemedText>
              </View>

              {item.created_at ? (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700' }}>Created At</ThemedText>
                  <ThemedText muted>{formatDateTime12(item.created_at)}</ThemedText>
                </View>
              ) : null}

              {item.birth_order !== undefined && item.birth_order !== null ? (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700' }}>Birth Order</ThemedText>
                  <ThemedText muted>{String(item.birth_order)}</ThemedText>
                </View>
              ) : null}

              {item.delivery_place_type || item.delivery_place_type_id !== undefined ? (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700' }}>Delivery Place Type</ThemedText>
                  <ThemedText muted>
                    {item.delivery_place_type && item.delivery_place_type.delivery_place_type_name
                      ? String(item.delivery_place_type.delivery_place_type_name)
                      : item.delivery_place_type_id !== undefined
                      ? String(item.delivery_place_type_id)
                      : ''}
                  </ThemedText>
                </View>
              ) : null}

              {item.is_transferred !== undefined ? (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700' }}>Is Transferred</ThemedText>
                  <ThemedText muted>{item.is_transferred ? 'Yes' : 'No'}</ThemedText>
                </View>
              ) : null}

              {item.added_by_id ? (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700' }}>Added By (ID)</ThemedText>
                  <ThemedText muted>{String(item.added_by_id)}</ThemedText>
                </View>
              ) : null}

              {/* Person details */}
              {item.person && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Person</ThemedText>
                  <ThemedText muted>Name: {`${item.person.first_name ?? ''} ${item.person.middle_name ?? ''} ${item.person.last_name ?? ''}`.trim()}</ThemedText>
                  {item.person.birthdate ? <ThemedText muted>DOB: {String(item.person.birthdate)}</ThemedText> : null}
                  {item.person.sex ? <ThemedText muted>Sex: {String(item.person.sex)}</ThemedText> : null}
                  {item.person.person_id ? <ThemedText muted>Person ID: {String(item.person.person_id)}</ThemedText> : null}
                </View>
              )}

              {/* Mother / Father */}
              {item.mother && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Mother</ThemedText>
                  <ThemedText muted>{`${item.mother.first_name ?? ''} ${item.mother.last_name ?? ''}`.trim()}</ThemedText>
                  {item.mother.person_id ? <ThemedText muted>Person ID: {String(item.mother.person_id)}</ThemedText> : null}
                </View>
              )}

              {item.father && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Father</ThemedText>
                  <ThemedText muted>{`${item.father.first_name ?? ''} ${item.father.last_name ?? ''}`.trim()}</ThemedText>
                  {item.father.person_id ? <ThemedText muted>Person ID: {String(item.father.person_id)}</ThemedText> : null}
                </View>
              )}

              {/* Family / Household / Address / Purok */}
              {item.family && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Family</ThemedText>
                  <ThemedText muted>Family #: {String(item.family.family_num ?? '')}</ThemedText>
                  {item.family.family_id ? <ThemedText muted>Family ID: {String(item.family.family_id)}</ThemedText> : null}
                </View>
              )}

              {item.household && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Household</ThemedText>
                  <ThemedText muted>Household #: {String(item.household.household_num ?? '')}</ThemedText>
                  {item.household.household_id ? <ThemedText muted>Household ID: {String(item.household.household_id)}</ThemedText> : null}
                </View>
              )}

              {item.address && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Address</ThemedText>
                  {item.address.street ? <ThemedText muted>Street: {String(item.address.street)}</ThemedText> : null}
                  {item.address.barangay ? <ThemedText muted>Barangay: {String(item.address.barangay)}</ThemedText> : null}
                </View>
              )}

              {item.purok && (
                <View style={{ marginBottom: 8 }}>
                  <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>Purok</ThemedText>
                  <ThemedText muted>{String(item.purok.name ?? item.purok.purok_num ?? '')}</ThemedText>
                </View>
              )}

              <View style={styles.gap12} />
            </View>
          )}

        {viewMode === 'visit' && (
          <View>
            <ThemedText style={{ marginTop: 6 }}>Age</ThemedText>
            <ThemedTextInput keyboardType="decimal-pad" value={age} onChangeText={setAge} placeholder="Age" />

            <ThemedText style={{ marginTop: 6 }}>Weight (kg)</ThemedText>
            <ThemedTextInput keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="Weight" />

            <ThemedText style={{ marginTop: 6 }}>Temp (°C)</ThemedText>
            <ThemedTextInput keyboardType="decimal-pad" value={temp} onChangeText={setTemp} placeholder="Temperature" />

            <ThemedText style={{ marginTop: 6 }}>Height (cm)</ThemedText>
            <ThemedTextInput keyboardType="decimal-pad" value={height} onChangeText={setHeight} placeholder="Height" />

            <ThemedText style={{ marginTop: 6 }}>Notes</ThemedText>
            <ThemedTextInput value={notes} onChangeText={setNotes} placeholder="Notes" multiline numberOfLines={4} style={{ minHeight: 80 }} />

            <View style={styles.gap12} />
          </View>
        )}
      </CenteredModal>
    </ThemedCard>
  );
};

export default function ChildScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [queryText, setQueryText] = useState('');

  

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await query.GetAllChildHealthRecords();
        if (!mounted) return;
        if (res === null) {
          setRecords([]);
        } else {
          setRecords(res);
        }
      } catch (err: any) {
        console.error('Failed to load child records', err);
        if (mounted) setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await query.GetAllChildHealthRecords();
      setRecords(res ?? []);
    } catch (err) {
      console.error('Refresh failed', err);
      setError(String(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = (queryText || '').trim().toLowerCase();
    if (!q) return records;
    return records.filter((r: any) => {
      const name = r.person ? `${r.person.first_name ?? ''} ${r.person.last_name ?? ''}`.toLowerCase() : '';
      const family = r.family?.family_num ? String(r.family.family_num).toLowerCase() : '';
      return name.includes(q) || family.includes(q) || String(r.child_record_id).includes(q);
    });
  }, [records, queryText]);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // reset page when query changes
  React.useEffect(() => setCurrentPage(1), [queryText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  if (loading) {
    return (
      <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
        <ThemedAppBar title="Child Health Records" />
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </ThemedView>
    )
  }

  if (error) {
    return (
      <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
        <ThemedAppBar title="Child Health Records" />
        <View style={styles.center}>
          <ThemedText>Failed to load child records: {error}</ThemedText>
        </View>
      </ThemedView>
    )
  }

  return (
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title="Child Health Records" showNotif={false} />

      <View style={{ padding: 12 }}>
        <ThemedTextInput
          value={queryText}
          onChangeText={setQueryText}
          placeholder="Search by name or family number"
          showClearButton
          onRemove={() => setQueryText('')}
        />
        <View style={{ height: 8 }} />
      </View>

      <View style={styles.container}>
        <FlatList
          data={displayed}
          keyExtractor={(it) => String(it.child_record_id)}
          renderItem={({ item }) => <MinimalCard item={item} onSaved={onRefresh} />}
          ListEmptyComponent={<ThemedText style={styles.empty}>No child records found.</ThemedText>}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />

        {/* Pagination controls */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, gap: 8 }}>
          <ThemedButton label="Prev" onPress={() => setCurrentPage((p) => Math.max(1, p - 1))} />
          <ThemedText>Page {currentPage} of {totalPages}</ThemedText>
          <ThemedButton label="Next" onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} />
        </View>
      </View>
    </ThemedView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { marginTop: 4, fontSize: 13 },
  empty: { textAlign: 'center', marginTop: 20 },
  chipWrap: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -16 }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  // small gap helper (for platforms without gap support)
  gap8: { height: 8 },
  gap12: { height: 12 },
});
