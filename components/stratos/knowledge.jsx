'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { knowledgeService, dataMode } from '@/lib/services'
import { GlowCard, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { BookOpen, Search, Upload, FileText, Loader2, FolderOpen } from 'lucide-react'
import { fmtDate } from '@/lib/format'

const CATEGORIES = ['Marketing Frameworks', 'SEO Guidelines', 'Advertising', 'Branding', 'Agency SOPs', 'Case Studies', 'Templates']

export function KnowledgeBasePage() {
  const [docs, setDocs] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Templates' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)
  const load = () => knowledgeService.list().then(setDocs).catch(() => setDocs([]))
  useEffect(() => { load() }, [])

  const filtered = (docs || []).filter((d) => (cat === 'all' || d.category === cat) && (!q || d.title?.toLowerCase().includes(q.toLowerCase())))

  const upload = async () => {
    if (!form.title && !file) { toast.error('Add a title or choose a file'); return }
    setSaving(true)
    try {
      if (file) await knowledgeService.upload(file, form)
      else await knowledgeService.create({ ...form, file_url: '#' })
      toast.success('Document uploaded'); setOpen(false); setForm({ title: '', description: '', category: 'Templates' }); setFile(null); load()
    } catch (e) { toast.error(e?.message || 'Upload failed') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="Knowledge Base" subtitle="Central library of frameworks, SOPs and templates for your agency."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><Upload className="mr-2 h-4 w-4" />Upload Document</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-popover">
              <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Local SEO Checklist" className="input-dark" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Description</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" className="input-dark" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Category</Label><Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">File</Label>
                  <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-left text-sm text-muted-foreground hover:border-white/25">
                    <Upload className="h-4 w-4" />{file ? file.name : 'Choose a file to upload'}
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {dataMode === 'demo' && <p className="text-[11px] text-amber-200/70">Demo mode stores metadata only. Connect Supabase Storage to store real files.</p>}
                </div>
              </div>
              <DialogFooter><Button onClick={upload} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        } />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents..." className="h-10 input-dark pl-9" /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>All</Chip>
        {CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      {docs === null ? <CardSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" /> : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents" description="Upload frameworks, SOPs and templates to build your knowledge base." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard className="flex h-full flex-col p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300"><FileText className="h-5 w-5" /></div>
                <h3 className="mt-4 font-display font-semibold">{d.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{d.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-foreground"><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">{d.category}</span><span>{fmtDate(d.created_at)}</span></div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground/60">RAG-powered semantic search will be enabled in a future phase.</p>
    </div>
  )
}

function Chip({ active, children, ...props }) {
  return <button {...props} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition', active ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20')}>{children}</button>
}
