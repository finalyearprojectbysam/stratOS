// Lightweight, dependency-free Markdown → HTML renderer for the Knowledge Base
// reader. Content is authored by trusted agency owners, but we still HTML-escape
// first to avoid injection, then apply a safe subset of Markdown transforms.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inline(s) {
  return s
    // links [text](url)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-300 underline underline-offset-2">$1</a>')
    // bold **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // italic *text* or _text_
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>')
    // inline code `code`
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 text-[12px]">$1</code>')
}

export function mdToHtml(md = '') {
  const src = escapeHtml(md).replace(/\r\n/g, '\n')
  const lines = src.split('\n')
  const out = []
  let listType = null // 'ul' | 'ol'
  const closeList = () => { if (listType) { out.push(`</${listType}>`); listType = null } }

  for (let raw of lines) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) { closeList(); continue }

    // headings
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      closeList()
      const lvl = h[1].length
      const sizes = { 1: 'text-xl font-semibold mt-1', 2: 'text-lg font-semibold mt-2', 3: 'text-base font-semibold mt-2', 4: 'text-sm font-semibold mt-2' }
      out.push(`<h${lvl} class="${sizes[lvl]}">${inline(h[2])}</h${lvl}>`)
      continue
    }
    // blockquote
    if (/^>\s?/.test(line)) {
      closeList()
      out.push(`<blockquote class="border-l-2 border-blue-400/40 pl-3 text-muted-foreground italic">${inline(line.replace(/^>\s?/, ''))}</blockquote>`)
      continue
    }
    // unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)$/)
    if (ul) {
      if (listType !== 'ul') { closeList(); out.push('<ul class="list-disc space-y-1 pl-5">'); listType = 'ul' }
      out.push(`<li>${inline(ul[1])}</li>`)
      continue
    }
    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/)
    if (ol) {
      if (listType !== 'ol') { closeList(); out.push('<ol class="list-decimal space-y-1 pl-5">'); listType = 'ol' }
      out.push(`<li>${inline(ol[1])}</li>`)
      continue
    }
    // horizontal rule
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { closeList(); out.push('<hr class="border-white/10" />'); continue }
    // paragraph
    closeList()
    out.push(`<p>${inline(line)}</p>`)
  }
  closeList()
  return out.join('\n')
}
