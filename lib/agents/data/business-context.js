// Business-level context assembled for agents that need agency + client framing.
export function buildBusinessContext({ agency = {}, client = {} } = {}) {
  return {
    agencyName: agency.name || null,
    agencyIndustry: agency.industry || null,
    clientName: client.business_name || null,
    clientIndustry: client.industry || null,
    goals: client.business_goals || null,
  }
}

export default buildBusinessContext
