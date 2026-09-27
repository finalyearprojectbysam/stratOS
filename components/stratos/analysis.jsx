'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { AGENTS, getAgent, EVENTS, runMockWorkflow, USE_MOCK_AGENTS } from '@/lib/mockAgents'
import { analysisService, reportService, agentMessageService } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, RowSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { fmtTime, fmtDate, fmtDuration } from '@/lib/format'
import {
  Command, BarChart3, Radar, Search, Target, CalendarRange, Brain, Bot,
  CheckCircle2, Loader2, Circle, XCircle, ChevronDown, Sparkles, ArrowRight, FileText, History, Clock,
} from 'lucide-react'

const ICONS = { Command, BarChart3, Radar, Search, Target, CalendarRange, Brain }
const ACCENT = {
  blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300',
  cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300',
  violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-300',
  success: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
  warning: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-300',
}

// ---- Status indicator ------------------------------------------------------
function StatusIndicator({ status }) {
  if (status === 'completed') return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Completed</span>
  if (status === 'working') return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-300"><Loader2 className="h-4 w-4 animate-spin" /> Working</span>
  if (status === 'failed') return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-300"><XCircle className="h-4 w-4" /> Failed</span>
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Circle className="h-3.5 w-3.5" /> Waiting</span>
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      {[0, 1, 2].map((i) => <span key={i} className="typing-dot h-1.5 w-1.5 rounded-full bg-blue-400" style={{ animationDelay: `${i * 0.15}s` }} />)}
    </span>
  )
}

// ---- Single agent message card --------------------------------------------
function AgentMessage({ agent, state, index }) {
  const [open, setOpen] = useState(false)
  const Icon = ICONS[agent.icon] || Bot
  const accent = ACCENT[agent.accent] || ACCENT.blue
  const muted = state.status === 'waiting'
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: muted ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.02 }}
      className="flex gap-3 sm:gap-4"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-gradient-to-br ${accent} ${state.status === 'working' ? 'animate-pulse-glow' : ''}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`rounded-2xl border p-4 transition-colors ${state.status === 'working' ? 'border-blue-500/30 bg-blue-500/[0.04]' : 'border-white/10 bg-card/50'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{agent.name}</span>
              <StatusIndicator status={state.status} />
            </div>
            {state.timestamp && <span className="text-[11px] text-muted-foreground">{fmtTime(state.timestamp)}</span>}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {state.message}
            {state.status === 'working' && <span className="ml-2 inline-block align-middle"><TypingDots /></span>}
          </p>

          {(state.status === 'completed' || state.status === 'working') && (
            <>
              <button onClick={() => setOpen((o) => !o)} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} /> View agent details
              </button>
              <AnimatePresence>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-3 grid gap-3 rounded-xl border border-white/10 bg-background/40 p-3 text-xs sm:grid-cols-2">
                      <div><div className="mb-1 font-medium text-foreground/80">Task</div><div className="text-muted-foreground">{agent.task}</div></div>
                      <div><div className="mb-1 font-medium text-foreground/80">Progress</div><div className="text-muted-foreground">{state.status === 'completed' ? '100%' : `${state.progress || 0}%`}</div></div>
                      <div className="sm:col-span-2">
                        <div className="mb-1 font-medium text-foreground/80">Output summary</div>
                        {state.output?.length ? (
                          <ul className="space-y-1">{state.output.map((o, i) => <li key={i} className="flex items-start gap-1.5 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />{o}</li>)}</ul>
                        ) : <div className="text-muted-foreground">Working on it...</div>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================================
// ANALYSIS WORKFLOW PAGE  (the signature screen)
// ============================================================================
export function AnalysisPage({ analysisId }) {
  const { navigate } = useApp()
  const [clientName, setClientName] = useState('Client')
  const [analysis, setAnalysis] = useState(null)
  const [phase, setPhase] = useState('loading') // loading | running | completed
  const [states, setStates] = useState(() => Object.fromEntries(AGENTS.map((a) => [a.id, { status: 'waiting', message: a.waiting, progress: 0, output: null, timestamp: null }])))
  const [reportId, setReportId] = useState(null)
  const scrollRef = useRef(null)
  const startRef = useRef(Date.now())
  const controllerRef = useRef(null)
  const clientNameRef = useRef('Client')
  const analysisRef = useRef(null)

  // Single event handler \u2014 the ONLY thing the UI knows about the workflow.
  // Future: Supabase Realtime / SSE / WebSocket will call this same function.
  const handleAgentEvent = useCallback((event) => {
    if (event.type === EVENTS.ANALYSIS_STARTED) { setPhase('running'); return }
    if (event.type === EVENTS.ANALYSIS_COMPLETED) { finalize(); return }
    const id = event.agent
    setStates((prev) => {
      const cur = prev[id] || {}
      if (event.type === EVENTS.AGENT_STARTED) return { ...prev, [id]: { ...cur, status: 'working', message: event.message, timestamp: event.timestamp, progress: 10 } }
      if (event.type === EVENTS.AGENT_PROGRESS) return { ...prev, [id]: { ...cur, status: 'working', message: event.message, progress: event.progress } }
      if (event.type === EVENTS.AGENT_COMPLETED) return { ...prev, [id]: { ...cur, status: 'completed', message: event.message, progress: 100, output: event.output, timestamp: event.timestamp } }
      if (event.type === EVENTS.AGENT_FAILED) return { ...prev, [id]: { ...cur, status: 'failed', message: event.message } }
      return prev
    })
  }, []) // eslint-disable-line

  const finalize = useCallback(async () => {
    setPhase('completed')
    const duration = Math.round((Date.now() - startRef.current) / 1000)
    const name = clientNameRef.current
    const rec = analysisRef.current
    try {
      if (analysisId) await analysisService.update(analysisId, { status: 'completed', completed_at: new Date().toISOString(), duration_seconds: duration, agents_used: AGENTS.length })
      const rep = await reportService.create({
        analysis_id: analysisId, client_id: rec?.client_id, client_name: name,
        title: `${name} — Final AI Strategy Report`, report_type: 'final', status: 'ready',
      })
      setReportId(rep.id)
    } catch (e) { /* best effort */ }
    toast.success('Analysis completed successfully')
  }, [analysisId])

  // Load analysis + start workflow
  useEffect(() => {
    let mounted = true
    ;(async () => {
      let record = null
      try { if (analysisId) record = await analysisService.get(analysisId) } catch {}
      if (!mounted) return
      setAnalysis(record)
      analysisRef.current = record
      const nm = record?.client_name || 'Client'
      setClientName(nm)
      clientNameRef.current = nm
      setPhase('running')
      startRef.current = Date.now()
      if (USE_MOCK_AGENTS) {
        controllerRef.current = runMockWorkflow({ onEvent: handleAgentEvent, speed: 1 })
      }
    })()
    return () => { mounted = false; controllerRef.current?.cancel?.() }
  }, [analysisId]) // eslint-disable-line

  // Auto-scroll to latest
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [states, phase])

  // Determine which agents to render: all started + the next waiting one (preview)
  const lastActiveIdx = AGENTS.reduce((acc, a, i) => (states[a.id].status !== 'waiting' ? i : acc), -1)
  const visible = AGENTS.filter((a, i) => states[a.id].status !== 'waiting' || i <= lastActiveIdx + 1)

  const completedCount = AGENTS.filter((a) => states[a.id].status === 'completed').length
  const pct = Math.round((completedCount / AGENTS.length) * 100)

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {/* Header */}
      <GlowCard hover={false} className="shrink-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white"><Bot className="h-5 w-5" /></div>
            <div>
              <div className="font-display text-lg font-semibold leading-tight">STRATOS AI</div>
              <div className="text-sm text-muted-foreground">AI Analysis • {clientName}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {phase === 'completed' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Analysis complete</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" /> Analysis in progress</span>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500" animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">{completedCount}/{AGENTS.length} agents</span>
        </div>
      </GlowCard>

      {/* Chat */}
      <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-5 overflow-y-auto rounded-2xl border border-white/10 bg-background/40 p-4 sm:p-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Multiple AI agents are collaborating on this analysis
        </div>
        <div className="mx-auto max-w-3xl space-y-5">
          <AnimatePresence>
            {visible.map((agent, i) => <AgentMessage key={agent.id} agent={agent} state={states[agent.id]} index={i} />)}
          </AnimatePresence>

          {phase === 'completed' && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"><CheckCircle2 className="h-5 w-5" /></div>
              <div className="flex-1 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.05] p-5">
                <div className="font-display text-base font-semibold text-emerald-200">Analysis Complete</div>
                <p className="mt-1 text-sm text-muted-foreground">Your AI business intelligence report is ready.</p>
                <Button onClick={() => navigate(reportId ? `/reports/${reportId}` : '/reports')} className="mt-4 bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90">
                  <FileText className="mr-2 h-4 w-4" /> View Final Report <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 rounded-2xl border border-white/10 bg-card/60 p-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-white"><Bot className="h-4 w-4" /></div>
          {phase === 'completed' ? (
            <>
              <div className="flex-1 text-sm text-muted-foreground">Analysis completed successfully.</div>
              <Button size="sm" onClick={() => navigate(reportId ? `/reports/${reportId}` : '/reports')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">View Final Report</Button>
            </>
          ) : (
            <>
              <input disabled placeholder="STRATOS AI is analyzing your business..." className="flex-1 cursor-not-allowed bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground" />
              <TypingDots />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ANALYSIS HISTORY PAGE
// ============================================================================
export function AnalysisHistoryPage() {
  const { navigate } = useApp()
  const [rows, setRows] = useState(null)
  useEffect(() => { analysisService.list().then(setRows).catch(() => setRows([])) }, [])

  return (
    <div className="space-y-6">
      <PageHeader icon={History} title="Analysis History" subtitle="Review every multi-agent analysis run across your clients." />
      <GlowCard hover={false} className="p-0">
        {rows === null ? <div className="p-6"><RowSkeleton rows={5} /></div> : rows.length === 0 ? (
          <div className="p-6"><EmptyState icon={History} title="No analyses yet" description="Start an AI analysis from a client to see it here." action={<Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Sparkles className="mr-2 h-4 w-4" />New Analysis</Button>} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Client</th><th className="hidden px-6 py-3 font-medium sm:table-cell">Date</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Agents</th><th className="px-6 py-3 font-medium">Status</th>
                  <th className="hidden px-6 py-3 font-medium lg:table-cell">Duration</th><th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5 font-medium">{a.client_name || 'Client'}</td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground sm:table-cell">{fmtDate(a.created_at)}</td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground md:table-cell">{a.agents_used || 0}</td>
                    <td className="px-6 py-3.5"><StatusPill status={a.status} /></td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground lg:table-cell"><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtDuration(a.duration_seconds)}</span></td>
                    <td className="px-6 py-3.5 text-right"><Button variant="ghost" size="sm" className="text-primary" onClick={() => navigate(`/analysis/${a.id}`)}>Open</Button></td>
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
