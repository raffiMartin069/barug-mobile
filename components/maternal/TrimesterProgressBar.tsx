import { Colors } from '@/constants/Colors'
import React, { useEffect, useMemo } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

/**
 * TrimesterProgressBar
 * Small animated progress bar used in the Maternal Tracker UI to show
 * trimester completion percentage. This is a pure presentational component
 * with no side-effects.
 *
 * Props:
 * - percent: number (0-100)
 */
export default function TrimesterProgressBar({ percent }: { percent: number }) {
    const animated = useMemo(() => new Animated.Value(0), [])

    useEffect(() => {
        animated.setValue(0)
        Animated.timing(animated, {
            toValue: Math.max(0, Math.min(100, percent)),
            duration: 700,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start()
    }, [percent, animated])

    const widthInterpolated = animated.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    })

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.fill, { width: widthInterpolated }]} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: 80,
        height: 8,
        backgroundColor: Colors.light.card,
        borderRadius: 6,
        overflow: 'hidden',
    },
    fill: {
        height: '100%',
        backgroundColor: Colors.light.tint,
    },
})
