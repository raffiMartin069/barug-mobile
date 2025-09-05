// services/storage.ts
import { supabase } from '@/constants/supabase'
import * as FileSystem from 'expo-file-system'

const BUCKET = 'id-uploads'

export type Picked = {
  uri?: string
  path?: string
  name?: string
  fileName?: string
  mimeType?: string
  type?: string
  base64?: string
  width?: number
  height?: number
}

/**
 * Upload a single file to Supabase Storage and return { path, publicUrl }.
 * IMPORTANT: Your edge function expects the STORAGE PATH (not the public URL).
 */
export async function uploadToStorage(picked: Picked, path: string) {
  if (!picked?.uri) throw new Error('Missing file uri for ' + path)

  let fileUri = picked.uri

  // Handle Android content:// URIs
  if (fileUri.startsWith('content://')) {
    const safe = (picked.fileName || picked.name || 'file').replace(/[^\w.-]/g, '_')
    const dest = `${FileSystem.cacheDirectory}upl_${Date.now()}_${safe}`
    await FileSystem.copyAsync({ from: fileUri, to: dest })
    fileUri = dest
  }

  // Read local file -> bytes
  const resp = await fetch(fileUri)
  if (!resp.ok) throw new Error(`Failed to read local file for ${path}: ${resp.status}`)
  const bytes = await resp.arrayBuffer()

  // Upload (upsert = true)
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: picked.mimeType || 'image/jpeg',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}


export async function uploadToLegitStorage(picked: Picked, path: string) {
  if (!picked?.uri) throw new Error('Missing file uri for ' + path)

  let fileUri = picked.uri

  // Handle Android content:// URIs
  if (fileUri.startsWith('content://')) {
    const safe = (picked.fileName || picked.name || 'file').replace(/[^\w.-]/g, '_')
    const dest = `${FileSystem.cacheDirectory}upl_${Date.now()}_${safe}`
    await FileSystem.copyAsync({ from: fileUri, to: dest })
    fileUri = dest
  }

  // Read local file -> bytes
  const resp = await fetch(fileUri)
  if (!resp.ok) throw new Error(`Failed to read local file for ${path}: ${resp.status}`)
  const bytes = await resp.arrayBuffer()

  // Upload (upsert = true)
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: picked.mimeType || 'image/jpeg',
    upsert: true,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}
