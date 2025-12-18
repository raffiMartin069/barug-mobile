import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const ThemedView = ({ style = null, safe = false, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    
    if (!safe) return (
        <View
            style={[{backgroundColor: theme.background}, styles.container, style]}
            {...props}
        />
    )
    
    const insets = useSafeAreaInsets()

    return(
        <View
            style={[{ 
                backgroundColor: theme.background,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
            }, 
            styles.container, 
            style]} 
        {...props}
        />
    )
}

export default ThemedView

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
})
