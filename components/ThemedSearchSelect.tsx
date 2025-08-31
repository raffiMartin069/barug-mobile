import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
    NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TextInputFocusEventData,
    View,
} from 'react-native'
import ThemedText from './ThemedText'
import ThemedTextInput from './ThemedTextInput'

type Maybe<T> = T | null

type BaseProps<T> = {
  items: T[]
  /** Extract the main label shown in the input and top of each row */
  getLabel: (item: T) => string
  /** Optional sublabel shown under the main label (e.g., address) */
  getSubLabel?: (item: T) => string | undefined
  /** Custom filter; defaults to a case-insensitive substring on getLabel */
  filter?: (item: T, query: string) => boolean
  /** Called when a row is selected */
  onSelect: (item: T) => void
  /** Placeholder for the input */
  placeholder?: string
  /** Message when no results */
  emptyText?: string
  /** Max dropdown height (px) */
  maxDropdownHeight?: number
  /** Auto-cap behavior for TextInput */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  /** If true, dropdown shows when input is focused and query non-empty */
  initiallyOpen?: boolean
  /** Optional custom row renderer; return your own JSX for each item */
  renderItem?: (item: T, isActive: boolean) => React.ReactNode
}

type ControlledTextProps =
  | {
      /** Controlled text value for the input */
      inputValue: string
      /** Controlled change handler for the input */
      onInputValueChange: (text: string) => void
      /** When selecting, should the input auto-fill with the selected label? default: true */
      fillOnSelect?: boolean
    }
  | {
      inputValue?: undefined
      onInputValueChange?: undefined
      fillOnSelect?: boolean
    }

type ValueProps<T> =
  | {
      /** Currently selected value (optional) */
      value: Maybe<T>
      /** If provided, sets the input text to getLabel(value) when value changes */
      reflectSelectionInInput?: boolean
    }
  | {
      value?: undefined
      reflectSelectionInInput?: boolean
    }

type Props<T> = BaseProps<T> & ControlledTextProps & ValueProps<T>

/**
 * ThemedSearchSelect
 * - Composes ThemedTextInput + a results dropdown
 * - Works with controlled or uncontrolled input text
 * - Calls onSelect(item) when a row is picked
 */
export default function ThemedSearchSelect<T>(props: Props<T>) {
  const {
    items,
    getLabel,
    getSubLabel,
    filter,
    onSelect,
    placeholder = 'Search…',
    emptyText = 'No matches',
    maxDropdownHeight = 240,
    autoCapitalize = 'characters',
    initiallyOpen = false,
    renderItem,
    // controlled or uncontrolled input text
    inputValue,
    onInputValueChange,
    fillOnSelect = true,
    // selection reflection
    value,
    reflectSelectionInInput = true,
  } = props

  // internal text state if uncontrolled
  const [innerText, setInnerText] = useState<string>('')
  const text = inputValue ?? innerText
  const setText = onInputValueChange ?? setInnerText

  const [open, setOpen] = useState<boolean>(initiallyOpen)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  // ✅ cross-platform timeout type (RN returns number)
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<TextInput>(null)

  // When value changes (external selection), reflect in input if asked
  useEffect(() => {
    if (value && reflectSelectionInInput) {
      const lbl = safeTrim(getLabel(value))
      if (lbl && lbl !== text) setText(lbl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // cleanup any pending timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current)
        blurTimeoutRef.current = null
      }
    }
  }, [])

  const q = safeTrim(text).toLowerCase()

  const defaultFilter = (it: T, query: string) => {
    const lbl = safeTrim(getLabel(it)).toLowerCase()
    const sub = safeTrim(getSubLabel?.(it)).toLowerCase()
    return lbl.includes(query) || (sub ? sub.includes(query) : false)
  }

  const list = useMemo(() => {
    if (!q) return []
    const fn = filter ?? defaultFilter
    return items.filter(it => fn(it, q))
  }, [items, q, filter])

  const handleBlur = (_e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    // Delay closing to allow onPress handlers to run
    blurTimeoutRef.current = setTimeout(() => setOpen(false), 100)
  }

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    setOpen(true)
  }

  const selectItem = (item: T) => {
    if (fillOnSelect) setText(getLabel(item))
    setOpen(false)
    onSelect(item)
    // inputRef.current?.focus()
  }

  return (
    <View>
      <ThemedTextInput
        ref={inputRef as any}
        placeholder={placeholder}
        value={text}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChangeText={(t: string) => {
          if (!open) setOpen(true)
          setText(t)
        }}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
      />

      {open && safeTrim(text).length > 0 && (
        <View style={styles.dropdown}>
          {list.length === 0 ? (
            <ThemedText style={[styles.subtle, styles.dropdownEmpty]}>
              {emptyText}
            </ThemedText>
          ) : (
            <ScrollView
              style={{ maxHeight: maxDropdownHeight }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {list.map((item, idx) => {
                const key = `${idx}-${getLabel(item)}`
                const isActive = activeKey === key
                return (
                  <Pressable
                    key={key}
                    style={[styles.row, isActive && styles.rowActive]}
                    onPress={() => selectItem(item)}
                    onHoverIn={() => setActiveKey(key)}
                    onHoverOut={() => setActiveKey(null)}
                  >
                    {renderItem ? (
                      renderItem(item, isActive)
                    ) : (
                      <View style={{ flex: 1 }}>
                        <ThemedText weight="600">
                          {getLabel(item)}
                        </ThemedText>
                        {!!getSubLabel && (
                          <ThemedText style={styles.subtle}>
                            {getSubLabel(item)}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </Pressable>
                )
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  )
}

function safeTrim(v?: string) {
  return (v || '').trim()
}

const styles = StyleSheet.create({
  dropdown: {
    marginTop: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowActive: {
    backgroundColor: '#F9FAFB',
  },
  subtle: {
    opacity: 0.7,
    fontSize: 12,
  },
  dropdownEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
})
