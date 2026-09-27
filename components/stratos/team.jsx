'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { staffService, taskService, projectService, activityService, authService, notifyTaskAssigned } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { UsersRound, UserPlus, Loader2, MoreHorizontal, Pencil, KeyRound, ClipboardPlus, Trash2, Mail, Phone, Circle } from 'lucide-react'
import { initials, fmtDuration, fmtRelative } from '@/lib/format'

const ROLES = ['Admin', 'Manager', 'Strategist', 'Analyst', 'Editor']
const GENDERS = ['Male', 'Female', 'Other']
const EMPTY = { full_name: '', gender: 'Male', dob: '', email: '', phone: '', employee_id: '', password: '', role: 'Analyst', avatar_url: '' }

export function TeamPage() {
  const [staff, setStaff] = useState(null)
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [openCreate, setOpenCreate] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [resetFor, setResetFor] = useState(null)
  const [newPass, setNewPass] = useState('')
  const [assignFor, setAssignFor] = useState(null)
  const [task, setTask] = useState({ project_id: '', title: '', priority: 'Medium', deadline: '' })

  const load = () => {
    staffService.list().then(setStaff).catch(() => setStaff([]))
    taskService.list().then(setTasks).catch(() => {})
    projectService.list().then(setProjects).catch(() => {})
  }
  useEffect(() => { load() }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const onAvatar = (e) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setForm((f) => ({ ...f, avatar_url: r.result })); r.readAsDataURL(file) }

  const openNew = () => { setEditId(null); setForm(EMPTY); setOpenCreate(true) }
  const openEdit = (s) => { setEditId(s.id); setForm({ ...EMPTY, ...s, password: '' }); setOpenCreate(true) }

  const saveStaff = async () => {
    if (!form.full_name || !form.employee_id || (!editId && !form.password)) { toast.error('Name, Employee ID and password are required'); return }
    setSaving(true)
    try {
      if (editId) {
        const patch = { full_name: form.full_name, gender: form.gender, dob: form.dob, email: form.email, phone: form.phone, employee_id: form.employee_id, role: form.role, avatar_url: form.avatar_url }
        if (form.password) patch.password_hash = authService.hashPassword(form.password)
        await staffService.update(editId, patch)
        await activityService.log('Updated employee', 'Staff', `${form.full_name} (${form.employee_id})`)
        toast.success('Staff updated')
      } else {
        await staffService.create({ full_name: form.full_name, gender: form.gender, dob: form.dob, email: form.email, phone: form.phone, employee_id: form.employee_id, role: form.role, avatar_url: form.avatar_url, password_hash: authService.hashPassword(form.password), status: 'active', online: false, total_online_seconds: 0 })
        await activityService.log('Created employee', 'Staff', `${form.full_name} (${form.employee_id})`)
        toast.success('Staff account created')
      }
      setOpenCreate(false); load()
    } catch (e) { toast.error('Could not save staff') } finally { setSaving(false) }
  }

  const doReset = async () => {
    if (!newPass) { toast.error('Enter a new password'); return }
    await staffService.update(resetFor.id, { password_hash: authService.hashPassword(newPass) })
    await activityService.log('Reset password', 'Staff', `${resetFor.full_name} (${resetFor.employee_id})`)
    toast.success('Password reset'); setResetFor(null); setNewPass('')
  }
  const doDelete = async () => {
    await staffService.remove(toDelete.id)
    await activityService.log('Deleted employee', 'Staff', `${toDelete.full_name} (${toDelete.employee_id})`)
    toast.success('Staff deleted'); setToDelete(null); load()
  }
  const doAssign = async () => {
    if (!task.title || !task.project_id) { toast.error('Pick a project and task title'); return }
    const proj = projects.find((p) => p.id === task.project_id)
    const created = await taskService.create({ project_id: task.project_id, project_name: proj?.name || '', title: task.title, priority: task.priority, deadline: task.deadline, assigned_to: assignFor.id, assigned_to_name: assignFor.full_name, status: 'pending', progress: 0 })
    if (proj && !(proj.team || []).includes(assignFor.id)) await projectService.update(proj.id, { team: [...(proj.team || []), assignFor.id] })
    await notifyTaskAssigned(assignFor.id, created)
    await activityService.log('Assigned task', task.title, `${task.title} → ${assignFor.full_name}`)
    toast.success(`Task assigned to ${assignFor.full_name}`); setAssignFor(null); setTask({ project_id: '', title: '', priority: 'Medium', deadline: '' }); load()
  }
  const toggleStatus = async (s) => {
    const next = s.status === 'inactive' ? 'active' : 'inactive'
    await staffService.update(s.id, { status: next, online: next === 'inactive' ? false : s.online })
    await activityService.log(next === 'inactive' ? 'Deactivated staff' : 'Activated staff', 'Staff', `${s.full_name} (${s.employee_id})`)
    toast.success(next === 'inactive' ? 'Employee deactivated' : 'Employee activated'); load()
  }

  const completion = (id) => { const t = tasks.filter((x) => x.assigned_to === id); if (!t.length) return 0; return Math.round((t.filter((x) => x.status === 'completed').length / t.length) * 100) }

  return (
    <div className="space-y-6">
      <PageHeader icon={UsersRound} title="Team / Staff" subtitle="Create and manage your agency staff accounts, assignments and access."
        actions={<Button onClick={openNew} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><UserPlus className="mr-2 h-4 w-4" />Create Staff</Button>} />

      {staff === null ? <CardSkeleton count={4} className="sm:grid-cols-2 lg:grid-cols-3" /> : staff.length === 0 ? (
        <EmptyState icon={UsersRound} title="No staff yet" description="Create your first employee account to start assigning work." action={<Button onClick={openNew} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><UserPlus className="mr-2 h-4 w-4" />Create Staff</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-white/10"><AvatarImage src={s.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white">{initials(s.full_name)}</AvatarFallback></Avatar>
                    <div><div className="flex items-center gap-2"><span className="font-medium leading-tight">{s.full_name}</span><StatusPill status={s.status === 'inactive' ? 'inactive' : 'active'} /></div><div className="text-xs text-muted-foreground">{s.employee_id} · {s.role}</div>
                      <div className="mt-1 inline-flex items-center gap-1 text-[11px]"><Circle className={`h-2 w-2 ${s.online ? 'fill-emerald-400 text-emerald-400' : 'fill-slate-500 text-slate-500'}`} />{s.online ? 'Online' : `Last active ${fmtRelative(s.last_active)}`}</div></div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-white/10 bg-popover">
                      <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setResetFor(s); setNewPass('') }}><KeyRound className="mr-2 h-4 w-4" />Reset Password</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setAssignFor(s)}><ClipboardPlus className="mr-2 h-4 w-4" />Assign Task</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStatus(s)}><Circle className="mr-2 h-4 w-4" />{s.status === 'inactive' ? 'Activate Staff' : 'Deactivate Staff'}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setToDelete(s)} className="text-red-300 focus:text-red-300"><Trash2 className="mr-2 h-4 w-4" />Delete Staff</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{s.email || '—'}</div>
                  <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{s.phone || '—'}</div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 text-center">
                  <div><div className="font-display text-lg font-semibold">{completion(s.id)}%</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Task Completion</div></div>
                  <div><div className="font-display text-lg font-semibold">{fmtDuration(s.total_online_seconds || 0)}</div><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Online Time</div></div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / edit staff */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-popover sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? 'Edit Staff' : 'Create Staff'}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2 sm:grid-cols-2">
            <div className="flex items-center gap-3 sm:col-span-2">
              <Avatar className="h-14 w-14 border border-white/10"><AvatarImage src={form.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white">{initials(form.full_name || 'S')}</AvatarFallback></Avatar>
              <div><input type="file" accept="image/*" onChange={onAvatar} className="text-xs text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:text-foreground" /><p className="mt-1 text-[11px] text-muted-foreground">Profile picture (optional)</p></div>
            </div>
            <FF label="Full Name *"><Input value={form.full_name} onChange={set('full_name')} className="input-dark" placeholder="Arun Kumar" /></FF>
            <FF label="Gender"><Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></FF>
            <FF label="Date of Birth"><Input type="date" value={form.dob} onChange={set('dob')} className="input-dark" /></FF>
            <FF label="Role"><Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></FF>
            <FF label="Email"><Input type="email" value={form.email} onChange={set('email')} className="input-dark" placeholder="arun@example.com" /></FF>
            <FF label="Phone"><Input value={form.phone} onChange={set('phone')} className="input-dark" placeholder="9876543210" /></FF>
            <FF label="Employee ID *"><Input value={form.employee_id} onChange={set('employee_id')} className="input-dark" placeholder="STR001" /></FF>
            <FF label={editId ? 'New Password (optional)' : 'Password *'}><Input type="password" value={form.password} onChange={set('password')} className="input-dark" placeholder="••••••••" /></FF>
          </div>
          <DialogFooter><Button onClick={saveStaff} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}{editId ? 'Save Changes' : 'Create Account'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password */}
      <Dialog open={!!resetFor} onOpenChange={(o) => !o && setResetFor(null)}>
        <DialogContent className="border-white/10 bg-popover"><DialogHeader><DialogTitle>Reset password — {resetFor?.full_name}</DialogTitle></DialogHeader>
          <div className="py-2"><Label className="text-xs text-muted-foreground">New password</Label><Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="input-dark mt-1.5" placeholder="••••••••" /></div>
          <DialogFooter><Button onClick={doReset} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><KeyRound className="mr-2 h-4 w-4" />Reset Password</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign task */}
      <Dialog open={!!assignFor} onOpenChange={(o) => !o && setAssignFor(null)}>
        <DialogContent className="border-white/10 bg-popover"><DialogHeader><DialogTitle>Assign task — {assignFor?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <FF label="Project"><Select value={task.project_id} onValueChange={(v) => setTask((t) => ({ ...t, project_id: v }))}><SelectTrigger className="input-dark"><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></FF>
            <FF label="Task title"><Input value={task.title} onChange={(e) => setTask((t) => ({ ...t, title: e.target.value }))} className="input-dark" placeholder="e.g. SEO audit" /></FF>
            <div className="grid grid-cols-2 gap-3">
              <FF label="Priority"><Select value={task.priority} onValueChange={(v) => setTask((t) => ({ ...t, priority: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{['High', 'Medium', 'Low'].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></FF>
              <FF label="Deadline"><Input type="date" value={task.deadline} onChange={(e) => setTask((t) => ({ ...t, deadline: e.target.value }))} className="input-dark" /></FF>
            </div>
          </div>
          <DialogFooter><Button onClick={doAssign} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><ClipboardPlus className="mr-2 h-4 w-4" />Assign Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-popover"><AlertDialogHeader><AlertDialogTitle>Delete staff?</AlertDialogTitle><AlertDialogDescription>This permanently removes <b className="text-foreground">{toDelete?.full_name}</b> and their access.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-white/15">Cancel</AlertDialogCancel><AlertDialogAction onClick={doDelete} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FF({ label, children }) { return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div> }
