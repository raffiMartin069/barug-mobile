// hooks/NiceModalProvider.tsx
import NiceModal, { ModalVariant } from '@/components/NiceModal'
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ShowOptions = {
  title: string
  message?: string
  variant?: ModalVariant
  primaryText?: string
  secondaryText?: string
  onPrimary?: () => void
  onSecondary?: () => void  
  dismissible?: boolean
}

type Ctx = {
  showModal: (opts: ShowOptions) => void
  hideModal: () => void
}

const ModalCtx = createContext<Ctx | null>(null)

export function NiceModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  const [opts, setOpts] = useState<ShowOptions>({
    title: '',
    message: '',
    variant: 'info',
    primaryText: 'OK',
  })

  const showModal = useCallback((o: ShowOptions) => {
    setOpts({
      variant: 'info',
      primaryText: 'OK',
      dismissible: true,
      ...o,
    })
    setVisible(true)
  }, [])

  const hideModal = useCallback(() => setVisible(false), [])

  const ctx = useMemo(() => ({ showModal, hideModal }), [showModal, hideModal])

  return (
    <ModalCtx.Provider value={ctx}>
      {children}
      <NiceModal
        visible={visible}
        title={opts.title}
        message={opts.message}
        variant={opts.variant}
        primaryText={opts.primaryText}
        secondaryText={opts.secondaryText}
        onPrimary={() => { opts.onPrimary?.(); hideModal() }}
        onSecondary={() => { opts.onSecondary?.(); hideModal() }}
        onClose={hideModal}
        dismissible={opts.dismissible}
      />
    </ModalCtx.Provider>
  )
}

export function useNiceModal() {
  const ctx = useContext(ModalCtx)
  if (!ctx) throw new Error('useNiceModal must be used within <NiceModalProvider>')
  return ctx
}
