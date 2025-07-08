import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, useColorScheme, View } from 'react-native'

const ThemedView = ({ style = null, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    
    return (
        <View
            style={[{backgroundColor: theme.background}, styles.container, style]}
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
