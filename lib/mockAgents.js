// ============================================================================
// STRATOS — MOCK AGENT WORKFLOW ENGINE (Phase 2: 11 agents)
// ----------------------------------------------------------------------------
// Event-driven, decoupled from UI. The same event contract will later be
// produced by the real backend: Next.js -> FastAPI -> LangGraph -> Gemini.
// Toggle with USE_MOCK_AGENTS. Progress is ALWAYS derived from WORKFLOW length
// (never hard-coded).
// ============================================================================

export const USE_MOCK_AGENTS = true

// Canonical 11-agent registry. `icon` resolves to a lucide-react component.
export const AGENT_REGISTRY = [
  { id: 'ceo', name: 'CEO Agent', icon: 'Command', accent: 'blue',
    working: 'Understanding the client request and planning the analysis workflow...',
    waiting: 'Preparing execution plan...', done: 'Execution plan created. Delegating tasks to specialist agents.',
    task: 'Interpret the client brief and orchestrate the specialist agents.' },
  { id: 'business', name: 'Business Intelligence Agent', icon: 'BarChart3', accent: 'cyan',
    working: "Analyzing the client's business, services, branding and digital presence...",
    waiting: 'Waiting for the execution plan...', done: 'Business profile, positioning and digital footprint mapped.',
    task: 'Assess business model, offerings, brand and online presence.' },
  { id: 'competitor', name: 'Competitor Intelligence Agent', icon: 'Radar', accent: 'violet',
    working: 'Researching competitors and comparing SEO, social media and offers...',
    waiting: 'Waiting for the execution plan...', done: 'Top competitors benchmarked across channels and offers.',
    task: 'Identify and benchmark key competitors in the market.' },
  { id: 'seo', name: 'SEO Agent', icon: 'Search', accent: 'blue',
    working: 'Performing technical SEO, local SEO and Google Business analysis...',
    waiting: 'Waiting for the execution plan...', done: 'Technical + local SEO audit complete with prioritized fixes.',
    task: 'Audit technical, on-page and local SEO signals.' },
  { id: 'analytics', name: 'Analytics Agent', icon: 'LineChart', accent: 'cyan',
    working: 'Analyzing KPIs, performance trends, anomalies and weak areas...',
    waiting: 'Waiting for the execution plan...', done: 'Performance insights and metrics-to-monitor identified.',
    task: 'Analyze KPIs, trends, anomalies and performance insights.' },
  { id: 'ads', name: 'Ads Strategy Agent', icon: 'Megaphone', accent: 'warning',
    working: 'Mapping ad platforms, audiences, funnel, messaging and budget...',
    waiting: 'Waiting for the execution plan...', done: 'Paid advertising strategy and audience segments drafted.',
    task: 'Design a paid advertising strategy across platforms.' },
  { id: 'opportunity', name: 'Opportunity Finder Agent', icon: 'Lightbulb', accent: 'success',
    working: 'Scanning for growth, content, SEO and acquisition opportunities...',
    waiting: 'Waiting for the execution plan...', done: 'Prioritized opportunities and quick wins compiled.',
    task: 'Discover and prioritize business & marketing opportunities.' },
  { id: 'marketing', name: 'Marketing Strategy Agent', icon: 'Target', accent: 'success',
    working: 'Synthesizing insights into a data-driven 90-day marketing strategy...',
    waiting: 'Waiting for research agents to finish...', done: '90-day marketing roadmap generated across channels.',
    task: 'Synthesize research into a channel-level marketing strategy.' },
  { id: 'campaign', name: 'Campaign Planning Agent', icon: 'CalendarRange', accent: 'warning',
    working: 'Designing a multi-channel campaign roadmap and budget split...',
    waiting: 'Waiting for marketing strategy...', done: 'Campaign calendar, creative themes and budget allocation ready.',
    task: 'Translate strategy into an executable campaign plan.' },
  { id: 'risk', name: 'Risk Analysis Agent', icon: 'ShieldAlert', accent: 'violet',
    working: 'Evaluating business, marketing, campaign and execution risks...',
    waiting: 'Waiting for campaign plan...', done: 'Risk register built with likelihood, impact and mitigation.',
    task: 'Assess risks with likelihood, impact and mitigation.' },
  { id: 'project_manager', name: 'Project Manager Agent', icon: 'KanbanSquare', accent: 'blue',
    working: 'Converting strategy into projects, tasks, owners and deadlines...',
    waiting: 'Waiting for risk analysis...', done: 'Execution plan with tasks, dependencies and owners prepared.',
    task: 'Convert strategy into projects, tasks and an execution plan.' },
]

export function getAgent(id) { return AGENT_REGISTRY.find((a) => a.id === id) }

// Execution plan (parallel-capable). `group` marks concurrency waves.
// CEO Final Review reuses the CEO agent identity (NOT a 12th agent).
export const WORKFLOW = [
  { id: 'ceo', agentId: 'ceo', group: 0 },
  { id: 'business', agentId: 'business', group: 1 },
  { id: 'competitor', agentId: 'competitor', group: 1 },
  { id: 'seo', agentId: 'seo', group: 1 },
  { id: 'analytics', agentId: 'analytics', group: 1 },
  { id: 'ads', agentId: 'ads', group: 1 },
  { id: 'opportunity', agentId: 'opportunity', group: 1 },
  { id: 'marketing', agentId: 'marketing', group: 2 },
  { id: 'campaign', agentId: 'campaign', group: 3 },
  { id: 'risk', agentId: 'risk', group: 4 },
  { id: 'project_manager', agentId: 'project_manager', group: 5 },
  { id: 'ceo_review', agentId: 'ceo', group: 6, name: 'CEO Final Review',
    working: 'Synthesizing all agent findings, checking conflicts and writing the executive strategy...',
    done: 'Final AI strategy report compiled and quality-checked.',
    task: 'Aggregate evidence, resolve conflicts and produce the final report.' },
]

// Resolve display info for a workflow step (agent + optional step overrides).
export function stepInfo(step) {
  const agent = getAgent(step.agentId)
  return { ...agent, ...step, name: step.name || agent.name }
}

export const EVENTS = {
  ANALYSIS_STARTED: 'analysis_started',
  AGENT_STARTED: 'agent_started',
  AGENT_PROGRESS: 'agent_progress',
  AGENT_COMPLETED: 'agent_completed',
  AGENT_FAILED: 'agent_failed',
  ANALYSIS_COMPLETED: 'analysis_completed',
}

function outputFor(id) {
  const map = {
    ceo: ['Defined 11-agent analysis pipeline', 'Assigned research tasks in parallel', 'Set success criteria for the report'],
    business: ['Identified core services & value prop', 'Reviewed website & social presence', 'Flagged 3 branding inconsistencies'],
    competitor: ['Benchmarked 4 direct competitors', 'Compared pricing & offers', 'Found 2 content gaps to exploit'],
    seo: ['Crawled key pages for tech issues', 'Audited local & GBP signals', 'Prioritized 8 high-impact fixes'],
    analytics: ['Reviewed traffic & conversion KPIs', 'Detected a drop in returning users', 'Listed 5 metrics to monitor'],
    ads: ['Selected Meta + Google as primary', 'Drafted 3 audience segments', 'Proposed funnel & budget split'],
    opportunity: ['Found 6 quick wins', 'Identified 2 market-expansion plays', 'Ranked opportunities by impact'],
    marketing: ['Selected primary & secondary channels', 'Drafted 90-day roadmap', 'Defined KPIs & targets'],
    campaign: ['Built 4-week launch calendar', 'Allocated budget across channels', 'Outlined creative themes'],
    risk: ['Logged 7 risks with impact', 'Rated likelihood', 'Added mitigation steps'],
    project_manager: ['Created 3 projects', 'Broke down 14 tasks', 'Mapped owners & deadlines'],
    ceo_review: ['Validated cross-agent consistency', 'Computed digital health score', 'Compiled executive summary'],
  }
  return map[id] || []
}

/**
 * Run the mock workflow. Emits events over time via onEvent. Returns { cancel }.
 * Research agents in the same group start together (parallel-capable).
 */
export function runMockWorkflow({ onEvent, speed = 1 } = {}) {
  let cancelled = false
  const timers = []
  const wait = (ms) => new Promise((res) => { const t = setTimeout(res, ms * speed); timers.push(t) })
  const emit = (e) => { if (!cancelled) onEvent({ ...e, timestamp: new Date().toISOString() }) }

  const groups = []
  WORKFLOW.forEach((s) => { (groups[s.group] = groups[s.group] || []).push(s) })

  ;(async () => {
    emit({ type: EVENTS.ANALYSIS_STARTED })
    await wait(500)
    for (const group of groups) {
      if (cancelled) return
      // start all steps in the wave
      for (const step of group) {
        const info = stepInfo(step)
        emit({ type: EVENTS.AGENT_STARTED, step: step.id, agentId: step.agentId, message: info.working })
      }
      await wait(1000)
      if (cancelled) return
      for (const step of group) {
        const info = stepInfo(step)
        emit({ type: EVENTS.AGENT_PROGRESS, step: step.id, agentId: step.agentId, progress: 55, message: info.working })
      }
      // complete staggered
      for (let i = 0; i < group.length; i++) {
        await wait(500)
        if (cancelled) return
        const step = group[i]
        const info = stepInfo(step)
        emit({ type: EVENTS.AGENT_COMPLETED, step: step.id, agentId: step.agentId, message: info.done, progress: 100, output: outputFor(step.id) })
      }
      await wait(300)
    }
    if (cancelled) return
    emit({ type: EVENTS.ANALYSIS_COMPLETED })
  })()

  return { cancel() { cancelled = true; timers.forEach(clearTimeout) } }
}
