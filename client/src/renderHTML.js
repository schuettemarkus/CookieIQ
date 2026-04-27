export default function renderRichHTML(text) {
  const escape = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  const lines = text.split('\n');
  const out = [];
  let inList = false;
  let listType = null;
  let inBlockquote = false;

  const closeList = () => {
    if (inList) { out.push(listType === 'ol' ? '</ol>' : '</ul>'); inList = false; listType = null; }
  };
  const closeBlockquote = () => {
    if (inBlockquote) { out.push('</blockquote>'); inBlockquote = false; }
  };

  const inlineFmt = (s) => {
    return escape(s)
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-stone-100 font-mono text-xs text-stone-800">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Headings
    if (/^####\s/.test(line)) { closeList(); closeBlockquote(); out.push(`<h4 class="text-sm font-semibold text-stone-800 mt-4 mb-1.5">${inlineFmt(line.replace(/^####\s*/, ''))}</h4>`); continue; }
    if (/^###\s/.test(line)) { closeList(); closeBlockquote(); out.push(`<h3 class="text-base font-semibold text-stone-900 mt-5 mb-2">${inlineFmt(line.replace(/^###\s*/, ''))}</h3>`); continue; }
    if (/^##\s/.test(line)) { closeList(); closeBlockquote(); out.push(`<h2 class="text-lg font-semibold text-stone-900 mt-6 mb-2">${inlineFmt(line.replace(/^##\s*/, ''))}</h2>`); continue; }
    if (/^#\s/.test(line)) { closeList(); closeBlockquote(); out.push(`<h2 class="text-xl font-bold text-stone-900 mt-6 mb-3">${inlineFmt(line.replace(/^#\s*/, ''))}</h2>`); continue; }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { closeList(); closeBlockquote(); out.push('<hr class="my-5 border-stone-200"/>'); continue; }

    // Blockquote
    if (/^>\s?/.test(line)) {
      closeList();
      if (!inBlockquote) { out.push('<blockquote class="border-l-4 border-blue-300 pl-4 py-1 my-3 text-stone-600 italic">'); inBlockquote = true; }
      out.push(`<p>${inlineFmt(line.replace(/^>\s?/, ''))}</p>`);
      continue;
    } else { closeBlockquote(); }

    // Ordered list
    if (/^\d+[\.\)]\s/.test(line)) {
      if (!inList || listType !== 'ol') { closeList(); out.push('<ol class="list-decimal ml-6 my-3 space-y-1.5 text-stone-700">'); inList = true; listType = 'ol'; }
      out.push(`<li class="leading-relaxed">${inlineFmt(line.replace(/^\d+[\.\)]\s*/, ''))}</li>`);
      continue;
    }

    // Unordered list
    if (/^[\-\*]\s/.test(line)) {
      if (!inList || listType !== 'ul') { closeList(); out.push('<ul class="list-disc ml-6 my-3 space-y-1.5 text-stone-700">'); inList = true; listType = 'ul'; }
      out.push(`<li class="leading-relaxed">${inlineFmt(line.replace(/^[\-\*]\s*/, ''))}</li>`);
      continue;
    }

    closeList();

    // Empty line
    if (!line.trim()) { out.push('<div class="h-2"></div>'); continue; }

    // Regular paragraph
    out.push(`<p class="text-stone-700 leading-relaxed my-1.5">${inlineFmt(line)}</p>`);
  }

  closeList();
  closeBlockquote();
  return out.join('\n');
}
