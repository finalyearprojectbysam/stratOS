'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { teamService } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, RowSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { UsersRound, UserPlus, Mail, Loader2 } from 'lucide-react'
import { initials } from '@/lib/format'

const ROLES = ['Admin', 'Manager', 'Strategist', 'Analyst', 'Editor']

export function TeamPage() {
  const [members, setMembers] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'Analyst' })
  const [saving, setSaving] = useState(false)
  const load = () => teamService.list().then(setMembers).catch(() => setMembers([]))
  useEffect(() => { load() }, [])

  const invite = async () => {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return }
    setSaving(true)
    try { await teamService.create({ ...form, status: 'invited', assigned_projects: 0 }); toast.success(`Invitation sent to ${form.email}`); setOpen(false); setForm({ name: '', email: '', role: 'Analyst' }); load() }
    catch (e) { toast.error('Could not invite member') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={UsersRound} title="Team" subtitle="Manage your agency team members and their roles."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><UserPlus className="mr-2 h-4 w-4" />Invite Member</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-popover">
              <DialogHeader><DialogTitle>Invite team member</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Full name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" className="input-dark" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@agency.com" className="input-dark" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Role</Label><Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <DialogFooter><Button onClick={invite} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}Send Invite</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      <GlowCard hover={false} className="p-0">
        {members === null ? <div className="p-6"><RowSkeleton rows={4} /></div> : members.length === 0 ? (
          <div className="p-6"><EmptyState icon={UsersRound} title="No team members" description="Invite your first team member to collaborate." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 font-medium">Member</th><th className="hidden px-6 py-3 font-medium sm:table-cell">Email</th>
                <th className="px-6 py-3 font-medium">Role</th><th className="px-6 py-3 font-medium">Status</th><th className="hidden px-6 py-3 font-medium md:table-cell">Projects</th>
              </tr></thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5"><div className="flex items-center gap-3"><Avatar className="h-9 w-9 border border-white/10"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-xs text-white">{initials(m.name)}</AvatarFallback></Avatar><span className="font-medium">{m.name}</span></div></td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground sm:table-cell">{m.email}</td>
                    <td className="px-6 py-3.5"><span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs">{m.role}</span></td>
                    <td className="px-6 py-3.5"><StatusPill status={m.status} /></td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground md:table-cell">{m.assigned_projects || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>
    </div>
  )
}
