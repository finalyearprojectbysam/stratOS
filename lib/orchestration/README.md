# Orchestration

The orchestration layer wires the 11 agents into a runnable analysis. It knows
**which** agents run, **when**, and **what** results flow downstream — but
contains **no** agent-specific business logic.

## Files
- `registry.js` — single source of truth; all 11 agents keyed by id. Use `getAgent(id)` / `listAgents()`.
- `dependencies.js` — the 12-stage workflow (11 agents, CEO runs first + last) and dependency map.
- `workflow.js` — `runWorkflow({ context, provider, onEvent })`. Emits the standard events, runs the research layer in parallel, isolates failures.
- `graph.js` — derives a node/edge graph for docs/visualization.
- `state.js` — per-run mutable state (results, errors, timing).
- `events.js` — canonical event names (match the existing analysis UI).
- `types.js` — JSDoc typedefs.

## Events (unchanged contract)
`analysis_started`, `agent_started`, `agent_progress`, `agent_completed`, `agent_failed`, `analysis_completed`.

## Workflow
```
CEO (framing)
  → [Business, Competitor, SEO, Analytics, Ads, Opportunity]  (parallel)
  → Marketing Strategy → Campaign Planning → Risk Analysis → Project Manager
  → CEO Final Review → Final Executive Strategy
```

## Enable/disable
Set `enabled: false` in an agent's `config.js`. The workflow emits a `skipped`
result and continues; it never crashes.

## Mock vs Gemini
`runWorkflow` uses the injected `provider` (or `getProvider()` default). In Demo
Mode this is the `MockProvider`; set `USE_MOCK_AGENTS=false` + `GEMINI_API_KEY`
to use Gemini (server-side).
