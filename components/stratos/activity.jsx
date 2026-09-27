'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { activityService } from '@/lib/services'
import { GlowCard, PageHeader, EmptyState, RowSkeleton } from './primitives'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollText, Search, Crown, User } from 'lucide-react'
import dayjs from 'dayjs'

export function ActivityLogPage() {
  const [logs, setLogs] = useState(null)
  const [q, setQ] = useState('')
  const [roleF, setRoleF] = useState('all')
  const [actionF, setActionF] = useState('all')

  useEffect(() => { activityService.list().then(setLogs).catch(() => setLogs([])) }, [])

  const actions = Array.from(new Set((logs || []).map((l) => l.action)))
  const filtered = (logs || []).filter((l) => {
    if (roleF !== 'all' && l.role !== roleF) return false
    if (actionF !== 'all' && l.action !== actionF) return false
    if (q) { const s = `${l.user_name} ${l.action} ${l.resource} ${l.detail}`.toLowerCase(); if (!s.includes(q.toLowerCase())) return false }
    return true
  })

  return (
    <div className="space-y-6">
      <PageHeader icon={ScrollText} title="Activity Log" subtitle="Owner-only chronological audit of everything happening across your agency." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity..." className="h-10 input-dark pl-9" /></div>
        <Select value={roleF} onValueChange={setRoleF}><SelectTrigger className="h-10 w-full input-dark sm:w-36"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="owner">Owner</SelectItem><SelectItem value="employee">Employee</SelectItem></SelectContent></Select>
        <Select value={actionF} onValueChange={setActionF}><SelectTrigger className="h-10 w-full input-dark sm:w-44"><SelectValue placeholder="Action" /></SelectTrigger><SelectContent><SelectItem value="all">All actions</SelectItem>{actions.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
      </div>

      <GlowCard hover={false} className="p-0">
        {logs === null ? <div className="p-6"><RowSkeleton rows={6} /></div> : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={ScrollText} title="No activity" description="Actions across your agency will appear here." /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="flex items-start gap-3 px-6 py-3.5">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${l.role === 'owner' ? 'border-violet-500/25 bg-violet-500/10 text-violet-300' : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'}`}>{l.role === 'owner' ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm"><b className="font-medium">{l.user_name}</b> <span className="text-xs uppercase tracking-wide text-muted-foreground">({l.role})</span> <span className="text-muted-foreground">{l.action.toLowerCase()}</span> <span className="font-medium">{l.resource}</span></div>
                  {l.detail && <div className="text-xs text-muted-foreground">{l.detail}</div>}
                </div>
                <div className="whitespace-nowrap text-xs text-muted-foreground">{dayjs(l.created_at).format('DD MMM YYYY, h:mm A')}</div>
              </motion.div>
            ))}
          </div>
        )}
      </GlowCard>
    </div>
  )
}
