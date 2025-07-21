import Spacer from '@/components/Spacer';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import ThemedButton from '@/components/ThemedButton';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { resendVerificationEmail } from '@/api/authApi'; // 🔥 create this API call

const VerifyEmail = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail(email);
      Alert.alert('Success', 'Verification email resent successfully.');
    } catch (error: any) {
      console.error('Resend failed:', error);
      Alert.alert('Error', error.message || 'Failed to resend verification email.');
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
          We’ve sent a verification email to <ThemedText bold>{email}</ThemedText>.{"\n"}
          Please check your inbox or spam folder and click the link to verify your account.
        </ThemedText>
        <Spacer height={10} />
        <ThemedButton onPress={handleResend} disabled={loading}>
          <ThemedText btn={true}>
            {loading ? 'Resending...' : 'Resend Verification Email'}
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
