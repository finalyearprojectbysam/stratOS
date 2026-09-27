'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/appContext'
import { sessionService } from '@/lib/services'
import { BrandMark } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard, Users, Sparkles, History, FileText, FolderKanban, UsersRound,
  BookOpen, Settings, PanelLeftClose, PanelLeft, Search, Bell, LogOut, ChevronDown, Menu, ScrollText, ClipboardList,
} from 'lucide-react'
import { initials } from '@/lib/format'
import { NotificationsBell } from './phase3'
import { Video, Rocket, UserCircle, ClipboardList as ClipIcon } from 'lucide-react'

const NAV_OWNER = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Clients', icon: Users, to: '/clients' },
  { label: 'New Analysis', icon: Sparkles, to: '/clients/new' },
  { label: 'Analysis History', icon: History, to: '/analysis-history' },
  { label: 'Reports', icon: FileText, to: '/reports' },
  { label: 'Projects', icon: FolderKanban, to: '/projects' },
  { label: 'Team / Staff', icon: UsersRound, to: '/team' },
  { label: 'Meetings', icon: Video, to: '/meetings' },
  { label: 'Knowledge Base', icon: BookOpen, to: '/knowledge-base' },
  { label: 'Activity Log', icon: ScrollText, to: '/activity-log' },
  { label: 'Social Media', icon: Rocket, to: '/social-media' },
  { label: 'My Profile', icon: UserCircle, to: '/my-profile' },
  { label: 'Settings', icon: Settings, to: '/settings' },
]
const NAV_EMPLOYEE = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'My Projects', icon: FolderKanban, to: '/projects' },
  { label: 'My Tasks', icon: ClipboardList, to: '/tasks' },
  { label: 'Reports', icon: FileText, to: '/reports' },
  { label: 'Knowledge Base', icon: BookOpen, to: '/knowledge-base' },
  { label: 'My Profile', icon: UserCircle, to: '/my-profile' },
]

function NavList({ collapsed, onNavigate }) {
  const { path, navigate, role } = useApp()
  const nav = role === 'employee' ? NAV_EMPLOYEE : NAV_OWNER
  const isActive = (to) => path === to || (to !== '/dashboard' && path.startsWith(to))
  return (
    <nav className="flex-1 space-y-1 px-3">
      {nav.map((item) => {
        const active = isActive(item.to)
        return (
          <button key={item.to} onClick={() => { navigate(item.to); onNavigate?.() }}
            className={cn('group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              active ? 'bg-white/[0.06] text-foreground' : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
              collapsed && 'justify-center px-0')} title={collapsed ? item.label : undefined}>
            {active && <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r bg-gradient-to-b from-blue-400 to-violet-500" />}
            <item.icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-primary')} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}

function UserFooter({ collapsed }) {
  const { user, profile, role, signOut, navigate } = useApp()
  const name = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const sub = role === 'employee' ? (profile?.employee_id || 'Employee') : (profile?.agency_name || 'Your Agency')
  if (collapsed) {
    return <div className="flex justify-center px-3 py-3"><Avatar className="h-9 w-9 border border-white/10"><AvatarImage src={profile?.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-xs text-white">{initials(name)}</AvatarFallback></Avatar></div>
  }
  return (
    <div className="px-3 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:bg-white/[0.06]">
            <Avatar className="h-9 w-9 border border-white/10"><AvatarImage src={profile?.avatar_url} /><AvatarFallback className="bg-gradient-to-br from-blue-500 to-violet-600 text-xs text-white">{initials(name)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{name}</div><div className="truncate text-xs text-muted-foreground">{sub}</div></div>
            <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase', role === 'employee' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-violet-500/15 text-violet-300')}>{role === 'employee' ? 'Staff' : 'Owner'}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 border-white/10 bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer"><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
          <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-300 focus:text-red-300"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function SidebarInner({ collapsed, setCollapsed, onNavigate, showCollapse = true }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className={cn('flex items-center gap-2 px-4 py-4', collapsed ? 'justify-center' : 'justify-between')}>
        <BrandMark collapsed={collapsed} />
        {showCollapse && !collapsed && <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setCollapsed(true)}><PanelLeftClose className="h-4 w-4" /></Button>}
      </div>
      {showCollapse && collapsed && <div className="flex justify-center pb-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setCollapsed(false)}><PanelLeft className="h-4 w-4" /></Button></div>}
      <div className="mt-2 flex-1 overflow-y-auto no-scrollbar"><NavList collapsed={collapsed} onNavigate={onNavigate} /></div>
      <div className="border-t border-white/10"><UserFooter collapsed={collapsed} /></div>
    </div>
  )
}

function Topbar({ onOpenMobile }) {
  const { navigate, role } = useApp()
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/10 bg-background/70 px-4 backdrop-blur-xl sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile}><Menu className="h-5 w-5" /></Button>
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search clients, projects, reports..." className="h-9 border-white/10 bg-white/[0.03] pl-9 focus-visible:ring-primary/40" />
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <NotificationsBell />
        {role !== 'employee' && <Button onClick={() => navigate('/clients/new')} className="hidden bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90 sm:inline-flex"><Sparkles className="mr-2 h-4 w-4" /> New Analysis</Button>}
      </div>
    </header>
  )
}

export function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { role } = useApp()

  // Online-time heartbeat for employees
  useEffect(() => {
    if (role !== 'employee') return
    const iv = setInterval(() => { sessionService.heartbeat(30) }, 30000)
    return () => clearInterval(iv)
  }, [role])

  return (
    <div className="min-h-screen bg-background bg-radial-glow">
      <div className="flex">
        <aside className={cn('sticky top-0 hidden h-screen shrink-0 border-r border-white/10 transition-all duration-300 lg:block', collapsed ? 'w-[76px]' : 'w-[264px]')}>
          <SidebarInner collapsed={collapsed} setCollapsed={setCollapsed} />
        </aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] border-white/10 bg-sidebar p-0">
            <SidebarInner collapsed={false} setCollapsed={() => {}} showCollapse={false} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex min-h-screen w-full min-w-0 flex-col">
          <Topbar onOpenMobile={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto w-full max-w-7xl">{children}</div></main>
        </div>
      </div>
    </div>
  )
}
