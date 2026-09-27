'use client'

import { createBrowserClient } from '@supabase/ssr'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey && url.startsWith('http'))

let _client = null

export function getSupabase() {
  if (!isSupabaseConfigured) return null
  if (!_client) {
    _client = createBrowserClient(url, anonKey)
  }
  return _client
}

export const supabase = getSupabase()
