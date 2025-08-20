import { Colors } from '@/constants/Colors'
import { useTextSearch } from '@/store/textStore'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View, useColorScheme } from 'react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import Spacer from './Spacer'
import { useDropdownValueStore } from '@/store/dropdownValueStore'

const ThemedSearchableDropdown = ({ 
  style = null, 
  searchplaceholder, 
  dropdwonplaceholder, 
  order = 0, 
  data, searchKey, 
  dropdownType }) => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light

  const baseZIndex = 1000
  const computedZIndex = baseZIndex - order

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState()
  const [filteredItems, setFilteredItems] = useState([])
  const searchText = useTextSearch((state: { searchTexts: Record<string, string> }) => state.searchTexts[searchKey] || "")
  const setSearchText = useTextSearch((state: { setSearchText: (key: string, value: string) => void }) => state.setSearchText)
  const setHouseholdId = useDropdownValueStore((state: { setHouseholdId: (id: any) => void }) => state.setHouseholdId)
  const setFamilyId = useDropdownValueStore((state: { setFamilyId: (id: any) => void }) => state.setFamilyId)

  useEffect(() => {
    const trimmed = searchText.trim()

    if (trimmed === '') {
      setFilteredItems([])
      setOpen(false)
    } else {
      const filtered = data.filter((item) =>
        item.label.toLocaleLowerCase().includes(trimmed.toLocaleLowerCase())
      )
      setFilteredItems(filtered)
      setOpen(filtered.length > 0)
    }
  }, [searchText, data])

  return (
    <View style={[styles.container, { position: 'relative', zIndex: computedZIndex }, style]}>
      <TextInput
        placeholder={searchplaceholder}
        style={[
          {
            color: theme.text,
            flex: 1,
            paddingVertical: 15,
            backgroundColor: 'white',
            borderColor: 'black',
            borderBottomWidth: 2,
            paddingHorizontal: 12,
          },
        ]}
        placeholderTextColor={theme.placeholder}
        value={searchText}
        onChangeText={(text) => setSearchText(searchKey, text.trim())}
      />

      <Spacer height={10} />

      <DropDownPicker
        open={open}
        value={value}
        placeholder={dropdwonplaceholder}
        items={filteredItems}
        setOpen={setOpen}
        setValue={setValue}
        setItems={() => {}}
        onSelectItem={(item) => {
          setValue(item.value)
          if (dropdownType === "household") {
            setHouseholdId(item.value)
          } else if (dropdownType === "family") {
            setFamilyId(item.value)
          }
        }}
        listMode="SCROLLVIEW"
        zIndex={computedZIndex}
        zIndexInverse={baseZIndex + 1}
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
          maxHeight: 200,
        }}
        ListEmptyComponent={() => (
          <Text style={styles.empty}>
            {searchText.trim() === '' ? 'Please type something' : 'No results found'}
          </Text>
        )}
      />

    </View>
  )
}

export default ThemedSearchableDropdown

const styles = StyleSheet.create({
  container: {
    position: 'relative', 
    zIndex: 1000,
  },
  empty: {
    textAlign: 'center',
    padding: 10,
    color: 'gray',
    fontStyle: 'italic',
  },
})
