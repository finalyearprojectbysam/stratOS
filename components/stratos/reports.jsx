'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { reportService } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { fmtDate } from '@/lib/format'
import {
  FileText, Download, Share2, ArrowLeft, BarChart3, Radar, Search, Target, CalendarRange,
  Brain, ListChecks, TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Sparkles, Gauge,
} from 'lucide-react'

const REPORT_TYPES = [
  { key: 'business', name: 'Business Intelligence Report', icon: BarChart3, accent: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' },
  { key: 'competitor', name: 'Competitor Analysis', icon: Radar, accent: 'text-violet-300 bg-violet-500/10 border-violet-500/20' },
  { key: 'seo', name: 'SEO Report', icon: Search, accent: 'text-blue-300 bg-blue-500/10 border-blue-500/20' },
  { key: 'marketing', name: 'Marketing Strategy', icon: Target, accent: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'campaign', name: 'Campaign Plan', icon: CalendarRange, accent: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
  { key: 'final', name: 'Final Strategy Report', icon: Brain, accent: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20' },
]

export function ReportsPage() {
  const { navigate } = useApp()
  const [reports, setReports] = useState(null)
  useEffect(() => { reportService.list().then(setReports).catch(() => setReports([])) }, [])

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Reports" subtitle="AI-generated marketing intelligence reports, ready to share." />
      {reports === null ? <CardSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" /> : reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet" description="Run an AI analysis to generate your first strategy report." action={<Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Sparkles className="mr-2 h-4 w-4" />New Analysis</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r, i) => {
            const meta = REPORT_TYPES.find((t) => t.key === r.report_type) || REPORT_TYPES[5]
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${meta.accent}`}><meta.icon className="h-5 w-5" /></div>
                    <StatusPill status={r.status} />
                  </div>
                  <h3 className="mt-4 font-display font-semibold leading-snug">{r.title}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">{r.client_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground/70">Generated {fmtDate(r.created_at)}</div>
                  <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                    <Button size="sm" onClick={() => navigate(`/reports/${r.id}`)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1]"><FileText className="mr-1.5 h-3.5 w-3.5" />View</Button>
                    <Button size="sm" variant="outline" onClick={() => toast.info('PDF export coming soon')} className="border-white/15"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </GlowCard>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---- Mock report content (UI demonstration only) --------------------------
// NOTE: This is placeholder data for UI demonstration. In future phases it will
// be replaced by real agent outputs stored in reports.content.
const MOCK = {
  score: 72, opportunity: 'High', priorityActions: 8,
  summary: 'The business has a solid local reputation and engaged social following, but is under-leveraging paid acquisition and local SEO. Competitors are outspending on search while ranking for high-intent keywords the client currently misses. A focused 90-day plan across local SEO, paid social and reactivation email can realistically lift qualified leads by 30-45%.',
  strengths: ['Strong brand recall in core locality', 'Highly rated on Google (4.7★)', 'Active, engaged Instagram community'],
  weaknesses: ['No structured paid acquisition', 'Thin website content & slow mobile load', 'Inconsistent Google Business posting'],
  opportunities: ['Rank for 12 untapped local keywords', 'Launch referral + reactivation flows', 'Short-form video for reach'],
  competitors: [
    { name: 'FitZone', strength: 'Aggressive Google Ads', gap: 'Weak organic content' },
    { name: 'PulseGym', strength: 'Strong SEO authority', gap: 'Poor social engagement' },
    { name: 'CoreLab', strength: 'Premium branding', gap: 'Limited local presence' },
  ],
  seo: [
    { label: 'Technical health', value: 68 }, { label: 'On-page SEO', value: 74 }, { label: 'Local SEO', value: 61 }, { label: 'Backlinks', value: 55 },
  ],
  marketing: ['Primary: Local SEO + Google Business optimization', 'Secondary: Meta paid social for offers', 'Tertiary: Email reactivation for lapsed members', 'KPIs: +40% qualified leads, -15% CPL in 90 days'],
  campaign: [
    { week: 'Weeks 1-2', focus: 'Foundation: GBP, tracking, landing pages' },
    { week: 'Weeks 3-5', focus: 'Launch: paid social offer + retargeting' },
    { week: 'Weeks 6-8', focus: 'Content: local SEO pages + short video' },
    { week: 'Weeks 9-12', focus: 'Scale: email flows + referral program' },
  ],
  actions: ['Claim & optimize Google Business Profile', 'Fix mobile page speed (<2.5s LCP)', 'Publish 6 local landing pages', 'Launch offer campaign on Meta', 'Set up conversion tracking', 'Build 20 local citations', 'Create reactivation email flow', 'Launch member referral program'],
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: Gauge }, { key: 'business', label: 'Business Analysis', icon: BarChart3 },
  { key: 'competitors', label: 'Competitors', icon: Radar }, { key: 'seo', label: 'SEO Audit', icon: Search },
  { key: 'marketing', label: 'Marketing Strategy', icon: Target }, { key: 'campaign', label: 'Campaign Plan', icon: CalendarRange },
  { key: 'actions', label: 'Action Plan', icon: ListChecks },
]

export function FinalReportPage({ reportId }) {
  const { navigate } = useApp()
  const [report, setReport] = useState(undefined)
  useEffect(() => { reportService.get(reportId).then(setReport).catch(() => setReport(null)) }, [reportId])

  if (report === undefined) return <div className="p-8 text-center text-muted-foreground">Loading report...</div>
  if (report === null) return <EmptyState icon={FileText} title="Report unavailable" description="This report could not be found." action={<Button onClick={() => navigate('/reports')} variant="outline" className="border-white/15">Return to Reports</Button>} />

  const client = report.client_name || 'Client'

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/reports')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Reports</button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Brain className="h-3.5 w-3.5 text-fuchsia-300" />Final AI Strategy Report</div>
          <h1 className="mt-1 font-display text-2xl font-semibold">{client}</h1>
          <div className="mt-1 text-sm text-muted-foreground">Generated {fmtDate(report.created_at)}</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/15" onClick={() => toast.info('Share link copied (demo)')}><Share2 className="mr-2 h-4 w-4" />Share</Button>
          <Button onClick={() => toast.info('PDF export coming soon')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-4 py-2 text-xs text-amber-200/80">Demonstration data — report content will be generated by real AI agents in a future phase.</div>

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-white/[0.02] p-1">
          {TABS.map((t) => <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:bg-white/[0.08]"><t.icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t.label}</span></TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ScoreCard icon={Gauge} label="Digital Health Score" value={`${MOCK.score}/100`} sub="Above local average" accent="blue" />
            <ScoreCard icon={TrendingUp} label="Market Opportunity" value={MOCK.opportunity} sub="Room to grow fast" accent="violet" />
            <ScoreCard icon={ListChecks} label="Priority Actions" value={MOCK.priorityActions} sub="Ranked by impact" accent="emerald" />
          </div>
          <GlowCard hover={false} className="p-6"><h3 className="font-display font-semibold">Executive Summary</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{MOCK.summary}</p></GlowCard>
        </TabsContent>

        <TabsContent value="business" className="mt-5 grid gap-4 md:grid-cols-3">
          <ListCard icon={CheckCircle2} title="Strengths" items={MOCK.strengths} tone="emerald" />
          <ListCard icon={AlertTriangle} title="Weaknesses" items={MOCK.weaknesses} tone="amber" />
          <ListCard icon={Lightbulb} title="Opportunities" items={MOCK.opportunities} tone="blue" />
        </TabsContent>

        <TabsContent value="competitors" className="mt-5 space-y-3">
          {MOCK.competitors.map((c) => (
            <GlowCard key={c.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-medium">{c.name}</div>
              <div className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-6">
                <span className="text-emerald-300">Strength: <span className="text-muted-foreground">{c.strength}</span></span>
                <span className="text-amber-300">Gap: <span className="text-muted-foreground">{c.gap}</span></span>
              </div>
            </GlowCard>
          ))}
        </TabsContent>

        <TabsContent value="seo" className="mt-5 space-y-4">
          <GlowCard hover={false} className="space-y-4 p-6">
            {MOCK.seo.map((s) => (
              <div key={s.label}><div className="mb-1.5 flex justify-between text-sm"><span>{s.label}</span><span className="text-muted-foreground">{s.value}%</span></div><Progress value={s.value} className="h-2 bg-white/10" /></div>
            ))}
          </GlowCard>
        </TabsContent>

        <TabsContent value="marketing" className="mt-5">
          <ListCard icon={Target} title="90-Day Marketing Strategy" items={MOCK.marketing} tone="emerald" full />
        </TabsContent>

        <TabsContent value="campaign" className="mt-5 space-y-3">
          {MOCK.campaign.map((c) => (
            <GlowCard key={c.week} className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-300"><CalendarRange className="h-5 w-5" /></div>
              <div><div className="text-sm font-medium">{c.week}</div><div className="text-sm text-muted-foreground">{c.focus}</div></div>
            </GlowCard>
          ))}
        </TabsContent>

        <TabsContent value="actions" className="mt-5">
          <GlowCard hover={false} className="p-6">
            <h3 className="font-display font-semibold">Priority Actions</h3>
            <div className="mt-4 space-y-2">
              {MOCK.actions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold text-white">{i + 1}</span>
                  <span className="text-sm">{a}</span>
                </div>
              ))}
            </div>
          </GlowCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ScoreCard({ icon: Icon, label, value, sub, accent }) {
  const a = { blue: 'text-blue-300 border-blue-500/20 bg-blue-500/10', violet: 'text-violet-300 border-violet-500/20 bg-violet-500/10', emerald: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' }[accent]
  return <GlowCard className="p-5"><div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a}`}><Icon className="h-5 w-5" /></div><div className="mt-4 font-display text-3xl font-semibold">{value}</div><div className="mt-1 text-sm text-muted-foreground">{label}</div><div className="text-xs text-muted-foreground/60">{sub}</div></GlowCard>
}
function ListCard({ icon: Icon, title, items, tone, full }) {
  const t = { emerald: 'text-emerald-300', amber: 'text-amber-300', blue: 'text-blue-300' }[tone]
  return (
    <GlowCard hover={false} className={`p-5 ${full ? '' : ''}`}>
      <div className={`flex items-center gap-2 font-display font-semibold ${t}`}><Icon className="h-4 w-4" />{title}</div>
      <ul className="mt-3 space-y-2">{items.map((it, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.replace('text', 'bg')}`} />{it}</li>)}</ul>
    </GlowCard>
  )
}
