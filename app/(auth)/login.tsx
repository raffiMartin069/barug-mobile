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

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // Call API
      const response = await loginUser(email, password);

      // Save token to AsyncStorage
      await AsyncStorage.setItem('userToken', response.token);

      // Navigate to chooserole screen
      router.push('/chooserole');
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
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
