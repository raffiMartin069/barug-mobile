import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const ThemedTextInput = ({ style = null, value, onChangeText, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    const handleConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    onChangeText && onChangeText(formattedDate);
    setDatePickerVisibility(false);
  };

    return (
        <View style={[styles.inputContainer, style]}>
            <Pressable
                onPress={() => setDatePickerVisibility(true)}
                style={{ flex: 1 }}
                >
                <TextInput
                    style={[
                    { color: theme.text, flex: 1 },
                    styles.textinput,
                    style,
                    ]}
                    editable={false}
                    value={value}
                    {...props}
                />
            </Pressable>
            <TouchableOpacity
                onPress={() => setDatePickerVisibility(true)}
                style={styles.iconContainer}
            >
                <Ionicons name="calendar" size={20} color={theme.icon} />
            </TouchableOpacity>

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={() => setDatePickerVisibility(false)}
            />
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