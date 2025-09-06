import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';

const ThemedDatePicker = ({ style = null, placeholder, value, onChange, mode, minimumDate = null, maximumDate = null }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const [show, setShow] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShow(Platform.OS === 'ios'); // On Android, auto-closes
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const displayValue = value
  ? mode === 'time'
    ? value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : value.toLocaleDateString()
  : '';

  return (
    <>
      {/* Input field */}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          style,
        ]}
        onPress={() => setShow(true)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.text,
            { color: value ? theme.text : theme.placeholder },
          ]}
        >
          {value ? displayValue : placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.icon}
          style={styles.icon}
        />
      </TouchableOpacity>

      {/* DateTime Picker Modal */}
      {show && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display="default"
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          themeVariant="light"         // or "dark"
          accentColor="#310101"  
        />
      )}
    </>
  )
}

export default ThemedDatePicker

const styles = StyleSheet.create({
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white', 
    borderColor: 'black',
    borderBottomWidth: 2,
    paddingHorizontal: 15,
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 14,
    flex: 1,
  },
  icon: {
    marginLeft: 10,
  },
})