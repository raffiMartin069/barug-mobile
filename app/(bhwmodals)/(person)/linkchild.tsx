import Spacer from '@/components/Spacer'
import ThemedAppBar from '@/components/ThemedAppBar'
import ThemedButton from '@/components/ThemedButton'
import ThemedCard from '@/components/ThemedCard'
import ThemedChip from '@/components/ThemedChip'
import ThemedDropdown from '@/components/ThemedDropdown'
import ThemedKeyboardAwareScrollView from '@/components/ThemedKeyboardAwareScrollView'
import ThemedProgressBar from '@/components/ThemedProgressBar'
import ThemedSearchSelect from '@/components/ThemedSearchSelect'
import ThemedText from '@/components/ThemedText'
import ThemedView from '@/components/ThemedView'
import { useResidentFormStore } from '@/store/forms'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
// 🔎 bring in the same search hook & type used in CreateFamily
import { usePersonSearchByKey } from '@/hooks/usePersonSearch'
import { PersonSearchRequest } from '@/types/householdHead'

type CRel = 'CHILD' | 'SON' | 'DAUGHTER'
type LinkedChild = { id: string; name: string; rel: CRel }
type RelItem = { label: string; value: CRel; disabled?: boolean }

const LinkChild = () => {
  const router = useRouter()

  // 🔗 store fields & helpers
  const { 
    childIds, childNames, addChild, removeChild,
    motherId, fatherId, guardianId 
  } = useResidentFormStore()

  // Relationship picker + search input state
  const [rel, setRel] = useState<CRel | ''>('')
  const [searchText, setSearchText] = useState('')

  // ✅ live search (results + search() trigger) — mirrors CreateFamily usage
  const { results: residentItems, search } = usePersonSearchByKey()

  // Filter out parents/guardians from search results
  const filteredItems = useMemo(() => {
    if (!residentItems) return []
    const excludeIds = [motherId, fatherId, guardianId].filter(Boolean).map(id => String(id))
    return residentItems.filter(p => !excludeIds.includes(String(p.person_id)))
  }, [residentItems, motherId, fatherId, guardianId])

  // Relationship options (multiple children allowed)
  const relItems: RelItem[] = [
    { label: 'Child', value: 'CHILD' },
  ]

  // Chips derived from store (single source of truth).
  // If you later persist per-child relation, swap 'CHILD' below for that stored value.
  const linked: LinkedChild[] = useMemo(
    () => childIds.map((id, i) => ({ id, name: childNames[i] ?? 'Child', rel: 'CHILD' })),
    [childIds, childNames]
  )

  const canAdd = (r: CRel | '') => !!r

  // When the user picks a resident from the search list
  const onPick = (p: PersonSearchRequest) => {
    if (!rel) return
    const r: CRel = rel
    if (!canAdd(r)) return
    if (childIds.includes(p.person_id)) return // avoid duplicates

    // Store child (name for review screen; ids for payload later)
    // If you want to persist r (SON/DAUGHTER), add a parallel array in the store.
    addChild(p.person_id, p.full_name)

    // Clear UI
    setRel('')
    setSearchText('')
    // Optionally: search('') // to clear remote results too
  }

  // Manage modal state
  const [manageVisible, setManageVisible] = useState(false)
  const [selected, setSelected] = useState<LinkedChild | null>(null)

  const openManage = useCallback((item: LinkedChild) => {
    setSelected(item)
    setManageVisible(true)
  }, [])

  const closeManage = () => {
    setManageVisible(false)
    setSelected(null)
  }

  const unlinkSelected = () => {
    if (!selected) return
    removeChild(selected.id)
    closeManage()
  }

  // Icon per relation (visual only on chips)
  const getIcon = (r: CRel) => {
    if (r === 'SON') return <Ionicons name="male" size={14} color="#2563EB" />
    if (r === 'DAUGHTER') return <Ionicons name="female" size={14} color="#DB2777" />
    return null
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Link Child / Children' showNotif={false} showProfile={false} />
      <ThemedProgressBar step={3} totalStep={4} />

      <ThemedKeyboardAwareScrollView>
        {/* Linked list */}
        <View>
          <ThemedCard>
            <ThemedText title>Linked Child / Children</ThemedText>
            <ThemedText style={{ opacity: 0.75 }}>Tap a chip to manage.</ThemedText>
            <Spacer height={10} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {linked.length === 0 ? (
                <ThemedText style={{ opacity: 0.6 }}>No linked records yet</ThemedText>
              ) : (
                linked.map(k => (
                  <ThemedChip
                    key={`${k.id}`}
                    // If/when you persist rel per child, use the icon rendering below:
                    // label={
                    //   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    //     {getIcon(k.rel)}
                    //     <ThemedText non_btn>{`${k.name} • ${k.rel}`}</ThemedText>
                    //   </View>
                    // }
                    label={`${k.name} • ${k.rel}`}
                    filled
                    onPress={() => openManage(k)}
                  />
                ))
              )}
            </View>
          </ThemedCard>

          <Spacer />

          {/* Link form */}
          <ThemedCard>
            <ThemedText title>Link a Child</ThemedText>
            <ThemedText style={{ opacity: 0.75 }}>Search existing resident.</ThemedText>

            <View>
              <ThemedDropdown
                items={relItems}
                value={rel}
                setValue={(v: CRel) => setRel(v)}
                placeholder='Relationship'
              />

              <Spacer height={10} />

              {/* 🔎 Live-search select (same pattern as CreateFamily) */}
              <ThemedSearchSelect<PersonSearchRequest>
                items={filteredItems}   // results from the hook, excluding parents/guardians
                getLabel={(p) => (p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name)}
                getSubLabel={(p) => p.address}
                placeholder='Search resident by name…'
                emptyText='No matches'

                // Controlled input so we can call search() on every change
                inputValue={searchText}
                onInputValueChange={(t) => {
                  setSearchText(t) // update UI
                  search(t)        // 🔑 trigger hook to fetch/filter server-side
                }}

                onSelect={onPick}
                fillOnSelect={false}

                // Optional client-side fallback filter (kept from your version)
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
              />
            </View>
          </ThemedCard>
        </View>

        <Spacer height={15} />

        {/* Footer actions */}
        <View>
          <ThemedButton
            onPress={() => router.push('/(bhwmodals)/(person)/socioeconomicinfo')}
          >
            <ThemedText btn>Continue</ThemedText>
          </ThemedButton>
        </View>
      </ThemedKeyboardAwareScrollView>

      {/* Manage modal */}
      <Modal
        transparent
        visible={manageVisible}
        animationType="fade"
        onRequestClose={closeManage}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeManage} />
          <View style={styles.modalCard}>
            <ThemedText title>Manage Link</ThemedText>
            <Spacer height={10} />
            <ThemedText subtitle style={{ opacity: 0.75 }}>
              {selected ? `${selected.name} • ${selected.rel}` : ''}
            </ThemedText>
            <Spacer height={10} />
            <View style={styles.modalActions}>
              <ThemedButton style={styles.modalAction} onPress={unlinkSelected}>
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

export default LinkChild

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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
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
