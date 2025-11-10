// app/(resident)/payments/PayRenewal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';

import ThemedView from '@/components/ThemedView';
import ThemedText from '@/components/ThemedText';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import Spacer from '@/components/Spacer';

import { startRenewalCheckout, confirmRenewal } from '@/services/payments';

const BRAND = '#310101';

export default function PayRenewal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const renewalId = Number(id);

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'PAID' | 'ISSUED' | 'RECONCILE'>('IDLE');
  const [clearanceId, setClearanceId] = useState<number | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const startPolling = () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    const doPoll = async () => {
      try {
        const r = await confirmRenewal(renewalId);
        setStatus((r.status as any) || 'PENDING');
        setClearanceId(r.clearance_rec_id ?? null);
        if (r.status === 'PAID' || r.status === 'ISSUED') {
          // final
          return;
        }
      } catch (e: any) {
        setLastError(e?.message || 'Confirm failed');
      }
      pollTimer.current = setTimeout(doPoll, 2000);
    };
    doPoll();
  };

  const handlePay = async () => {
    setLastError(null);
    setBusy(true);
    try {
      const { checkout_url } = await startRenewalCheckout(renewalId);
      setStatus('PENDING');

      // Open browser to PayMongo Checkout
      const result = await WebBrowser.openBrowserAsync(checkout_url);

      // When user closes browser, we begin polling confirm
      if (result.type === 'opened' || result.type === 'dismiss') {
        // When app comes to foreground again, also try confirm immediately
        startPolling();
      }
    } catch (e: any) {
      setLastError(e?.message || 'Unable to start checkout');
    } finally {
      setBusy(false);
    }
  };

  // Also trigger confirm when app returns to foreground (extra safety)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active' && status === 'PENDING') startPolling();
    });
    return () => sub.remove();
  }, [status]);

  const done = status === 'PAID' || status === 'ISSUED';

  return (
    <ThemedView safe>
      <View style={styles.header}>
        <Ionicons name="card-outline" size={22} color={BRAND} />
        <ThemedText style={styles.title} weight="800">
          Pay Renewal #{renewalId}
        </ThemedText>
      </View>

      <ThemedCard>
        <ThemedText>1) Tap Pay with GCash.</ThemedText>
        <ThemedText>2) Finish in the PayMongo page.</ThemedText>
        <ThemedText>3) Return here. We’ll finalize automatically.</ThemedText>
      </ThemedCard>

      <Spacer height={12} />

      <ThemedCard>
        <ThemedText weight="700">Status: </ThemedText>
        <Spacer height={6} />
        <StatusPill value={status} />
        {!!clearanceId && (
          <>
            <Spacer height={6} />
            <ThemedText muted>Clearance Ref: {clearanceId}</ThemedText>
          </>
        )}
        {!!lastError && (
          <>
            <Spacer height={8} />
            <ThemedText style={{ color: '#C0392B' }}>{lastError}</ThemedText>
          </>
        )}
      </ThemedCard>

      <Spacer height={16} />

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <ThemedButton onPress={handlePay} disabled={busy || done} loading={busy}>
          <ThemedText btn>Pay with GCash</ThemedText>
        </ThemedButton>

        {done && (
          <ThemedButton
            variant="ghost"
            onPress={() => router.back()}
          >
            <ThemedText btn>Done</ThemedText>
          </ThemedButton>
        )}
      </View>

      {status === 'PENDING' && (
        <>
          <Spacer height={16} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator />
            <Spacer width={8} />
            <ThemedText muted>Waiting for payment…</ThemedText>
          </View>
        </>
      )}
    </ThemedView>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    IDLE: { bg: '#f1f5f9', fg: '#0f172a' },
    PENDING: { bg: '#fff7ed', fg: '#7c2d12' },
    PAID: { bg: '#dcfce7', fg: '#065f46' },
    ISSUED: { bg: '#dcfce7', fg: '#065f46' },
    RECONCILE: { bg: '#fef3c7', fg: '#92400e' },
  };
  const s = map[value] || map.IDLE;
  return (
    <View style={{ backgroundColor: s.bg, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999 }}>
      <ThemedText style={{ color: s.fg }} weight="800">
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  title: { fontSize: 18 },
});
