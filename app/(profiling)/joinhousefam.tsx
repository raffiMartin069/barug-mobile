import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedText from '@/components/ThemedText'
import ThemedTextInput from '@/components/ThemedTextInput'
import ThemedView from '@/components/ThemedView'
import React, { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

const HOUSEHOLDS = [ { id: 'HH-001', number: 'HH-001', headName: 'Rogelio Santos', address: 'Purok 3, Sto. Niño', familyUnits: [ { id: 'FU-001-A', number: 'FAM-001', headName: 'Rogelio Santos' }, { id: 'FU-001-B', number: 'FAM-002', headName: 'Maria Santos' }, { id: 'FU-001-C', number: 'FAM-003', headName: 'Ana Santos' }, ], }, { id: 'HH-002', number: 'HH-002', headName: 'Juan Dela Cruz', address: 'Purok 5, Sto. Niño', familyUnits: [ { id: 'FU-002-A', number: 'FAM-010', headName: 'Juan Dela Cruz' }, { id: 'FU-002-B', number: 'FAM-011', headName: 'Isabel Dela Cruz' }, ], }, { id: 'HH-003', number: 'HH-003', headName: 'Luz Rivera', address: 'Purok 1, Sto. Niño', familyUnits: [ { id: 'FU-003-A', number: 'FAM-020', headName: 'Luz Rivera' }, ], }, { id: 'HH-004', number: 'HH-004', headName: 'Luz Rivera', address: 'Purok 1, Sto. Niño', familyUnits: [ { id: 'FU-003-A', number: 'FAM-020', headName: 'Luz Rivera' }, ], }, { id: 'HH-005', number: 'HH-005', headName: 'Luz Rivera', address: 'Purok 1, Sto. Niño', familyUnits: [ { id: 'FU-003-A', number: 'FAM-020', headName: 'Luz Rivera' }, ], }, { id: 'HH-006', number: 'HH-006', headName: 'Luz Rivera', address: 'Purok 1, Sto. Niño', familyUnits: [ { id: 'FU-003-A', number: 'FAM-020', headName: 'Luz Rivera' }, ], }, ]

const JoinHouseFam = () => {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedHousehold, setSelectedHousehold] =
    useState<typeof HOUSEHOLDS[number] | null>(null)
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)
  const [resYrs, setResYrs] = useState<string>('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return HOUSEHOLDS.filter(hh =>
      hh.number.toLowerCase().includes(q) ||
      hh.headName.toLowerCase().includes(q) ||
      q.includes(hh.number.toLowerCase()) ||
      q.includes(hh.headName.toLowerCase())
    )
  }, [search])

  const handleSelectHousehold = (hh: typeof HOUSEHOLDS[number]) => {
    setSelectedHousehold(hh)
    setSelectedFamilyId(null)
    setSearch(`${hh.number} · ${hh.headName}`)
    setShowDropdown(false)                                   
  }

  return (
    <ThemedView safe style={{ flex: 1, justifyContent: 'flex-start' }}>
      <ThemedAppBar title='Join Household & Family Unit' showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>
        <View>
          <ThemedText weight='600' style={styles.sectionTitle}>Find your household</ThemedText>

          <ThemedTextInput
            placeholder='Search Household Number / Household Head'
            value={search}
            onFocus={() => setShowDropdown(true)}             
            onChangeText={(t: string) => {
              setSearch(t)
              setShowDropdown(true)                           
              if (!t) {
                setSelectedHousehold(null)
                setSelectedFamilyId(null)
              }
            }}
            onBlur={() => setShowDropdown(false)}             
            autoCorrect={false}
            autoCapitalize='characters'
          />

          {showDropdown && search.trim().length > 0 && (
            <View style={styles.dropdown}>
              {filtered.length === 0 ? (
                <ThemedText style={[styles.subtle, styles.dropdownEmpty]}>
                  No matching households
                </ThemedText>
              ) : (
                <ScrollView
                  style={{ maxHeight: 240 }}                  
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                >
                  {filtered.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.dropdownRow}
                      onPress={() => handleSelectHousehold(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <ThemedText weight='600'>{item.number} — {item.headName}</ThemedText>
                        <ThemedText style={styles.subtle}>{item.address}</ThemedText>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {selectedHousehold && (
            <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
              <ThemedText weight='600' style={styles.sectionTitle}>
                Family units in {selectedHousehold.number}
              </ThemedText>

              <View style={styles.pillsWrap}>
                {selectedHousehold.familyUnits.map((fam) => {
                  const active = selectedFamilyId === fam.id
                  return (
                    <Pressable
                      key={fam.id}
                      style={[styles.pill, active && styles.pillActive]}
                      onPress={() => setSelectedFamilyId(fam.id)}
                    >
                      <ThemedText style={[styles.pillText, active && styles.pillTextActive]}>
                        {fam.number} · {fam.headName}
                      </ThemedText>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )}

          <View style={{ paddingTop: 20 }}>
            <ThemedText weight='600' style={styles.sectionTitle}>Years of Residency</ThemedText>
            <ThemedTextInput
              placeholder='Years of Residency'
              value={resYrs}
              onChangeText={setResYrs}
              keyboardType='numeric'
            />
          </View>
        </View>

        <Spacer height={15} />

        <View>
          <ThemedButton>
            <ThemedText btn>Join</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default JoinHouseFam

const styles = StyleSheet.create({
  sectionTitle: { 
    marginBottom: 8 
  },
  subtle: { 
    opacity: 0.7, 
    fontSize: 12 
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  dropdownRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownEmpty: { 
    paddingHorizontal: 14, 
    paddingVertical: 12 
  },
  pillsWrap: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8, 
    marginTop: 8 
  },
  pill: {
    borderWidth: 1, 
    borderColor: '#cbd5e1',
    borderRadius: 999, 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    backgroundColor: 'white',
  },
  pillActive: { 
    backgroundColor: '#310101', 
    borderColor: '#310101' 
  },
  pillText: { 
    fontSize: 12 
  },
  pillTextActive: { 
    color: 'white', 
    fontWeight: '700' 
  },
})
