'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { taskService, projectService, activityService } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, RowSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClipboardList, Flag, CalendarClock, CheckCircle2 } from 'lucide-react'
import { fmtDate } from '@/lib/format'

// Recompute a project's progress from its tasks (avg). Exported for reuse.
export async function recalcProject(projectId) {
  if (!projectId) return
  const all = await taskService.list()
  const t = all.filter((x) => x.project_id === projectId)
  if (!t.length) return
  const avg = Math.round(t.reduce((s, x) => s + (x.progress || 0), 0) / t.length)
  const status = avg >= 100 ? 'completed' : avg > 0 ? 'in_progress' : 'planning'
  await projectService.update(projectId, { progress: avg, status })
}

const PROGRESS = [0, 25, 50, 75, 100]

// A single editable task card. `editable` = employee/owner can update progress.
export function TaskCard({ task, editable, onChanged }) {
  const { userName } = useApp()
  const [busy, setBusy] = useState(false)
  const update = async (progress) => {
    setBusy(true)
    const status = progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending'
    try {
      await taskService.update(task.id, { progress, status })
      await recalcProject(task.project_id)
      await activityService.log(status === 'completed' ? 'Completed task' : 'Updated task', task.title, `${task.title} → ${progress}%`)
      toast.success(status === 'completed' ? 'Task completed' : `Progress updated to ${progress}%`)
      onChanged?.()
    } catch (e) { toast.error('Could not update task') } finally { setBusy(false) }
  }
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2"><span className="font-medium">{task.title}</span><StatusPill status={task.status} /></div>
          <div className="mt-0.5 text-xs text-muted-foreground">{task.project_name} · {task.assigned_to_name}</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Flag className="h-3.5 w-3.5" />{task.priority || 'Medium'}</span>
          <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{fmtDate(task.deadline)}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Progress value={task.progress || 0} className="h-1.5 flex-1 bg-white/10" />
        <span className="w-9 text-right text-xs">{task.progress || 0}%</span>
        {editable && (
          <Select disabled={busy} value={String(task.progress || 0)} onValueChange={(v) => update(Number(v))}>
            <SelectTrigger className="h-8 w-24 input-dark"><SelectValue /></SelectTrigger>
            <SelectContent>{PROGRESS.map((p) => <SelectItem key={p} value={String(p)}>{p}%</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

export function TasksPage() {
  const { user, role } = useApp()
  const [tasks, setTasks] = useState(null)
  const load = () => taskService.list().then((all) => setTasks(role === 'employee' ? all.filter((t) => t.assigned_to === user.id) : all)).catch(() => setTasks([]))
  useEffect(() => { load() }, [])

  const groups = { pending: [], in_progress: [], completed: [] }
  ;(tasks || []).forEach((t) => { (groups[t.status] || groups.pending).push(t) })

  return (
    <div className="space-y-6">
      <PageHeader icon={ClipboardList} title={role === 'employee' ? 'My Tasks' : 'All Tasks'} subtitle={role === 'employee' ? 'Update progress on the tasks assigned to you.' : 'Every task across your agency projects.'} />
      {tasks === null ? <RowSkeleton rows={5} /> : tasks.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tasks" description={role === 'employee' ? "You have no assigned tasks yet." : 'Assign tasks to staff from the Team page.'} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {[['pending', 'Pending'], ['in_progress', 'In Progress'], ['completed', 'Completed']].map(([k, label]) => (
            <div key={k}>
              <div className="mb-3 flex items-center justify-between"><h3 className="font-display text-sm font-semibold">{label}</h3><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-muted-foreground">{groups[k].length}</span></div>
              <div className="space-y-3">
                {groups[k].length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-muted-foreground">Nothing here</div> :
                  groups[k].map((t) => <TaskCard key={t.id} task={t} editable={role === 'employee' || role === 'owner'} onChanged={load} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
