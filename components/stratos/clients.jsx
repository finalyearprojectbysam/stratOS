'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { clientService, analysisService, notifyClientGaps } from '@/lib/services'
import { GlowCard, StatusPill, PageHeader, EmptyState, RowSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Users, Search, Plus, MoreHorizontal, Eye, Pencil, Trash2, Sparkles, Globe, MapPin, Building2,
  Instagram, Facebook, ArrowLeft, Loader2, Target as TargetIcon, AlertTriangle, CheckCircle2, Bell,
} from 'lucide-react'
import { fmtRelative, fmtDate } from '@/lib/format'

// Phase 3: fields the AI agents rely on — flag which are missing so the team knows
// exactly what client data to collect.
const IMPORTANT_FIELDS = [
  ['industry', 'Industry'], ['target_location', 'Location'], ['website_url', 'Website'],
  ['google_business_url', 'Google Business'], ['instagram_url', 'Instagram'], ['facebook_url', 'Facebook'],
  ['business_description', 'Description'], ['target_audience', 'Target Audience'],
  ['business_goals', 'Goals'], ['current_channels', 'Channels'],
]
export function missingClientFields(c) {
  return IMPORTANT_FIELDS.filter(([k]) => {
    const v = c?.[k]
    return Array.isArray(v) ? v.length === 0 : (v == null || String(v).trim() === '')
  }).map(([, label]) => label)
}

// ---- Clients list ----------------------------------------------------------
export function ClientsPage() {
  const { navigate } = useApp()
  const [clients, setClients] = useState(null)
  const [q, setQ] = useState('')
  const [industry, setIndustry] = useState('all')
  const [status, setStatus] = useState('all')
  const [toDelete, setToDelete] = useState(null)

  const load = () => clientService.list().then(setClients).catch(() => setClients([]))
  useEffect(() => { load() }, [])

  const industries = Array.from(new Set((clients || []).map((c) => c.industry).filter(Boolean)))
  const filtered = (clients || []).filter((c) => {
    if (q && !c.business_name?.toLowerCase().includes(q.toLowerCase())) return false
    if (industry !== 'all' && c.industry !== industry) return false
    if (status !== 'all' && c.status !== status) return false
    return true
  })

  const del = async () => {
    try { await clientService.remove(toDelete.id); toast.success('Client deleted'); setToDelete(null); load() }
    catch (e) { toast.error('Could not delete client') }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Users} title="Clients" subtitle="Manage your agency clients and their AI analysis projects."
        actions={<Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><Plus className="mr-2 h-4 w-4" />Add New Client</Button>} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients..." className="h-10 border-white/10 bg-white/[0.03] pl-9" />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="h-10 w-full border-white/10 bg-white/[0.03] sm:w-40"><SelectValue placeholder="Industry" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All industries</SelectItem>{industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-full border-white/10 bg-white/[0.03] sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem><SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <GlowCard hover={false} className="p-0">
        {clients === null ? <div className="p-6"><RowSkeleton rows={5} /></div> : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={Users} title={clients.length === 0 ? 'No clients yet' : 'No matches'} description={clients.length === 0 ? 'Start by adding your first client and launch an AI analysis.' : 'Try adjusting your search or filters.'}
            action={clients.length === 0 ? <Button onClick={() => navigate('/clients/new')} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white"><Plus className="mr-2 h-4 w-4" />Add Your First Client</Button> : null} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Client</th><th className="hidden px-6 py-3 font-medium sm:table-cell">Industry</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Location</th><th className="hidden px-6 py-3 font-medium lg:table-cell">Website</th>
                  <th className="px-6 py-3 font-medium">Status</th><th className="hidden px-6 py-3 font-medium md:table-cell">Last Analysis</th><th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const gaps = missingClientFields(c)
                  return (
                  <tr key={c.id} className="border-b border-white/5 transition hover:bg-white/[0.02]">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/clients/${c.id}`)} className="font-medium hover:text-primary">{c.business_name}</button>
                        {gaps.length > 0 && (
                          <span title={`Missing: ${gaps.join(', ')}`} className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                            <AlertTriangle className="h-3 w-3" />{gaps.length} missing
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground sm:table-cell">{c.industry || '—'}</td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground md:table-cell">{c.target_location || '—'}</td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground lg:table-cell">{c.website_url ? <a href={c.website_url} target="_blank" rel="noreferrer" className="hover:text-primary">{c.website_url.replace(/^https?:\/\//, '')}</a> : '—'}</td>
                    <td className="px-6 py-3.5"><StatusPill status={c.status} /></td>
                    <td className="hidden px-6 py-3.5 text-muted-foreground md:table-cell">{fmtRelative(c.updated_at || c.created_at)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border-white/10 bg-popover">
                          <DropdownMenuItem onClick={() => navigate(`/clients/${c.id}`)}><Eye className="mr-2 h-4 w-4" />View</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/clients/${c.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setToDelete(c)} className="text-red-300 focus:text-red-300"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlowCard>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="border-white/10 bg-popover">
          <AlertDialogHeader><AlertDialogTitle>Delete client?</AlertDialogTitle><AlertDialogDescription>This will permanently remove <span className="font-medium text-foreground">{toDelete?.business_name}</span> and cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="border-white/15">Cancel</AlertDialogCancel><AlertDialogAction onClick={del} className="bg-red-500 text-white hover:bg-red-600">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---- Client detail ---------------------------------------------------------
export function ClientDetailPage({ clientId }) {
  const { navigate } = useApp()
  const [client, setClient] = useState(undefined)
  const [starting, setStarting] = useState(false)

  useEffect(() => { clientService.get(clientId).then(setClient).catch(() => setClient(null)) }, [clientId])

  const startAnalysis = async () => {
    setStarting(true)
    try {
      const analysis = await analysisService.create({ client_id: client.id, client_name: client.business_name, status: 'in_progress', started_at: new Date().toISOString(), agents_used: 0 })
      await clientService.update(client.id, { status: 'in_progress' })
      toast.success('AI analysis started')
      navigate(`/analysis/${analysis.id}`)
    } catch (e) { toast.error('Could not start analysis'); setStarting(false) }
  }

  if (client === undefined) return <div className="space-y-4"><RowSkeleton rows={2} /><RowSkeleton rows={4} /></div>
  if (client === null) return <EmptyState icon={Users} title="Client not found" description="This client may have been removed." action={<Button onClick={() => navigate('/clients')} variant="outline" className="border-white/15">Back to Clients</Button>} />

  const info = [
    { icon: Building2, label: 'Industry', value: client.industry },
    { icon: MapPin, label: 'Target Location', value: client.target_location },
    { icon: Globe, label: 'Website', value: client.website_url, link: true },
    { icon: Instagram, label: 'Instagram', value: client.instagram_url, link: true },
    { icon: Facebook, label: 'Facebook', value: client.facebook_url, link: true },
    { icon: TargetIcon, label: 'Target Audience', value: client.target_audience },
  ]

  const gaps = missingClientFields(client)

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/clients')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Clients</button>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 text-lg font-semibold text-white">{client.business_name?.[0]}</div>
          <div>
            <h1 className="font-display text-2xl font-semibold">{client.business_name}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><StatusPill status={client.status} /><span>• Added {fmtDate(client.created_at)}</span></div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-white/15" onClick={() => navigate(`/clients/${client.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          <Button disabled={starting} onClick={startAnalysis} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90">{starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}Start AI Analysis</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {info.filter((i) => i.value).map((i) => (
          <GlowCard key={i.label} className="p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><i.icon className="h-3.5 w-3.5" />{i.label}</div>
            <div className="mt-1.5 truncate text-sm font-medium">{i.link ? <a href={i.value} target="_blank" rel="noreferrer" className="text-primary hover:underline">{i.value}</a> : i.value}</div></GlowCard>
        ))}
      </div>

      {gaps.length > 0 ? (
        <GlowCard hover={false} className="border-amber-500/25 bg-amber-500/[0.04] p-5">
          <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-300" /><h3 className="font-display font-semibold text-amber-100">Missing information ({gaps.length})</h3></div>
          <p className="mt-1 text-sm text-amber-100/70">Collect these details to give the AI agents a complete picture for a stronger analysis.</p>
          <div className="mt-3 flex flex-wrap gap-2">{gaps.map((g) => <span key={g} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">{g}</span>)}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="border-amber-500/30 text-amber-200 hover:bg-amber-500/10" onClick={() => navigate(`/clients/${client.id}/edit`)}><Pencil className="mr-2 h-4 w-4" />Complete profile</Button>
            <Button variant="ghost" className="text-amber-200 hover:bg-amber-500/10" onClick={async () => { const n = await notifyClientGaps(client, gaps); if (n) toast.success(`Nudged ${n} team member${n > 1 ? 's' : ''} to help collect the missing info`); else toast('No employees are assigned to this client yet') }}><Bell className="mr-2 h-4 w-4" />Notify assigned team</Button>
          </div>
        </GlowCard>
      ) : (
        <GlowCard hover={false} className="border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" />Complete profile — all key fields captured for AI analysis.</div>
        </GlowCard>
      )}

      {client.business_description && <GlowCard hover={false} className="p-5"><h3 className="font-display font-semibold">Business Description</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{client.business_description}</p></GlowCard>}

      {client.business_goals?.length > 0 && (
        <GlowCard hover={false} className="p-5"><h3 className="font-display font-semibold">Business Goals</h3>
          <div className="mt-3 flex flex-wrap gap-2">{client.business_goals.map((g) => <span key={g} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs">{g}</span>)}</div></GlowCard>
      )}
    </div>
  )
}
