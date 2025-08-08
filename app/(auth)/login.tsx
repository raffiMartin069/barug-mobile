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

<<<<<<< HEAD
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

      // Navigate to resident home
      router.push('/residenthome');
    }

    catch (err: any) {
      // Don’t show red error box in production
      if (__DEV__) {
        console.log('Login failed:', err);
      }

      let errorCode = '';
      try {
        if (typeof err.message === 'string' && err.message.startsWith('{')) {
          const parsedError = JSON.parse(
            err.message.replace(/'/g, '"').replace(/ None/g, ' null')
          );
          errorCode = parsedError.code;
        }
      } catch (parseErr) {
        if (__DEV__) {
          console.warn('Error parsing backend error:', parseErr);
        }
      }

      if (errorCode === 'P6071') {
        // Redirect user to verify email page
        router.push({ pathname: '/verifyemail', params: { email } });
        return; // Prevent further error handling
      }

      Alert.alert('Login Failed', 'Invalid credentials');
    } finally {
      setLoading(false);
    }



  };
=======
  const handleSubmit = () => {
    router.push('/residenthome')
  }
>>>>>>> 3e804421dd25f5d56df26d64e302f04c64bc176e

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
