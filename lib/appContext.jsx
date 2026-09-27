'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

// Shared application context (auth + navigation). Value is provided by App in page.js.
export const AppContext = createContext(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppContext')
  return ctx
}

// Lightweight hash-based router — keeps the app a single Next.js page (no server
// 404s on refresh) while supporting the full route table from the spec.
export function useHashRoute() {
  const [hash, setHash] = useState('#/dashboard')

  useEffect(() => {
    const read = () => setHash(window.location.hash || '#/dashboard')
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  const path = (hash.startsWith('#') ? hash.slice(1) : hash) || '/dashboard'
  const segments = path.split('/').filter(Boolean)

  const navigate = useCallback((to) => {
    const target = to.startsWith('#') ? to : `#${to}`
    if (window.location.hash === target) {
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    } else {
      window.location.hash = target
    }
    window.scrollTo({ top: 0 })
  }, [])

  return { path, segments, navigate }
}
