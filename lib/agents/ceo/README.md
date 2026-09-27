# CEO Agent

**Purpose:** Orchestrates the analysis and produces the final executive strategy. Runs first (framing) and last (final review).

**Files:** `agent.js` (execution) · `prompt.js` (system prompt — TODO) · `schema.js` (output) · `types.js` · `tools.js` · `config.js`

**Input:** shared `AgentContext` (agency/client/analysis + all prior agent results).
**Output:** `{ executiveSummary, keyFindings, strategicPriorities, recommendations, nextActions, finalStrategy }`.

**Add domain logic:** edit `prompt.js` + `schema.js`. Test via `lib/agents/tests`.
