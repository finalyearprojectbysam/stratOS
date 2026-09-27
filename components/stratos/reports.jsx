'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { reportService, activityService } from '@/lib/services'
import { generateReportPDF } from '@/lib/pdf'
import { GlowCard, StatusPill, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { fmtDate } from '@/lib/format'
import {
  FileText, Download, Share2, ArrowLeft, BarChart3, Radar, Search, Target, CalendarRange, Brain, ListChecks,
  TrendingUp, CheckCircle2, AlertTriangle, Lightbulb, Sparkles, Gauge, LineChart, Megaphone, ShieldAlert,
  KanbanSquare, MoreHorizontal, Trash2, Eye,
} from 'lucide-react'

// Mock report content (UI demonstration only — replaced by real agent outputs later).
export const MOCK = {
  score: 72, opportunity: 'High',
  summary: 'The business has a solid local reputation and engaged social following, but is under-leveraging paid acquisition and local SEO. Competitors are outspending on search while ranking for high-intent keywords the client currently misses. A focused 90-day plan across local SEO, paid social and reactivation email can realistically lift qualified leads by 30-45%.',
  strengths: ['Strong brand recall in core locality', 'Highly rated on Google (4.7 stars)', 'Active, engaged Instagram community'],
  weaknesses: ['No structured paid acquisition', 'Thin website content & slow mobile load', 'Inconsistent Google Business posting'],
  opportunitiesList: ['Rank for 12 untapped local keywords', 'Launch referral + reactivation flows', 'Short-form video for reach'],
  competitors: [{ name: 'FitZone', strength: 'Aggressive Google Ads', gap: 'Weak organic content' }, { name: 'PulseGym', strength: 'Strong SEO authority', gap: 'Poor social engagement' }, { name: 'CoreLab', strength: 'Premium branding', gap: 'Limited local presence' }],
  seo: [{ label: 'Technical health', value: 68 }, { label: 'On-page SEO', value: 74 }, { label: 'Local SEO', value: 61 }, { label: 'Backlinks', value: 55 }],
  analytics: ['Website sessions up 14% MoM, but returning visitors down 9%', 'Conversion rate 2.1% (below 3.5% industry benchmark)', 'Top channel: Organic (46%); Paid contributes just 6%', 'Anomaly: bounce rate spike on mobile landing pages', 'Monitor: CPL, lead-to-trial rate, returning-visitor ratio'],
  marketing: ['Primary: Local SEO + Google Business optimization', 'Secondary: Meta paid social for offers', 'Tertiary: Email reactivation for lapsed customers', 'KPIs: +40% qualified leads, -15% CPL in 90 days'],
  ads: ['Platforms: Meta (prospecting + retargeting) and Google Search', 'Audiences: lookalikes, local radius, past visitors', 'Funnel: awareness reel → offer LP → retarget → book', 'Budget: 60% Meta / 40% Google; start at modest daily spend', 'Optimize: CPL, ROAS, landing-page conversion'],
  campaign: [{ week: 'Weeks 1-2', focus: 'Foundation: GBP, tracking, landing pages' }, { week: 'Weeks 3-5', focus: 'Launch: paid social offer + retargeting' }, { week: 'Weeks 6-8', focus: 'Content: local SEO pages + short video' }, { week: 'Weeks 9-12', focus: 'Scale: email flows + referral program' }],
  risks: [{ risk: 'Ad spend without tracking wastes budget', impact: 'High', mitigation: 'Set up conversion tracking before launch' }, { risk: 'Slow mobile site hurts conversions', impact: 'Medium', mitigation: 'Fix LCP < 2.5s in week 1' }, { risk: 'Content cadence not sustained', impact: 'Medium', mitigation: 'Batch-produce 4 weeks upfront' }],
  execution: ['Project: SEO & GBP foundation (owner: Analyst)', 'Project: Paid social launch (owner: Strategist)', 'Project: Content & landing pages (owner: Editor)', '14 tasks mapped with dependencies and deadlines'],
  actions: ['Claim & optimize Google Business Profile', 'Fix mobile page speed (<2.5s LCP)', 'Publish 6 local landing pages', 'Launch offer campaign on Meta', 'Set up conversion tracking', 'Build 20 local citations', 'Create reactivation email flow', 'Launch member referral program'],
}

function pdfContent() {
  return { score: MOCK.score, opportunity: MOCK.opportunity, summary: MOCK.summary, strengths: MOCK.strengths, weaknesses: MOCK.weaknesses, competitors: MOCK.competitors, seo: MOCK.seo, analytics: MOCK.analytics, marketing: MOCK.marketing, ads: MOCK.ads, campaign: MOCK.campaign, opportunities: MOCK.opportunitiesList, risks: MOCK.risks, execution: MOCK.execution, actions: MOCK.actions }
}

const REPORT_META = { final: { icon: Brain, accent: 'text-fuchsia-300 bg-fuchsia-500/10 border-fuchsia-500/20' } }

export function ReportsPage() {
  const { navigate, role } = useApp()
  const [reports, setReports] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const load = () => reportService.list().then(setReports).catch(() => setReports([]))
  useEffect(() => { load() }, [])

  const download = (r) => { generateReportPDF(r, pdfContent()); activityService.log('Downloaded report', r.title, 'PDF export') }
  const del = async () => {
    try { await reportService.remove(toDelete.id); await activityService.log('Deleted report', toDelete.title, `Report for ${toDelete.client_name}`); toast.success('Report deleted'); setToDelete(null); load() }
    catch (e) { toast.error('Could not delete report') }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FileText} title="Reports" subtitle="AI-generated marketing intelligence reports, ready to export & share." />
      {reports === null ? <CardSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" /> : reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet" description="Run an AI analysis to generate your first strategy report." action={role !== 'employee' ? <Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Sparkles className="mr-2 h-4 w-4" />New Analysis</Button> : null} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r, i) => {
            const meta = REPORT_META[r.report_type] || REPORT_META.final
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlowCard className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${meta.accent}`}><meta.icon className="h-5 w-5" /></div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={r.status} />
                      {role !== 'employee' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-white/10 bg-popover">
                            <DropdownMenuItem onClick={() => navigate(`/reports/${r.id}`)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => download(r)}><Download className="mr-2 h-4 w-4" />Download PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setToDelete(r)} className="text-red-300 focus:text-red-300"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-4 font-display font-semibold leading-snug">{r.title}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">{r.client_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground/70">Generated {fmtDate(r.created_at)}</div>
                  <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
                    <Button size="sm" onClick={() => navigate(`/reports/${r.id}`)} className="flex-1 bg-white/[0.05] hover:bg-white/[0.1]"><FileText className="mr-1.5 h-3.5 w-3.5" />View</Button>
                    <Button size="sm" variant="outline" onClick={() => download(r)} className="border-white/15"><Download className="h-3.5 w-3.5" /></Button>
                  </div>
                </GlowCard>
              </motion.div>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-popover"><AlertDialogHeader><AlertDialogTitle>Delete this report?</AlertDialogTitle><AlertDialogDescription>This permanently removes <b className="text-foreground">{toDelete?.title}</b>. This action is logged in the Activity Log.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-white/15">Cancel</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: Gauge }, { key: 'business', label: 'Business', icon: BarChart3 },
  { key: 'competitors', label: 'Competitors', icon: Radar }, { key: 'seo', label: 'SEO', icon: Search },
  { key: 'analytics', label: 'Analytics', icon: LineChart }, { key: 'marketing', label: 'Marketing', icon: Target },
  { key: 'ads', label: 'Ads', icon: Megaphone }, { key: 'campaign', label: 'Campaign', icon: CalendarRange },
  { key: 'opportunities', label: 'Opportunities', icon: Lightbulb }, { key: 'risks', label: 'Risks', icon: ShieldAlert },
  { key: 'execution', label: 'Execution', icon: KanbanSquare }, { key: 'actions', label: 'Next Actions', icon: ListChecks },
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
          <Button onClick={() => { generateReportPDF(report, pdfContent()); activityService.log('Downloaded report', report.title, 'PDF export') }} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Download className="mr-2 h-4 w-4" />Download PDF</Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-4 py-2 text-xs text-amber-200/80">Demonstration data — report content will be generated by real AI agents in a future phase.</div>

      <Tabs defaultValue="overview">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-white/[0.02] p-1">
          {TABS.map((t) => <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:bg-white/[0.08]"><t.icon className="h-3.5 w-3.5" /><span className="hidden md:inline">{t.label}</span></TabsTrigger>)}
        </TabsList>

        <TabsContent value="overview" className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <ScoreCard icon={Gauge} label="Digital Health Score" value={`${MOCK.score}/100`} sub="Above local average" accent="blue" />
            <ScoreCard icon={TrendingUp} label="Market Opportunity" value={MOCK.opportunity} sub="Room to grow fast" accent="violet" />
            <ScoreCard icon={ListChecks} label="Priority Actions" value={MOCK.actions.length} sub="Ranked by impact" accent="emerald" />
          </div>
          <GlowCard hover={false} className="p-6"><h3 className="font-display font-semibold">Executive Summary</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{MOCK.summary}</p></GlowCard>
        </TabsContent>

        <TabsContent value="business" className="mt-5 grid gap-4 md:grid-cols-3">
          <ListCard icon={CheckCircle2} title="Strengths" items={MOCK.strengths} tone="emerald" />
          <ListCard icon={AlertTriangle} title="Weaknesses" items={MOCK.weaknesses} tone="amber" />
          <ListCard icon={Lightbulb} title="Opportunities" items={MOCK.opportunitiesList} tone="blue" />
        </TabsContent>
        <TabsContent value="competitors" className="mt-5 space-y-3">
          {MOCK.competitors.map((c) => (<GlowCard key={c.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="font-medium">{c.name}</div><div className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-6"><span className="text-emerald-300">Strength: <span className="text-muted-foreground">{c.strength}</span></span><span className="text-amber-300">Gap: <span className="text-muted-foreground">{c.gap}</span></span></div></GlowCard>))}
        </TabsContent>
        <TabsContent value="seo" className="mt-5"><GlowCard hover={false} className="space-y-4 p-6">{MOCK.seo.map((s) => (<div key={s.label}><div className="mb-1.5 flex justify-between text-sm"><span>{s.label}</span><span className="text-muted-foreground">{s.value}%</span></div><Progress value={s.value} className="h-2 bg-white/10" /></div>))}</GlowCard></TabsContent>
        <TabsContent value="analytics" className="mt-5"><ListCard icon={LineChart} title="Analytics Insights" items={MOCK.analytics} tone="cyan" /></TabsContent>
        <TabsContent value="marketing" className="mt-5"><ListCard icon={Target} title="90-Day Marketing Strategy" items={MOCK.marketing} tone="emerald" /></TabsContent>
        <TabsContent value="ads" className="mt-5"><ListCard icon={Megaphone} title="Paid Ads Strategy" items={MOCK.ads} tone="amber" /></TabsContent>
        <TabsContent value="campaign" className="mt-5 space-y-3">{MOCK.campaign.map((c) => (<GlowCard key={c.week} className="flex items-center gap-4 p-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-300"><CalendarRange className="h-5 w-5" /></div><div><div className="text-sm font-medium">{c.week}</div><div className="text-sm text-muted-foreground">{c.focus}</div></div></GlowCard>))}</TabsContent>
        <TabsContent value="opportunities" className="mt-5"><ListCard icon={Lightbulb} title="Growth Opportunities" items={MOCK.opportunitiesList} tone="blue" /></TabsContent>
        <TabsContent value="risks" className="mt-5 space-y-3">{MOCK.risks.map((r, i) => (<GlowCard key={i} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-violet-300" /><span className="text-sm font-medium">{r.risk}</span></div><div className="flex gap-4 text-sm"><span className="text-amber-300">Impact: <span className="text-muted-foreground">{r.impact}</span></span><span className="text-emerald-300">Mitigation: <span className="text-muted-foreground">{r.mitigation}</span></span></div></GlowCard>))}</TabsContent>
        <TabsContent value="execution" className="mt-5"><ListCard icon={KanbanSquare} title="Project / Execution Plan" items={MOCK.execution} tone="blue" /></TabsContent>
        <TabsContent value="actions" className="mt-5"><GlowCard hover={false} className="p-6"><h3 className="font-display font-semibold">Next Actions</h3><div className="mt-4 space-y-2">{MOCK.actions.map((a, i) => (<div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold text-white">{i + 1}</span><span className="text-sm">{a}</span></div>))}</div></GlowCard></TabsContent>
      </Tabs>
    </div>
  )
}

function ScoreCard({ icon: Icon, label, value, sub, accent }) {
  const a = { blue: 'text-blue-300 border-blue-500/20 bg-blue-500/10', violet: 'text-violet-300 border-violet-500/20 bg-violet-500/10', emerald: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' }[accent]
  return <GlowCard className="p-5"><div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${a}`}><Icon className="h-5 w-5" /></div><div className="mt-4 font-display text-3xl font-semibold">{value}</div><div className="mt-1 text-sm text-muted-foreground">{label}</div><div className="text-xs text-muted-foreground/60">{sub}</div></GlowCard>
}
function ListCard({ icon: Icon, title, items, tone }) {
  const t = { emerald: 'text-emerald-300', amber: 'text-amber-300', blue: 'text-blue-300', cyan: 'text-cyan-300' }[tone]
  return (<GlowCard hover={false} className="p-5"><div className={`flex items-center gap-2 font-display font-semibold ${t}`}><Icon className="h-4 w-4" />{title}</div><ul className="mt-3 space-y-2">{items.map((it, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${t.replace('text', 'bg')}`} />{it}</li>)}</ul></GlowCard>)
}
