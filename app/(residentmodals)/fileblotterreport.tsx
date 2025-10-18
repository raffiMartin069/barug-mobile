// app/blotter/file.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
      // Debug: show what we have to confirm person_id presence
      const keys = me ? Object.keys(me) : [];
      console.log('[RoleStore] resident profile keys:', keys.slice(0, 10), '... total:', keys.length);
      console.log('[RoleStore] resident person_id:', me?.person_id);
    })();
    return () => { live = false; };
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

  useEffect(() => {
    console.log('[Blotter] useLocalSearchParams:', params);
  }, [params]);

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

  useEffect(() => {
    if (streetParam || purokParam || brgyParam || cityParam) {
      const full = [streetParam, purokParam, brgyParam, cityParam].filter(Boolean).join(', ');
      setAddress(full);
      console.log('[Blotter] Composed address:', full);
    } else {
      console.log('[Blotter] No address parts found yet');
    }
  }, [streetParam, purokParam, brgyParam, cityParam]);

  useEffect(() => {
    const latParam = pickOne(params.lat);
    const lngParam = pickOne(params.lng);
    if (latParam || lngParam) {
      setLat(latParam || '');
      setLng(lngParam || '');
      console.log('[Blotter] Lat/Lng captured from params:', { lat: latParam, lng: lngParam });
    } else {
      console.log('[Blotter] No lat/lng in params');
    }
  }, [params.lat, params.lng]);

  // Attachments
  const [photos, setPhotos] = useState<string[]>([]);
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
          console.log('[Blotter] searchResidents results:', res);
        }
      } catch (err) {
        console.warn('[Blotter] searchResidents error:', err);
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
    console.log('[Blotter] addRespondent selected:', entry);
    setRespondents((prev) =>
      prev.find((x) => x.person_id === entry.person_id) ? prev : [...prev, entry]
    );
  };

  const removeRespondent = (person_id: number) => {
    console.log('[Blotter] removeRespondent:', person_id);
    setRespondents((prev) => prev.filter((r) => r.person_id !== person_id));
  };

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaType.Images],
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 4,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      const next = [...photos, ...uris].slice(0, 6);
      console.log('[Blotter] picked photos:', next);
      setPhotos(next);
    }
  }

  /* ---------------- Normalizers for pickers ---------------- */

  const setDateFromPicker = (next: Date | string | undefined) => {
    if (next instanceof Date && !isNaN(next.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const v = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
      console.log('[Blotter] setDateFromPicker Date:', v);
      setDate(v);
    } else if (typeof next === 'string') {
      console.log('[Blotter] setDateFromPicker string:', next);
      setDate(next);
    } else {
      setDate('');
    }
  };

  const setTimeFromPicker = (next: Date | string | undefined) => {
    if (next instanceof Date && !isNaN(next.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      const v = `${pad(next.getHours())}:${pad(next.getMinutes())}`;
      console.log('[Blotter] setTimeFromPicker Date:', v);
      setTime(v);
    } else if (typeof next === 'string') {
      const m = next.match(/^(\d{1,2}):(\d{2})/);
      if (m) {
        const hh = String(m[1]).padStart(2, '0');
        const v = `${hh}:${m[2]}`;
        console.log('[Blotter] setTimeFromPicker string parsed:', v);
        setTime(v);
      } else {
        console.log('[Blotter] setTimeFromPicker string raw:', next);
        setTime(next);
      }
    } else {
      setTime('');
    }
  };

  function validate(): string | null {
    if (!subject.trim()) return 'Subject is required.';
    if (!desc.trim()) return 'Description is required.';
    if (!address.trim()) return 'Incident location is required.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Date must be YYYY-MM-DD.';
    if (!/^\d{2}:\d{2}$/.test(time)) return 'Time must be HH:mm (24h).';
    return null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) {
      Alert.alert('Fix form', err);
      return;
    }

    // 🔑 complainant/reporting person = current resident
    const complainantId = Number(me?.person_id) || null;
    console.log('[Blotter] complainantId (from resident profile):', complainantId);

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
      evidenceUris: photos,
    } as const;

    console.log('[Blotter] onSubmit — respondents:', respondents);
    console.log('[Blotter] onSubmit — payload:', JSON.stringify(payload, null, 2));

    setBusy(true);
    try {
      await createBlotterReport(payload as any);
      Alert.alert('Submitted', 'Your blotter report was sent successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      console.warn('[Blotter] Submit failed:', e);
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

  const goPickIncidentAddress = () => {
    console.log('[Blotter] Navigating to /mapaddress for picking address…');
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

  return (
    <ThemedView safe style={{ flex: 1 }}>
      <ThemedAppBar title="File a Blotter Report" showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {/* Header */}
        <ThemedCard>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <ThemedIcon name="document-text-outline" bgColor={accent} size={20} containerSize={28} />
                <ThemedText style={styles.title}>Blotter Report</ThemedText>
              </View>
              <ThemedText muted style={{ marginTop: 4 }}>
                Please review your information before submitting.
              </ThemedText>
            </View>
          </View>
        </ThemedCard>

        <Spacer height={16} />

        {/* Important Note */}
        <ThemedCard>
          <View style={[styles.row, { marginBottom: 6 }]}>
            <ThemedIcon name="information-circle-outline" bgColor="#310101" size={20} containerSize={28} />
            <ThemedText style={styles.noteTitle}>Important Note</ThemedText>
          </View>
          <ThemedText style={{ lineHeight: 20 }}>
            By submitting this blotter report, you affirm that all information provided is true and accurate to the
            best of your knowledge. False reporting may lead to legal consequences.
          </ThemedText>

          <Spacer height={10} />
          <Bullet icon="checkmark-circle-outline" text="Make sure names, time, and location are accurate." />
          <Bullet icon="shield-checkmark-outline" text="Attach supporting photos/videos if available." />
          <Bullet icon="chatbubbles-outline" text="A barangay officer may contact you for clarification." />
        </ThemedCard>

        <Spacer height={16} />

        {/* Form */}
        <ThemedCard>
          <Label>Subject</Label>
          <TextField value={subject} onChangeText={setSubject} placeholder="e.g., Loud altercation" />

          <Spacer height={10} />

          <Label>Description</Label>
          <TextField
            value={desc}
            onChangeText={setDesc}
            placeholder="What happened?"
            multiline
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          <Spacer height={10} />

          {/* Date / Time */}
          <View style={styles.rowBetween}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Label>Date</Label>
              <ThemedDatePicker
                value={date ? new Date(date) : undefined}
                mode="date"
                onChange={setDateFromPicker}
                placeholder="YYYY-MM-DD"
                maximumDate={new Date()}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Label>Time</Label>
              <ThemedDatePicker
                value={time ? dayjs(`2000-01-01T${time}:00`).toDate() : undefined}
                mode="time"
                onChange={setTimeFromPicker}
                placeholder="HH:mm"
              />
            </View>
          </View>

          <Spacer height={10} />

          {/* Incident Location */}
          <Label>Incident Location</Label>
          <Pressable onPress={goPickIncidentAddress}>
            <TextField
              placeholder="Tap to pick on map (Street, Purok/Sitio, Barangay, City)"
              multiline
              numberOfLines={2}
              value={address}
              onChangeText={() => {}}
              editable={false}
              pointerEvents="none"
            />
          </Pressable>

          {/* Show lat/lng (read-only) if present */}
          {(lat || lng) && (
            <>
              <Spacer height={6} />
              <ThemedText muted>
                Coordinates: {lat || '—'}, {lng || '—'}
              </ThemedText>
            </>
          )}

          <Spacer height={14} />

          {/* Respondents */}
          <Label>Respondents</Label>

          {respondents.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
              {respondents.map((r) => (
                <View key={r.person_id} style={styles.chip}>
                  <ThemedText style={{ fontWeight: '600' }}>{r.name}</ThemedText>
                  <TouchableOpacity onPress={() => removeRespondent(r.person_id)} style={{ marginLeft: 8 }}>
                    <ThemedIcon name="close" size={14} containerSize={18} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <ThemedSearchSelect<ResidentLite>
            items={searchResults}
            getLabel={(p) => p.full_name}
            getSubLabel={(p) => p.address}
            inputValue={searchText}
            onInputValueChange={(v) => {
              console.log('[Blotter] search text:', v);
              setSearchText(v);
            }}
            placeholder={searching ? 'Searching…' : 'Search resident by name or ID…'}
            emptyText={searchText.length < 2 ? 'Type at least 2 characters' : 'No matches'}
            fillOnSelect={false}
            onSelect={(p) => addRespondent(p)}
          />

          <Spacer height={14} />

          {/* Photos */}
          <View style={[styles.rowBetween, { marginBottom: 10 }]}>
            <Label>Attachments</Label>
            <TouchableOpacity onPress={pickImage} style={styles.addBtn}>
              <ThemedIcon name="add" size={18} />
              <ThemedText style={{ marginLeft: 6, fontWeight: '700' }}>Add Photos</ThemedText>
            </TouchableOpacity>
          </View>

          {!!photos.length && (
            <FlatList
              horizontal
              data={photos}
              keyExtractor={(u, i) => u + i}
              ItemSeparatorComponent={() => <Spacer width={8} />}
              renderItem={({ item }) => (
                <View style={styles.thumb}>
                  <ThemedView style={styles.thumbInner}>
                    <Image source={{ uri: item }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </ThemedView>
                </View>
              )}
            />
          )}

          <Spacer height={16} />

          <TouchableOpacity onPress={onSubmit} disabled={busy} style={[styles.submitBtn, busy && { opacity: 0.7 }]}>
            {busy ? (
              <ActivityIndicator />
            ) : (
              <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Submit Report</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedCard>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  );
}

function Bullet({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <ThemedIcon name={icon} size={16} containerSize={22} />
      <ThemedText muted style={styles.bulletText}>
        {text}
      </ThemedText>
    </View>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>{children}</ThemedText>;
}

function TextField(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#999"
      style={[
        {
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.12)',
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          backgroundColor: '#fff',
        },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { paddingLeft: 10, fontSize: 16, fontWeight: '700' },
  noteTitle: { paddingLeft: 10, fontWeight: '700' },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  bulletText: { marginLeft: 6, flex: 1 },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  thumb: { width: 86, height: 86, borderRadius: 8, overflow: 'hidden' },
  thumbInner: { width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f6f3f2',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
});
