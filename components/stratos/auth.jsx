'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { dataMode } from '@/lib/services'
import { BrandMark } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Mail, Lock, User, Building2, ArrowRight, ArrowLeft } from 'lucide-react'

const BG = 'https://images.unsplash.com/photo-1653549893012-b8b4fbe97630?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxuZXVyYWwlMjBuZXR3b3JrfGVufDB8fHxibHVlfDE3OTA0Nzg3ODZ8MA&ixlib=rb-4.1.0&q=85'
const PILLS = ['Business Intelligence', 'Competitor Research', 'SEO Analysis', 'Marketing Strategy', 'Campaign Planning']

export function AuthPage() {
  const { signIn, signUp, resetPassword, refreshSession } = useApp()
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', agencyName: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn({ email: form.email, password: form.password })
        toast.success('Welcome back to STRATOS')
        await refreshSession()
      } else if (mode === 'signup') {
        const res = await signUp(form)
        if (dataMode === 'supabase' && res?.user && !res?.session) {
          toast.success('Account created. Check your email to confirm, then sign in.')
          setMode('login')
        } else {
          toast.success('Account created')
          await refreshSession()
        }
      } else {
        await resetPassword(form.email)
        toast.success('If an account exists, a reset link has been sent.')
        setMode('login')
      }
    } catch (err) {
      toast.error(err?.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const google = () => toast.info('Google sign-in will be enabled once your agency connects Google OAuth.')

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src={BG} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#080B14] via-[#080B14]/85 to-[#0F172A]/70" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandMark size={44} />
          <div className="max-w-lg">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="font-display text-4xl font-bold leading-tight">
              Your <span className="text-gradient">AI Marketing</span> Command Center
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-4 text-base leading-relaxed text-muted-foreground">
              Analyze businesses, discover opportunities, build strategies and coordinate marketing workflows with specialized AI agents.
            </motion.p>
            <div className="mt-7 flex flex-wrap gap-2">
              {PILLS.map((p, i) => (
                <motion.span key={p} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
                  {p}
                </motion.span>
              ))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">AI-Powered Marketing Intelligence · STRATOS AI</div>
        </div>
      </div>

      {/* Right auth card */}
      <div className="relative flex items-center justify-center bg-background bg-radial-glow px-5 py-10">
        <div className="absolute right-6 top-6 lg:hidden"><BrandMark /></div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="rounded-2xl border-white/10 bg-card/70 p-7 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-semibold">
                {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create your account' : 'Reset password'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'login' ? 'Welcome back. Enter your credentials to continue.' : mode === 'signup' ? 'Start orchestrating AI marketing analyses.' : 'We will email you a secure reset link.'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <Field id="fullName" label="Full name" icon={User} value={form.fullName} onChange={set('fullName')} placeholder="Aarav Sharma" required />
                  <Field id="agencyName" label="Agency name" icon={Building2} value={form.agencyName} onChange={set('agencyName')} placeholder="Nova Digital" required />
                </>
              )}
              <Field id="email" type="email" label="Email" icon={Mail} value={form.email} onChange={set('email')} placeholder="you@agency.com" required />
              {mode !== 'forgot' && (
                <Field id="password" type="password" label="Password" icon={Lock} value={form.password} onChange={set('password')} placeholder="••••••••" required />
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">Forgot password?</button>
                </div>
              )}

              <Button type="submit" disabled={loading} className="h-11 w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                  <>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create account' : 'Send reset link'}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </form>

            {mode !== 'forgot' && (
              <>
                <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-white/10" /> OR <span className="h-px flex-1 bg-white/10" />
                </div>
                <Button type="button" variant="outline" onClick={google} className="h-11 w-full border-white/15 bg-white/[0.02] hover:bg-white/[0.06]">
                  <GoogleIcon /> Continue with Google
                </Button>
              </>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'login' && (<>Don&apos;t have an account?{' '}<button onClick={() => setMode('signup')} className="font-medium text-primary hover:underline">Create account</button></>)}
              {mode === 'signup' && (<>Already have an account?{' '}<button onClick={() => setMode('login')} className="font-medium text-primary hover:underline">Sign in</button></>)}
              {mode === 'forgot' && (<button onClick={() => setMode('login')} className="inline-flex items-center font-medium text-primary hover:underline"><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back to sign in</button>)}
            </div>

            {dataMode === 'demo' && (
              <p className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-center text-xs text-amber-200/90">
                Demo mode — enter any email &amp; password to explore. Connect Supabase keys to enable real auth.
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function Field({ id, label, icon: Icon, type = 'text', ...props }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} type={type} className="h-11 border-white/10 bg-white/[0.03] pl-10 focus-visible:ring-primary/40" {...props} />
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  )
}
