import { Colors } from '@/constants/Colors'
import React from 'react'
import { StyleSheet, Text, useColorScheme } from 'react-native'

const ThemedText = ({ style = null, title = false , subtitle = false,
    link = false, btn = false , non_btn = false, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const textColor = link
        ? theme.link
        : title
        ? theme.title
        : theme.text

    return (
        <Text
            style={[{color: textColor},
                    title && styles.title, 
                    subtitle && styles.subtitle, 
                    link && styles.link,
                    btn && styles.btn,
                    non_btn && styles.non_btn,
                    style]}
            {...props}
        />
    )
}

export default ThemedText

const styles = StyleSheet.create({
    title: {
        fontSize: 25,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
    },
    link: {
        fontWeight: 'bold',
    },
    btn: {
        fontSize: 16,
        fontWeight: 500,
        color: '#fff',
        alignSelf: 'center',
    },
    non_btn: {
        fontSize: 16,
        fontWeight: 500,
        color: Colors.primary,
        alignSelf: 'center',
    },
})