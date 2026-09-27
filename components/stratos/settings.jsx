'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { authService } from '@/lib/services'
import { GlowCard, PageHeader } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Settings as SettingsIcon, User, Building2, Bell, Shield, Plug, Palette, Loader2, Check, Moon, Sun } from 'lucide-react'
import { initials } from '@/lib/format'

const TABS = [
  { key: 'profile', label: 'Profile', icon: User }, { key: 'agency', label: 'Agency', icon: Building2 },
  { key: 'notifications', label: 'Notifications', icon: Bell }, { key: 'security', label: 'Security', icon: Shield },
  { key: 'integrations', label: 'API / Integrations', icon: Plug }, { key: 'appearance', label: 'Appearance', icon: Palette },
]

export function SettingsPage() {
  const { user, profile, refreshSession } = useApp()
  const [form, setForm] = useState({ full_name: profile?.full_name || '', email: user?.email || '', agency_name: profile?.agency_name || '', agency_website: profile?.agency_website || '', agency_industry: profile?.agency_industry || '' })
  const [saving, setSaving] = useState(false)
  const [theme, setTheme] = useState('dark')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try { await authService.updateProfile({ full_name: form.full_name, agency_name: form.agency_name, agency_website: form.agency_website, agency_industry: form.agency_industry }); await refreshSession?.(); toast.success('Settings saved') }
    catch (e) { toast.error('Could not save settings') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={SettingsIcon} title="Settings" subtitle="Manage your profile, agency and platform preferences." />
      <Tabs defaultValue="profile">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-white/[0.02] p-1">
          {TABS.map((t) => <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:bg-white/[0.08]"><t.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t.label}</span></TabsTrigger>)}
        </TabsList>

        <TabsContent value="profile" className="mt-5">
          <GlowCard hover={false} className="p-6">
            <div className="flex items-center gap-4"><Avatar className="h-16 w-16 border border-white/10"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-lg text-white">{initials(form.full_name || 'U')}</AvatarFallback></Avatar>
              <div><Button variant="outline" size="sm" className="border-white/15" onClick={() => toast.info('Avatar upload coming soon')}>Change avatar</Button><p className="mt-1 text-xs text-muted-foreground">JPG or PNG, up to 2MB</p></div></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={set('full_name')} />
              <Field label="Email" value={form.email} onChange={set('email')} disabled />
            </div>
            <div className="mt-6"><Button onClick={save} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save changes</Button></div>
          </GlowCard>
        </TabsContent>

        <TabsContent value="agency" className="mt-5">
          <GlowCard hover={false} className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Agency name" value={form.agency_name} onChange={set('agency_name')} />
              <Field label="Website" value={form.agency_website} onChange={set('agency_website')} placeholder="https://..." />
              <Field label="Industry" value={form.agency_industry} onChange={set('agency_industry')} placeholder="Digital Marketing" className="sm:col-span-2" />
            </div>
            <div className="mt-6"><Button onClick={save} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save changes</Button></div>
          </GlowCard>
        </TabsContent>

        <TabsContent value="notifications" className="mt-5">
          <GlowCard hover={false} className="divide-y divide-white/10 p-2">
            {[['Analysis completed', 'Notify me when an AI analysis finishes'], ['New reports', 'Email me when a report is generated'], ['Team activity', 'Updates when teammates make changes'], ['Product updates', 'News about new STRATOS features']].map(([t, d], i) => (
              <div key={t} className="flex items-center justify-between px-4 py-4"><div><div className="text-sm font-medium">{t}</div><div className="text-xs text-muted-foreground">{d}</div></div><Switch defaultChecked={i < 2} /></div>
            ))}
          </GlowCard>
        </TabsContent>

        <TabsContent value="security" className="mt-5">
          <GlowCard hover={false} className="space-y-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2"><Field label="New password" type="password" placeholder="••••••••" /><Field label="Confirm password" type="password" placeholder="••••••••" /></div>
            <Button onClick={() => toast.info('Password update handled via Supabase Auth')} variant="outline" className="border-white/15"><Shield className="mr-2 h-4 w-4" />Update password</Button>
          </GlowCard>
        </TabsContent>

        <TabsContent value="integrations" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[['Supabase', 'Database, Auth & Storage', 'Connected'], ['Gemini API', 'AI agent reasoning engine', 'Coming soon'], ['Google Ads', 'Campaign performance data', 'Coming soon'], ['Meta Ads', 'Social campaign data', 'Coming soon']].map(([n, d, s]) => (
              <GlowCard key={n} className="flex items-center justify-between p-5"><div><div className="font-medium">{n}</div><div className="text-xs text-muted-foreground">{d}</div></div><span className={cn('rounded-full border px-2.5 py-0.5 text-xs', s === 'Connected' ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-muted-foreground')}>{s}</span></GlowCard>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="mt-5">
          <GlowCard hover={false} className="p-6">
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
              <button onClick={() => setTheme('dark')} className={cn('flex items-center gap-3 rounded-xl border p-4 transition', theme === 'dark' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/[0.02]')}><Moon className="h-5 w-5 text-blue-300" /><div className="text-left"><div className="text-sm font-medium">Dark</div><div className="text-xs text-muted-foreground">Default</div></div>{theme === 'dark' && <Check className="ml-auto h-4 w-4 text-blue-300" />}</button>
              <button onClick={() => { setTheme('light'); toast.info('Light mode is coming soon — dark is the default STRATOS theme.') }} className={cn('flex items-center gap-3 rounded-xl border p-4 transition', theme === 'light' ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/10 bg-white/[0.02]')}><Sun className="h-5 w-5 text-amber-300" /><div className="text-left"><div className="text-sm font-medium">Light</div><div className="text-xs text-muted-foreground">Coming soon</div></div></button>
            </div>
          </GlowCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, className, type = 'text', ...props }) {
  return <div className={cn('space-y-1.5', className)}><Label className="text-xs font-medium text-muted-foreground">{label}</Label><Input type={type} className="input-dark h-10" {...props} /></div>
}
