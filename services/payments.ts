// /services/payments.ts
import Constants from 'expo-constants'

const API_BASE: string = String(
  (Constants.expoConfig?.extra as any)?.API_BASE_URL || ''
).replace(/\/+$/, '')

async function apiFetch<T = any>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new Error('Missing API_BASE_URL in app.json → expo.extra.API_BASE_URL')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  // surface JSON or text on error
  if (!res.ok) {
    let payload: any = null
    try { payload = await res.json() } catch { payload = await res.text() }
    const msg = typeof payload === 'string'
      ? `HTTP ${res.status} ${payload}`
      : `HTTP ${res.status} ${payload?.error || payload?.message || ''}`.trim()
    throw new Error(msg)
  }
  try { return (await res.json()) as T } catch { return {} as T }
}

export async function startDocCheckout(
  docId: number,
  body: { success_url: string; cancel_url: string; amount?: number }
): Promise<{ checkout_url: string; provider_session_id: string }> {
  return apiFetch(`/payments/api/docs/${docId}/start`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function confirmDocPayment(
  docId: number,
  opts?: { dev?: boolean }
): Promise<any> {
  const qs = opts?.dev ? '?dev=1' : ''
  return apiFetch(`/payments/api/docs/${docId}/confirm${qs}`, { method: 'POST' })
}
