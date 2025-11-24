// components/StaffPurokFilter.tsx
import React from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import ThemedText from './ThemedText'
import { useStaffPuroks } from '@/hooks/useStaffPuroks'

type Props = {
  selectedPurokId?: number | null
  onSelectPurok: (purokId: number | null) => void
}

/**
 * Reusable component to filter by staff's assigned puroks
 */
export default function StaffPurokFilter({ selectedPurokId, onSelectPurok }: Props) {
  const { assignments, hasAssignments } = useStaffPuroks()

  if (!hasAssignments) {
    return null
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.label}>Filter by Purok:</ThemedText>
      <View style={styles.chipContainer}>
        {/* All option */}
        <TouchableOpacity
          style={[
            styles.chip,
            selectedPurokId === null && styles.chipSelected
          ]}
          onPress={() => onSelectPurok(null)}
        >
          <ThemedText style={[
            styles.chipText,
            selectedPurokId === null && styles.chipTextSelected
          ]}>
            All
          </ThemedText>
        </TouchableOpacity>

        {/* Individual puroks */}
        {assignments.map((assignment) => (
          <TouchableOpacity
            key={assignment.staff_purok_id}
            style={[
              styles.chip,
              selectedPurokId === assignment.purok_sitio_id && styles.chipSelected
            ]}
            onPress={() => onSelectPurok(assignment.purok_sitio_id)}
          >
            <ThemedText style={[
              styles.chipText,
              selectedPurokId === assignment.purok_sitio_id && styles.chipTextSelected
            ]}>
              {assignment.purok_sitio_name}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipSelected: {
    backgroundColor: '#561C24',
    borderColor: '#561C24',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
})
