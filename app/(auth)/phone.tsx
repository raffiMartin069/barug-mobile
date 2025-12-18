// app/(auth)/phone.tsx
import { useNiceModal } from '@/hooks/NiceModalProvider'; // 👈 use global modal
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../constants/supabase';

const COLORS = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#111827',
  primaryText: '#FFFFFF',
  focus: '#2563EB',
  danger: '#B91C1C',
}

function toE164PH(input: string) {
  let d = (input || '').replace(/\D/g, '')
  if (d.startsWith('09')) d = '63' + d.slice(1)
  if (/^9\d{9}$/.test(d)) d = '63' + d
  if (/^63\d{10}$/.test(d)) return '+' + d
  if (/^\d{10}$/.test(d)) return '+63' + d
  return null
}

function extractLocal10(input: string) {
  let d = (input || '').replace(/\D/g, '')
  if (d.startsWith('09')) d = d.slice(1)
  if (d.startsWith('63')) d = d.slice(2)
  if (d.startsWith('639')) d = d.slice(3)
  d = d.slice(-10)
  return d.replace(/\D/g, '')
}

export default function Phone() {
  const { showModal, hideModal } = useNiceModal()

  const [local10, setLocal10] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = useMemo(() => /^\d{10}$/.test(local10), [local10])
  const fullDisplay = useMemo(() => `+63 ${local10}`, [local10])

  const open = (
    title: string,
    message = '',
    variant: 'info' | 'success' | 'warn' | 'error' = 'info',
    opts?: { primaryText?: string; onPrimary?: () => void; secondaryText?: string; onSecondary?: () => void }
  ) => showModal({ title, message, variant, primaryText: opts?.primaryText ?? 'Got it', secondaryText: opts?.secondaryText, onPrimary: opts?.onPrimary, onSecondary: opts?.onSecondary })

  const checkPhoneExists = async (phone: string) => {
    const { data, error } = await supabase.rpc('phone_exists', { p_phone: phone })
    if (error) throw error
    return !!data
  }

const sendOtp = async () => {
  if (loading) return;
  setLoading(true);
  try {
    const phone = toE164PH(local10);

    console.log('[OTP] local10:', local10);
    console.log('[OTP] toE164PH(local10):', phone);

    if (!phone) {
      open('Invalid number', 'Enter the last 10 digits after +63 (e.g., 9XXXXXXXXX).', 'warn');
      return;
    }

    const exists = await checkPhoneExists(phone);
    console.log('[OTP] phone_exists result:', exists);
    if (!exists) {
      open('Number not found', 'This mobile number is not registered. Please register first or contact the barangay office.', 'warn');
      return;
    }

    // Build the exact payload and log it before sending
    const payload = {
      phone, // ⬅️ use the computed phone (remove hard-coded number)
      options: { channel: 'sms', shouldCreateUser: true },
    } as const;

    console.log('[OTP] signInWithOtp payload:', payload);

    const { data, error } = await supabase.auth.signInWithOtp(payload);

    // Log full response objects for debugging
    console.log('[OTP] signInWithOtp data:', data);
    console.log('[OTP] signInWithOtp error:', error);

    if (error) {
      const errAny = error as any;
      console.log('[OTP] error details:', {
        status: errAny?.status,
        name: errAny?.name,
        message: errAny?.message,
        cause: errAny?.cause,
        stack: errAny?.stack,
      });
      const msg = errAny?.message || 'Failed to send code';
      open('Failed to send code', msg, 'error');
      return;
    }

    open('OTP sent', `We’ve sent a verification code to ${phone}.`, 'success');
    setTimeout(() => {
      hideModal();
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    }, 500);
  } catch (err: any) {
    console.log('[OTP] exception thrown:', err);
    open('Error', err?.message ?? 'Something went wrong.', 'error');
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={{ flex: 1, backgroundColor: COLORS.bg }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <View
          style={{
            backgroundColor: COLORS.card,
            borderRadius: 16,
            padding: 24,
            borderWidth: 1,
            borderColor: COLORS.border,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
            gap: 16,
          }}
        >
          {/* Barangay Logo + Title */}
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <Image
              source={require('@/assets/images/icon-.png')}
              style={{ width: '100%', height: 70, alignSelf: 'center' }}
            />
            <Text style={{ fontSize: 30, fontWeight: '700', color: COLORS.text, textAlign: 'center' }}>
              Barangay Sto. Niño
            </Text>
            <Text style={{ fontSize: 14, color: COLORS.muted, textAlign: 'center', marginTop: 4 }}>
              Mobile number verification
            </Text>
          </View>

          {/* Input group */}
          <View style={{ gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.border,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: '#F3F4F6',
                  borderRightWidth: 1,
                  borderRightColor: COLORS.border,
                }}
              >
                <Text style={{ fontWeight: '600', color: COLORS.text }}>+63</Text>
              </View>

              <TextInput
                placeholder="9XXXXXXXXX"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                autoCapitalize="none"
                value={local10}
                onChangeText={(t) => setLocal10(extractLocal10(t))}
                maxLength={10}
                style={{
                  flex: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: COLORS.text,
                }}
              />
            </View>

            <Text
              style={{
                color: isValid ? COLORS.muted : COLORS.danger,
                fontSize: 12,
                marginTop: 2,
              }}
            >
              {isValid
                ? `We will send an OTP to ${fullDisplay}`
                : 'Enter the last 10 digits after +63 (e.g., 9XXXXXXXXX).'}
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={sendOtp}
            disabled={!isValid || loading}
            style={{
              backgroundColor: '#4d0602ff',
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              opacity: !isValid || loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '700' }}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={{ color: COLORS.muted, fontSize: 12, textAlign: 'center' }}>
            By continuing, you agree to receive an SMS OTP to verify your identity for the Barangay Sto. Niño system.
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
