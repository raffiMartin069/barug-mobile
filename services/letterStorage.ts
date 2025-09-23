// services/letterStorage.ts
import { supabase } from '@/constants/supabase' // adjust if your path differs
import * as FileSystem from 'expo-file-system'

type UploadOpts = {
  /** Requester person_id (used to organize folder paths) */
  personId?: number
  /** If acting on-behalf of someone, include their id (for path clarity) */
  onBehalfOfId?: number | null
  /** Optional subdirectory; defaults to computed "personId[__onBehalf]" */
  dir?: string
  /** Override contentType if you want */
  contentType?: string
  /** Upsert behavior (default true so users can replace) */
  upsert?: boolean
}

type UploadResult = { path: string }

/** Constant bucket name for letters */
const LETTERS_BUCKET = 'authorization-letters'

/**
 * Upload an authorization letter (image/PDF) from a local URI to Supabase Storage.
 * - Accepts file:// or content:// URIs
 * - Infers content type if not provided
 * - Stores under: <dir or computed>/<sanitizedFileName>
 */
export async function uploadAuthLetter(
  localUri: string,
  originalName?: string,
  opts?: UploadOpts,
): Promise<UploadResult> {
  if (!localUri) throw new Error('Missing file uri')

  // 1) Ensure we have a cache file:// URI (copy content:// to cache)
  const ensuredUri = await ensureFileUriInCache(localUri, originalName || `auth_${Date.now()}`)

  // 2) Convert to ArrayBuffer (fetch->blob preferred; base64 fallback)
  const { arrayBuffer, contentTypeFromBlob } = await toArrayBuffer(ensuredUri)

  // 3) Build a destination path and contentType
  const fileName = buildFileName(originalName)
  const safeName = sanitizeFileName(fileName)
  const contentType =
    opts?.contentType || contentTypeFromBlob || extToMime(safeName) || 'application/octet-stream'

  const baseDir =
    opts?.dir ??
    (opts?.personId
      ? `${opts.personId}${opts?.onBehalfOfId ? `__${opts.onBehalfOfId}` : ''}`
      : 'misc')

  const destPath = `${baseDir}/${safeName}`

  // 4) Upload
  const { data, error } = await supabase.storage.from(LETTERS_BUCKET).upload(destPath, arrayBuffer, {
    contentType,
    upsert: opts?.upsert ?? true,
  })
  if (error) throw error

  return { path: data.path }
}

/** ---------------- helpers ---------------- */

async function ensureFileUriInCache(uri: string, name: string): Promise<string> {
  if (uri.startsWith('file://')) return uri

  // content:// -> copy to cache
  const target = `${FileSystem.cacheDirectory}${sanitizeFileName(name)}`
  try {
    await FileSystem.copyAsync({ from: uri, to: target })
    return target
  } catch {
    // Fallback: read & write as base64 if direct copy fails
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    await FileSystem.writeAsStringAsync(target, base64, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return target
  }
}

async function toArrayBuffer(fileUri: string): Promise<{ arrayBuffer: ArrayBuffer; contentTypeFromBlob?: string }> {
  try {
    const res = await fetch(fileUri)
    const blob = await res.blob()
    const buf = await blob.arrayBuffer()
    return { arrayBuffer: buf, contentTypeFromBlob: (blob as any).type }
  } catch {
    // Fallback: base64 decode
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return { arrayBuffer: base64ToArrayBuffer(base64) }
  }
}

function buildFileName(name?: string) {
  if (name && /\./.test(name)) return name
  // Default to jpg if we don’t know
  return (name || `auth_${Date.now()}`) + '.jpg'
}

function extToMime(name: string): string | undefined {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return 'application/pdf'
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  return undefined
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

/** Tiny base64 decoder w/o relying on atob/Buffer */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup = new Uint8Array(256)
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i
  let bufferLength = base64.length * 0.75
  if (base64[base64.length - 1] === '=') bufferLength--
  if (base64[base64.length - 2] === '=') bufferLength--
  const bytes = new Uint8Array(bufferLength)
  let p = 0
  for (let i = 0; i < base64.length; i += 4) {
    const a = lookup[base64.charCodeAt(i)]
    const b = lookup[base64.charCodeAt(i + 1)]
    const c = lookup[base64.charCodeAt(i + 2)]
    const d = lookup[base64.charCodeAt(i + 3)]
    bytes[p++] = (a << 2) | (b >> 4)
    if (base64[i + 2] !== '=') bytes[p++] = ((b & 15) << 4) | (c >> 2)
    if (base64[i + 3] !== '=') bytes[p++] = ((c & 3) << 6) | d
  }
  return bytes.buffer
}
