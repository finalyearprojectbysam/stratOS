// Converts orchestration results into a report-friendly structure WITHOUT
// duplicating report formatting inside each agent. Keeps the existing report /
// PDF system compatible with the new agent result contract.
export function resultsToReport(results = [], { clientName } = {}) {
  const byId = {}
  for (const r of results) if (r?.metadata?.agentId) byId[r.metadata.agentId] = r
  // The final CEO review is the last 'ceo' result in the list.
  const ceoRuns = results.filter((r) => r?.metadata?.agentId === 'ceo')
  const finalReview = ceoRuns[ceoRuns.length - 1] || null

  return {
    clientName: clientName || null,
    generatedAt: new Date().toISOString(),
    executiveSummary: finalReview?.summary || '',
    finalStrategy: finalReview?.findings?.finalStrategy ?? finalReview?.findings ?? null,
    sections: results.map((r) => ({
      agentId: r?.metadata?.agentId || null,
      agent: r.agentName,
      status: r.status,
      summary: r.summary,
      findings: r.findings ?? null,
      recommendations: r.recommendations ?? [],
      metrics: r.metrics ?? null,
    })),
    stats: {
      total: results.length,
      completed: results.filter((r) => r.status === 'completed').length,
      failed: results.filter((r) => r.status === 'failed').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
    },
  }
}

export default resultsToReport
