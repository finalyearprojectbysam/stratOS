'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { meetingService, staffService, notificationService, statsService, ownerProfileService } from '@/lib/services'
import { GlowCard, PageHeader, EmptyState, StatCard } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button as Btn } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { initials, fmtDate, fmtDuration } from '@/lib/format'
import {
  Video, Plus, Loader2, CalendarClock, Bell, Instagram, Facebook, Linkedin, Mail, Lock, MessageCircle, Megaphone,
  User, Building2, ClipboardList, CheckCircle2, Clock, Rocket, ArrowRight, ArrowLeft, Check, Hash,
} from 'lucide-react'

const FF = ({ label, children }) => <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>

// ============================ NOTIFICATIONS BELL ============================
export function NotificationsBell() {
  const { navigate, role } = useApp()
  const [items, setItems] = useState([])
  const load = () => meetingService.generateReminders().catch(() => {}).finally(() => notificationService.forMe().then(setItems).catch(() => {}))
  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv) }, [])
  const unread = items.filter((n) => !n.is_read).length
  const open = async (n) => {
    await notificationService.update(n.id, { is_read: true }); load()
    const isMeeting = n.resource_type === 'meeting'
    navigate(isMeeting ? (role === 'owner' ? '/meetings' : '/dashboard') : (role === 'owner' ? '/tasks' : '/tasks'))
  }
  return (
    <DropdownMenu onOpenChange={(o) => { if (o) { notificationService.markAllRead().then(load) } }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground"><Bell className="h-5 w-5" />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">{unread}</span>}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 border-white/10 bg-popover">
        <DropdownMenuLabel className="flex items-center justify-between">Notifications {unread > 0 && <span className="text-xs text-muted-foreground">{unread} new</span>}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        {items.length === 0 ? <div className="px-3 py-6 text-center text-xs text-muted-foreground">No notifications</div> : items.slice(0, 8).map((n) => (
          <DropdownMenuItem key={n.id} onClick={() => open(n)} className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5">
            <div className="flex w-full items-center gap-2"><span className="text-sm font-medium">{n.title}</span>{!n.is_read && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-400" />}</div>
            <span className="text-xs text-muted-foreground">{n.message}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ============================ EMPLOYEE TODAY'S MEETINGS ============================
export function TodaysMeetings() {
  const { user } = useApp()
  const [meetings, setMeetings] = useState([])
  useEffect(() => { meetingService.forEmployee(user.id).then((all) => { const today = new Date().toISOString().slice(0, 10); setMeetings(all.filter((m) => m.meeting_date === today && m.status !== 'cancelled')) }).catch(() => {}) }, [user.id])
  return (
    <GlowCard hover={false} className="p-6">
      <div className="mb-4 flex items-center gap-2"><CalendarClock className="h-5 w-5 text-violet-300" /><h2 className="font-display text-lg font-semibold">Today&apos;s Meetings</h2></div>
      {meetings.length === 0 ? <p className="text-sm text-muted-foreground">No meeting with the owner today.</p> : meetings.map((m) => (
        <div key={m.id} className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] p-4">
          <div className="flex items-center justify-between"><div className="font-medium">{m.title}</div><span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs text-violet-200">{m.meeting_time}</span></div>
          {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
          <div className="mt-1 text-xs text-muted-foreground">With: Owner</div>
          <a href={m.meet_url} target="_blank" rel="noreferrer"><Button size="sm" className="mt-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Video className="mr-2 h-4 w-4" />Join Google Meet</Button></a>
        </div>
      ))}
    </GlowCard>
  )
}

// ============================ OWNER MEETINGS PAGE ============================
export function MeetingsPage() {
  const [meetings, setMeetings] = useState(null)
  const [staff, setStaff] = useState([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', meeting_date: new Date().toISOString().slice(0, 10), meeting_time: '16:00', meet_url: '', attendees: [] })
  const load = () => { meetingService.list().then(setMeetings).catch(() => setMeetings([])); staffService.list().then(setStaff).catch(() => {}) }
  useEffect(() => { load() }, [])
  const toggle = (id) => setForm((f) => ({ ...f, attendees: f.attendees.includes(id) ? f.attendees.filter((x) => x !== id) : [...f.attendees, id] }))
  const create = async () => {
    if (!form.title || !form.meet_url || form.attendees.length === 0) { toast.error('Title, Meet link and at least one employee are required'); return }
    setSaving(true)
    try { await meetingService.createMeeting(form); toast.success('Meeting scheduled — employees notified'); setOpen(false); setForm({ title: '', description: '', meeting_date: new Date().toISOString().slice(0, 10), meeting_time: '16:00', meet_url: '', attendees: [] }); load() }
    catch (e) { toast.error('Could not schedule meeting') } finally { setSaving(false) }
  }
  return (
    <div className="space-y-6">
      <PageHeader icon={Video} title="Meetings" subtitle="Schedule Google Meet sessions with your staff."
        actions={<Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Plus className="mr-2 h-4 w-4" />Schedule Meeting</Button>} />
      {meetings === null ? null : meetings.length === 0 ? <EmptyState icon={Video} title="No meetings yet" description="Schedule your first team meeting." /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meetings.map((m) => (
            <GlowCard key={m.id} className="p-5">
              <div className="flex items-center justify-between"><div className="font-display font-semibold">{m.title}</div><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-xs">{fmtDate(m.meeting_date)}</span></div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />{m.meeting_time} · {(m.attendees || []).length} attendee(s)</div>
              <a href={m.meet_url} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="mt-3 border-white/15"><Video className="mr-2 h-4 w-4" />Open Meet</Button></a>
            </GlowCard>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-popover sm:max-w-lg"><DialogHeader><DialogTitle>Schedule Meeting</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <FF label="Meeting Title *"><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input-dark" placeholder="Weekly Client Strategy Meeting" /></FF>
            <FF label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-dark min-h-[60px]" /></FF>
            <div className="grid grid-cols-2 gap-3"><FF label="Date *"><Input type="date" value={form.meeting_date} onChange={(e) => setForm((f) => ({ ...f, meeting_date: e.target.value }))} className="input-dark" /></FF><FF label="Time *"><Input type="time" value={form.meeting_time} onChange={(e) => setForm((f) => ({ ...f, meeting_time: e.target.value }))} className="input-dark" /></FF></div>
            <FF label="Google Meet Link *"><Input value={form.meet_url} onChange={(e) => setForm((f) => ({ ...f, meet_url: e.target.value }))} className="input-dark" placeholder="https://meet.google.com/xxx" /></FF>
            <FF label="Select Employees *"><div className="flex flex-wrap gap-2">{staff.map((s) => { const on = form.attendees.includes(s.id); return <button key={s.id} onClick={() => toggle(s.id)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition', on ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.02] text-muted-foreground')}>{on ? <Check className="h-3 w-3" /> : null}{s.full_name}</button> })}</div></FF>
          </div>
          <DialogFooter><Button onClick={create} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}Schedule</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================ SOCIAL MEDIA (COMING SOON) ============================
const SOCIALS = [
  { name: 'Instagram', icon: Instagram }, { name: 'Facebook', icon: Facebook }, { name: 'LinkedIn', icon: Linkedin },
  { name: 'Gmail', icon: Mail }, { name: 'Meta Ads Manager', icon: Megaphone }, { name: 'WhatsApp', icon: MessageCircle },
]
export function SocialMediaPage() {
  return (
    <div className="space-y-6">
      <PageHeader icon={Rocket} title="Social Media" subtitle="Connect your agency accounts. Integrations are on the way." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIALS.map((s) => (
          <GlowCard key={s.name} className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground"><s.icon className="h-5 w-5" /></div><div className="font-medium">{s.name}</div></div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Coming Soon</span>
          </GlowCard>
        ))}
      </div>
    </div>
  )
}

// ============================ MY PROFILE ============================
export function MyProfilePage() {
  const { role } = useApp()
  return role === 'employee' ? <EmployeeProfile /> : <OwnerProfile />
}

function EmployeeProfile() {
  const { user, profile, agency } = useApp()
  const [me, setMe] = useState(null)
  const [stats, setStats] = useState(null)
  useEffect(() => { staffService.get(user.id).then(setMe).catch(() => {}); statsService.employeeSummary(user.id).then(setStats).catch(() => {}) }, [user.id])
  return (
    <div className="space-y-6">
      <PageHeader icon={User} title="My Profile" subtitle="Your personal and employment information." />
      <div className="grid gap-4 lg:grid-cols-3">
        <GlowCard hover={false} className="p-6 lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border border-white/10"><AvatarImage src={me?.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-xl text-white">{initials(me?.full_name || 'U')}</AvatarFallback></Avatar>
            <div className="mt-3 font-display text-lg font-semibold">{me?.full_name}</div>
            <div className="text-sm text-muted-foreground">{me?.role} · {me?.employee_id}</div>
          </div>
        </GlowCard>
        <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
          <Section title="Personal Information" rows={[['Full Name', me?.full_name], ['Gender', me?.gender], ['Date of Birth', me?.dob], ['Email', me?.email], ['Phone', me?.phone]]} />
          <Section title="Employment" rows={[['Employee ID', me?.employee_id], ['Position', me?.role], ['Agency', agency?.name], ['Status', me?.status === 'inactive' ? 'Inactive' : 'Active']]} />
        </div>
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard index={0} label="Assigned Tasks" value={stats.assigned} icon={ClipboardList} accent="blue" />
          <StatCard index={1} label="Completed" value={stats.completed} icon={CheckCircle2} accent="emerald" />
          <StatCard index={2} label="Completion" value={`${stats.completion}%`} icon={ClipboardList} accent="violet" />
          <StatCard index={3} label="Total Online" value={fmtDuration(me?.total_online_seconds || 0)} icon={Clock} accent="cyan" />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Your identity details are managed by your agency owner and are view-only.</p>
    </div>
  )
}

function OwnerProfile() {
  const { agency, profile, user, refreshSession } = useApp()
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  useEffect(() => { setForm(agency || {}) }, [agency])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const save = async () => { setSaving(true); try { await ownerProfileService.update(form); await refreshSession?.(); toast.success('Profile saved') } catch (e) { toast.error('Could not save') } finally { setSaving(false) } }
  return (
    <div className="space-y-6">
      <PageHeader icon={User} title="My Profile" subtitle="Your owner and agency information." />
      <GlowCard hover={false} className="p-6">
        <h3 className="mb-4 font-display font-semibold">Owner Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FF label="Full Name"><Input value={form.owner_name || ''} onChange={set('owner_name')} className="input-dark" /></FF>
          <FF label="Gmail (from Google)"><Input value={form.owner_email || ''} disabled className="input-dark" /></FF>
          <FF label="Phone"><Input value={form.owner_phone || ''} onChange={set('owner_phone')} className="input-dark" /></FF>
          <FF label="Date of Birth"><Input type="date" value={form.owner_dob || ''} onChange={set('owner_dob')} className="input-dark" /></FF>
          <FF label="Position / Designation"><Input value={form.owner_position || ''} onChange={set('owner_position')} className="input-dark" placeholder="Founder & CEO" /></FF>
          <FF label="Owner ID"><Input value={form.id?.slice(0, 8).toUpperCase() || ''} disabled className="input-dark" /></FF>
        </div>
        <h3 className="mb-4 mt-8 font-display font-semibold">Agency Information</h3>
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"><Hash className="h-5 w-5 text-primary" /><div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Agency Code</div><div className="font-display text-lg font-bold tracking-widest text-gradient">{agency?.code}</div></div></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FF label="Agency Name"><Input value={form.name || ''} onChange={set('name')} className="input-dark" /></FF>
          <FF label="Website"><Input value={form.website || ''} onChange={set('website')} className="input-dark" placeholder="https://..." /></FF>
          <FF label="Agency Email"><Input value={form.agency_email || ''} onChange={set('agency_email')} className="input-dark" /></FF>
          <FF label="Agency Phone"><Input value={form.agency_phone || ''} onChange={set('agency_phone')} className="input-dark" /></FF>
          <FF label="Location"><Input value={form.location || ''} onChange={set('location')} className="input-dark" /></FF>
          <FF label="Founded Year"><Input value={form.founded_year || ''} onChange={set('founded_year')} className="input-dark" /></FF>
          <FF label="Industry / Type"><Input value={form.industry || ''} onChange={set('industry')} className="input-dark" /></FF>
          <FF label="Number of Employees"><Input value={form.employee_count || ''} onChange={set('employee_count')} className="input-dark" /></FF>
          <div className="sm:col-span-2"><FF label="Description"><Textarea value={form.description || ''} onChange={set('description')} className="input-dark min-h-[70px]" /></FF></div>
          <div className="sm:col-span-2"><FF label="Main Services"><Input value={form.services || ''} onChange={set('services')} className="input-dark" placeholder="SEO, Paid Ads, Branding..." /></FF></div>
        </div>
        <Button onClick={save} disabled={saving} className="mt-6 bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save Changes</Button>
      </GlowCard>
    </div>
  )
}

function Section({ title, rows }) {
  return <GlowCard hover={false} className="p-5"><h3 className="font-display text-sm font-semibold">{title}</h3><dl className="mt-3 space-y-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v || 'NULL'}</dd></div>)}</dl></GlowCard>
}

// ============================ OWNER ONBOARDING WIZARD ============================
const STEPS = ['Agency Details', 'Owner Details', 'Agency Information', 'Connections']
const SERVICES = ['Digital Marketing', 'Web Development', 'SEO', 'Paid Ads', 'Social Media', 'Video Editing', 'Branding', 'Content Marketing', 'Other']
export function OnboardingWizard() {
  const { agency, profile, refreshSession } = useApp()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: agency?.name || '', website: '', agency_email: '', agency_phone: '', location: '', founded_year: '', description: '', owner_phone: '', owner_dob: '', owner_position: '', industry: '', employee_count: '', services: [], target_clients: '', service_areas: '' })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggleSvc = (s) => setForm((f) => ({ ...f, services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] }))
  const finish = async () => { setSaving(true); try { await ownerProfileService.completeSetup({ ...form, services: form.services.join(', ') }); await refreshSession?.(); toast.success('Welcome to STRATOS!') } catch (e) { toast.error('Could not save setup'); setSaving(false) } }
  const skipConnections = () => finish()
  return (
    <div className="min-h-screen bg-background bg-radial-glow px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground"><Rocket className="h-3.5 w-3.5 text-primary" />Welcome to STRATOS</div>
          <h1 className="mt-3 font-display text-2xl font-semibold">Let&apos;s set up your agency</h1>
        </div>
        <div className="mb-6 flex items-center gap-2">{STEPS.map((s, i) => <div key={s} className="flex flex-1 items-center gap-2"><div className={cn('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold', i < step ? 'bg-emerald-500/15 text-emerald-300' : i === step ? 'bg-blue-500/15 text-blue-300' : 'bg-white/[0.03] text-muted-foreground')}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>{i < STEPS.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-emerald-500/40' : 'bg-white/10')} />}</div>)}</div>
        <GlowCard hover={false} className="p-6">
          <h2 className="mb-4 font-display font-semibold">{STEPS[step]}</h2>
          {step === 0 && <div className="grid gap-3 sm:grid-cols-2"><FF label="Agency Name *"><Input value={form.name} onChange={set('name')} className="input-dark" /></FF><FF label="Website"><Input value={form.website} onChange={set('website')} className="input-dark" /></FF><FF label="Agency Email"><Input value={form.agency_email} onChange={set('agency_email')} className="input-dark" /></FF><FF label="Agency Phone"><Input value={form.agency_phone} onChange={set('agency_phone')} className="input-dark" /></FF><FF label="Location"><Input value={form.location} onChange={set('location')} className="input-dark" /></FF><FF label="Founded Year"><Input value={form.founded_year} onChange={set('founded_year')} className="input-dark" /></FF><div className="sm:col-span-2"><FF label="Description"><Textarea value={form.description} onChange={set('description')} className="input-dark min-h-[60px]" /></FF></div></div>}
          {step === 1 && <div className="grid gap-3 sm:grid-cols-2"><FF label="Full Name (from Google)"><Input value={profile?.full_name || ''} disabled className="input-dark" /></FF><FF label="Gmail (from Google)"><Input value={agency?.owner_email || ''} disabled className="input-dark" /></FF><FF label="Phone"><Input value={form.owner_phone} onChange={set('owner_phone')} className="input-dark" /></FF><FF label="Date of Birth"><Input type="date" value={form.owner_dob} onChange={set('owner_dob')} className="input-dark" /></FF><FF label="Position"><Input value={form.owner_position} onChange={set('owner_position')} className="input-dark" placeholder="Founder & CEO" /></FF><FF label="Owner ID"><Input value={agency?.id?.slice(0, 8).toUpperCase() || 'AUTO'} disabled className="input-dark" /></FF></div>}
          {step === 2 && <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><FF label="Industry / Type"><Input value={form.industry} onChange={set('industry')} className="input-dark" /></FF><FF label="Number of Employees"><Input value={form.employee_count} onChange={set('employee_count')} className="input-dark" /></FF><FF label="Target Client Types"><Input value={form.target_clients} onChange={set('target_clients')} className="input-dark" /></FF><FF label="Primary Service Areas"><Input value={form.service_areas} onChange={set('service_areas')} className="input-dark" /></FF></div><FF label="Main Services"><div className="flex flex-wrap gap-2">{SERVICES.map((s) => { const on = form.services.includes(s); return <button key={s} onClick={() => toggleSvc(s)} className={cn('rounded-full border px-3 py-1.5 text-xs transition', on ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.02] text-muted-foreground')}>{s}</button> })}</div></FF></div>}
          {step === 3 && <div className="space-y-3"><p className="text-sm text-muted-foreground">Connect agency accounts. All integrations are coming soon — you can skip and connect later.</p><div className="grid gap-2 sm:grid-cols-2">{SOCIALS.map((s) => <div key={s.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5"><div className="flex items-center gap-2 text-sm"><s.icon className="h-4 w-4" />{s.name}</div><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Coming Soon</span></div>)}</div></div>}
          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
            <div>{step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>}</div>
            <div className="flex gap-2">
              {step === 3 && <Button variant="outline" onClick={skipConnections} disabled={saving} className="border-white/15">Skip for now</Button>}
              {step < 3 ? <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !form.name} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">Continue<ArrowRight className="ml-2 h-4 w-4" /></Button>
                : <Button onClick={finish} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}Enter STRATOS</Button>}
            </div>
          </div>
        </GlowCard>
      </div>
    </div>
  )
}
