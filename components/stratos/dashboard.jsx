'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { useApp } from '@/lib/appContext'
import { statsService } from '@/lib/services'
import { AGENTS } from '@/lib/mockAgents'
import { StatCard, GlowCard, StatusPill, EmptyState, CardSkeleton, RowSkeleton, PageHeader } from './primitives'
import { Button } from '@/components/ui/button'
import { fmtRelative } from '@/lib/format'
import {
  Users, Activity, FileText, FolderCheck, Sparkles, ArrowRight, CheckCircle2, Command, BarChart3, Radar, Search, Target, Brain, CalendarRange,
} from 'lucide-react'

const ICONS = { Command, BarChart3, Radar, Search, Target, CalendarRange, Brain }

const RECENT_ACTIVITY = [
  { agent: 'ceo', text: 'Completed business planning', when: '10 min ago' },
  { agent: 'business', text: 'Completed client analysis for ABC Fitness', when: '32 min ago' },
  { agent: 'seo', text: 'Completed SEO audit for Glow Salon', when: '1 hr ago' },
  { agent: 'marketing', text: 'Generated 90-day roadmap', when: '2 hr ago' },
]

const WEEK = [
  { d: 'Mon', analyses: 2, completed: 1 }, { d: 'Tue', analyses: 3, completed: 2 }, { d: 'Wed', analyses: 1, completed: 1 },
  { d: 'Thu', analyses: 4, completed: 3 }, { d: 'Fri', analyses: 2, completed: 2 }, { d: 'Sat', analyses: 3, completed: 1 }, { d: 'Sun', analyses: 1, completed: 1 },
]

export function DashboardPage() {
  const { navigate, profile, user } = useApp()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const name = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  useEffect(() => { statsService.summary().then(setData).finally(() => setLoading(false)) }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const recentClients = (data?.clients || []).slice(0, 5)
  const pending = data ? (data.analyses.length - data.activeAnalyses - data.analyses.filter(a => a.status === 'completed').length) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{greeting}, <span className="text-gradient">{name}</span></h1>
          <p className="mt-1.5 text-muted-foreground">Here&apos;s what&apos;s happening across your agency.</p>
        </div>
        <Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90">
          <Sparkles className="mr-2 h-4 w-4" /> New Client Analysis
        </Button>
      </div>

      {loading ? <CardSkeleton count={4} className="grid-cols-2 lg:grid-cols-4" /> : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard index={0} label="Total Clients" value={data.totalClients} icon={Users} trend="+12%" accent="blue" hint="Across all industries" />
          <StatCard index={1} label="Active Analyses" value={data.activeAnalyses} icon={Activity} trend="+2" accent="cyan" hint="Running right now" />
          <StatCard index={2} label="Reports Generated" value={data.reportsGenerated} icon={FileText} trend="+8%" accent="violet" hint="Ready to share" />
          <StatCard index={3} label="Completed Projects" value={data.completedProjects} icon={FolderCheck} trend="+3" accent="emerald" hint="Delivered on time" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* AI Activity */}
        <GlowCard className="p-6 lg:col-span-1" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">AI Activity</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live</span>
          </div>
          <div className="relative space-y-1">
            <div className="absolute bottom-2 left-[18px] top-2 w-px bg-white/10" />
            {RECENT_ACTIVITY.map((a, i) => {
              const agent = AGENTS.find((x) => x.id === a.agent) || AGENTS[0]
              const Icon = ICONS[agent.icon] || Command
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="relative flex gap-3 rounded-xl p-2 transition hover:bg-white/[0.03]">
                  <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-card text-primary"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="text-sm font-medium">{agent.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{a.text}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground/60">{a.when}</div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                </motion.div>
              )
            })}
          </div>
        </GlowCard>

        {/* Analysis Overview chart */}
        <GlowCard className="p-6 lg:col-span-2" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Analysis Overview</h2>
              <p className="text-xs text-muted-foreground">Analyses this week vs. completed</p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Analyses</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" /> Completed</span>
            </div>
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
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[{ l: 'This week', v: 16 }, { l: 'Completed', v: 11 }, { l: 'Pending', v: Math.max(pending, 0) }].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-center">
                <div className="font-display text-xl font-semibold">{s.v}</div>
                <div className="text-[11px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Recent clients */}
      <GlowCard className="p-0" hover={false}>
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-lg font-semibold">Recent Clients</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/clients')} className="text-primary">View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
        </div>
        {loading ? <div className="p-6"><RowSkeleton rows={4} /></div> : recentClients.length === 0 ? (
          <div className="p-6"><EmptyState title="No clients yet" description="Add your first client and launch an AI analysis." action={<Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Sparkles className="mr-2 h-4 w-4" />Add Your First Client</Button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Client</th><th className="px-6 py-3 font-medium">Industry</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">Location</th><th className="px-6 py-3 font-medium">Status</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Last Analysis</th><th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {recentClients.map((c) => (
                  <tr key={c.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5 font-medium">{c.business_name}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{c.industry || '—'}</td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground sm:table-cell">{c.target_location || '—'}</td>
                    <td className="px-6 py-3.5"><StatusPill status={c.status} /></td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground md:table-cell">{fmtRelative(c.updated_at || c.created_at)}</td>
                    <td className="px-6 py-3.5 text-right"><Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate(`/clients/${c.id}`)}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { t: 'New Client Analysis', d: 'Launch the multi-agent workflow', icon: Sparkles, to: '/clients/new', accent: 'from-blue-500 to-violet-600' },
          { t: 'View Reports', d: 'Browse generated strategy reports', icon: FileText, to: '/reports', accent: 'from-violet-500 to-fuchsia-600' },
          { t: 'View Projects', d: 'Track delivery across clients', icon: FolderCheck, to: '/projects', accent: 'from-cyan-500 to-blue-600' },
        ].map((q) => (
          <button key={q.t} onClick={() => navigate(q.to)} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-card/50 p-5 text-left transition hover:border-white/20 hover:bg-white/[0.04]">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${q.accent} text-white`}><q.icon className="h-5 w-5" /></div>
            <div className="flex-1"><div className="font-medium">{q.t}</div><div className="text-xs text-muted-foreground">{q.d}</div></div>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  )
}
