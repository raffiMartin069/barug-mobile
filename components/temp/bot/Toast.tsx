import React, { useEffect, useRef, useState } from 'react'
import { Animated, StyleSheet, Text, View, Platform } from 'react-native'
import { Colors } from '@/constants/Colors'

type ToastListener = (msg: string) => void

const listeners: ToastListener[] = []

export function showToast(message: string) {
    listeners.forEach((l) => l(message))
}

export const ToastContainer: React.FC = () => {
    const [msg, setMsg] = useState<string | null>(null)
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const listener: ToastListener = (m) => setMsg(m)
        listeners.push(listener)
        return () => {
            const idx = listeners.indexOf(listener)
            if (idx >= 0) listeners.splice(idx, 1)
        }
    }, [])

    useEffect(() => {
        if (!msg) return
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start()
        const t = setTimeout(() => {
            Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setMsg(null))
        }, 1400)
        return () => clearTimeout(t)
    }, [msg, opacity])

    if (!msg) return null

    return (
        <Animated.View pointerEvents="none" style={[styles.container, { opacity, transform: [{ translateY: msg ? 0 : 10 }] }]}> 
            <View style={styles.toast}>
                <Text style={styles.text}>{msg}</Text>
            </View>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 90 : 80,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 20,
    },
    toast: {
        backgroundColor: 'rgba(49,1,1,0.06)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(49,1,1,0.12)',
        maxWidth: '92%'
    },
    text: {
        color: Colors.primary,
        fontSize: 13,
    }
})
