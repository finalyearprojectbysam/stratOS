import { NextResponse } from 'next/server'
import { listAgents } from '@/lib/orchestration/registry'
import { WORKFLOW_STAGES, TOTAL_STAGES } from '@/lib/orchestration/dependencies'
import { testAgent, testWorkflow } from '@/lib/agents/tests/agent-harness'

export const dynamic = 'force-dynamic'

function seg(params) {
  const p = params?.path
  return Array.isArray(p) ? p : p ? [p] : []
}

export async function GET(request, { params }) {
  const path = seg(await params)
  // GET /api/agents  → registry metadata + workflow stages (single source of truth)
  if (path[0] === 'agents') {
    return NextResponse.json({
      count: listAgents().length,
      totalStages: TOTAL_STAGES,
      agents: listAgents(),
      workflow: WORKFLOW_STAGES,
    })
  }
  return NextResponse.json({ status: 'ok', service: 'STRATOS', phase: 3 })
}

export async function POST(request, { params }) {
  const path = seg(await params)
  // POST /api/agents/run  { agentId?, client? }
  if (path[0] === 'agents' && path[1] === 'run') {
    let body = {}
    try { body = await request.json() } catch {}
    try {
      if (body.agentId) {
        const result = await testAgent(body.agentId, { client: body.client })
        return NextResponse.json({ mode: 'single', agentId: body.agentId, result })
      }
      const events = []
      const state = await testWorkflow({ client: body.client, onEvent: (e) => events.push({ type: e.type, agentId: e.agentId, stage: e.stage, progress: e.progress }) })
      return NextResponse.json({
        mode: 'workflow',
        events,
        durationMs: state.durationMs,
        results: state.results.map((r) => ({ agentId: r.metadata?.agentId, agent: r.agentName, status: r.status, summary: r.summary, schemaValid: r.metadata?.schemaValid })),
      })
    } catch (e) {
      return NextResponse.json({ error: e?.message || 'Agent run failed' }, { status: 500 })
    }
  }
  return NextResponse.json({ status: 'ok' })
}
