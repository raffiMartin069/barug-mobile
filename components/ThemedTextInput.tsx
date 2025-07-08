import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'

const ThemedTextInput = ({ style = null, secureTextEntry = false, value, onChangeText, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    return (
        <View style={[styles.inputContainer, style]}>
            <TextInput
                style={[
                { color: theme.text, flex: 1 },
                styles.textinput,
                style
                ]}
                secureTextEntry={secureTextEntry && !isPasswordVisible}
                value={value}
                onChangeText={onChangeText}
                {...props}
            />
            {secureTextEntry && (
                <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    style={styles.iconContainer}
                >
                    <Ionicons
                        name={isPasswordVisible ? 'eye' : 'eye-off'}
                        size={20}
                        color={theme.icon}
                    />
                </TouchableOpacity>
            )}
        </View>
    )
}

export default ThemedTextInput

const styles = StyleSheet.create ({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderColor: 'black',
        borderWidth: 1.5,
        borderRadius: 6,
        paddingHorizontal: 15,
    },
    textinput: {
        paddingVertical: 15,
    },
    iconContainer: {
        paddingHorizontal: 5,
    },
})