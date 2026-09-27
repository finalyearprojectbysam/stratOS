'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { activityService, staffService } from '@/lib/services'
import { generateActivityPDF } from '@/lib/pdf'
import { GlowCard, PageHeader, EmptyState, RowSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollText, Search, Crown, User, Download } from 'lucide-react'
import dayjs from 'dayjs'

const PRESETS = [
  { v: 'all', l: 'All time' }, { v: 'today', l: 'Today' }, { v: 'yesterday', l: 'Yesterday' },
  { v: 'week', l: 'This Week' }, { v: 'month', l: 'This Month' }, { v: 'custom', l: 'Custom Range' },
]

export function ActivityLogPage() {
  const { agency } = useApp()
  const [logs, setLogs] = useState(null)
  const [staff, setStaff] = useState([])
  const [q, setQ] = useState('')
  const [roleF, setRoleF] = useState('all')
  const [staffF, setStaffF] = useState('all')
  const [preset, setPreset] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [timeFrom, setTimeFrom] = useState('')
  const [timeTo, setTimeTo] = useState('')

  useEffect(() => {
    activityService.list().then(setLogs).catch(() => setLogs([]))
    staffService.list().then(setStaff).catch(() => {})
  }, [])

  const range = useMemo(() => {
    const now = dayjs()
    if (preset === 'today') return [now.startOf('day'), now.endOf('day')]
    if (preset === 'yesterday') return [now.subtract(1, 'day').startOf('day'), now.subtract(1, 'day').endOf('day')]
    if (preset === 'week') return [now.startOf('week'), now.endOf('week')]
    if (preset === 'month') return [now.startOf('month'), now.endOf('month')]
    if (preset === 'custom' && (from || to)) return [from ? dayjs(from).startOf('day') : null, to ? dayjs(to).endOf('day') : null]
    return [null, null]
  }, [preset, from, to])

  const filtered = (logs || []).filter((l) => {
    if (roleF !== 'all' && l.role !== roleF) return false
    if (staffF !== 'all' && l.user_name !== staffF) return false
    const d = dayjs(l.created_at)
    if (range[0] && d.isBefore(range[0])) return false
    if (range[1] && d.isAfter(range[1])) return false
    if (timeFrom) { const [h, m] = timeFrom.split(':').map(Number); if (d.hour() * 60 + d.minute() < h * 60 + m) return false }
    if (timeTo) { const [h, m] = timeTo.split(':').map(Number); if (d.hour() * 60 + d.minute() > h * 60 + m) return false }
    if (q) { const s = `${l.user_name} ${l.action} ${l.resource} ${l.detail}`.toLowerCase(); if (!s.includes(q.toLowerCase())) return false }
    return true
  })

  const exportPdf = () => {
    const dateLabel = preset === 'custom' ? [from, to].filter(Boolean).join(' → ') : PRESETS.find((p) => p.v === preset)?.l
    const timeLabel = (timeFrom || timeTo) ? `${timeFrom || '00:00'} – ${timeTo || '23:59'}` : ''
    generateActivityPDF(filtered, { agency: agency?.name, title: 'Activity Log', staff: staffF !== 'all' ? staffF : '', dateLabel, timeLabel })
    activityService.log('Downloaded activity log', 'Activity Log', dateLabel || 'All time')
    toast.success('Activity log exported')
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={ScrollText} title="Activity Log" subtitle="Owner-only chronological audit across your agency."
        actions={<Button onClick={exportPdf} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Download className="mr-2 h-4 w-4" />Download PDF</Button>} />

      <GlowCard hover={false} className="space-y-3 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search activity..." className="h-10 input-dark pl-9" /></div>
          <Select value={preset} onValueChange={setPreset}><SelectTrigger className="h-10 w-full input-dark md:w-40"><SelectValue /></SelectTrigger><SelectContent>{PRESETS.map((p) => <SelectItem key={p.v} value={p.v}>{p.l}</SelectItem>)}</SelectContent></Select>
          <Select value={staffF} onValueChange={setStaffF}><SelectTrigger className="h-10 w-full input-dark md:w-44"><SelectValue placeholder="Staff" /></SelectTrigger><SelectContent><SelectItem value="all">All Staff</SelectItem>{staff.map((s) => <SelectItem key={s.id} value={s.full_name}>{s.full_name}</SelectItem>)}</SelectContent></Select>
          <Select value={roleF} onValueChange={setRoleF}><SelectTrigger className="h-10 w-full input-dark md:w-32"><SelectValue placeholder="Role" /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="owner">Owner</SelectItem><SelectItem value="employee">Employee</SelectItem></SelectContent></Select>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {preset === 'custom' && (<><LabelledDate label="From" value={from} onChange={setFrom} /><LabelledDate label="To" value={to} onChange={setTo} /></>)}
          <LabelledTime label="Time from" value={timeFrom} onChange={setTimeFrom} />
          <LabelledTime label="Time to" value={timeTo} onChange={setTimeTo} />
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} result(s)</span>
        </div>
      </GlowCard>

      <GlowCard hover={false} className="p-0">
        {logs === null ? <div className="p-6"><RowSkeleton rows={6} /></div> : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={ScrollText} title="No activity" description="No activity matches the selected filters." /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((l, i) => (
              <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.02, 0.3) }} className="flex items-start gap-3 px-6 py-3.5">
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${l.role === 'owner' ? 'border-violet-500/25 bg-violet-500/10 text-violet-300' : 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300'}`}>{l.role === 'owner' ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}</div>
                <div className="min-w-0 flex-1"><div className="text-sm"><b className="font-medium">{l.user_name}</b> <span className="text-xs uppercase tracking-wide text-muted-foreground">({l.role})</span> <span className="text-muted-foreground">{l.action.toLowerCase()}</span> <span className="font-medium">{l.resource}</span></div>{l.detail && <div className="text-xs text-muted-foreground">{l.detail}</div>}</div>
                <div className="whitespace-nowrap text-xs text-muted-foreground">{dayjs(l.created_at).format('DD MMM YYYY, h:mm A')}</div>
              </motion.div>
            ))}
          </div>
        )}
      </GlowCard>
    </div>
  )
}

function LabelledDate({ label, value, onChange }) { return <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{label}</span><Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 input-dark w-40" /></div> }
function LabelledTime({ label, value, onChange }) { return <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{label}</span><Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 input-dark w-32" /></div> }
