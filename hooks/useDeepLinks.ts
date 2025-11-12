// app/hooks/useDeepLinks.ts
import { useEffect } from 'react'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'

export default function useDeepLinks() {
  useEffect(() => {
    const onUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url)
      const path = (parsed.path || '').toLowerCase()
      const qp = parsed.queryParams || {}
      if (path === 'receipt' && qp.id) {
        router.replace({ pathname: '/(residentmodals)/(docreq)/receipt', params: { id: String(qp.id) } })
      }
    }
    Linking.getInitialURL().then(u => { if (u) onUrl({ url: u }) })
    const sub = Linking.addEventListener('url', onUrl)
    return () => sub.remove()
  }, [])
}
