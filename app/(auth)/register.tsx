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
    router.push('/personalinfo')
  }
  return (
    <TouchableWithoutFeedback>
        <ThemedView>
            <ThemedCard>
                 <Image
                    source={require('@/assets/images/icon-.png')}
                    style={styles.image}
                />

                <Spacer height={20}/>

                <ThemedText style={styles.text} title={true}>Barangay Sto. Niño</ThemedText>

                <ThemedText style={styles.text} subtitle={true}>Register to access barangay services.</ThemedText>

                <Spacer height={15}/>

                <ThemedText>Please complete the following steps to
                    register as a resident in the barangay.</ThemedText>

                <Spacer height={10}/>

                <View>
                    <View style={styles.stepItem}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>Personal Information</Text>
                    </View>

                    <View style={styles.stepItem}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>Socioeconomic Information</Text>
                    </View>

                    <View style={styles.stepItem}>
                    <View style={styles.circle}>
                        <Text style={styles.circleText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>Valid ID</Text>
                    </View>
                </View>

                <ThemedButton onPress={handleContinue}>
                    <ThemedText btn={true}>Continue</ThemedText>
                </ThemedButton>

                <Spacer height={5}/>
                
                <ThemedText style={styles.link}>
                    Already have an account?
                    <Link href='/login'>
                        <ThemedText link={true}> Log in</ThemedText>
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
    text:{
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
    button: {
        backgroundColor: '#4a0000',
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
})