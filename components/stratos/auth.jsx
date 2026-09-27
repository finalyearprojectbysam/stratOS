'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { BrandMark } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Loader2, Mail, Lock, User, Building2, ArrowRight, ArrowLeft, Crown, IdCard, Hash, Users } from 'lucide-react'

const BG = 'https://images.unsplash.com/photo-1653549893012-b8b4fbe97630?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxuZXVyYWwlMjBuZXR3b3JrfGVufDB8fHxibHVlfDE3OTA0Nzg3ODZ8MA&ixlib=rb-4.1.0&q=85'
const PILLS = ['Business Intelligence', 'Competitor Research', 'SEO Analysis', 'Ads Strategy', 'Campaign Planning', 'Risk Analysis']

export function AuthPage() {
  const { ownerSignIn, ownerSignUp, employeeSignIn, resetPassword, refreshSession } = useApp()
  const [role, setRole] = useState(null) // null | 'owner' | 'employee'
  const [mode, setMode] = useState('login') // owner: login|signup|forgot
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', agencyName: '', agencyCode: '', employeeId: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submitOwner = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (mode === 'login') { await ownerSignIn({ email: form.email, password: form.password }); toast.success('Welcome back to STRATOS') }
      else if (mode === 'signup') { await ownerSignUp(form); toast.success('Agency created — welcome to STRATOS') }
      else { await resetPassword(form.email); toast.success('If an account exists, a reset link was sent.'); setMode('login'); setLoading(false); return }
      await refreshSession()
    } catch (err) { toast.error(err?.message || 'Authentication failed') } finally { setLoading(false) }
  }

  const submitEmployee = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await employeeSignIn({ agencyCode: form.agencyCode.trim(), employeeId: form.employeeId.trim(), password: form.password })
      toast.success('Welcome back to STRATOS')
      await refreshSession()
    } catch (err) { toast.error(err?.message || 'Login failed') } finally { setLoading(false) }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
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
            <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mt-4 text-base leading-relaxed text-slate-300">
              Orchestrate 11 specialized AI agents to analyze businesses, discover opportunities and build complete marketing strategies.
            </motion.p>
            <div className="mt-7 flex flex-wrap gap-2">
              {PILLS.map((p, i) => (
                <motion.span key={p} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-100 backdrop-blur">{p}</motion.span>
              ))}
            </div>
          </div>
          <div className="text-xs text-slate-400">AI-Powered Marketing Intelligence · STRATOS</div>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-background bg-radial-glow px-5 py-10">
        <div className="absolute right-6 top-6 lg:hidden"><BrandMark /></div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="rounded-2xl border-white/10 bg-card/70 p-7 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {!role ? (
                <motion.div key="role" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <h2 className="font-display text-2xl font-semibold">Welcome to STRATOS</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose how you want to sign in.</p>
                  <div className="mt-6 space-y-3">
                    <RoleButton icon={Crown} title="Agency Owner" desc="Manage your agency, staff, clients & analyses" onClick={() => { setRole('owner'); setMode('login') }} accent="from-blue-500 to-violet-600" />
                    <RoleButton icon={Users} title="Agency Employee" desc="Access your assigned projects & tasks" onClick={() => setRole('employee')} accent="from-cyan-500 to-blue-600" />
                  </div>
                </motion.div>
              ) : role === 'owner' ? (
                <motion.div key="owner" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <button onClick={() => setRole(null)} className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Change role</button>
                  <div className="mb-5 flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /><h2 className="font-display text-2xl font-semibold">{mode === 'login' ? 'Owner sign in' : mode === 'signup' ? 'Create your agency' : 'Reset password'}</h2></div>
                  <form onSubmit={submitOwner} className="space-y-4">
                    {mode === 'signup' && (<>
                      <Field id="fullName" label="Full name" icon={User} value={form.fullName} onChange={set('fullName')} placeholder="Aarav Sharma" required />
                      <Field id="agencyName" label="Agency name" icon={Building2} value={form.agencyName} onChange={set('agencyName')} placeholder="Nova Digital" required />
                    </>)}
                    <Field id="email" type="email" label="Email" icon={Mail} value={form.email} onChange={set('email')} placeholder="you@agency.com" required />
                    {mode !== 'forgot' && <Field id="password" type="password" label="Password" icon={Lock} value={form.password} onChange={set('password')} placeholder="••••••••" required />}
                    {mode === 'login' && <div className="flex justify-end"><button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">Forgot password?</button></div>}
                    <Button type="submit" disabled={loading} className="h-11 w-full bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Agency' : 'Send reset link'}<ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    {mode === 'login' && <>New agency? <button onClick={() => setMode('signup')} className="font-medium text-primary hover:underline">Create account</button></>}
                    {mode === 'signup' && <>Already have an agency? <button onClick={() => setMode('login')} className="font-medium text-primary hover:underline">Sign in</button></>}
                    {mode === 'forgot' && <button onClick={() => setMode('login')} className="inline-flex items-center font-medium text-primary hover:underline"><ArrowLeft className="mr-1 h-3.5 w-3.5" />Back to sign in</button>}
                  </div>
                  <Note>Demo mode — create an agency with any email &amp; password. A unique 6-digit agency code is generated automatically.</Note>
                </motion.div>
              ) : (
                <motion.div key="emp" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
                  <button onClick={() => setRole(null)} className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Change role</button>
                  <div className="mb-5 flex items-center gap-2"><Users className="h-5 w-5 text-cyan-300" /><h2 className="font-display text-2xl font-semibold">Employee sign in</h2></div>
                  <form onSubmit={submitEmployee} className="space-y-4">
                    <Field id="agencyCode" label="Agency Code" icon={Hash} value={form.agencyCode} onChange={set('agencyCode')} placeholder="482731" required />
                    <Field id="employeeId" label="Employee ID" icon={IdCard} value={form.employeeId} onChange={set('employeeId')} placeholder="STR001" required />
                    <Field id="password" type="password" label="Password" icon={Lock} value={form.password} onChange={set('password')} placeholder="••••••••" required />
                    <Button type="submit" disabled={loading} className="h-11 w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-90">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In<ArrowRight className="ml-2 h-4 w-4" /></>}
                    </Button>
                  </form>
                  <Note>Your Agency Owner creates your credentials. Demo employee: sign in as an Owner first (any email), then use the seeded code with ID <b className="text-slate-200">STR001</b> / password <b className="text-slate-200">staff123</b>.</Note>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function RoleButton({ icon: Icon, title, desc, onClick, accent }) {
  return (
    <button onClick={onClick} className="group flex w-full items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]">
      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white', accent)}><Icon className="h-5 w-5" /></div>
      <div className="flex-1"><div className="font-medium">{title}</div><div className="text-xs text-muted-foreground">{desc}</div></div>
      <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
    </button>
  )
}
function Field({ id, label, icon: Icon, type = 'text', ...props }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative"><Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} type={type} className="h-11 border-white/10 bg-white/[0.03] pl-10 focus-visible:ring-primary/40" {...props} /></div>
    </div>
  )
}
function Note({ children }) {
  return <p className="mt-5 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-center text-xs leading-relaxed text-amber-200/90">{children}</p>
}
