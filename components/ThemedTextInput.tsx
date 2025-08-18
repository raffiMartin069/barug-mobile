import { Colors } from '@/constants/Colors'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native'

const ThemedTextInput = ({ style = null, secureTextEntry = false,  showClearButton = false, value, onChangeText, onRemove = () => {}, ...props }) => {
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
            {secureTextEntry ? (
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
            ) : showClearButton ? (
                <TouchableOpacity
                    onPress={() => onRemove ? onRemove() : onChangeText('')}
                    style={styles.iconContainer}
                >
                    <Ionicons
                        name="remove-circle-outline"
                        size={20}
                        color={theme.icon}
                    />
                </TouchableOpacity>
            ) : null}
        </View>
    )
}

export default ThemedTextInput

const styles = StyleSheet.create ({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderColor: 'black',
        borderBottomWidth: 2,
        paddingHorizontal: 12,
    },
    textinput: {
        paddingVertical: 15,
    },
    iconContainer: {
        paddingHorizontal: 5,
    },
})