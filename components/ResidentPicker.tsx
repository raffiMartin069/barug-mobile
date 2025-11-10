// components/ResidentPicker.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, TextInput, TouchableOpacity, View } from 'react-native';
import ThemedText from '@/components/ThemedText';
import ThemedIcon from '@/components/ThemedIcon';
import ThemedView from '@/components/ThemedView';
import Spacer from '@/components/Spacer';
import { ResidentLite, searchResidents } from '@/services/residents';

type Props = {
  label?: string;
  placeholder?: string;
  value: ResidentLite[];               // selected
  onChange: (next: ResidentLite[]) => void;
  authToken?: string;
};

const accent = '#6d2932';

export default function ResidentPicker({ label = 'Respondents', placeholder = 'Search resident by name', value, onChange, authToken }: Props) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ResidentLite[]>([]);
  const timer = useRef<any>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q || q.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        setBusy(true);
        const r = await searchResidents(q, authToken);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setBusy(false);
      }
    }, 250); // debounce
    return () => timer.current && clearTimeout(timer.current);
  }, [q, authToken]);

  function add(resident: ResidentLite) {
    if (value.find((x) => x.person_id === resident.person_id)) return;
    onChange([...value, resident]);
    setQ('');
    setResults([]);
  }
  function remove(person_id: number) {
    onChange(value.filter((x) => x.person_id !== person_id));
  }

  return (
    <ThemedView style={{ width: '100%' }}>
      {label ? <ThemedText style={{ fontWeight: '700', marginBottom: 6 }}>{label}</ThemedText> : null}

      {/* Input */}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={q}
        onChangeText={setQ}
        style={{
          borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 10,
          paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff',
        }}
      />

      {/* Results dropdown */}
      {(busy || results.length > 0) && (
        <View style={{
          marginTop: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', borderRadius: 10, backgroundColor: '#fff',
        }}>
          {busy ? (
            <View style={{ padding: 10, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.person_id)}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)' }} />}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => add(item)} style={{ padding: 10 }}>
                  <ThemedText style={{ fontWeight: '600' }}>{item.name}</ThemedText>
                  {!!item.address && <ThemedText muted style={{ marginTop: 2 }}>{item.address}</ThemedText>}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {/* Selected chips */}
      {!!value.length && (
        <>
          <Spacer height={8} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {value.map((p) => (
              <View key={p.person_id} style={{
                flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
                borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', backgroundColor: '#fff', marginRight: 8, marginBottom: 8,
              }}>
                <ThemedIcon name="person-outline" size={14} containerSize={18} />
                <ThemedText style={{ marginLeft: 6 }}>{p.name}</ThemedText>
                <TouchableOpacity onPress={() => remove(p.person_id)} style={{ marginLeft: 8 }}>
                  <ThemedIcon name="close" size={14} containerSize={18} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </>
      )}
    </ThemedView>
  );
}
