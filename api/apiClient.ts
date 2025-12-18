// api/apiClient.ts
import Constants from 'expo-constants';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const API_BASE =
  (Constants?.expoConfig?.extra as any)?.API_BASE_URL ||
  (Constants as any)?.manifest?.extra?.API_BASE_URL ||
  'http://10.0.2.2:8000'; // Android emulator default

const DEFAULT_HEADERS: Record<string, string> = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

export type ApiOptions = {
  method?: HttpMethod;
  path: string;              // e.g. "/payments/api/renewals/12/start"
  body?: any;                // will be JSON.stringify-ed
  headers?: Record<string, string>;
  apiKey?: string;           // optional X-API-Key for Treasurer-only endpoints
  timeoutMs?: number;        // optional
};

export async function apiRequest<T = any>({
  method = 'GET',
  path,
  body,
  headers,
  apiKey,
  timeoutMs = 30000,
}: ApiOptions): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const res = await fetch(url, {
    method,
    headers: {
      ...DEFAULT_HEADERS,
      ...(apiKey ? { 'X-API-Key': apiKey } : {}),
      ...(headers || {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: controller.signal,
  }).catch((e) => {
    clearTimeout(id);
    throw e;
  });

  clearTimeout(id);

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data && (data.error || data.detail || data.message)) ||
      `HTTP ${res.status}`;
    const err = new Error(String(msg));
    (err as any).response = data;
    throw err;
  }

  return data as T;
}

function safeJson(s: string) {
  try { return JSON.parse(s); } catch { return s as any; }
}

export const ApiBaseURL = API_BASE;
