import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedChip from '@/components/ThemedChip'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import React, { useCallback, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

type Rel = 'MOTHER' | 'FATHER' | 'GUARDIAN'
type Linked = { id: string; name: string; rel: Rel }
type RelItem = { label: string; value: Rel; disabled?: boolean } // ✅ Option 1 items

type Person = {
  person_id: string
  full_name: string
  person_code?: string
  address?: string
}

const PERSON: Person[] = [
  { person_id: 'P-001', full_name: 'Rogelio Santos', person_code: 'P03-R001', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-002', full_name: 'Maria Santos', person_code: 'P03-R002', address: 'Purok 3, Sto. Niño' },
  { person_id: 'P-003', full_name: 'Juan Dela Cruz', person_code: 'P05-R010', address: 'Purok 5, Sto. Niño' },
  { person_id: 'P-004', full_name: 'Luz Rivera', person_code: 'P01-R020', address: 'Purok 1, Sto. Niño' },
]

const LinkParentGuardian = () => {
  const [rel, setRel] = useState<Rel | ''>('')
  const [linked, setLinked] = useState<Linked[]>([])
  const residentItems = useMemo(() => PERSON, [])

  const hasMother = linked.some(x => x.rel === 'MOTHER')
  const hasFather = linked.some(x => x.rel === 'FATHER')

  const relItems: RelItem[] = [
    { label: 'Mother',   value: 'MOTHER',   disabled: hasMother },
    { label: 'Father',   value: 'FATHER',   disabled: hasFather },
    { label: 'Guardian', value: 'GUARDIAN' },
  ]

  const canAdd = (r: Rel | '') => {
    if (r === 'MOTHER') return !hasMother
    if (r === 'FATHER') return !hasFather
    if (r === 'GUARDIAN') return true
    return false
  }

  const [searchText, setSearchText] = useState('')

  const onPick = (p: Person) => {
    if (!rel) return
    const r: Rel = rel
    if (!canAdd(r)) return
    if (linked.some(x => x.id === p.person_id && x.rel === r)) return

    setLinked(prev => [...prev, { id: p.person_id, name: p.full_name, rel: r }])

    setRel('')
    setSearchText('')
  }

  const [manageVisible, setManageVisible] = useState(false)
  const [selected, setSelected] = useState<Linked | null>(null)

  const openManage = useCallback((item: Linked) => {
    setSelected(item);
    setManageVisible(true);
  }, []);
  const closeManage = () => { setManageVisible(false); setSelected(null) }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Link Parent(s) / Guardian' showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>

        <View>
          <ThemedCard>
            <ThemedText title>Current Linked Parents/Guardian</ThemedText>
            <ThemedText style={{ opacity: 0.75 }}>Tap a chip to manage.</ThemedText>
            <Spacer height={10}/>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {linked.length === 0 ? (
                <ThemedText style={{ opacity: 0.6 }}>No linked records yet</ThemedText>
              ) : (
                linked.map((k) => (
                  <ThemedChip
                    key={`${k.id}-${k.rel}`}
                    label={`${k.name} • ${k.rel}`}
                    filled={k.rel !== 'GUARDIAN'}
                    onPress= {() =>  openManage(k)}
                  />
                ))
              )}
            </View>
          </ThemedCard>

          <Spacer />

          <ThemedCard>
            <ThemedText title>Link Parent(s)/Guardian</ThemedText>
            <ThemedText style={{ opacity: 0.75 }}>Search existing resident.</ThemedText>

            <View>
              <ThemedDropdown
                items={relItems}
                value={rel}
                setValue={(v: Rel) => setRel(v)}
                placeholder='Relationship'
              />

              <Spacer height={10}/>

              <ThemedSearchSelect<Person>
                items={residentItems}
                getLabel={(p) => p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name}
                getSubLabel={(p) => p.address}
                filter={(p, q) => {
                  const query = q.toLowerCase()
                  return (
                    p.full_name.toLowerCase().includes(query) ||
                    (p.person_code || '').toLowerCase().includes(query) ||
                    (p.address || '').toLowerCase().includes(query) ||
                    query.includes(p.full_name.toLowerCase()) ||
                    (p.person_code && query.includes(p.person_code.toLowerCase()))
                  )
                }}
                placeholder='Search resident by name…'
                emptyText='No matches'
                onSelect={onPick}
                inputValue={searchText}
                onInputValueChange={setSearchText}
                fillOnSelect={false}
              />
            </View>
          </ThemedCard>
        </View>

        <Spacer height={15}/>

        <View>
          <ThemedButton submit={false}>
            <ThemedText non_btn>Skip</ThemedText>
          </ThemedButton>
          <ThemedButton>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      <Modal
        transparent
        visible={manageVisible}
        animationType="fade"
        onRequestClose={closeManage}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          {/* Tap outside to close */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeManage} />

          <View style={styles.modalCard}>
            <ThemedText title>Manage Link</ThemedText>

            <Spacer height={10}/>

            <ThemedText subtitle style={{opacity: 0.75}}>
              {selected ? `${selected.name} • ${selected.rel}` : ''}
            </ThemedText>

            <Spacer height={10}/>

            <View style={styles.modalActions}>
              <ThemedButton style={styles.modalAction}>
                <ThemedText btn>Unlink</ThemedText>
              </ThemedButton>

              <ThemedButton submit={false} style={styles.modalAction} onPress={closeManage}>
                <ThemedText non_btn>Cancel</ThemedText>
              </ThemedButton>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  )
}

export default LinkParentGuardian

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Android elevation
    elevation: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalAction: {
    flex: 1,
  },
})
