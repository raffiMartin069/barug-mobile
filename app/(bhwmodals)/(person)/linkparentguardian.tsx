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
import { usePersonSearchWithGender } from '@/hooks/usePersonSearch'
import { useResidentFormStore } from '@/store/forms'
import { PersonSearchRequest } from '@/types/householdHead'
import { useRouter } from 'expo-router'
import React, { useCallback, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'

type Rel = 'MOTHER' | 'FATHER' | 'GUARDIAN'
type Linked = { id: string; name: string; rel: Rel }
type RelItem = { label: string; value: Rel; disabled?: boolean }

const LinkParentGuardian = () => {
  const router = useRouter()

  // Store fields (now single guardian)
  const {
    motherId, motherName,
    fatherId, fatherName,
    guardianId, guardianName,
    childIds,
    setMother, setFather,
    setGuardian, clearGuardian,
  } = useResidentFormStore()

  const { results: residentItems, search } = usePersonSearchWithGender()

  const [rel, setRel] = useState<Rel | ''>('')
  const [searchText, setSearchText] = useState('')

  // Filter results by sex based on relationship and exclude children
  const filteredBySex = useMemo(() => {
    if (!residentItems) return []
    console.log('[LinkParent] childIds:', childIds)
    console.log('[LinkParent] residentItems sample:', residentItems[0])
    let filtered = residentItems.filter(p => {
      const personIdStr = String(p.person_id)
      const isChild = childIds.includes(personIdStr)
      if (isChild) console.log('[LinkParent] Filtering out child:', personIdStr, p.full_name)
      return !isChild
    })
    console.log('[LinkParent] After child filter:', filtered.length, 'of', residentItems.length)
    if (rel === 'MOTHER') return filtered.filter(p => p.sex_id === 2)
    if (rel === 'FATHER') return filtered.filter(p => p.sex_id === 1)
    return filtered
  }, [residentItems, rel, childIds])

  // Build chips: mother, father, guardian (single)
  const linked: Linked[] = useMemo(() => {
    const out: Linked[] = []
    if (motherId) out.push({ id: String(motherId), name: motherName ?? 'Mother', rel: 'MOTHER' })
    if (fatherId) out.push({ id: String(fatherId), name: fatherName ?? 'Father', rel: 'FATHER' })
    if (guardianId) out.push({ id: String(guardianId), name: guardianName ?? 'Guardian', rel: 'GUARDIAN' })
    return out
  }, [motherId, motherName, fatherId, fatherName, guardianId, guardianName])

  const hasMother = !!motherId
  const hasFather = !!fatherId
  const hasGuardian = !!guardianId

  // Disable “Guardian” if already set
  const relItems: RelItem[] = [
    { label: 'Mother',   value: 'MOTHER',   disabled: hasMother },
    { label: 'Father',   value: 'FATHER',   disabled: hasFather },
    { label: 'Guardian', value: 'GUARDIAN', disabled: hasGuardian },
  ]

  const canAdd = (r: Rel | '') => {
    if (r === 'MOTHER') return !hasMother
    if (r === 'FATHER') return !hasFather
    if (r === 'GUARDIAN') return !hasGuardian
    return false
  }

  // When a resident is chosen from search
  const onPick = (p: PersonSearchRequest) => {
    if (!rel) return
    const r: Rel = rel
    if (!canAdd(r)) return

    if (r === 'MOTHER') setMother(String(p.person_id), p.full_name)
    else if (r === 'FATHER') setFather(String(p.person_id), p.full_name)
    else setGuardian(String(p.person_id), p.full_name) // single guardian

    setRel('')
    setSearchText('')
  }

  // Manage modal
  const [manageVisible, setManageVisible] = useState(false)
  const [selected, setSelected] = useState<Linked | null>(null)

  const openManage = useCallback((item: Linked) => {
    setSelected(item)
    setManageVisible(true)
  }, [])
  const closeManage = () => { setManageVisible(false); setSelected(null) }

  const unlinkSelected = () => {
    if (!selected) return
    if (selected.rel === 'MOTHER') setMother(null, null)
    else if (selected.rel === 'FATHER') setFather(null, null)
    else clearGuardian() // single guardian remover
    closeManage()
  }

  return (
    <ThemedView safe>
      <ThemedAppBar title='Link Parent(s) / Guardian' showNotif={false} showProfile={false} />
      <ThemedProgressBar step={2} totalStep={4} />
      <ThemedKeyboardAwareScrollView>

        {/* Linked preview chips */}
        <View>
          <ThemedCard>
            <ThemedText title>Linked Parent(s)/Guardian</ThemedText>
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
                    onPress={() => openManage(k)}
                  />
                ))
              )}
            </View>
          </ThemedCard>

          <Spacer />

          {/* Search + relationship picker */}
          <ThemedCard>
            <ThemedText title>Link Parent(s)/Guardian</ThemedText>
            <ThemedText style={{ opacity: 0.75 }}>Search existing resident.</ThemedText>

            <View>
              {/* Relation picker */}
              <ThemedDropdown
                items={relItems}
                value={rel}
                setValue={(v: unknown) => setRel((v ?? '') as Rel | '')}
                placeholder='Relationship'
              />

              <Spacer height={10}/>

              {/* Live search select */}
              <ThemedSearchSelect<PersonSearchRequest>
                items={filteredBySex}
                getLabel={(p) =>
                  p.person_code ? `${p.full_name} · ${p.person_code}` : p.full_name
                }
                getSubLabel={(p) => p.address}
                inputValue={searchText}
                onInputValueChange={(t) => { setSearchText(t); search(t) }}
                placeholder='Search resident by name…'
                emptyText='No matches'
                onSelect={onPick}
                fillOnSelect={false}
                filter={(p, q) => {
                  const query = (q || '').toLowerCase()
                  const name = (p.full_name || '').toLowerCase()
                  const code = (p.person_code || '').toLowerCase()
                  const addr = (p.address || '').toLowerCase()
                  return (
                    name.includes(query) ||
                    code.includes(query) ||
                    addr.includes(query) ||
                    query.includes(name) ||
                    (code && query.includes(code))
                  )
                }}
              />
            </View>
          </ThemedCard>
        </View>

        <Spacer height={15}/>

        {/* Footer actions */}
        <View>
          <ThemedButton onPress={() => router.push('/(bhwmodals)/(person)/linkchild')}>
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
            <Spacer height={10}/>
            <ThemedText subtitle style={{opacity: 0.75}}>
              {selected ? `${selected.name} • ${selected.rel}` : ''}
            </ThemedText>
            <Spacer height={10}/>
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