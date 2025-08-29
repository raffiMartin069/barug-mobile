import Spacer from '@/components/Spacer'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { Ionicons } from '@expo/vector-icons'
import React, { useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, View } from 'react-native'

const CIRCLE = 78;
const MPIN_LEN = 4;

const Mpin = () => {
    const [pin, setPin] = useState('');

    const keys = useMemo(
        () => [
            '1', '2', '3',
            '4', '5', '6',
            '7', '8', '9',
            'blank', '0', 'back',
        ],
        []
    )

    const pushDigit = (d: string) => {
        if (pin.length >= MPIN_LEN) return
        setPin(prev => prev + d)
    }

    const popDigit = () => setPin(prev => prev.slice(0, -1))

  return (
    <ThemedView safe>
        <Image
            source={require('@/assets/images/icon-.png')}
            style={styles.image}
        />

        <Spacer />

        <View style={styles.header}>
            <ThemedText style={styles.text}>Mobile Number?</ThemedText>
            <ThemedText style={styles.text}>Enter your MPIN</ThemedText>
        </View>

        <View style={styles.dots}>
            {Array.from({length: MPIN_LEN}).map((_, i) => (
                <View
                    key={i}
                    style={[styles.dot, i < pin.length  && styles.dotFilled]}
                />
            ))}
        </View>

        <View style={styles.pad}>
            {keys.map((k, i) => {
                if (k === 'blank') return <View key={i} style={styles.keyBlank} />
                if (k === 'back' ) {
                    return (
                        <Pressable key={i} onPress={popDigit} style={({pressed}) => [styles.key, pressed && styles.keyPressed]}>
                            <Ionicons name='backspace-outline' size={20} color={'#fff'}/>
                        </Pressable>
                    )
                }
                return (
                    <Pressable 
                        key={i} 
                        onPress={() => pushDigit(k)} 
                        style={({pressed}) => [styles.key, pressed && styles.keyPressed]}
                    >
                        <ThemedText btn>{k}</ThemedText>
                    </Pressable>
                )
        
            })}
        </View>

        <Spacer />

        <View>
            <ThemedText style={styles.forgot}>Forgot MPIN?</ThemedText>
        </View>
    </ThemedView>
  )
}

export default Mpin

const styles = StyleSheet.create({
    image: {
        width: '100%',
        height: 70,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
    },
    text: {
        fontSize: 18,
        fontWeight: 600,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 18,
        marginTop: 24,
        marginBottom: 8,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#310101',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#310101',
    },
    pad: {
        marginTop: 12,
        alignSelf: 'center',
        width: '90%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: 20,
    },
    keyBlank: {
        width: CIRCLE,
        height: CIRCLE,
        marginVertical: 10,
        opacity: 0,
    },
    key: {
        width: CIRCLE,
        height: CIRCLE,
        marginVertical: 10,
        borderRadius: CIRCLE / 2,
        backgroundColor: '#310101',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    keyPressed: {
        transform: [{ scale: 0.97 }],
        opacity: 0.85,
    },
    forgot : {
        fontWeight: 700, 
        textAlign: 'right', 
        padding: 20,
    },
})