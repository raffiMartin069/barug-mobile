import ThemedText from '@/components/ThemedText';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Item = { label: string; value: any }
type Props = {
  items: Item[]
  value: any
  setValue: (v: any) => void
  placeholder?: string
}

const CustomDropdown = ({ items, value, setValue, placeholder }: Props) => {
  const [open, setOpen] = useState(false)

  const selectedLabel = items.find((i) => i.value === value)?.label

  return (
    <View>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} accessibilityRole="button">
        <ThemedText style={styles.triggerText}>{selectedLabel ?? placeholder ?? 'Select'}</ThemedText>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.menuContainer}>
            <FlatList
              data={items}
              keyExtractor={(i) => String(i.value)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setValue(item.value)
                    setOpen(false)
                  }}
                >
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

export default CustomDropdown

const styles = StyleSheet.create({
  trigger: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  triggerText: { color: '#111827' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20 },
  menuContainer: { backgroundColor: '#fff', borderRadius: 8, maxHeight: '60%' },
  menuItem: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuItemText: { color: '#111827' },
})
