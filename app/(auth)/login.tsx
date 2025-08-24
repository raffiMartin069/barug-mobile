import { loginUser } from '@/api/authApi';
import Spacer from '@/components/Spacer';
import ThemedButton from '@/components/ThemedButton';
import ThemedCard from '@/components/ThemedCard';
import ThemedText from '@/components/ThemedText';
import ThemedTextInput from '@/components/ThemedTextInput';
import ThemedView from '@/components/ThemedView';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Extract {code, message} from many possible error shapes
  const extractError = (err: any): { code?: string; message?: string } => {
    // 1) If axios: err.response.data
    const data = err?.response?.data ?? err?.data ?? undefined;
    if (data) {
      if (typeof data === 'object') {
        // e.g. {message, code, ...}
        if (data.message || data.code) return { code: data.code, message: data.message || data.detail };
        // sometimes backend nests it one level deeper
        if (data.error && (data.error.message || data.error.code)) {
          return { code: data.error.code, message: data.error.message };
        }
      } else if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data.replace(/'/g, '"').replace(/\bNone\b/g, 'null'));
          if (parsed?.message || parsed?.code) {
            return { code: parsed.code, message: parsed.message };
          }
        } catch { }
      }
    }

    // 2) Some libs throw the server object directly: err = {message, code, ...}
    if (typeof err === 'object' && (err.message || err.code)) {
      return { code: err.code, message: err.message };
    }

    // 3) String in err.message (possibly JSON-like string)
    if (typeof err?.message === 'string') {
      const msg = err.message.trim();
      if (msg.startsWith('{')) {
        try {
          const parsed = JSON.parse(msg.replace(/'/g, '"').replace(/\bNone\b/g, 'null'));
          return { code: parsed?.code, message: parsed?.message };
        } catch { }
      }
      return { message: err.message };
    }

    // 4) String thrown directly
    if (typeof err === 'string') {
      try {
        const parsed = JSON.parse(err.replace(/'/g, '"').replace(/\bNone\b/g, 'null'));
        return { code: parsed?.code, message: parsed?.message };
      } catch {
        return { message: err };
      }
    }

    return {};
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const response = await loginUser(trimmedEmail, trimmedPassword);

      await AsyncStorage.setItem('userToken', response.token);

      router.push('/residenthome');
    } catch (err: any) {
      if (__DEV__) {
        console.log('Login failed:', err);
      }

      const { code, message } = extractError(err);
      const codeNorm = (code || '').toString().toUpperCase();
      const msgNorm = (message || '').toLowerCase();

      // ✅ Case 1: Email not verified → redirect
      if (codeNorm === 'P5040' || codeNorm === 'P6071' || msgNorm.includes('not verified')) {
        router.push({ pathname: '/verifyemail', params: { email: trimmedEmail } });
        return;
      }

      // ✅ Case 2: Network error
      if (err?.response?.status === 0) {
        Alert.alert('Login Failed', 'Network error. Please check your connection.');
        return;
      }

      // ✅ Case 3: Everything else
      Alert.alert('Login Failed', 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ThemedView>
        <ThemedCard>
          <Image
            source={require('@/assets/images/icon-.png')}
            style={styles.image}
          />

          <Spacer height={20} />

          <ThemedText style={styles.text} title={true}>
            Barangay Sto. Niño
          </ThemedText>

          <ThemedText style={styles.text} subtitle={true}>
            Log in to access barangay services.
          </ThemedText>

          <Spacer height={20} />

          <ThemedTextInput
            placeholder="Email or Username"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Spacer height={10} />

          <ThemedTextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Spacer height={15} />

          <Link href="/forgotpassword">
            <ThemedText style={styles.link} link={true}>
              Forgot Password?
            </ThemedText>
          </Link>

          <Spacer height={5} />

          <ThemedButton onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.text} btn={true}>
                Log In
              </ThemedText>
            )}
          </ThemedButton>

          <Spacer height={5} />

          <ThemedText style={styles.link}>
            Don't have an account?
            <Link href="/register">
              <ThemedText link={true}> Register</ThemedText>
            </Link>
          </ThemedText>
        </ThemedCard>
      </ThemedView>
    </TouchableWithoutFeedback>
  );
};

export default Login;

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 70,
    alignSelf: 'center',
  },
  text: {
    textAlign: 'center',
  },
  link: {
    textAlign: 'right',
  },
});
