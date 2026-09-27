'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { statsService, staffService, taskService } from '@/lib/services'
import { StatCard, GlowCard, StatusPill, EmptyState, CardSkeleton, RowSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { fmtRelative, fmtDuration, fmtDate, initials } from '@/lib/format'
import { TodaysMeetings } from './phase3'
import {
  Users, Activity, FileText, FolderCheck, Sparkles, ArrowRight, Hash, Copy, Check, UsersRound,
  ClipboardList, CheckCircle2, Clock, ListTodo, Target,
} from 'lucide-react'

const WEEK = [
  { d: 'Mon', analyses: 2, completed: 1 }, { d: 'Tue', analyses: 3, completed: 2 }, { d: 'Wed', analyses: 1, completed: 1 },
  { d: 'Thu', analyses: 4, completed: 3 }, { d: 'Fri', analyses: 2, completed: 2 }, { d: 'Sat', analyses: 3, completed: 1 }, { d: 'Sun', analyses: 1, completed: 1 },
]

export function DashboardPage() {
  const { role } = useApp()
  return role === 'employee' ? <EmployeeDashboard /> : <OwnerDashboard />
}

// ============================ OWNER ============================
function OwnerDashboard() {
  const { navigate, profile, agency } = useApp()
  const [data, setData] = useState(null)
  const [activity, setActivity] = useState([])
  const [copied, setCopied] = useState(false)
  const name = profile?.full_name?.split(' ')[0] || 'there'

  useEffect(() => {
    statsService.ownerSummary().then(setData).catch(() => {})
    import('@/lib/services').then((m) => m.activityService.list().then((a) => setActivity(a.slice(0, 6))).catch(() => {}))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const copyCode = () => { navigator.clipboard?.writeText(agency?.code || ''); setCopied(true); toast.success('Agency code copied'); setTimeout(() => setCopied(false), 1500) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border border-white/10"><AvatarImage src={agency?.owner_avatar_url || profile?.avatar_url} referrerPolicy="no-referrer" /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-white">{initials(profile?.full_name || 'U')}</AvatarFallback></Avatar>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{greeting}, <span className="text-gradient">{name}</span></h1>
            <p className="mt-1.5 text-muted-foreground">Here&apos;s what&apos;s happening across your agency.</p>
          </div>
        </div>
        <Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><Sparkles className="mr-2 h-4 w-4" /> New Client Analysis</Button>
      </div>

      {/* Agency code banner */}
      <GlowCard hover={false} className="flex flex-col gap-4 overflow-hidden p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white"><Hash className="h-6 w-6" /></div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your Agency Code</div>
            <div className="font-display text-3xl font-bold tracking-[0.3em] text-gradient">{agency?.code || '------'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden max-w-xs text-xs text-muted-foreground sm:block">Share this code with employees so they can log in to your agency workspace.</p>
          <Button variant="outline" onClick={copyCode} className="border-white/15">{copied ? <Check className="mr-2 h-4 w-4 text-emerald-400" /> : <Copy className="mr-2 h-4 w-4" />}Copy</Button>
        </div>
      </GlowCard>

      {!data ? <CardSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" /> : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard index={0} label="Total Staff" value={data.totalStaff} icon={UsersRound} trend={`${data.activeStaff} online`} accent="blue" hint="Agency team" />
          <StatCard index={1} label="Total Clients" value={data.totalClients} icon={Users} trend="+12%" accent="cyan" hint="Across industries" />
          <StatCard index={2} label="Active Projects" value={data.activeProjects} icon={FolderCheck} trend={`${data.taskCompletion}% tasks`} accent="violet" hint="In delivery" />
          <StatCard index={3} label="Reports Generated" value={data.reportsGenerated} icon={FileText} trend="+8%" accent="emerald" hint="Ready to share" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlowCard className="p-6 lg:col-span-1" hover={false}>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Recent Activity</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/activity-log')} className="text-primary">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          {activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : (
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="flex gap-3">
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.role === 'owner' ? 'bg-violet-400' : 'bg-cyan-400'}`} />
                  <div className="min-w-0 flex-1"><div className="text-sm"><b className="font-medium">{a.user_name}</b> <span className="text-muted-foreground">{a.action.toLowerCase()}</span> {a.resource}</div>
                    <div className="text-[11px] text-muted-foreground/70">{a.detail} · {fmtRelative(a.created_at)}</div></div>
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        <GlowCard className="p-6 lg:col-span-2" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-display text-lg font-semibold">Analysis Overview</h2><p className="text-xs text-muted-foreground">Analyses this week vs. completed</p></div>
            <div className="flex gap-4 text-xs"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Analyses</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Completed</span></div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEK} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3B82F6" stopOpacity={0.5} /><stop offset="100%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.5} /><stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="d" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="analyses" stroke="#3B82F6" strokeWidth={2} fill="url(#g1)" />
                <Area type="monotone" dataKey="completed" stroke="#8B5CF6" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlowCard>
      </div>

      {/* Team performance / project progress */}
      {data && (
        <GlowCard hover={false} className="p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4"><h2 className="font-display text-lg font-semibold">Project Progress</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-primary">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          <div className="divide-y divide-white/5">
            {data.projects.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">{(p.team || []).length} members · due {fmtDate(p.deadline)}</div></div>
                <div className="hidden w-40 items-center gap-2 sm:flex"><Progress value={p.progress || 0} className="h-1.5 bg-white/10" /><span className="w-9 text-right text-xs">{p.progress || 0}%</span></div>
                <StatusPill status={p.status} />
              </div>
            ))}
            {data.projects.length === 0 && <div className="p-6"><EmptyState icon={FolderCheck} title="No projects yet" description="Create a project and assign your staff." /></div>}
          </div>
        </GlowCard>
      )}
    </div>
  )
}

// ============================ EMPLOYEE ============================
function EmployeeDashboard() {
  const { navigate, profile, user } = useApp()
  const [data, setData] = useState(null)
  const [me, setMe] = useState(null)
  const name = profile?.full_name?.split(' ')[0] || 'there'

  useEffect(() => {
    statsService.employeeSummary(user.id).then(setData).catch(() => {})
    staffService.get(user.id).then(setMe).catch(() => {})
  }, [user.id])

  const onlineToday = me ? fmtDuration(me.total_online_seconds || 0) : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Welcome back, <span className="text-gradient">{name}</span></h1>
        <p className="mt-1.5 text-muted-foreground">Here&apos;s the work assigned to you.</p>
      </div>

      {!data ? <CardSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" /> : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard index={0} label="Assigned Tasks" value={data.assigned} icon={ClipboardList} accent="blue" hint="Total assigned to you" />
          <StatCard index={1} label="Completed" value={data.completed} icon={CheckCircle2} accent="emerald" hint={`${data.pending} pending`} />
          <StatCard index={2} label="Completion" value={`${data.completion}%`} icon={Target} accent="violet" hint="Your task rate" />
          <StatCard index={3} label="Online Today" value={onlineToday} icon={Clock} accent="cyan" hint={me?.online ? 'Currently online' : 'Offline'} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlowCard hover={false} className="p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4"><h2 className="font-display text-lg font-semibold">My Tasks</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')} className="text-primary">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          {!data ? <div className="p-6"><RowSkeleton rows={4} /></div> : data.myTasks.length === 0 ? (
            <div className="p-6"><EmptyState icon={ListTodo} title="No tasks assigned" description="Your owner hasn't assigned any tasks yet." /></div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.myTasks.slice(0, 5).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-6 py-3.5">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{t.title}</div><div className="text-xs text-muted-foreground">{t.project_name} · due {fmtDate(t.deadline)}</div></div>
                  <div className="hidden w-24 items-center gap-2 sm:flex"><Progress value={t.progress || 0} className="h-1.5 bg-white/10" /></div>
                  <StatusPill status={t.status} />
                </div>
              ))}
            </div>
          )}
        </GlowCard>

        <GlowCard hover={false} className="p-0">
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4"><h2 className="font-display text-lg font-semibold">My Projects</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-primary">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
          {!data ? <div className="p-6"><RowSkeleton rows={3} /></div> : data.myProjects.length === 0 ? (
            <div className="p-6"><EmptyState icon={FolderCheck} title="No projects yet" description="You aren't assigned to any project yet." /></div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.myProjects.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground">due {fmtDate(p.deadline)}</div></div>
                  <div className="hidden w-32 items-center gap-2 sm:flex"><Progress value={p.progress || 0} className="h-1.5 bg-white/10" /><span className="w-9 text-right text-xs">{p.progress || 0}%</span></div>
                  <StatusPill status={p.status} />
                </div>
              ))}
            </div>
          )}
        </GlowCard>
      </div>
    </div>
  )
}
