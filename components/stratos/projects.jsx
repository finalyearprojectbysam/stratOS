'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '@/lib/appContext'
import { projectService, clientService } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { fmtDate, initials } from '@/lib/format'
import { FolderKanban, ArrowLeft, CalendarClock, Users2, ArrowRight } from 'lucide-react'

export function ProjectsPage() {
  const { navigate } = useApp()
  const [projects, setProjects] = useState(null)
  const [clients, setClients] = useState({})
  useEffect(() => {
    projectService.list().then(setProjects).catch(() => setProjects([]))
    clientService.list().then((cs) => setClients(Object.fromEntries(cs.map((c) => [c.id, c.business_name])))).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderKanban} title="Projects" subtitle="Track delivery and progress across all client engagements." />
      {projects === null ? <CardSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" /> : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Projects created from analyses will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlowCard className="flex h-full cursor-pointer flex-col p-5" onClick={() => navigate(`/projects/${p.id}`)}>
                <div className="flex items-start justify-between"><div className="text-xs text-muted-foreground">{clients[p.client_id] || 'Client'}</div><StatusPill status={p.status} /></div>
                <h3 className="mt-2 font-display font-semibold">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4"><div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">Progress</span><span>{p.progress || 0}%</span></div><Progress value={p.progress || 0} className="h-1.5 bg-white/10" /></div>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex -space-x-2">{(p.team || []).slice(0, 3).map((t, j) => <Avatar key={j} className="h-7 w-7 border-2 border-card"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-[10px] text-white">{initials(t)}</AvatarFallback></Avatar>)}</div>
                  <div className="inline-flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />{fmtDate(p.deadline)}</div>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectDetailPage({ projectId }) {
  const { navigate } = useApp()
  const [p, setP] = useState(undefined)
  useEffect(() => { projectService.get(projectId).then(setP).catch(() => setP(null)) }, [projectId])
  if (p === undefined) return <div className="p-8 text-center text-muted-foreground">Loading project...</div>
  if (p === null) return <EmptyState icon={FolderKanban} title="Project not found" action={<Button onClick={() => navigate('/projects')} variant="outline" className="border-white/15">Back to Projects</Button>} />
  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/projects')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Projects</button>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="font-display text-2xl font-semibold">{p.name}</h1><p className="mt-1 text-sm text-muted-foreground">{p.description}</p></div>
        <StatusPill status={p.status} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <GlowCard className="p-5"><div className="text-xs uppercase tracking-wider text-muted-foreground">Progress</div><div className="mt-2 font-display text-3xl font-semibold">{p.progress || 0}%</div><Progress value={p.progress || 0} className="mt-3 h-1.5 bg-white/10" /></GlowCard>
        <GlowCard className="p-5"><div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Deadline</div><div className="mt-2 font-display text-xl font-semibold">{fmtDate(p.deadline)}</div><div className="text-xs text-muted-foreground">Started {fmtDate(p.start_date)}</div></GlowCard>
        <GlowCard className="p-5"><div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><Users2 className="h-3.5 w-3.5" />Team</div><div className="mt-3 flex flex-wrap gap-2">{(p.team || []).map((t, i) => <span key={i} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs"><Avatar className="h-5 w-5"><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-[9px] text-white">{initials(t)}</AvatarFallback></Avatar>{t}</span>)}</div></GlowCard>
      </div>
    </div>
  )
}
