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
import { TeamPage } from '@/components/stratos/team'
import { KnowledgeBasePage } from '@/components/stratos/knowledge'
import { SettingsPage } from '@/components/stratos/settings'
import { BrandMark } from '@/components/stratos/primitives'

// ---- Route resolver --------------------------------------------------------
function Router({ segments }) {
  const [a, b, c] = segments
  switch (a) {
    case undefined:
    case 'dashboard':
      return <DashboardPage />
    case 'clients':
      if (!b) return <ClientsPage />
      if (b === 'new') return <AddClientPage />
      if (c === 'edit') return <AddClientPage editId={b} />
      return <ClientDetailPage clientId={b} />
    case 'analysis':
      if (b) return <AnalysisPage analysisId={b} />
      return <AnalysisHistoryPage />
    case 'analysis-history':
      return <AnalysisHistoryPage />
    case 'reports':
      return b ? <FinalReportPage reportId={b} /> : <ReportsPage />
    case 'projects':
      return b ? <ProjectDetailPage projectId={b} /> : <ProjectsPage />
    case 'team':
      return <TeamPage />
    case 'knowledge-base':
      return <KnowledgeBasePage />
    case 'settings':
      return <SettingsPage />
    default:
      return <DashboardPage />
  }
}

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-radial-glow">
      <div className="flex flex-col items-center gap-4">
        <BrandMark size={48} />
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-violet-500" />
        </div>
      </div>
    </div>
  )
}

function App() {
  const { path, segments, navigate } = useHashRoute()
  const [session, setSession] = useState(undefined) // undefined = loading, null = logged out

  const refreshSession = useCallback(async () => {
    const s = await authService.getSession()
    setSession(s || null)
    return s
  }, [])

  useEffect(() => {
    refreshSession()
    const unsub = authService.onAuthStateChange(() => refreshSession())
    return () => unsub?.()
  }, [refreshSession])

  useEffect(() => {
    if (!window.location.hash) navigate('/dashboard')
  }, []) // eslint-disable-line

  const signOut = useCallback(async () => {
    await authService.signOut()
    setSession(null)
    navigate('/dashboard')
  }, [navigate])

  const ctx = useMemo(() => ({
    user: session?.user || null,
    profile: session?.profile || null,
    path, navigate,
    refreshSession,
    signIn: authService.signIn,
    signUp: authService.signUp,
    resetPassword: authService.resetPassword,
    signOut,
  }), [session, path, navigate, refreshSession, signOut])

  if (session === undefined) return <Splash />

  return (
    <AppContext.Provider value={ctx}>
      <Toaster theme="dark" position="top-right" richColors closeButton />
      {!session ? (
        <AuthPage />
      ) : (
        <AppShell>
          <Router segments={segments} />
        </AppShell>
      )}
    </AppContext.Provider>
  )
}

export default App
