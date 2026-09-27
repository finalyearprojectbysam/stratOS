import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// PKCE OAuth callback: exchanges the ?code for a Supabase session (stored in
// cookies), then returns the browser to the app root. The hash router then
// takes over (existing owner → /#/dashboard, new owner → onboarding wizard).
export async function GET(request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (code && supabaseUrl && supabaseKey) {
    const cookieStore = await cookies()
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    })
    try { await supabase.auth.exchangeCodeForSession(code) } catch (e) { /* fall through to redirect */ }
  }

  return NextResponse.redirect(new URL('/', url.origin))
}
