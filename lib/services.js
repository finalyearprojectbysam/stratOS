'use client'

// ============================================================================
// STRATOS SERVICE LAYER (Phase 2)
// ----------------------------------------------------------------------------
// The UI never talks to Supabase directly. Two runtime modes:
//   'supabase' when NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set,
//   'demo'     localStorage fallback (fully functional & testable now).
// Phase 2 adds: agencies + 6-digit codes, owner/employee roles, staff mgmt,
// tasks, activity logs, session/online tracking, agency data isolation.
// Passwords are NEVER stored in plaintext (hashed even in demo mode).
// ============================================================================

// The UI never talks to Supabase directly. Auth and data are DECOUPLED:
//   authMode 'supabase' when NEXT_PUBLIC_SUPABASE_URL/ANON_KEY set → Owner
//            authenticates via real Google OAuth (Supabase Auth).
//   dataMode stays 'demo' (localStorage) unless NEXT_PUBLIC_DATA_BACKEND=supabase,
//            so all agency data keeps working regardless of auth provider.
import { v4 as uuid } from 'uuid'
import { supabase, isSupabaseConfigured } from './supabaseClient'

export const authMode = isSupabaseConfigured ? 'supabase' : 'demo'
export const dataMode = (process.env.NEXT_PUBLIC_DATA_BACKEND === 'supabase' && isSupabaseConfigured) ? 'supabase' : 'demo'

const LS = typeof window !== 'undefined' ? window.localStorage : null
const KEY = (t) => `stratos_${t}`
const readLS = (t) => { try { return JSON.parse(LS?.getItem(KEY(t)) || '[]') } catch { return [] } }
const writeLS = (t, rows) => { try { LS?.setItem(KEY(t), JSON.stringify(rows)) } catch {} }

// Non-reversible hash (demo). Real security handled by Supabase Auth when connected.
function hashPassword(pw = '') {
  let h = 5381
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) + h) + pw.charCodeAt(i); h = h >>> 0 }
  return 'h' + h.toString(16)
}
const verifyPassword = (pw, hash) => hashPassword(pw) === hash

// ---------------------------------------------------------------------------
// Runtime context (set on login) \u2014 used for agency isolation in demo mode.
// ---------------------------------------------------------------------------
let ctx = { agencyId: null, role: null, staffId: null, userName: 'User' }
export function setContext(next) { ctx = { ...ctx, ...next } }
export function getContext() { return ctx }

// Tables that are agency-scoped
const AGENCY_TABLES = new Set(['clients', 'projects', 'analyses', 'reports', 'tasks', 'staff', 'activity_logs', 'knowledge_documents', 'meetings', 'notifications'])

// ---------------------------------------------------------------------------
// Generic table service (demo: agency-scoped filtering)
// ---------------------------------------------------------------------------
function table(name) {
  const scoped = AGENCY_TABLES.has(name)
  return {
    async list(orderBy = 'created_at') {
      if (dataMode === 'supabase') {
        let q = supabase.from(name).select('*').order(orderBy, { ascending: false })
        const { data, error } = await q
        if (error) throw error
        return data || []
      }
      let rows = readLS(name)
      if (scoped && ctx.agencyId) rows = rows.filter((r) => r.agency_id === ctx.agencyId)
      return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
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
      const record = { id: uuid(), created_at: new Date().toISOString(), ...(scoped && ctx.agencyId ? { agency_id: ctx.agencyId } : {}), ...row }
      if (dataMode === 'supabase') {
        const { data, error } = await supabase.from(name).insert(record).select().single()
        if (error) throw error
        return data
      }
      const rows = readLS(name); rows.unshift(record); writeLS(name, rows)
      return record
    },
    async update(id, patch) {
      if (dataMode === 'supabase') {
        const { data, error } = await supabase.from(name).update(patch).eq('id', id).select().single()
        if (error) throw error
        return data
      }
      const rows = readLS(name); const i = rows.findIndex((r) => r.id === id)
      if (i >= 0) { rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() }; writeLS(name, rows) }
      return rows[i]
    },
    async remove(id) {
      if (dataMode === 'supabase') {
        const { error } = await supabase.from(name).delete().eq('id', id); if (error) throw error; return true
      }
      writeLS(name, readLS(name).filter((r) => r.id !== id)); return true
    },
  }
}

// ---------------------------------------------------------------------------
// Domain services
// ---------------------------------------------------------------------------
export const clientService = table('clients')
export const projectService = table('projects')
export const analysisService = table('analyses')
export const reportService = table('reports')
export const staffService = table('staff')
export const teamService = staffService // backward-compat alias
export const taskService = table('tasks')
export const knowledgeService = {
  ...table('knowledge_documents'),
  async upload(file, meta) {
    const text = await readFileText(file)
    if (dataMode === 'supabase') {
      const { data: u } = await supabase.auth.getUser()
      const uid = u?.user?.id
      const path = `${uid}/${uuid()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('knowledge-documents').upload(path, file, { upsert: false })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from('knowledge-documents').getPublicUrl(path)
      return table('knowledge_documents').create({ title: meta.title || file.name, description: meta.description || '', category: meta.category || 'Templates', notes_md: meta.notes_md || null, file_url: pub?.publicUrl || '#', storage_path: path, mime_type: file.type, file_name: file.name, file_size: file.size, text_content: text || null })
    }
    return table('knowledge_documents').create({ title: meta.title || file.name, description: meta.description || '', category: meta.category || 'Templates', notes_md: meta.notes_md || null, file_url: '#', mime_type: file.type || null, file_name: file.name, file_size: file.size, text_content: text || null })
  },
}

// Reads a File as plain text if it's a text-like format (for the in-app reader).
export async function readFileText(file) {
  if (!file) return ''
  const textyExt = /\.(txt|md|markdown|csv|json|log|html?|xml|yaml|yml)$/i
  const isTexty = (file.type && file.type.startsWith('text/')) || file.type === 'application/json' || textyExt.test(file.name || '')
  if (!isTexty) return ''
  try { return await file.text() } catch { return '' }
}

// ---------------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------------
export const activityService = {
  ...table('activity_logs'),
  async log(action, resource, detail = '') {
    try {
      await table('activity_logs').create({
        agency_id: ctx.agencyId, user_name: ctx.userName || 'User', role: ctx.role || 'owner',
        action, resource, detail, created_at: new Date().toISOString(),
      })
    } catch {}
  },
}

// ---------------------------------------------------------------------------
// Session / online-time tracking (employees + owner)
// ---------------------------------------------------------------------------
export const sessionService = {
  async startSession() {
    if (ctx.role === 'employee' && ctx.staffId) {
      await staffService.update(ctx.staffId, { online: true, login_time: new Date().toISOString(), last_active: new Date().toISOString() })
    }
  },
  async heartbeat(deltaSeconds = 30) {
    if (ctx.role === 'employee' && ctx.staffId) {
      const s = await staffService.get(ctx.staffId)
      if (s) await staffService.update(ctx.staffId, { last_active: new Date().toISOString(), total_online_seconds: (s.total_online_seconds || 0) + deltaSeconds })
    }
  },
  async endSession() {
    if (ctx.role === 'employee' && ctx.staffId) {
      const s = await staffService.get(ctx.staffId)
      if (s) {
        const extra = s.login_time ? Math.round((Date.now() - new Date(s.login_time).getTime()) / 1000) : 0
        await staffService.update(ctx.staffId, { online: false, logout_time: new Date().toISOString(), last_active: new Date().toISOString() })
      }
    }
  },
}

// ---------------------------------------------------------------------------
// Agencies
// ---------------------------------------------------------------------------
function unique6DigitCode() {
  const agencies = readLS('agencies')
  let code
  do { code = String(Math.floor(100000 + Math.random() * 900000)) } while (agencies.some((a) => a.code === code))
  return code
}

export const agencyService = {
  async getByCode(code) {
    return readLS('agencies').find((a) => a.code === code) || null
  },
  async get(id) {
    return readLS('agencies').find((a) => a.id === id) || null
  },
}

// ---------------------------------------------------------------------------
// Demo seeding (per-agency) \u2014 gives a populated owner dashboard immediately.
// Also seeds ONE demo employee: Employee ID STR001 / password "staff123".
// ---------------------------------------------------------------------------
function seedAgency(agencyId, ownerName) {
  if (!LS || LS.getItem(`stratos_seed_${agencyId}`)) return
  const now = Date.now()
  const iso = (d = 0) => new Date(now - d * 86400000).toISOString()
  const A = (rows, extra = {}) => rows.map((r) => ({ id: uuid(), agency_id: agencyId, created_at: iso(), ...extra, ...r }))

  const clients = A([
    { business_name: 'ABC Fitness', industry: 'Fitness', target_location: 'Chennai', website_url: 'https://abcfitness.example', status: 'completed', business_goals: ['Lead Generation', 'Local Visibility'], target_audience: 'Urban professionals 25-40', business_description: 'Premium boutique fitness studio.' },
    { business_name: 'XYZ Academy', industry: 'Education', target_location: 'Coimbatore', website_url: 'https://xyzacademy.example', status: 'in_progress', business_goals: ['Website Traffic'], target_audience: 'Students & parents', business_description: 'Coaching academy for competitive exams.' },
    { business_name: 'Fresh Bites', industry: 'Restaurant', target_location: 'Chennai', website_url: 'https://freshbites.example', status: 'pending', business_goals: ['Brand Awareness'], target_audience: 'Families', business_description: 'Farm-to-table casual dining.' },
    { business_name: 'Glow Salon', industry: 'Beauty', target_location: 'Madurai', website_url: 'https://glowsalon.example', status: 'completed', business_goals: ['Customer Retention'], target_audience: 'Women 20-45', business_description: 'Full-service beauty & wellness salon.' },
  ])
  writeLS('clients', [...clients, ...readLS('clients')])

  const staff = [
    { id: uuid(), agency_id: agencyId, full_name: 'Arun Kumar', employee_id: 'STR001', password_hash: hashPassword('staff123'), gender: 'Male', dob: '2002-05-12', email: 'arun@example.com', phone: '9876543210', avatar_url: '', role: 'Analyst', status: 'active', online: false, total_online_seconds: 16320, last_active: iso(0), created_at: iso(20) },
    { id: uuid(), agency_id: agencyId, full_name: 'Priya Nair', employee_id: 'STR002', password_hash: hashPassword('staff123'), gender: 'Female', dob: '2000-09-03', email: 'priya@example.com', phone: '9876500011', avatar_url: '', role: 'Strategist', status: 'active', online: false, total_online_seconds: 9200, last_active: iso(1), created_at: iso(15) },
  ]
  writeLS('staff', [...staff, ...readLS('staff')])

  const projects = A([
    { client_id: clients[0].id, name: 'Q3 Growth Sprint', description: 'Lead-gen focused 90-day sprint.', status: 'in_progress', progress: 62, priority: 'High', team: [staff[0].id, staff[1].id], deadline: iso(-20), start_date: iso(10) },
    { client_id: clients[3].id, name: 'Brand Refresh', description: 'Salon rebrand + local SEO.', status: 'review', progress: 80, priority: 'Medium', team: [staff[1].id], deadline: iso(-8), start_date: iso(25) },
  ])
  writeLS('projects', [...projects, ...readLS('projects')])

  const tasks = A([
    { project_id: projects[0].id, project_name: projects[0].name, title: 'SEO audit', description: 'Full technical + local SEO audit.', assigned_to: staff[0].id, assigned_to_name: 'Arun Kumar', priority: 'High', status: 'in_progress', progress: 50, deadline: iso(-5) },
    { project_id: projects[0].id, project_name: projects[0].name, title: 'Content planning', description: 'Plan 6 local landing pages.', assigned_to: staff[1].id, assigned_to_name: 'Priya Nair', priority: 'Medium', status: 'pending', progress: 0, deadline: iso(-8) },
    { project_id: projects[0].id, project_name: projects[0].name, title: 'Landing page build', description: 'Build primary offer LP.', assigned_to: staff[0].id, assigned_to_name: 'Arun Kumar', priority: 'High', status: 'completed', progress: 100, deadline: iso(2) },
    { project_id: projects[1].id, project_name: projects[1].name, title: 'Logo & palette', description: 'Refresh brand identity.', assigned_to: staff[1].id, assigned_to_name: 'Priya Nair', priority: 'Medium', status: 'completed', progress: 100, deadline: iso(3) },
  ])
  writeLS('tasks', [...tasks, ...readLS('tasks')])

  const analyses = A([
    { client_id: clients[0].id, client_name: 'ABC Fitness', status: 'completed', agents_used: 11, duration_seconds: 190, started_at: iso(6), completed_at: iso(6) },
    { client_id: clients[3].id, client_name: 'Glow Salon', status: 'completed', agents_used: 11, duration_seconds: 172, started_at: iso(3), completed_at: iso(3) },
  ])
  writeLS('analyses', [...analyses, ...readLS('analyses')])

  const reports = A([
    { analysis_id: analyses[0].id, client_id: clients[0].id, client_name: 'ABC Fitness', title: 'ABC Fitness \u2014 Final AI Strategy Report', report_type: 'final', status: 'ready' },
    { analysis_id: analyses[1].id, client_id: clients[3].id, client_name: 'Glow Salon', title: 'Glow Salon \u2014 Final AI Strategy Report', report_type: 'final', status: 'ready' },
  ])
  writeLS('reports', [...reports, ...readLS('reports')])

  const docs = A([
    { title: 'AARRR Growth Framework', description: 'Pirate metrics playbook.', category: 'Marketing Frameworks', file_url: '#' },
    { title: 'Local SEO Checklist 2025', description: 'GBP + citations workflow.', category: 'SEO Guidelines', file_url: '#' },
  ])
  writeLS('knowledge_documents', [...docs, ...readLS('knowledge_documents')])

  const logs = A([
    { user_name: ownerName, role: 'owner', action: 'Created agency', resource: 'Agency', detail: 'Agency workspace initialized' },
    { user_name: ownerName, role: 'owner', action: 'Created employee', resource: 'Staff', detail: 'Arun Kumar (STR001)' },
    { user_name: 'Arun Kumar', role: 'employee', action: 'Updated task', resource: 'SEO audit', detail: 'Progress \u2192 50%' },
  ])
  writeLS('activity_logs', [...logs, ...readLS('activity_logs')])

  const today = new Date(); today.setHours(16, 0, 0, 0)
  const meetings = A([{ title: 'Weekly Client Strategy Meeting', description: "Discuss this week's campaign performance.", meeting_date: new Date().toISOString().slice(0, 10), meeting_time: '16:00', meet_url: 'https://meet.google.com/abc-defg-hij', status: 'scheduled', created_by: ownerName, attendees: [staff[0].id, staff[1].id] }])
  writeLS('meetings', [...meetings, ...readLS('meetings')])
  const notifs = A([
    { recipient_id: staff[0].id, type: 'task', title: 'New Task Assigned', message: 'SEO audit has been assigned to you by the Owner.', resource_type: 'task', resource_id: tasks[0].id, is_read: false },
    { recipient_id: staff[0].id, type: 'meeting', title: 'Meeting Scheduled', message: 'Weekly Client Strategy Meeting — Today at 4:00 PM', resource_type: 'meeting', resource_id: meetings[0].id, is_read: false },
  ])
  writeLS('notifications', [...notifs, ...readLS('notifications')])

  LS.setItem(`stratos_seed_${agencyId}`, '1')
}

// ---------------------------------------------------------------------------
// Auth service (owner + employee)
// ---------------------------------------------------------------------------
// Finds (or provisions on first Google login) the owner's agency. Auth comes
// from Supabase (Google), but the agency + all data live in the localStorage
// demo layer, so nothing else has to change. One Google user → one agency.
async function ensureOwnerAgency(user) {
  const meta = user.user_metadata || {}
  const fullName = meta.full_name || meta.name || (user.email ? user.email.split('@')[0] : 'Owner')
  const email = user.email || meta.email || ''
  const avatar = meta.avatar_url || meta.picture || ''
  const agencies = readLS('agencies')
  let agency = agencies.find((a) => a.owner_user_id === user.id)
  if (!agency) {
    agency = {
      id: uuid(), name: `${fullName}'s Agency`, code: unique6DigitCode(),
      owner_user_id: user.id, owner_email: email, owner_name: fullName,
      owner_avatar_url: avatar, setup_completed: false, created_at: new Date().toISOString(),
    }
    writeLS('agencies', [agency, ...agencies])
  } else if (avatar && agency.owner_avatar_url !== avatar) {
    // keep the avatar fresh if Google photo changed
    const list = readLS('agencies'); const i = list.findIndex((a) => a.id === agency.id)
    if (i >= 0) { list[i] = { ...list[i], owner_avatar_url: avatar }; writeLS('agencies', list); agency = list[i] }
  }
  const session = {
    role: 'owner', agency, user: { id: user.id, email },
    profile: { full_name: agency.owner_name || fullName, agency_name: agency.name, role: 'Owner', avatar_url: agency.owner_avatar_url || avatar, email },
  }
  LS?.setItem('stratos_session', JSON.stringify(session))
  setContext({ agencyId: agency.id, role: 'owner', staffId: null, userName: session.profile.full_name })
  seedAgency(agency.id, session.profile.full_name)
  return session
}

export const authService = {
  mode: dataMode,

  async getSession() {
    // Employees (and demo owners) use a localStorage session.
    const raw = LS?.getItem('stratos_session')
    if (raw) {
      const session = JSON.parse(raw)
      setContext({ agencyId: session.agency?.id, role: session.role, staffId: session.staff_id || null, userName: session.profile?.full_name || session.user?.email || 'User' })
      return session
    }
    // Owners authenticate via real Google OAuth (Supabase) when configured.
    if (authMode === 'supabase' && supabase) {
      try {
        const { data } = await supabase.auth.getSession()
        const user = data?.session?.user
        if (user) {
          const session = await ensureOwnerAgency(user)
          setContext({ agencyId: session.agency.id, role: 'owner', staffId: null, userName: session.profile.full_name })
          return session
        }
      } catch (e) { /* surface via null session */ }
    }
    setContext({ agencyId: null, role: null, staffId: null, userName: 'User' })
    return null
  },

  onAuthStateChange() { return () => {} },

  async ownerSignUp({ email, password, fullName, agencyName }) {
    let agency = readLS('agencies').find((a) => a.owner_email === email)
    if (!agency) {
      agency = { id: uuid(), name: agencyName || 'Your Agency', code: unique6DigitCode(), owner_email: email, owner_name: fullName || 'Owner', owner_password_hash: hashPassword(password), setup_completed: false, created_at: new Date().toISOString() }
      writeLS('agencies', [agency, ...readLS('agencies')])
    }
    const session = { role: 'owner', agency, user: { id: agency.id, email }, profile: { full_name: fullName || 'Owner', agency_name: agency.name, role: 'Owner' } }
    LS?.setItem('stratos_session', JSON.stringify(session))
    setContext({ agencyId: agency.id, role: 'owner', staffId: null, userName: session.profile.full_name })
    seedAgency(agency.id, session.profile.full_name)
    await activityService.log('Logged in', 'Owner', 'Owner account created & signed in')
    return session
  },

  async ownerSignIn({ email, password }) {
    let agency = readLS('agencies').find((a) => a.owner_email === email)
    if (!agency) {
      // demo convenience: create on first sign-in
      return authService.ownerSignUp({ email, password, fullName: email.split('@')[0], agencyName: 'Your Agency' })
    }
    if (agency.owner_password_hash && !verifyPassword(password, agency.owner_password_hash)) {
      throw new Error('Incorrect password for this agency owner.')
    }
    const session = { role: 'owner', agency, user: { id: agency.id, email }, profile: { full_name: agency.owner_name, agency_name: agency.name, role: 'Owner' } }
    LS?.setItem('stratos_session', JSON.stringify(session))
    setContext({ agencyId: agency.id, role: 'owner', staffId: null, userName: agency.owner_name })
    seedAgency(agency.id, agency.owner_name)
    await activityService.log('Logged in', 'Owner', 'Owner signed in')
    return session
  },

  async employeeSignIn({ agencyCode, employeeId, password }) {
    const agency = readLS('agencies').find((a) => a.code === agencyCode)
    if (!agency) throw new Error('Agency code not found.')
    const staff = readLS('staff').find((s) => s.agency_id === agency.id && s.employee_id?.toLowerCase() === employeeId.toLowerCase())
    if (!staff) throw new Error('Employee ID not found in this agency.')
    if (staff.status === 'inactive') throw new Error('This account has been deactivated. Contact your agency owner.')
    if (!verifyPassword(password, staff.password_hash)) throw new Error('Incorrect password.')
    const session = { role: 'employee', agency, staff_id: staff.id, user: { id: staff.id, email: staff.email }, profile: { full_name: staff.full_name, agency_name: agency.name, role: staff.role || 'Staff', employee_id: staff.employee_id, avatar_url: staff.avatar_url } }
    LS?.setItem('stratos_session', JSON.stringify(session))
    setContext({ agencyId: agency.id, role: 'employee', staffId: staff.id, userName: staff.full_name })
    await sessionService.startSession()
    await activityService.log('Logged in', 'Session', `${staff.full_name} logged in`)
    return session
  },

  // Owner Google OAuth (real, via Supabase). Redirects the browser to Google.
  async signInWithGoogle() {
    if (!(authMode === 'supabase' && supabase)) throw new Error('Google sign-in requires Supabase to be configured.')
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, queryParams: { prompt: 'select_account' } } })
    if (error) throw error
    return true
  },

  async signOut() {
    try {
      if (ctx.role === 'employee') { await sessionService.endSession() }
      await activityService.log('Logged out', 'Session', `${ctx.userName} logged out`)
    } catch {}
    LS?.removeItem('stratos_session')
    if (authMode === 'supabase' && supabase) { try { await supabase.auth.signOut() } catch {} }
    setContext({ agencyId: null, role: null, staffId: null, userName: 'User' })
  },

  async resetPassword() { return true },

  async updateProfile(patch) {
    const raw = LS?.getItem('stratos_session')
    const session = raw ? JSON.parse(raw) : { profile: {} }
    session.profile = { ...session.profile, ...patch }
    LS?.setItem('stratos_session', JSON.stringify(session))
    return session.profile
  },

  hashPassword,
}

// ---------------------------------------------------------------------------
// Aggregate stats
// ---------------------------------------------------------------------------
export const statsService = {
  async ownerSummary() {
    const [clients, analyses, reports, projects, staff, tasks] = await Promise.all([
      clientService.list(), analysisService.list(), reportService.list(), projectService.list(), staffService.list(), taskService.list(),
    ])
    const completedTasks = tasks.filter((t) => t.status === 'completed').length
    return {
      clients, analyses, reports, projects, staff, tasks,
      totalClients: clients.length,
      activeAnalyses: analyses.filter((a) => a.status === 'in_progress').length,
      reportsGenerated: reports.length,
      activeProjects: projects.filter((p) => p.status !== 'completed').length,
      totalStaff: staff.length,
      activeStaff: staff.filter((s) => s.online).length,
      totalTasks: tasks.length,
      completedTasks,
      taskCompletion: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    }
  },
  async employeeSummary(staffId) {
    const [projects, tasks] = await Promise.all([projectService.list(), taskService.list()])
    const myTasks = tasks.filter((t) => t.assigned_to === staffId)
    const myProjects = projects.filter((p) => (p.team || []).includes(staffId))
    const completed = myTasks.filter((t) => t.status === 'completed').length
    const pending = myTasks.filter((t) => t.status === 'pending').length
    return {
      myTasks, myProjects,
      assigned: myTasks.length, completed, pending,
      completion: myTasks.length ? Math.round((completed / myTasks.length) * 100) : 0,
    }
  },
}

// ---------------------------------------------------------------------------
// Phase 3: notifications, meetings, owner profile / onboarding
// ---------------------------------------------------------------------------
export const notificationService = {
  ...table('notifications'),
  async forMe() {
    const all = await table('notifications').list()
    const rid = ctx.role === 'employee' ? ctx.staffId : (ctx.agencyId ? `owner_${ctx.agencyId}` : null)
    return all.filter((n) => n.recipient_id === rid || (ctx.role === 'owner' && n.recipient_id === `owner_${ctx.agencyId}`))
  },
  async notify(recipientId, { type, title, message, resource_type, resource_id }) {
    return table('notifications').create({ recipient_id: recipientId, type, title, message, resource_type, resource_id, is_read: false })
  },
  async markAllRead() {
    const mine = await notificationService.forMe()
    for (const n of mine.filter((x) => !x.is_read)) await table('notifications').update(n.id, { is_read: true })
  },
}

let _remindersInFlight = false
export const meetingService = {
  ...table('meetings'),
  async forEmployee(staffId) {
    const all = await table('meetings').list()
    return all.filter((m) => (m.attendees || []).includes(staffId))
  },
  async createMeeting(data) {
    const m = await table('meetings').create({ ...data, status: 'scheduled', created_by: ctx.userName })
    for (const sid of data.attendees || []) {
      await notificationService.notify(sid, { type: 'meeting', title: 'Meeting Scheduled', message: `${data.title} — ${data.meeting_date} at ${data.meeting_time}`, resource_type: 'meeting', resource_id: m.id })
    }
    await activityService.log('Created meeting', data.title, `${(data.attendees || []).length} attendee(s)`)
    return m
  },
  // Client-side reminder engine (no server cron in demo mode): scans meetings and,
  // for any starting within REMINDER_LEAD minutes that hasn't been reminded yet,
  // drops a "Meeting Reminder" notification into each attendee's (and the owner's) bell.
  async generateReminders(leadMinutes = 60) {
    if (_remindersInFlight) return
    _remindersInFlight = true
    try {
      const all = await table('meetings').list()
      const now = Date.now()
      const existing = await table('notifications').list()
      const already = (rid, mid) => existing.some((n) => n.type === 'meeting_reminder' && n.recipient_id === rid && n.resource_id === mid)
      for (const m of all) {
        if (!m || m.status === 'cancelled' || m.reminder_sent) continue
        if (!m.meeting_date || !m.meeting_time) continue
        const start = new Date(`${m.meeting_date}T${m.meeting_time}`).getTime()
        if (isNaN(start)) continue
        const diffMin = Math.round((start - now) / 60000)
        if (diffMin <= 0 || diffMin > leadMinutes) continue
        const when = diffMin <= 1 ? 'is starting now' : `starts in ~${diffMin} min`
        const recipients = new Set([...(m.attendees || [])])
        if (m.agency_id) recipients.add(`owner_${m.agency_id}`)
        for (const rid of recipients) {
          if (already(rid, m.id)) continue
          await notificationService.notify(rid, { type: 'meeting_reminder', title: 'Meeting Reminder', message: `${m.title} ${when} (${m.meeting_time})`, resource_type: 'meeting', resource_id: m.id })
        }
        await table('meetings').update(m.id, { reminder_sent: true })
      }
    } finally { _remindersInFlight = false }
  },
}

// Assign-task notification helper (used by staff mgmt)
export async function notifyTaskAssigned(staffId, task) {
  await notificationService.notify(staffId, { type: 'task', title: 'New Task Assigned', message: `${task.title} has been assigned to you by the Owner.`, resource_type: 'task', resource_id: task.id })
}

// Gap Nudge: notify every employee who works on a client (via that client's
// projects / assigned tasks) that the client is still missing key profile info.
export async function notifyClientGaps(client, missing = []) {
  if (!client || !missing.length) return 0
  const [projects, tasks, existing] = await Promise.all([
    projectService.list(), taskService.list(), table('notifications').list(),
  ])
  const clientProjects = projects.filter((p) => p.client_id === client.id)
  const projIds = new Set(clientProjects.map((p) => p.id))
  const recipients = new Set()
  clientProjects.forEach((p) => (p.team || []).forEach((sid) => sid && recipients.add(sid)))
  tasks.forEach((t) => { if (projIds.has(t.project_id) && t.assigned_to) recipients.add(t.assigned_to) })
  if (!recipients.size) return 0
  const preview = missing.slice(0, 4).join(', ') + (missing.length > 4 ? '…' : '')
  let sent = 0
  for (const rid of recipients) {
    const dupe = existing.some((n) => n.type === 'client_gap' && n.recipient_id === rid && n.resource_id === client.id && !n.is_read)
    if (dupe) continue
    await notificationService.notify(rid, { type: 'client_gap', title: 'Client info needed', message: `${client.business_name} is missing: ${preview}`, resource_type: 'client', resource_id: client.id })
    sent++
  }
  if (sent) await activityService.log('Requested client info', client.business_name, missing.join(', '))
  return sent
}

export const ownerProfileService = {
  async get() { return agencyService.get(ctx.agencyId) },
  async update(patch) {
    const list = readLS('agencies'); const i = list.findIndex((a) => a.id === ctx.agencyId)
    if (i >= 0) { list[i] = { ...list[i], ...patch }; writeLS('agencies', list) }
    // keep session in sync (incl. avatar / owner name)
    const raw = LS?.getItem('stratos_session'); if (raw) { const s = JSON.parse(raw); s.agency = list[i]; if (patch.owner_name) s.profile.full_name = patch.owner_name; if (patch.owner_avatar_url) s.profile.avatar_url = patch.owner_avatar_url; LS.setItem('stratos_session', JSON.stringify(s)) }
    await activityService.log('Updated agency information', 'Agency', patch.name || '')
    return list[i]
  },
  async completeSetup(patch = {}) {
    return ownerProfileService.update({ ...patch, setup_completed: true })
  },
}
