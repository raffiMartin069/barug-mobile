import { resendVerificationEmail } from '@/api/authApi';
import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

const COOLDOWN_SECS = 30;
const keyFor = (email?: string) => `verifyCooldown:${email ?? 'unknown'}`;

const VerifyEmail = () => {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds left

  // Restore cooldown on mount
  useEffect(() => {
    let mounted = true;

    const restoreCooldown = async () => {
      try {
        const raw = await AsyncStorage.getItem(keyFor(email));
        if (!mounted) return;

        if (raw) {
          const last = Number(raw); // stored as ms epoch
          const elapsed = Math.floor((Date.now() - last) / 1000);
          const remaining = Math.max(0, COOLDOWN_SECS - elapsed);
          if (remaining > 0) setCooldown(remaining);
        }
      } catch (e) {
        // noop; fail open
      }
    };

    restoreCooldown();
    return () => {
      mounted = false;
    };
  }, [email]);

  // Tick down every second while on cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return; // extra guard
    if (!email) {
      Alert.alert('Error', 'Missing email address.');
      return;
    }

    setLoading(true);
    try {
      await resendVerificationEmail(email);
      Alert.alert('Success', 'Verification email resent successfully.');
      // Start + persist cooldown
      const now = Date.now();
      await AsyncStorage.setItem(keyFor(email), String(now));
      setCooldown(COOLDOWN_SECS);
    } catch (error: any) {
      console.error('Resend failed:', error);
      const msg =
        error?.message ||
        error?.response?.data?.message ||
        'Failed to resend verification email.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView>
      <ThemedCard>
        <ThemedText title={true}>Verify your email address</ThemedText>
        <Spacer height={10} />
        <ThemedText subtitle={true}>
          We’ve sent a verification email to <ThemedText bold>{email}</ThemedText>{'\n'}
          Please check your inbox or spam folder and click the link to verify your account.
        </ThemedText>

        <Spacer height={10} />

        <ThemedButton onPress={handleResend} disabled={loading || cooldown > 0}>
          <ThemedText btn={true}>
            {loading
              ? 'Processing...'
              : cooldown > 0
              ? `Resend available in ${cooldown}s`
              : 'Resend Verification Email'}
          </ThemedText>
        </ThemedButton>

        <Spacer height={10} />
        <ThemedButton onPress={() => router.replace('/login')}>
          <ThemedText btn={true}>Back to Login</ThemedText>
        </ThemedButton>
      </ThemedCard>
    </ThemedView>
  );
};

export default VerifyEmail;

const styles = StyleSheet.create({});
