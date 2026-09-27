// ============================================================================
// MOCK AGENT WORKFLOW ENGINE (Phase 1)
// ----------------------------------------------------------------------------
// This module simulates the multi-agent AI workflow using an event-driven
// architecture. It is DELIBERATELY decoupled from the UI. In future phases the
// same event contract will be produced by the real backend:
//   Next.js -> FastAPI -> LangGraph -> Gemini -> Agents -> Supabase Realtime
//
// The UI only knows about `handleAgentEvent(event)` and never about timers,
// so swapping this mock for Supabase Realtime / SSE / WebSocket requires no
// UI rewrite. Toggle with USE_MOCK_AGENTS.
// ============================================================================

export const USE_MOCK_AGENTS = true

// Canonical agent registry. `icon` is a lucide-react component name resolved in the UI.
export const AGENTS = [
  {
    id: 'ceo',
    name: 'CEO Agent',
    icon: 'Command',
    accent: 'blue',
    working: 'Understanding the client request and planning the analysis workflow...',
    waiting: 'Preparing execution plan...',
    done: 'Execution plan created. Delegating tasks to specialist agents.',
    task: 'Interpret the client brief and orchestrate the specialist agents.',
  },
  {
    id: 'business',
    name: 'Business Intelligence Agent',
    icon: 'BarChart3',
    accent: 'cyan',
    working: "Analyzing the client's business, services, branding and digital presence...",
    waiting: 'Waiting for the execution plan...',
    done: 'Business profile, positioning and digital footprint mapped.',
    task: 'Assess business model, offerings, brand and online presence.',
  },
  {
    id: 'competitor',
    name: 'Competitor Intelligence Agent',
    icon: 'Radar',
    accent: 'violet',
    working: 'Researching competitors and comparing SEO, social media and offers...',
    waiting: 'Waiting for business intelligence...',
    done: 'Top competitors benchmarked across channels and offers.',
    task: 'Identify and benchmark key competitors in the market.',
  },
  {
    id: 'seo',
    name: 'SEO Agent',
    icon: 'Search',
    accent: 'blue',
    working: 'Performing technical SEO, local SEO and Google Business analysis...',
    waiting: 'Waiting for competitor insights...',
    done: 'Technical + local SEO audit complete with prioritized fixes.',
    task: 'Audit technical, on-page and local SEO signals.',
  },
  {
    id: 'marketing',
    name: 'Marketing Strategy Agent',
    icon: 'Target',
    accent: 'success',
    working: 'Building a data-driven 90-day marketing strategy...',
    waiting: 'Waiting for business, competitor and SEO insights...',
    done: '90-day marketing roadmap generated across channels.',
    task: 'Synthesize insights into a channel-level marketing strategy.',
  },
  {
    id: 'campaign',
    name: 'Campaign Planning Agent',
    icon: 'CalendarRange',
    accent: 'warning',
    working: 'Designing a multi-channel campaign roadmap and budget split...',
    waiting: 'Waiting for marketing strategy...',
    done: 'Campaign calendar, creatives themes and budget allocation ready.',
    task: 'Translate strategy into an executable campaign plan.',
  },
  {
    id: 'ceo_review',
    name: 'CEO Final Review',
    icon: 'Brain',
    accent: 'violet',
    working: 'Synthesizing all agent findings into the final strategy report...',
    waiting: 'Waiting for all specialist outputs...',
    done: 'Final AI strategy report compiled and quality-checked.',
    task: 'Consolidate all findings into the final strategy report.',
  },
]

export function getAgent(id) {
  return AGENTS.find((a) => a.id === id)
}

// Event types (stable contract shared with the future real backend)
export const EVENTS = {
  ANALYSIS_STARTED: 'analysis_started',
  AGENT_STARTED: 'agent_started',
  AGENT_PROGRESS: 'agent_progress',
  AGENT_COMPLETED: 'agent_completed',
  AGENT_FAILED: 'agent_failed',
  ANALYSIS_COMPLETED: 'analysis_completed',
}

// Small deterministic-ish output snippets for the expandable "agent details".
function outputFor(agentId) {
  const map = {
    ceo: ['Defined 6-step analysis pipeline', 'Assigned tasks to specialist agents', 'Set success criteria for the report'],
    business: ['Identified core services & value prop', 'Reviewed website & social presence', 'Flagged 3 branding inconsistencies'],
    competitor: ['Benchmarked 4 direct competitors', 'Compared pricing & offers', 'Found 2 content gaps to exploit'],
    seo: ['Crawled key pages for tech issues', 'Audited local & GBP signals', 'Prioritized 8 high-impact fixes'],
    marketing: ['Selected primary & secondary channels', 'Drafted 90-day roadmap', 'Defined KPIs & targets'],
    campaign: ['Built 4-week launch calendar', 'Allocated budget across channels', 'Outlined creative themes'],
    ceo_review: ['Validated cross-agent consistency', 'Computed digital health score', 'Compiled executive summary'],
  }
  return map[agentId] || []
}

/**
 * Run the mock workflow. Emits events over time via `onEvent`.
 * Returns a controller with `.cancel()`.
 *
 * @param {object} opts
 * @param {(event: object) => void} opts.onEvent
 * @param {number} [opts.speed=1] time multiplier (lower = faster)
 */
export function runMockWorkflow({ onEvent, speed = 1 } = {}) {
  let cancelled = false
  const timers = []
  const wait = (ms) => new Promise((res) => { const t = setTimeout(res, ms * speed); timers.push(t) })
  const emit = (event) => { if (!cancelled) onEvent({ ...event, timestamp: new Date().toISOString() }) }

  ;(async () => {
    emit({ type: EVENTS.ANALYSIS_STARTED })
    await wait(600)
    for (const agent of AGENTS) {
      if (cancelled) return
      emit({ type: EVENTS.AGENT_STARTED, agent: agent.id, message: agent.working })
      await wait(1400)
      if (cancelled) return
      emit({ type: EVENTS.AGENT_PROGRESS, agent: agent.id, progress: 55, message: agent.working })
      await wait(1300)
      if (cancelled) return
      emit({
        type: EVENTS.AGENT_COMPLETED,
        agent: agent.id,
        message: agent.done,
        progress: 100,
        output: outputFor(agent.id),
      })
      await wait(500)
    }
    if (cancelled) return
    emit({ type: EVENTS.ANALYSIS_COMPLETED })
  })()

  return {
    cancel() {
      cancelled = true
      timers.forEach(clearTimeout)
    },
  }
}
