# Agent Tests

Agents are independently testable via the harness (`agent-harness.js`) which
uses the offline **MockProvider**. Because the modules use ESM `import` resolved
by the Next bundler, run them from a server context.

## Easiest: the API route
```
GET  /api/agents                 → list all agent metadata + workflow stages
POST /api/agents/run  { agentId } → run ONE agent with the mock provider
POST /api/agents/run  { }         → run the FULL 12-stage workflow (events summarized)
```

## In code
```js
import { testAgent, testWorkflow } from '@/lib/agents/tests/agent-harness'
await testAgent('seo')       // one agent
await testWorkflow()          // full workflow
```

A teammate working only in `lib/agents/seo/` can validate Input → SEOAgent →
Output without running the other 10 agents.
