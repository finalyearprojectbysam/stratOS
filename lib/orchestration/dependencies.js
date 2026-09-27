// Dependency graph for the 12-stage workflow across 11 unique agents.
// CEO runs first (executive framing) and again last (final review).
//
//   CEO → [Research/Intelligence ×6 in parallel] → Marketing → Campaign
//       → Risk → Project Manager → CEO Final Review → Final Strategy
export const WORKFLOW_STAGES = [
  { group: 0, stageId: 'ceo_framing', label: 'Executive Framing', parallel: false, agents: ['ceo'] },
  { group: 1, stageId: 'research', label: 'Research & Intelligence', parallel: true,
    agents: ['business', 'competitor', 'seo', 'analytics', 'ads', 'opportunity'] },
  { group: 2, stageId: 'marketing', label: 'Marketing Strategy', parallel: false, agents: ['marketing'] },
  { group: 3, stageId: 'campaign', label: 'Campaign Planning', parallel: false, agents: ['campaign'] },
  { group: 4, stageId: 'risk', label: 'Risk Analysis', parallel: false, agents: ['risk'] },
  { group: 5, stageId: 'project', label: 'Project Manager', parallel: false, agents: ['project_manager'] },
  { group: 6, stageId: 'ceo_review', label: 'CEO Final Review', parallel: false, agents: ['ceo'] },
]

// Which agent ids feed into a given stage (all prior results are always passed;
// this map documents the intended primary dependencies).
export const DEPENDENCIES = {
  ceo_framing: [],
  research: ['ceo'],
  marketing: ['business', 'competitor', 'seo', 'analytics', 'ads', 'opportunity'],
  campaign: ['marketing'],
  risk: ['campaign', 'marketing'],
  project_manager: ['campaign', 'marketing', 'risk'],
  ceo_review: ['marketing', 'campaign', 'risk', 'project_manager'],
}

export const TOTAL_STAGES = WORKFLOW_STAGES.reduce((n, s) => n + s.agents.length, 0) // = 12

export default { WORKFLOW_STAGES, DEPENDENCIES, TOTAL_STAGES }
