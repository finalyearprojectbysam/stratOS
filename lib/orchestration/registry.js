// Central agent registry — the SINGLE SOURCE OF TRUTH. Never import agents
// individually from app code; go through here. Keyed by agent id (matching the
// mock engine + event ids).
import ceo from '../agents/ceo/agent'
import business from '../agents/business-intelligence/agent'
import competitor from '../agents/competitor/agent'
import seo from '../agents/seo/agent'
import analytics from '../agents/analytics/agent'
import ads from '../agents/ads-strategy/agent'
import opportunity from '../agents/opportunity-finder/agent'
import marketing from '../agents/marketing-strategy/agent'
import campaign from '../agents/campaign-planning/agent'
import risk from '../agents/risk-analysis/agent'
import projectManager from '../agents/project-manager/agent'

export const AGENT_REGISTRY = {
  ceo,
  business,
  competitor,
  seo,
  analytics,
  ads,
  opportunity,
  marketing,
  campaign,
  risk,
  project_manager: projectManager,
}

export function getAgent(id) { return AGENT_REGISTRY[id] || null }

// Lightweight metadata list (powers dashboards / agent management / progress).
export function listAgents() {
  return Object.values(AGENT_REGISTRY).map((a) => ({ ...a.meta }))
}

export function isEnabled(id) {
  const a = AGENT_REGISTRY[id]
  return !!(a && a.meta && a.meta.enabled)
}

export default AGENT_REGISTRY
