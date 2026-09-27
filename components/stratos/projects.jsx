'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { projectService, clientService, staffService, taskService, activityService } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { TaskCard, recalcProject } from './tasks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { FolderKanban, ArrowLeft, CalendarClock, Plus, Loader2, Flag, Users2 } from 'lucide-react'
import { fmtDate, initials } from '@/lib/format'

export function ProjectsPage() {
  const { navigate, role, user } = useApp()
  const [projects, setProjects] = useState(null)
  const [clients, setClients] = useState([])
  const [staff, setStaff] = useState([])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', client_id: '', description: '', priority: 'Medium', deadline: '', team: [] })

  const load = () => {
    projectService.list().then((all) => setProjects(role === 'employee' ? all.filter((p) => (p.team || []).includes(user.id)) : all)).catch(() => setProjects([]))
    clientService.list().then(setClients).catch(() => {})
    staffService.list().then(setStaff).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const staffName = (id) => staff.find((s) => s.id === id)?.full_name || '?'
  const toggleMember = (id) => setForm((f) => ({ ...f, team: f.team.includes(id) ? f.team.filter((x) => x !== id) : [...f.team, id] }))

  const create = async () => {
    if (!form.name) { toast.error('Project name is required'); return }
    setSaving(true)
    try {
      const proj = await projectService.create({ ...form, status: 'planning', progress: 0, start_date: new Date().toISOString() })
      await activityService.log('Created project', proj.name, `Assigned ${form.team.length} member(s)`)
      toast.success('Project created'); setOpen(false); setForm({ name: '', client_id: '', description: '', priority: 'Medium', deadline: '', team: [] }); load()
    } catch (e) { toast.error('Could not create project') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderKanban} title={role === 'employee' ? 'My Projects' : 'Projects'} subtitle={role === 'employee' ? 'Projects you are assigned to.' : 'Create projects, assign staff and track delivery.'}
        actions={role !== 'employee' ? <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><Plus className="mr-2 h-4 w-4" />Create Project</Button> : null} />

      {projects === null ? <CardSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" /> : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description={role === 'employee' ? "You aren't assigned to a project yet." : 'Create your first project and assign staff.'} action={role !== 'employee' ? <Button onClick={() => setOpen(true)} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Plus className="mr-2 h-4 w-4" />Create Project</Button> : null} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlowCard className="flex h-full cursor-pointer flex-col p-5" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between"><div className="text-xs text-muted-foreground">{clients.find((c) => c.id === p.client_id)?.business_name || 'Client'}</div><StatusPill status={p.status} /></div>
                <h3 className="mt-2 font-display font-semibold">{p.name}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span>{p.progress || 0}%</span></div><Progress value={p.progress || 0} className="h-1.5 bg-white/10" /></div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex -space-x-2">{(p.team || []).slice(0, 3).map((id) => <Avatar key={id} className="h-7 w-7 border-2 border-card"><AvatarImage src={staff.find((s) => s.id === id)?.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-[10px] text-white">{initials(staffName(id))}</AvatarFallback></Avatar>)}</div>
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />{fmtDate(p.deadline)}</div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-popover sm:max-w-lg"><DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <FF label="Project name"><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-dark" placeholder="Client Website Revamp" /></FF>
            <FF label="Client"><Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v }))}><SelectTrigger className="input-dark"><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.business_name}</SelectItem>)}</SelectContent></Select></FF>
            <FF label="Description"><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input-dark min-h-[70px]" placeholder="Scope and objectives..." /></FF>
            <div className="grid grid-cols-2 gap-3">
              <FF label="Priority"><Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{['High', 'Medium', 'Low'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></FF>
              <FF label="Deadline"><Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="input-dark" /></FF>
            </div>
            <FF label="Assign Team">
              <div className="flex flex-wrap gap-2">{staff.length === 0 ? <span className="text-xs text-muted-foreground">Create staff first.</span> : staff.map((s) => { const on = form.team.includes(s.id); return (
                <button key={s.id} onClick={() => toggleMember(s.id)} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition', on ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20')}><Avatar className="h-4 w-4"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-[8px] text-white">{initials(s.full_name)}</AvatarFallback></Avatar>{s.full_name}</button>) })}</div>
            </FF>
          </div>
          <DialogFooter><Button onClick={create} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}Create Project</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ProjectDetailPage({ projectId }) {
  const { navigate, role, user } = useApp()
  const [p, setP] = useState(undefined)
  const [tasks, setTasks] = useState([])
  const [staff, setStaff] = useState([])
  const load = () => {
    projectService.get(projectId).then(setP).catch(() => setP(null))
    taskService.list().then((all) => setTasks(all.filter((t) => t.project_id === projectId))).catch(() => {})
    staffService.list().then(setStaff).catch(() => {})
  }
  useEffect(() => { load() }, [projectId])

  if (p === undefined) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>
  if (p === null) return <EmptyState icon={FolderKanban} title="Project not found" action={<Button onClick={() => navigate('/projects')} variant="outline" className="border-white/15">Back to Projects</Button>} />

  const visibleTasks = role === 'employee' ? tasks.filter((t) => t.assigned_to === user.id) : tasks

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Projects</button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-display text-2xl font-semibold">{p.name}</h1><p className="mt-1 text-sm text-muted-foreground">{p.description}</p></div>
        <StatusPill status={p.status} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <GlowCard className="p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Progress</div><div className="mt-2 font-display text-3xl font-semibold">{p.progress || 0}%</div><Progress value={p.progress || 0} className="mt-3 h-1.5 bg-white/10" /></GlowCard>
        <GlowCard className="p-5"><div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Deadline</div><div className="mt-2 font-display text-xl font-semibold">{fmtDate(p.deadline)}</div><div className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Flag className="h-3.5 w-3.5" />{p.priority || 'Medium'} priority</div></GlowCard>
        <GlowCard className="p-5"><div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Users2 className="h-3.5 w-3.5" />Team</div><div className="mt-3 flex flex-wrap gap-2">{(p.team || []).map((id) => { const s = staff.find((x) => x.id === id); return <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs"><Avatar className="h-5 w-5"><AvatarImage src={s?.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-[9px] text-white">{initials(s?.full_name || '?')}</AvatarFallback></Avatar>{s?.full_name || 'Member'}</span> })}{(p.team || []).length === 0 && <span className="text-xs text-muted-foreground">No members</span>}</div></GlowCard>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Tasks</h2>
        {visibleTasks.length === 0 ? <EmptyState icon={FolderKanban} title="No tasks" description={role === 'employee' ? 'No tasks assigned to you on this project.' : 'Assign tasks to staff from the Team page.'} /> : (
          <div className="space-y-3">{visibleTasks.map((t) => <TaskCard key={t.id} task={t} editable={role === 'employee' ? t.assigned_to === user.id : true} onChanged={load} />)}</div>
        )}
      </div>
    </div>
  )
}

function FF({ label, children }) { return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div> }
