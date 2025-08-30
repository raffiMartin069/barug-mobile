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
import React, { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

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
  const [rel, setRel] = useState<Rel | ''>('') // ✅ Rel | ''
  const [linked, setLinked] = useState<Linked[]>([])
  const residentItems = useMemo(() => PERSON, [])

  const hasMother = linked.some(x => x.rel === 'MOTHER')
  const hasFather = linked.some(x => x.rel === 'FATHER')

  // ✅ Option 1: items with disabled flags
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

  return (
    <ThemedView safe>
      <ThemedAppBar title='Link Parents / Guardian' showNotif={false} showProfile={false} />

      <ThemedKeyboardAwareScrollView>

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

        <View>
          <ThemedButton>
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>
    </ThemedView>
  )
}

export default LinkParentGuardian

const styles = StyleSheet.create({})
