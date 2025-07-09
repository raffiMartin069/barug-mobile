import { Colors } from '@/constants/Colors';
import React, { useState } from 'react';
import { StyleSheet, useColorScheme, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';

const ThemedDropdown = ({ style = null, placeholder, items = [], value, setValue, order = 0, ...props }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState(items);
  const baseZIndex = 1000; 
  const computedZIndex = baseZIndex - order;

  return (
    <View style={[style, {zIndex: computedZIndex}]}>
      <DropDownPicker
        open={open}
        value={value}
        items={dropdownItems}
        setOpen={setOpen}
        setValue={setValue}
        setItems={setDropdownItems}
        placeholder={placeholder}
        listMode="SCROLLVIEW"
        style={{
          backgroundColor: 'white',
          borderColor: theme.text,
          borderWidth: 0,
          borderBottomWidth: 2,
          borderRadius: 0,
          paddingHorizontal: 15,
        }}
        textStyle={{
          color: theme.text,
          fontSize: 14,
        }}
        placeholderStyle={{
          color: theme.placeholder,
        }}
        dropDownContainerStyle={{
          backgroundColor: theme.background,
          borderColor: theme.text,
          borderWidth: 2,
        }}
      />
    </View>
  )
}

export default ThemedDropdown

const styles = StyleSheet.create({
    container: {
    zIndex: 1000,
  },
})