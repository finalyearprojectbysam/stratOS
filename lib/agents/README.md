# STRATOS Agent System

Modular, Gemini-ready architecture for the 11 specialist agents. Built in JS to
match the existing Next.js app (the spec's `/backend/*` maps to `lib/*` here).

## Layout
```
lib/
  agents/
    <agent>/            one folder per agent (isolated)
      agent.js          execution logic (thin, consistent)
      prompt.js         system prompt  ← TEAMMATE EDITS (TODO placeholder)
      schema.js         zod output schema  ← TEAMMATE EDITS
      types.js          agent-specific JSDoc types
      tools.js          agent-specific tools (empty for now)
      config.js         name / version / enabled / model
      README.md
    shared/             base-agent, schemas, context, errors, logger, utils, report-adapter
    data/               client/business/analysis context + agent-input builders
    fixtures/           dev-only sample inputs (no real data)
    tests/              independent agent test harness
    index.js            public entrypoint
  orchestration/        registry (source of truth), workflow, graph, dependencies, state, events
  gemini/               provider abstraction + config + model (server-side)
```

## The 11 agents (12 workflow stages — CEO runs first + last)
1. CEOAgent · 2. BusinessIntelligenceAgent · 3. CompetitorAgent · 4. SEOAgent ·
5. AnalyticsAgent · 6. AdsStrategyAgent · 7. OpportunityFinderAgent ·
8. MarketingStrategyAgent · 9. CampaignPlanningAgent · 10. RiskAnalysisAgent ·
11. ProjectManagerAgent

## Add / edit an agent (e.g. SEO)
1. Open `lib/agents/seo/`.
2. Write the prompt in `prompt.js`.
3. Define the output shape in `schema.js` (zod).
4. Add tools in `tools.js` (later).
5. Add types in `types.js`.
6. Test via `lib/agents/tests` or `GET/POST /api/agents`.
You never touch the frontend, auth, or other agents.

## Run the workflow
```js
import { runWorkflow, buildAnalysisContext } from '@/lib/agents'
const context = buildAnalysisContext({ agency, client, analysis })
await runWorkflow({ context, onEvent: (e) => console.log(e.type) })
```
Events emitted match the existing analysis UI:
`analysis_started, agent_started, agent_progress, agent_completed, agent_failed, analysis_completed`.

## Mock vs Gemini
Default provider is **MockProvider** (Demo Mode, `USE_MOCK_AGENTS=true`). Set
`USE_MOCK_AGENTS=false` + `GEMINI_API_KEY` (server-side) to use Gemini once
`lib/gemini/client.js`'s `GeminiProvider` is implemented.

## Enable/disable
Set `enabled:false` in an agent `config.js` — the workflow emits a `skipped`
result and keeps going.

## Compatibility
The existing `lib/mockAgents.js` engine that powers the live Analysis UI is
**unchanged**. This new system is a drop-in, event-compatible replacement to
adopt when wiring real Gemini analysis.
