'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { clientService, analysisService } from '@/lib/services'
import { GlowCard } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, ArrowRight, Check, Sparkles, Loader2, Save, Building2, Target, ClipboardCheck,
} from 'lucide-react'

const STEPS = [
  { n: '01', label: 'Client Information', icon: Building2 },
  { n: '02', label: 'Goals & Audience', icon: Target },
  { n: '03', label: 'Review & Start', icon: ClipboardCheck },
]
const INDUSTRIES = ['Fitness', 'Education', 'Restaurant', 'Beauty', 'Healthcare', 'Real Estate', 'E-commerce', 'Technology', 'Retail', 'Finance', 'Other']
const GOALS = ['Lead Generation', 'Brand Awareness', 'Sales', 'Website Traffic', 'Customer Retention', 'Local Visibility']
const CHANNELS = ['Google Ads', 'Meta Ads', 'Instagram', 'Facebook', 'SEO', 'Email', 'Referrals', 'WhatsApp']

const EMPTY = {
  business_name: '', industry: '', website_url: '', instagram_url: '', facebook_url: '', google_business_url: '',
  target_location: '', business_description: '', target_audience: '', business_goals: [], current_channels: [], status: 'pending',
}

export function AddClientPage({ editId }) {
  const { navigate } = useApp()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(!editId)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const toggle = (k, v) => setForm((f) => ({ ...f, [k]: f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v] }))

  useEffect(() => {
    if (editId) clientService.get(editId).then((c) => {
      if (c) {
        const clean = {}
        Object.keys(EMPTY).forEach((k) => {
          const v = c[k]
          clean[k] = v == null ? (Array.isArray(EMPTY[k]) ? [] : '') : v
        })
        setForm({ ...EMPTY, ...clean, status: c.status || 'pending' })
      }
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [editId])

  const canNext = step === 0 ? form.business_name.trim() : true

  // Phase 3: send explicit NULL for any empty optional field so the AI agents
  // know the data is genuinely missing (not just skipped/omitted).
  const OPTIONAL_TEXT = ['industry', 'website_url', 'instagram_url', 'facebook_url', 'google_business_url', 'target_location', 'business_description', 'target_audience']
  const OPTIONAL_ARRAY = ['business_goals', 'current_channels']
  const normalize = (data) => {
    const out = { ...data, business_name: (data.business_name || '').trim() }
    OPTIONAL_TEXT.forEach((k) => { const v = typeof out[k] === 'string' ? out[k].trim() : out[k]; out[k] = v ? v : null })
    OPTIONAL_ARRAY.forEach((k) => { out[k] = Array.isArray(out[k]) && out[k].length ? out[k] : null })
    return out
  }

  const persist = async (status) => {
    const payload = { ...normalize(form), status }
    if (editId) return clientService.update(editId, payload)
    return clientService.create(payload)
  }

  const saveDraft = async () => {
    setSaving(true)
    try { await persist('draft'); toast.success('Saved as draft'); navigate('/clients') }
    catch (e) { toast.error('Could not save'); setSaving(false) }
  }

  const startAnalysis = async () => {
    setSaving(true)
    try {
      const client = await persist('in_progress')
      const analysis = await analysisService.create({ client_id: client.id, client_name: client.business_name, status: 'in_progress', started_at: new Date().toISOString(), agents_used: 0 })
      toast.success('AI analysis started')
      navigate(`/analysis/${analysis.id}`)
    } catch (e) { toast.error('Could not start analysis'); setSaving(false) }
  }

  if (!loaded) return <div className="p-8 text-center text-muted-foreground"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => navigate('/clients')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Clients</button>
      <div><h1 className="font-display text-2xl font-semibold">{editId ? 'Edit Client' : 'Add New Client'}</h1><p className="mt-1 text-sm text-muted-foreground">Provide business details, then launch the multi-agent AI analysis.</p></div>

      {/* Step indicator */}
      <div className="flex items-center">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex flex-1 items-center last:flex-none">
            <button onClick={() => i < step && setStep(i)} className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition', i < step ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : i === step ? 'border-blue-500/50 bg-blue-500/15 text-blue-300 glow-blue' : 'border-white/10 bg-white/[0.03] text-muted-foreground')}>
                {i < step ? <Check className="h-5 w-5" /> : s.n}
              </div>
              <div className="hidden text-left sm:block"><div className={cn('text-[11px] uppercase tracking-wider', i === step ? 'text-blue-300' : 'text-muted-foreground')}>Step {s.n}</div><div className={cn('text-sm font-medium', i <= step ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</div></div>
            </button>
            {i < STEPS.length - 1 && <div className={cn('mx-3 h-px flex-1', i < step ? 'bg-emerald-500/40' : 'bg-white/10')} />}
          </div>
        ))}
      </div>

      <GlowCard hover={false} className="p-6">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
            {step === 0 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <F label="Business Name *" className="sm:col-span-2"><Input value={form.business_name} onChange={(e) => set('business_name', e.target.value)} placeholder="ABC Fitness" className="input-dark" /></F>
                <F label="Industry"><Select value={form.industry} onValueChange={(v) => set('industry', v)}><SelectTrigger className="input-dark"><SelectValue placeholder="Select industry" /></SelectTrigger><SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select></F>
                <F label="Target Location"><Input value={form.target_location} onChange={(e) => set('target_location', e.target.value)} placeholder="Chennai, India" className="input-dark" /></F>
                <F label="Website URL"><Input value={form.website_url} onChange={(e) => set('website_url', e.target.value)} placeholder="https://..." className="input-dark" /></F>
                <F label="Google Business Profile"><Input value={form.google_business_url} onChange={(e) => set('google_business_url', e.target.value)} placeholder="https://..." className="input-dark" /></F>
                <F label="Instagram URL"><Input value={form.instagram_url} onChange={(e) => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." className="input-dark" /></F>
                <F label="Facebook URL"><Input value={form.facebook_url} onChange={(e) => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." className="input-dark" /></F>
                <F label="Business Description" className="sm:col-span-2"><Textarea value={form.business_description} onChange={(e) => set('business_description', e.target.value)} placeholder="What does the business do, its services and unique value..." className="input-dark min-h-[90px]" /></F>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-6">
                <F label="Target Audience"><Textarea value={form.target_audience} onChange={(e) => set('target_audience', e.target.value)} placeholder="Describe the ideal customer, demographics, interests..." className="input-dark min-h-[80px]" /></F>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Business Goals (select multiple)</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {GOALS.map((g) => { const on = form.business_goals.includes(g); return (
                      <button key={g} onClick={() => toggle('business_goals', g)} className={cn('flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition', on ? 'border-blue-500/50 bg-blue-500/10 text-foreground' : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20')}>
                        {g}{on && <Check className="h-4 w-4 text-blue-300" />}
                      </button>) })}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">Current Marketing Channels</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CHANNELS.map((c) => { const on = form.current_channels.includes(c); return (
                      <button key={c} onClick={() => toggle('current_channels', c)} className={cn('rounded-full border px-3 py-1.5 text-xs transition', on ? 'border-violet-500/50 bg-violet-500/15 text-violet-200' : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20')}>{c}</button>) })}
                  </div>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <ReviewCard title="Business Information" rows={[['Business Name', form.business_name], ['Industry', form.industry], ['Location', form.target_location], ['Website', form.website_url], ['Instagram', form.instagram_url], ['Facebook', form.facebook_url], ['Description', form.business_description]]} />
                <ReviewCard title="Goals & Audience" rows={[['Target Audience', form.target_audience], ['Goals', form.business_goals.join(', ')], ['Channels', form.current_channels.join(', ')]]} />
                <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] p-4 text-sm text-blue-100/90">
                  <Sparkles className="mr-2 inline h-4 w-4" />Starting the analysis will run 7 specialized AI agents to build a complete marketing strategy report.
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
          <div>{step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveDraft} disabled={saving || !form.business_name.trim()} className="border-white/15"><Save className="mr-2 h-4 w-4" />Save as Draft</Button>
            {step < 2 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">Continue<ArrowRight className="ml-2 h-4 w-4" /></Button>
            ) : (
              <Button onClick={startAnalysis} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Start AI Analysis</Button>
            )}
          </div>
        </div>
      </GlowCard>
    </div>
  )
}

function F({ label, className, children }) {
  return <div className={cn('space-y-1.5', className)}><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>
}
function ReviewCard({ title, rows }) {
  const has = rows.filter(([, v]) => v && v.length)
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {has.length ? has.map(([k, v]) => <div key={k}><dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt><dd className="mt-0.5 text-sm">{v}</dd></div>) : <div className="text-sm text-muted-foreground">No details provided</div>}
      </dl>
    </div>
  )
}
