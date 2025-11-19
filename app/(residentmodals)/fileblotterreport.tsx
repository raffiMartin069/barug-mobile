// app/blotter/file.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import dayjs from 'dayjs';

import Spacer from '@/components/Spacer';
import ThemedAppBar from '@/components/ThemedAppBar';
import ThemedCard from '@/components/ThemedCard';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedSearchSelect from '@/components/ThemedSearchSelect';
import ThemedDatePicker from '@/components/ThemedDatePicker';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  createBlotterReport,
  searchResidents,
  type ResidentLite,
} from '@/services/blotterReport';

// NEW: read the cached resident profile (to get person_id)
import { useAccountRole } from '@/store/useAccountRole';

/* ---------------- Helpers ---------------- */

const toTitleCase = (str: string) =>
  (str || '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const pickOne = (v: unknown): string => {
  if (Array.isArray(v)) return v[0] ?? '';
  return v != null ? String(v) : '';
};

type Respondent = {
  person_id: number;
  name: string;
  address?: string | null;
};

const accent = '#6d2932';
const wash = '#fafafa';
const ink = '#1f2937';
const line = '#e5e7eb';
const muted = '#6b7280';

type Errors = {
  subject?: string | null;
  desc?: string | null;
  address?: string | null;
  date?: string | null;
  time?: string | null;
};

export default function FileBlotterReport() {
  const router = useRouter();

  // ---- Get resident (complainant) from RoleStore ----
  const roleStore = useAccountRole();
  const cachedProfile = roleStore.getProfile('resident'); // fast, no network
  const [me, setMe] = useState<any | null>(cachedProfile ?? null);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!cachedProfile) {
        const fresh = await roleStore.ensureLoaded('resident');
        if (!live) return;
        if (fresh) setMe(fresh);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Get address pieces from /mapaddress ----
  const params = useLocalSearchParams<{
    street?: string | string[];
    purok_name?: string | string[];
    brgy?: string | string[];
    city?: string | string[];
    lat?: string | string[];
    lng?: string | string[];
    purok_code?: string | string[];
  }>();

  const streetParam = pickOne(params.street);
  const purokParam = toTitleCase(pickOne(params.purok_name));
  const brgyParam = pickOne(params.brgy);
  const cityParam = pickOne(params.city);

  // Selected respondents (multi)
  const [respondents, setRespondents] = useState<Respondent[]>([]);

  // Form state
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');

  // Date & time
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState(dayjs().format('HH:mm'));

  // Incident address (composed)
  const [address, setAddress] = useState('');

  // lat/lng optional
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');

  // Validation
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (streetParam || purokParam || brgyParam || cityParam) {
      const full = [streetParam, purokParam, brgyParam, cityParam].filter(Boolean).join(', ');
      setAddress(full);
    }
  }, [streetParam, purokParam, brgyParam, cityParam]);

  useEffect(() => {
    const latParam = pickOne(params.lat);
    const lngParam = pickOne(params.lng);
    if (latParam || lngParam) {
      setLat(latParam || '');
      setLng(lngParam || '');
    }
  }, [params.lat, params.lng]);

  const [busy, setBusy] = useState(false);

  // ---------------- Resident search (Supabase) ----------------
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<ResidentLite[]>([]);
  const [searching, setSearching] = useState(false);

  // debounce search
  useEffect(() => {
    const q = (searchText || '').trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let alive = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchResidents(q);
        if (alive) {
          setSearchResults(res);
        }
      } catch {
        if (alive) setSearchResults([]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [searchText]);

  const addRespondent = (p: ResidentLite) => {
    const entry: Respondent = {
      person_id: Number(p.person_id),
      name: p.full_name,
      address: p.address,
    };
    setRespondents((prev) =>
      prev.find((x) => x.person_id === entry.person_id) ? prev : [...prev, entry]
    );
  };

  const removeRespondent = (person_id: number) => {
    setRespondents((prev) => prev.filter((r) => r.person_id !== person_id));
  };

  /* ---------------- Normalizers for pickers ---------------- */

  const setDateFromPicker = (next: Date | string | undefined) => {
    if (next instanceof Date && !isNaN(next.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const v = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
      setDate(v);
      setErrors((e) => ({ ...e, date: null }));
    } else if (typeof next === 'string') {
      setDate(next);
      setErrors((e) => ({ ...e, date: null }));
    } else {
      setDate('');
    }
  };

  const setTimeFromPicker = (next: Date | string | undefined) => {
    if (next instanceof Date && !isNaN(next.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const v = `${pad(next.getHours())}:${pad(next.getMinutes())}`;
      setTime(v);
      setErrors((e) => ({ ...e, time: null }));
    } else if (typeof next === 'string') {
      const m = next.match(/^(\d{1,2}):(\d{2})/);
      if (m) {
        const hh = String(m[1]).padStart(2, '0');
        const v = `${hh}:${m[2]}`;
        setTime(v);
        setErrors((e) => ({ ...e, time: null }));
      } else {
        setTime(next);
      }
    } else {
      setTime('');
    }
  };

  function validate(): string | null {
    const next: Errors = {};
    if (!subject.trim()) next.subject = 'Subject is required.';
    if (!desc.trim()) next.desc = 'Description is required.';
    if (!address.trim()) next.address = 'Incident location is required.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = 'Use YYYY-MM-DD.';
    if (!/^\d{2}:\d{2}$/.test(time)) next.time = 'Use HH:mm (24h).';

    setErrors(next);
    const firstError = Object.values(next).find(Boolean) as string | undefined;
    return firstError || null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) {
      Alert.alert('Fix form', err);
      return;
    }

    // Show confirmation dialog first
    Alert.alert(
      'Confirm Submission',
      'Do you really want to submit this blotter report?\n\nBy proceeding, you confirm that all information provided is factual, accurate, and complete. False reporting may result in legal consequences.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit Report',
          style: 'default',
          onPress: async () => {
            // 🔑 complainant/reporting person = current resident
            const complainantId = Number(me?.person_id) || null;

            const payload = {
              incidentSubject: subject.trim(),
              incidentDesc: desc.trim(),
              incidentDate: date,
              incidentTime: time,

              // If you ever have a chosen address_id from the map picker, pass it here; else keep null:
              incidentAddressId: null,

              // Send raw map fields + coords so the service can create addresss
              mapStreet: streetParam || null,
              mapPurok: purokParam || null,
              mapBarangay: brgyParam || null,
              mapCity: cityParam || null,
              incidentLat: lat ? parseFloat(lat) : null,
              incidentLng: lng ? parseFloat(lng) : null,

              // Set complainant to the logged-in resident
              complainantId,
              // Use the same ID for "reported_by" (service forwards this to RPC)
              reportedByPersonId: complainantId,

              respondentIds: respondents.map((r) => Number(r.person_id)),
              evidenceUris: [], // attachments disabled by design
            } as const;

            setBusy(true);
            try {
              await createBlotterReport(payload as any);
              Alert.alert('Submitted', 'Your blotter report was sent successfully.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e: any) {
              const msg =
                e?.data?.detail ||
                e?.data?.error ||
                e?.message ||
                'Please try again.';
              Alert.alert('Submit failed', msg);
            } finally {
              setBusy(false);
            }
          }
        }
      ]
    );
  }

  const goPickIncidentAddress = () => {
    router.push({
      pathname: '/mapaddress',
      params: { returnTo: '(residentmodals)/fileblotterreport' },
    });
  };

  const filteredResults = useMemo(() => {
    const q = (searchText || '').toLowerCase();
    if (!q) return searchResults;
    return searchResults.filter((p) =>
      p.full_name.toLowerCase().includes(q) ||
      (p.person_code || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    );
  }, [searchText, searchResults]);

  const fillNowDate = () => {
    setDate(dayjs().format('YYYY-MM-DD'));
    setErrors((e) => ({ ...e, date: null }));
  };
  const fillNowTime = () => {
    setTime(dayjs().format('HH:mm'));
    setErrors((e) => ({ ...e, time: null }));
  };

  const complainantName =
    me?.full_name || me?.display_name || me?.name || 'You';

  return (
    <ThemedView safe style={{ flex: 1, backgroundColor: wash }}>
      <ThemedAppBar title="File a Blotter Report" showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Progress */}
        <ThemedCard style={styles.card}>
          <View style={styles.row}>
            <ThemedIcon name="clipboard-outline" size={18} containerSize={24} bgColor={accent} />
            <ThemedText style={styles.cardTitle}>Blotter Report Form</ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Notice */}
        <ThemedCard style={styles.card}>
          <ThemedText style={styles.notice}>
            Filing as: <ThemedText style={{ fontWeight: '600', color: accent }}>{complainantName}</ThemedText>
          </ThemedText>
          <ThemedText style={styles.warning}>
            Ensure all information is accurate. False reporting may result in legal consequences.
          </ThemedText>
        </ThemedCard>

        <Spacer height={16} />

        {/* Incident Location */}
        <ThemedCard style={styles.card}>
          <SectionHeader icon="location-outline" title="Incident Location" />

          <Label required>Pick on map</Label>
          <Pressable onPress={goPickIncidentAddress} style={{ borderRadius: 8 }}>
            <TextField
              placeholder="Tap to pick (Street, Purok/Sitio, Barangay, City)"
              multiline
              numberOfLines={2}
              value={address}
              onChangeText={() => {}}
              editable={false}
              pointerEvents="none"
              error={!!errors.address}
            />
          </Pressable>
          {!!errors.address && <FieldError text={errors.address!} />}

          {(lat || lng) && (
            <>
              <Spacer height={6} />
              <ThemedText muted style={{ fontSize: 12 }}>
                Coordinates: {lat || '—'}, {lng || '—'}
              </ThemedText>
            </>
          )}

          <Spacer height={8} />
          <View style={styles.tipBox}>
            <ThemedIcon name="map-outline" size={16} containerSize={22} bgColor={muted} />
            <ThemedText muted style={{ marginLeft: 8, flex: 1 }}>
              Use landmarks and the exact purok/sitio for faster response.
            </ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Incident Details */}
        <ThemedCard style={styles.card}>
          <SectionHeader icon="document-text-outline" title="Incident Details" />

          <Label required>Subject</Label>
          <TextField
            value={subject}
            onChangeText={(v) => {
              const cleaned = v.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
              setSubject(cleaned);
              if (errors.subject) setErrors((e) => ({ ...e, subject: null }));
            }}
            placeholder="e.g., Loud altercation"
            error={!!errors.subject}
            maxLength={100}
          />
          <View style={styles.hintRow}>
            <ThemedText muted style={{ fontSize: 12 }}>{subject.length}/100</ThemedText>
          </View>
          {!!errors.subject && <FieldError text={errors.subject!} />}

          <Spacer height={10} />

          <Label required>Description</Label>
          <TextField
            value={desc}
            onChangeText={(v) => {
              const cleaned = v.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
              setDesc(cleaned);
              if (errors.desc) setErrors((e) => ({ ...e, desc: null }));
            }}
            placeholder="What happened?"
            multiline
            style={{ minHeight: 110, textAlignVertical: 'top' }}
            error={!!errors.desc}
          />
          <View style={styles.hintRow}>
            <ThemedText muted style={{ fontSize: 12 }}>{desc.length}/1000</ThemedText>
            <ThemedText muted style={{ fontSize: 12 }}>Be specific and factual.</ThemedText>
          </View>
          {!!errors.desc && <FieldError text={errors.desc!} />}

          <Spacer height={12} />

          {/* Date / Time */}
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Label required>Date</Label>
              <ThemedDatePicker
                value={date ? new Date(date) : undefined}
                mode="date"
                onChange={setDateFromPicker}
                placeholder="YYYY-MM-DD"
                maximumDate={new Date()}
              />
              {!!errors.date && <FieldError text={errors.date!} />}
              <QuickBtn icon="time-outline" label="Now" onPress={fillNowDate} />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Label required>Time</Label>
              <ThemedDatePicker
                value={time ? dayjs(`2000-01-01T${time}:00`).toDate() : undefined}
                mode="time"
                onChange={setTimeFromPicker}
                placeholder="HH:mm"
              />
              {!!errors.time && <FieldError text={errors.time!} />}
              <QuickBtn icon="flash-outline" label="Now" onPress={fillNowTime} />
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Respondents */}
        <ThemedCard style={styles.card}>
          <SectionHeader icon="people-outline" title="Respondents (Optional)" />

          {respondents.length > 0 && (
            <>
              <View style={styles.selectedHeader}>
                <ThemedText style={{ fontWeight: '700' }}>
                  Selected ({respondents.length})
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setRespondents([])}
                  style={styles.linkBtn}
                >
                  <ThemedText style={{ fontWeight: '700', color: accent }}>Clear</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {respondents.map((r) => (
                  <View key={r.person_id} style={styles.chip}>
                    <ThemedText style={{ fontWeight: '600', fontSize: 13 }}>{r.name}</ThemedText>
                    <TouchableOpacity onPress={() => removeRespondent(r.person_id)} style={{ marginLeft: 8 }}>
                      <ThemedIcon name="close" size={14} containerSize={18} bgColor={accent} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </>
          )}

          <ThemedSearchSelect<ResidentLite>
            items={filteredResults}
            getLabel={(p) => p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={searchText}
            onInputValueChange={(v) => setSearchText(v)}
            placeholder={searching ? 'Searching…' : 'Search resident by name or ID…'}
            emptyText={searchText.length < 2 ? 'Type at least 2 characters' : 'No matches'}
            fillOnSelect={false}
            onSelect={(p) => addRespondent(p)}
          />
          <View style={styles.hintRow}>
            <ThemedText muted style={{ fontSize: 12 }}>
              Can't find someone? You may leave this blank.
            </ThemedText>
          </View>
        </ThemedCard>

        <Spacer height={20} />

        {/* Submit */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={busy}
          style={[styles.submitBtn, busy && { opacity: 0.7 }]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <ThemedIcon name="send" size={18} containerSize={22} bgColor="transparent" />
              <ThemedText style={styles.submitText}>Submit Report</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
}

/* ---------------- Small UI helpers ---------------- */

function Bullet({ icon, text, color }: { icon: string; text: string; color?: string }) {
  return (
    <View style={styles.bulletRow}>
      <ThemedIcon name={icon} size={16} containerSize={22} bgColor={color || accent} />
      <ThemedText muted style={styles.bulletText}>
        {text}
      </ThemedText>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={[styles.row, { marginBottom: 12 }]}>
      <ThemedIcon name={icon} bgColor={accent} size={16} containerSize={22} />
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
    </View>
  );
}

function Step({ icon, text, active, completed }: { icon: string; text: string; active?: boolean; completed?: boolean }) {
  return (
    <View style={styles.stepContainer}>
      <View style={[styles.stepIcon, completed ? styles.stepIconCompleted : active ? styles.stepIconActive : styles.stepIconInactive]}>
        <ThemedIcon
          name={completed ? 'checkmark' : icon}
          size={16}
          containerSize={20}
          bgColor="transparent"
        />
      </View>
      <ThemedText style={[styles.stepText, (active || completed) ? styles.stepTextActive : styles.stepTextInactive]}>
        {text}
      </ThemedText>
    </View>
  );
}

function StepConnector({ active }: { active?: boolean }) {
  return <View style={[styles.stepConnector, active ? styles.stepConnectorActive : styles.stepConnectorInactive]} />;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <ThemedText style={{ fontWeight: '600', color: ink }}>{children}</ThemedText>
      {required && <ThemedText style={{ color: accent, marginLeft: 4 }}>*</ThemedText>}
    </View>
  );
}

function FieldError({ text }: { text: string }) {
  return <ThemedText style={{ color: accent, marginTop: 4, fontSize: 12 }}>{text}</ThemedText>;
}

function QuickBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.quickBtn}>
      <ThemedIcon name={icon} size={14} containerSize={18} bgColor={muted} />
      <ThemedText style={{ marginLeft: 6, fontWeight: '600', fontSize: 12 }}>{label}</ThemedText>
    </TouchableOpacity>
  );
}

function TextField(
  props: React.ComponentProps<typeof TextInput> & { error?: boolean }
) {
  const { error, style, ...rest } = props;
  return (
    <TextInput
      {...rest}
      placeholderTextColor={muted}
      style={[
        {
          borderWidth: 1,
          borderColor: error ? accent : line,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: '#fff',
          fontSize: 14,
          color: ink,
        },
        style,
      ]}
      maxLength={rest.multiline ? 1000 : 255}
    />
  );
}

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ink,
    marginLeft: 8,
  },
  notice: {
    fontSize: 14,
    color: ink,
    marginBottom: 8,
  },
  warning: {
    fontSize: 12,
    color: muted,
    fontStyle: 'italic',
  },


  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: ink,
    marginLeft: 8,
  },
  submitBtn: {
    backgroundColor: accent,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  quickBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: line,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: line,
    borderRadius: 6,
    padding: 10,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  linkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(109,41,50,0.1)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: line,
  },
});