// Maps a raw client record (localStorage/Supabase shape) into the normalized
// ClientData the agents consume. Empty fields become null so agents can tell
// missing data from skipped.
import { nullIfEmpty } from '../shared/utils'

export function mapClientToClientData(client = {}) {
  return {
    businessName: client.business_name || null,
    industry: nullIfEmpty(client.industry),
    websiteUrl: nullIfEmpty(client.website_url),
    instagramUrl: nullIfEmpty(client.instagram_url),
    facebookUrl: nullIfEmpty(client.facebook_url),
    googleBusinessUrl: nullIfEmpty(client.google_business_url),
    targetLocation: nullIfEmpty(client.target_location),
    businessDescription: nullIfEmpty(client.business_description),
    targetAudience: nullIfEmpty(client.target_audience),
    businessGoals: nullIfEmpty(client.business_goals),
    currentChannels: nullIfEmpty(client.current_channels),
  }
}

export default mapClientToClientData
