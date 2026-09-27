'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Toaster } from 'sonner'
import { AppContext, useHashRoute } from '@/lib/appContext'
import { authService } from '@/lib/services'
import { AppShell } from '@/components/stratos/shell'
import { AuthPage } from '@/components/stratos/auth'
import { DashboardPage } from '@/components/stratos/dashboard'
import { ClientsPage, ClientDetailPage } from '@/components/stratos/clients'
import { AddClientPage } from '@/components/stratos/addclient'
import { AnalysisPage, AnalysisHistoryPage } from '@/components/stratos/analysis'
import { ReportsPage, FinalReportPage } from '@/components/stratos/reports'
import { ProjectsPage, ProjectDetailPage } from '@/components/stratos/projects'
import { TasksPage } from '@/components/stratos/tasks'
import { TeamPage } from '@/components/stratos/team'
import { ActivityLogPage } from '@/components/stratos/activity'
import { KnowledgeBasePage } from '@/components/stratos/knowledge'
import { SettingsPage } from '@/components/stratos/settings'
import { MeetingsPage, SocialMediaPage, MyProfilePage, OnboardingWizard } from '@/components/stratos/phase3'
import { BrandMark } from '@/components/stratos/primitives'

// Routes employees may NOT access (owner-only). Enforced here + hidden in nav + RLS-ready.
const OWNER_ONLY_PREFIXES = ['/activity-log', '/team', '/clients', '/analysis', '/analysis-history']

function Router({ segments }) {
  const [a, b, c] = segments
  switch (a) {
    case undefined:
    case 'dashboard': return <DashboardPage />
    case 'clients':
      if (!b) return <ClientsPage />
      if (b === 'new') return <AddClientPage />
      if (c === 'edit') return <AddClientPage editId={b} />
      return <ClientDetailPage clientId={b} />
    case 'analysis': return b ? <AnalysisPage analysisId={b} /> : <AnalysisHistoryPage />
    case 'analysis-history': return <AnalysisHistoryPage />
    case 'reports': return b ? <FinalReportPage reportId={b} /> : <ReportsPage />
    case 'projects': return b ? <ProjectDetailPage projectId={b} /> : <ProjectsPage />
    case 'tasks': return <TasksPage />
    case 'team': return <TeamPage />
    case 'activity-log': return <ActivityLogPage />
    case 'knowledge-base': return <KnowledgeBasePage />
    case 'meetings': return <MeetingsPage />
    case 'social-media': return <SocialMediaPage />
    case 'my-profile': return <MyProfilePage />
    case 'settings': return <SettingsPage />
    default: return <DashboardPage />
  }
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-radial-glow">
      <div className="flex flex-col items-center gap-4"><BrandMark size={48} /><div className="h-1 w-40 overflow-hidden rounded-full bg-white/10"><div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-violet-500" /></div></div>
    </div>
  )
}

function App() {
  const { path, segments, navigate } = useHashRoute()
  const [session, setSession] = useState(undefined)

  const refreshSession = useCallback(async () => { const s = await authService.getSession(); setSession(s || null); return s }, [])

  useEffect(() => { refreshSession() }, [refreshSession])
  useEffect(() => { if (!window.location.hash) navigate('/dashboard') }, []) // eslint-disable-line

  const role = session?.role || null

  // Employee route guard
  useEffect(() => {
    if (role === 'employee' && OWNER_ONLY_PREFIXES.some((p) => path.startsWith(p))) navigate('/dashboard')
  }, [role, path, navigate])

  const signOut = useCallback(async () => { await authService.signOut(); setSession(null); navigate('/dashboard') }, [navigate])

  const ctx = useMemo(() => ({
    user: session?.user || null,
    profile: session?.profile || null,
    agency: session?.agency || null,
    role,
    userName: session?.profile?.full_name || 'User',
    path, navigate, refreshSession,
    ownerSignIn: authService.ownerSignIn,
    ownerSignUp: authService.ownerSignUp,
    employeeSignIn: authService.employeeSignIn,
    resetPassword: authService.resetPassword,
    signInWithGoogle: authService.signInWithGoogle,
    signOut,
  }), [session, role, path, navigate, refreshSession, signOut])

  if (session === undefined) return <Splash />

  const needsOnboarding = session && role === 'owner' && session.agency && session.agency.setup_completed === false

  return (
    <AppContext.Provider value={ctx}>
      <Toaster theme="dark" position="top-right" richColors closeButton />
      {!session ? <AuthPage /> : needsOnboarding ? <OnboardingWizard /> : <AppShell><Router segments={segments} /></AppShell>}
    </AppContext.Provider>
  )
}

export default App
