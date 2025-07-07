import { Colors } from '@/constants/Colors'
import React from 'react'
import { useColorScheme, View } from 'react-native'

const ThemedView = ({ style = null, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    
    return (
        <View
            style={[{backgroundColor: theme.background}, style]}
            {...props}
        />
    )
}

export default ThemedView