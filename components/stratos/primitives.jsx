'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUpRight, ArrowDownRight, AlertTriangle, Inbox } from 'lucide-react'

// ---- Status metadata -------------------------------------------------------
export const STATUS_META = {
  completed: { label: 'Completed', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'bg-emerald-500/10 border-emerald-500/25' },
  ready: { label: 'Ready', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'bg-emerald-500/10 border-emerald-500/25' },
  active: { label: 'Active', dot: 'bg-emerald-400', text: 'text-emerald-300', ring: 'bg-emerald-500/10 border-emerald-500/25' },
  in_progress: { label: 'In Progress', dot: 'bg-blue-400', text: 'text-blue-300', ring: 'bg-blue-500/10 border-blue-500/25' },
  review: { label: 'Review', dot: 'bg-violet-400', text: 'text-violet-300', ring: 'bg-violet-500/10 border-violet-500/25' },
  planning: { label: 'Planning', dot: 'bg-cyan-400', text: 'text-cyan-300', ring: 'bg-cyan-500/10 border-cyan-500/25' },
  pending: { label: 'Pending', dot: 'bg-amber-400', text: 'text-amber-300', ring: 'bg-amber-500/10 border-amber-500/25' },
  invited: { label: 'Invited', dot: 'bg-amber-400', text: 'text-amber-300', ring: 'bg-amber-500/10 border-amber-500/25' },
  draft: { label: 'Draft', dot: 'bg-slate-400', text: 'text-slate-300', ring: 'bg-slate-500/10 border-slate-500/25' },
  failed: { label: 'Failed', dot: 'bg-red-400', text: 'text-red-300', ring: 'bg-red-500/10 border-red-500/25' },
}

export function StatusPill({ status, className }) {
  const m = STATUS_META[status] || STATUS_META.draft
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', m.ring, m.text, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

// ---- Page header -----------------------------------------------------------
export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

// ---- Glow / surface card ---------------------------------------------------
export function GlowCard({ className, children, hover = true, ...props }) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl border-white/10 bg-card/60 backdrop-blur-sm transition-all duration-300',
        hover && 'hover:border-white/20 hover:shadow-[0_8px_40px_-16px_rgba(59,130,246,0.45)]',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

// ---- Stat card -------------------------------------------------------------
export function StatCard({ label, value, icon: Icon, trend, trendUp = true, hint, accent = 'blue', index = 0 }) {
  const accents = {
    blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
    violet: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    cyan: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  }
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <GlowCard className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl border', accents[accent])}>
            {Icon && <Icon className="h-5 w-5" />}
          </div>
          {trend && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', trendUp ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300')}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <div className="font-display text-3xl font-semibold tracking-tight">{value}</div>
          <div className="mt-1 text-sm text-muted-foreground">{label}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground/70">{hint}</div>}
        </div>
      </GlowCard>
    </motion.div>
  )
}

// ---- Empty / error / loading ----------------------------------------------
export function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {onRetry && <Button variant="outline" className="mt-4 border-white/15" onClick={onRetry}>Retry</Button>}
    </div>
  )
}

export function CardSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/10 bg-card/50 p-5">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="mt-4 h-7 w-20" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
      ))}
    </div>
  )
}

export function RowSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ---- Brand mark ------------------------------------------------------------
export function BrandMark({ size = 36, withText = true, collapsed = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-[0_0_24px_-6px_rgba(59,130,246,0.7)]"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 2 7l10 5 10-5-10-5Z" />
          <path d="m2 17 10 5 10-5" />
          <path d="m2 12 10 5 10-5" />
        </svg>
      </div>
      {withText && !collapsed && (
        <div className="leading-none">
          <div className="font-display text-sm font-bold tracking-wide">MARCA STRATOS</div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">AI Marketing Intelligence</div>
        </div>
      )}
    </div>
  )
}
