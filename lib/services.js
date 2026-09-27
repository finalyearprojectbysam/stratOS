'use client'

// ============================================================================
// SERVICE ABSTRACTION LAYER
// ----------------------------------------------------------------------------
// The UI NEVER talks to Supabase directly — it goes through these services.
// This keeps business logic out of components and means the future FastAPI
// backend can replace these implementations without touching the UI.
//
// Two runtime modes:
//   • 'supabase' — active when NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set.
//   • 'demo'     — localStorage-backed fallback so the whole app is usable
//                  (and testable) before credentials are provided.
// ============================================================================

import { v4 as uuid } from 'uuid'
import { supabase, isSupabaseConfigured } from './supabaseClient'

export const dataMode = isSupabaseConfigured ? 'supabase' : 'demo'

// ---------------------------------------------------------------------------
// Demo (localStorage) store
// ---------------------------------------------------------------------------
const LS = typeof window !== 'undefined' ? window.localStorage : null
const KEY = (t) => `stratos_demo_${t}`
const readLS = (t) => { try { return JSON.parse(LS?.getItem(KEY(t)) || '[]') } catch { return [] } }
const writeLS = (t, rows) => { try { LS?.setItem(KEY(t), JSON.stringify(rows)) } catch {} }

function seedDemo() {
  if (!LS || LS.getItem('stratos_demo_seeded')) return
  const now = Date.now()
  const iso = (offsetDays = 0) => new Date(now - offsetDays * 86400000).toISOString()
  const clients = [
    { id: uuid(), business_name: 'ABC Fitness', industry: 'Fitness', target_location: 'Chennai', website_url: 'https://abcfitness.example', status: 'completed', created_at: iso(6), updated_at: iso(1), business_goals: ['Lead Generation', 'Local Visibility'], target_audience: 'Urban professionals 25-40', business_description: 'Premium boutique fitness studio.' },
    { id: uuid(), business_name: 'XYZ Academy', industry: 'Education', target_location: 'Coimbatore', website_url: 'https://xyzacademy.example', status: 'in_progress', created_at: iso(4), updated_at: iso(0), business_goals: ['Website Traffic', 'Sales'], target_audience: 'Students & parents', business_description: 'Coaching academy for competitive exams.' },
    { id: uuid(), business_name: 'Fresh Bites', industry: 'Restaurant', target_location: 'Chennai', website_url: 'https://freshbites.example', status: 'pending', created_at: iso(2), updated_at: iso(2), business_goals: ['Brand Awareness'], target_audience: 'Families & young diners', business_description: 'Farm-to-table casual dining restaurant.' },
    { id: uuid(), business_name: 'Glow Salon', industry: 'Beauty', target_location: 'Madurai', website_url: 'https://glowsalon.example', status: 'completed', created_at: iso(9), updated_at: iso(3), business_goals: ['Customer Retention', 'Local Visibility'], target_audience: 'Women 20-45', business_description: 'Full-service beauty & wellness salon.' },
  ]
  writeLS('clients', clients)
  const projects = [
    { id: uuid(), client_id: clients[0].id, name: 'Q3 Growth Sprint', description: 'Lead-gen focused 90-day sprint.', status: 'in_progress', progress: 62, team: ['Aarav', 'Meera'], deadline: iso(-20), start_date: iso(10), created_at: iso(10) },
    { id: uuid(), client_id: clients[3].id, name: 'Brand Refresh', description: 'Salon rebrand + local SEO.', status: 'review', progress: 88, team: ['Karthik'], deadline: iso(-8), start_date: iso(25), created_at: iso(25) },
    { id: uuid(), client_id: clients[1].id, name: 'Admissions Campaign', description: 'Peak-season admissions push.', status: 'planning', progress: 15, team: ['Meera', 'Ishan'], deadline: iso(-40), start_date: iso(3), created_at: iso(3) },
  ]
  writeLS('projects', projects)
  const analyses = [
    { id: uuid(), client_id: clients[0].id, client_name: 'ABC Fitness', status: 'completed', agents_used: 7, duration_seconds: 168, started_at: iso(6), completed_at: iso(6), created_at: iso(6) },
    { id: uuid(), client_id: clients[3].id, client_name: 'Glow Salon', status: 'completed', agents_used: 7, duration_seconds: 152, started_at: iso(3), completed_at: iso(3), created_at: iso(3) },
    { id: uuid(), client_id: clients[1].id, client_name: 'XYZ Academy', status: 'in_progress', agents_used: 4, duration_seconds: null, started_at: iso(0), completed_at: null, created_at: iso(0) },
  ]
  writeLS('analyses', analyses)
  const reports = [
    { id: uuid(), analysis_id: analyses[0].id, client_id: clients[0].id, client_name: 'ABC Fitness', title: 'ABC Fitness — Final AI Strategy Report', report_type: 'final', status: 'ready', created_at: iso(6) },
    { id: uuid(), analysis_id: analyses[1].id, client_id: clients[3].id, client_name: 'Glow Salon', title: 'Glow Salon — Final AI Strategy Report', report_type: 'final', status: 'ready', created_at: iso(3) },
  ]
  writeLS('reports', reports)
  const team = [
    { id: uuid(), name: 'Aarav Sharma', email: 'aarav@agency.com', role: 'Admin', status: 'active', assigned_projects: 3, created_at: iso(30) },
    { id: uuid(), name: 'Meera Nair', email: 'meera@agency.com', role: 'Manager', status: 'active', assigned_projects: 2, created_at: iso(28) },
    { id: uuid(), name: 'Karthik Rao', email: 'karthik@agency.com', role: 'Strategist', status: 'active', assigned_projects: 1, created_at: iso(20) },
    { id: uuid(), name: 'Ishan Patel', email: 'ishan@agency.com', role: 'Analyst', status: 'invited', assigned_projects: 0, created_at: iso(5) },
  ]
  writeLS('team_members', team)
  const docs = [
    { id: uuid(), title: 'AARRR Growth Framework', description: 'Pirate metrics playbook.', category: 'Marketing Frameworks', file_url: '#', created_at: iso(12) },
    { id: uuid(), title: 'Local SEO Checklist 2025', description: 'GBP + citations workflow.', category: 'SEO Guidelines', file_url: '#', created_at: iso(7) },
    { id: uuid(), title: 'Agency Onboarding SOP', description: 'Client onboarding standard.', category: 'Agency SOPs', file_url: '#', created_at: iso(3) },
  ]
  writeLS('knowledge_documents', docs)
  LS.setItem('stratos_demo_seeded', '1')
}
if (typeof window !== 'undefined') seedDemo()

// ---------------------------------------------------------------------------
// Generic table service factory
// ---------------------------------------------------------------------------
function table(name) {
  return {
    async list(orderBy = 'created_at') {
      if (dataMode === 'supabase') {
        const { data, error } = await supabase.from(name).select('*').order(orderBy, { ascending: false })
        if (error) throw error
        return data || []
      }
      return readLS(name).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    },
    async get(id) {
      if (dataMode === 'supabase') {
        const { data, error } = await supabase.from(name).select('*').eq('id', id).single()
        if (error) throw error
        return data
      }
      return readLS(name).find((r) => r.id === id) || null
    },
    async create(row) {
      const record = { id: uuid(), created_at: new Date().toISOString(), ...row }
      if (dataMode === 'supabase') {
        const payload = { ...row }
        const { data, error } = await supabase.from(name).insert(payload).select().single()
        if (error) throw error
        return data
      }
      const rows = readLS(name)
      rows.unshift(record)
      writeLS(name, rows)
      return record
    },
    async update(id, patch) {
      if (dataMode === 'supabase') {
        const { data, error } = await supabase.from(name).update(patch).eq('id', id).select().single()
        if (error) throw error
        return data
      }
      const rows = readLS(name)
      const idx = rows.findIndex((r) => r.id === id)
      if (idx >= 0) { rows[idx] = { ...rows[idx], ...patch, updated_at: new Date().toISOString() }; writeLS(name, rows) }
      return rows[idx]
    },
    async remove(id) {
      if (dataMode === 'supabase') {
        const { error } = await supabase.from(name).delete().eq('id', id)
        if (error) throw error
        return true
      }
      writeLS(name, readLS(name).filter((r) => r.id !== id))
      return true
    },
  }
}

// ---------------------------------------------------------------------------
// Auth service
// ---------------------------------------------------------------------------
export const authService = {
  mode: dataMode,
  async getSession() {
    if (dataMode === 'supabase') {
      const { data } = await supabase.auth.getUser()
      if (!data?.user) return null
      let profile = null
      try {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
        profile = p
      } catch {}
      return { user: data.user, profile }
    }
    const raw = LS?.getItem('stratos_demo_session')
    return raw ? JSON.parse(raw) : null
  },
  onAuthStateChange(cb) {
    if (dataMode === 'supabase') {
      const { data } = supabase.auth.onAuthStateChange(() => cb())
      return () => data?.subscription?.unsubscribe?.()
    }
    return () => {}
  },
  async signUp({ email, password, fullName, agencyName }) {
    if (dataMode === 'supabase') {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}`, data: { full_name: fullName, agency_name: agencyName } },
      })
      if (error) throw error
      // best-effort profile upsert
      if (data?.user) {
        try { await supabase.from('profiles').upsert({ id: data.user.id, full_name: fullName, agency_name: agencyName }) } catch {}
      }
      return data
    }
    const session = { user: { id: 'demo-user', email }, profile: { full_name: fullName || 'Demo User', agency_name: agencyName || 'Your Agency', role: 'Admin' } }
    LS?.setItem('stratos_demo_session', JSON.stringify(session))
    return session
  },
  async signIn({ email, password }) {
    if (dataMode === 'supabase') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return data
    }
    const session = { user: { id: 'demo-user', email }, profile: { full_name: email?.split('@')[0] || 'Demo User', agency_name: 'Your Agency', role: 'Admin' } }
    LS?.setItem('stratos_demo_session', JSON.stringify(session))
    return session
  },
  async signInWithGoogle() {
    if (dataMode === 'supabase') {
      return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}` } })
    }
    throw new Error('Google sign-in is not configured yet.')
  },
  async signOut() {
    if (dataMode === 'supabase') { await supabase.auth.signOut(); return }
    LS?.removeItem('stratos_demo_session')
  },
  async resetPassword(email) {
    if (dataMode === 'supabase') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}` })
      if (error) throw error
      return true
    }
    return true
  },
  async updateProfile(patch) {
    if (dataMode === 'supabase') {
      const { data: u } = await supabase.auth.getUser()
      if (!u?.user) throw new Error('Not authenticated')
      const { data, error } = await supabase.from('profiles').upsert({ id: u.user.id, ...patch }).select().single()
      if (error) throw error
      return data
    }
    const raw = LS?.getItem('stratos_demo_session')
    const session = raw ? JSON.parse(raw) : { user: { id: 'demo-user' }, profile: {} }
    session.profile = { ...session.profile, ...patch }
    LS?.setItem('stratos_demo_session', JSON.stringify(session))
    return session.profile
  },
}

// ---------------------------------------------------------------------------
// Domain services
// ---------------------------------------------------------------------------
export const clientService = table('clients')
export const projectService = table('projects')
export const analysisService = table('analyses')
export const reportService = table('reports')
export const teamService = table('team_members')
export const agentRunService = table('agent_runs')
export const agentMessageService = table('agent_messages')

export const knowledgeService = {
  ...table('knowledge_documents'),
  async upload(file, meta) {
    if (dataMode === 'supabase') {
      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      const path = `${uid}/${uuid()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('knowledge-documents').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('knowledge-documents').getPublicUrl(path)
      const { data, error } = await supabase.from('knowledge_documents')
        .insert({ title: meta.title || file.name, description: meta.description || '', category: meta.category || 'Templates', file_url: pub?.publicUrl || '#', storage_path: path, mime_type: file.type })
        .select().single()
      if (error) throw error
      return data
    }
    return table('knowledge_documents').create({ title: meta.title || file.name, description: meta.description || '', category: meta.category || 'Templates', file_url: '#' })
  },
}

// Dashboard aggregate stats
export const statsService = {
  async summary() {
    const [clients, analyses, reports, projects] = await Promise.all([
      clientService.list(), analysisService.list(), reportService.list(), projectService.list(),
    ])
    return {
      clients,
      analyses,
      reports,
      projects,
      totalClients: clients.length,
      activeAnalyses: analyses.filter((a) => a.status === 'in_progress').length,
      reportsGenerated: reports.length,
      completedProjects: projects.filter((p) => p.status === 'completed').length,
    }
  },
}
