'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useApp } from '@/lib/appContext'
import { knowledgeService, activityService, dataMode } from '@/lib/services'
import { generateDocumentPDF } from '@/lib/pdf'
import { GlowCard, PageHeader, EmptyState, CardSkeleton } from './primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { mdToHtml } from '@/lib/markdown'
import { BookOpen, Search, Upload, FileText, Loader2, FolderOpen, Eye, Download, Trash2, FileDown, ExternalLink, Lock, Pencil, Save, X, Sparkles } from 'lucide-react'
import { fmtDate } from '@/lib/format'

const CATEGORIES = ['Marketing Frameworks', 'SEO Guidelines', 'Advertising', 'Branding', 'Agency SOPs', 'Case Studies', 'Templates']

export function KnowledgeBasePage() {
  const { role } = useApp()
  const isOwner = role === 'owner'
  const [docs, setDocs] = useState(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', category: 'Templates', notes: '' })
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [reader, setReader] = useState(null)
  const fileRef = useRef(null)
  const load = () => knowledgeService.list().then(setDocs).catch(() => setDocs([]))
  useEffect(() => { load() }, [])

  const filtered = (docs || []).filter((d) => (cat === 'all' || d.category === cat) && (!q || d.title?.toLowerCase().includes(q.toLowerCase()) || d.description?.toLowerCase().includes(q.toLowerCase())))

  const upload = async () => {
    if (!form.title && !file) { toast.error('Add a title or choose a file'); return }
    setSaving(true)
    try {
      const meta = { ...form, notes_md: form.notes?.trim() || null }
      if (file) await knowledgeService.upload(file, meta)
      else await knowledgeService.create({ title: meta.title, description: meta.description, category: meta.category, notes_md: meta.notes_md, file_url: '#' })
      activityService.log('Uploaded document', form.title || file?.name || 'Document')
      toast.success('Document uploaded'); setOpen(false); setForm({ title: '', description: '', category: 'Templates', notes: '' }); setFile(null); load()
    } catch (e) { toast.error(e?.message || 'Upload failed') } finally { setSaving(false) }
  }

  const remove = async (d) => {
    try { await knowledgeService.remove(d.id); activityService.log('Deleted document', d.title); toast.success('Document deleted'); load() }
    catch (e) { toast.error('Could not delete document') }
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={BookOpen} title="Knowledge Base" subtitle="Central library of frameworks, SOPs and templates for your agency."
        actions={isOwner ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-violet-600 text-white hover:opacity-90"><Upload className="mr-2 h-4 w-4" />Upload Document</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-popover">
              <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Title</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Local SEO Checklist" className="input-dark" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Description</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" className="input-dark" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Category</Label><Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}><SelectTrigger className="input-dark"><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="h-3 w-3 text-violet-300" />Formatted notes <span className="text-muted-foreground/60">(Markdown — # heading, **bold**, - list)</span></Label><Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder={"## Overview\nKey points employees should read...\n\n- Step one\n- Step two"} className="input-dark min-h-[110px] font-mono text-[13px]" /></div>
                <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">File</Label>
                  <button onClick={() => fileRef.current?.click()} className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 text-left text-sm text-muted-foreground hover:border-white/25">
                    <Upload className="h-4 w-4" />{file ? file.name : 'Choose a file to upload'}
                  </button>
                  <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  <p className="text-[11px] text-muted-foreground/70">Text files (.txt, .md, .csv, .json) are previewed in the built-in reader. Any document can be exported as a branded PDF.</p>
                  {dataMode === 'demo' && <p className="text-[11px] text-amber-200/70">Demo mode stores document text &amp; metadata locally. Connect Supabase Storage to persist original binary files.</p>}
                </div>
              </div>
              <DialogFooter><Button onClick={upload} disabled={saving} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Upload</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground"><Eye className="h-3.5 w-3.5" />Read-only access</span>
        )} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search documents..." className="h-10 input-dark pl-9" /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>All</Chip>
        {CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      {docs === null ? <CardSkeleton count={6} className="sm:grid-cols-2 lg:grid-cols-3" /> : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No documents" description={isOwner ? 'Upload frameworks, SOPs and templates to build your knowledge base.' : 'No documents have been shared by your agency owner yet.'} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlowCard className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300"><FileText className="h-5 w-5" /></div>
                  {isOwner && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-300"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent className="border-white/10 bg-popover">
                        <AlertDialogHeader><AlertDialogTitle>Delete document?</AlertDialogTitle><AlertDialogDescription>&ldquo;{d.title}&rdquo; will be permanently removed from the knowledge base.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel className="border-white/15">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(d)} className="bg-red-500/90 text-white hover:bg-red-500">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <h3 className="mt-4 font-display font-semibold">{d.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{d.description || 'No description provided.'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-muted-foreground"><div className="flex items-center gap-1.5"><span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">{d.category}</span>{d.notes_md && <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-violet-200"><Sparkles className="h-3 w-3" />Notes</span>}</div><span>{fmtDate(d.created_at)}</span></div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 flex-1 border-white/15 text-xs" onClick={() => setReader(d)}><Eye className="mr-1.5 h-3.5 w-3.5" />Read</Button>
                  <Button size="sm" variant="outline" className="h-8 flex-1 border-white/15 text-xs" onClick={() => { generateDocumentPDF(d, d.text_content); activityService.log('Downloaded document', d.title) }}><FileDown className="mr-1.5 h-3.5 w-3.5" />PDF</Button>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted-foreground/60">RAG-powered semantic search will be enabled in a future phase.</p>

      <DocumentReader doc={reader} isOwner={isOwner} onClose={() => setReader(null)} onSaved={load} />
    </div>
  )
}

function DocumentReader({ doc, isOwner, onClose, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  useEffect(() => { setEditing(false); setNotes(doc?.notes_md || '') }, [doc])
  if (!doc) return null
  const hasText = !!(doc.text_content && String(doc.text_content).trim())
  const hasFile = doc.file_url && doc.file_url !== '#'
  const isPdf = (doc.mime_type || '').includes('pdf') || /\.pdf$/i.test(doc.file_name || '')
  const hasNotes = !!(doc.notes_md && String(doc.notes_md).trim())

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await knowledgeService.update(doc.id, { notes_md: notes.trim() || null })
      activityService.log('Updated document notes', doc.title)
      toast.success('Notes saved')
      doc.notes_md = notes.trim() || null
      setEditing(false); onSaved && onSaved()
    } catch (e) { toast.error('Could not save notes') } finally { setSavingNotes(false) }
  }

  return (
    <Dialog open={!!doc} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-3xl border-white/10 bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-4 w-4 text-blue-300" />{doc.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">{doc.category}</span>
          <span>{fmtDate(doc.created_at)}</span>
          {doc.file_name && <span className="truncate">· {doc.file_name}</span>}
          {isOwner && !editing && (
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setEditing(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" />{hasNotes ? 'Edit notes' : 'Add notes'}</Button>
          )}
        </div>
        {doc.description && <p className="text-sm text-muted-foreground">{doc.description}</p>}

        <div className="mt-1 max-h-[52vh] space-y-4 overflow-auto rounded-xl border border-white/10 bg-white/[0.02] p-4">
          {editing ? (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Sparkles className="h-3 w-3 text-violet-300" />Formatted notes (Markdown)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-dark min-h-[220px] font-mono text-[13px]" placeholder={"## Overview\n**Key points** for the team...\n\n- First\n- Second"} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setNotes(doc.notes_md || '') }}><X className="mr-1.5 h-4 w-4" />Cancel</Button>
                <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="bg-gradient-to-r from-blue-500 to-violet-600 text-white">{savingNotes ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}Save notes</Button>
              </div>
            </div>
          ) : hasNotes ? (
            <div className="prose-kb space-y-2 text-sm leading-relaxed text-foreground/90 [&_a]:break-words" dangerouslySetInnerHTML={{ __html: mdToHtml(doc.notes_md) }} />
          ) : hasText ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-foreground/90">{doc.text_content}</pre>
          ) : hasFile && isPdf ? (
            <iframe src={doc.file_url} title={doc.title} className="h-[48vh] w-full rounded-md bg-white" />
          ) : (
            <div className="py-8 text-center">
              <Lock className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">No inline preview is available for this file type.</p>
              <p className="text-xs text-muted-foreground/70">{isOwner ? 'Add formatted notes above, or use the PDF export below.' : 'Use the PDF export below, or open the original file if stored.'}</p>
            </div>
          )}
          {/* When notes exist, still let readers see the raw text preview below */}
          {!editing && hasNotes && hasText && (
            <div className="border-t border-white/10 pt-3">
              <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">Original file text</p>
              <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-muted-foreground">{doc.text_content}</pre>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {hasFile ? (
            <Button variant="outline" className="border-white/15" onClick={() => window.open(doc.file_url, '_blank')}><ExternalLink className="mr-2 h-4 w-4" />Open original</Button>
          ) : <span />}
          <Button className="bg-gradient-to-r from-blue-500 to-violet-600 text-white" onClick={() => { generateDocumentPDF(doc, doc.notes_md || doc.text_content); activityService.log('Downloaded document', doc.title) }}><Download className="mr-2 h-4 w-4" />Download PDF</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Chip({ active, children, ...props }) {
  return <button {...props} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition', active ? 'border-blue-500/50 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20')}>{children}</button>
}
