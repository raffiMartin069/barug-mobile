import Spacer from '@/components/Spacer'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'

const Register = () => {
  const router = useRouter()

  const handleContinue = () => {
    router.push('/chooserole')
  }
  return (
    <TouchableWithoutFeedback>
      <ThemedView>
        <ThemedCard>
          <Image
            source={require('@/assets/images/icon-.png')}
            style={styles.image}
          />

          <Spacer height={20} />

          <ThemedText style={styles.text} title>Barangay Sto. Niño</ThemedText>
          <ThemedText style={styles.text} subtitle>Register to access barangay services.</ThemedText>

          <Spacer height={15} />

          <ThemedText>
            Please complete the following steps to register as a resident in the barangay.
          </ThemedText>

          <Spacer height={10} />

          <View>
            <View style={styles.stepItem}>
              <View style={styles.circle}>
                <Text style={styles.circleText}>i</Text>
              </View>
              <View>
                <Text style={styles.stepText}>Personal Information</Text>
                <Text style={styles.stepHint}>(For online registration, a valid email address is required)</Text>
              </View>
            </View>

          </View>

          <ThemedButton onPress={handleContinue}>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>

          <Spacer height={5} />

          <ThemedText style={styles.link}>
            Already have an account?
            <Link href="/login">
              <ThemedText link> Log in</ThemedText>
            </Link>
          </ThemedText>
        </ThemedCard>
      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Register

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
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  circle: {
    backgroundColor: '#4a0000', // deep maroon
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  circleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepText: {
    fontSize: 14,
    color: '#333',
  },
  stepHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#4a0000',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
})
