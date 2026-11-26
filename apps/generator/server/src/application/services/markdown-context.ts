const DOCUMENT_MARKER = /^<!-- DOCUMENT: ([^\n]+) -->\n/gm;

export interface MarkdownSource {
  path: string;
  content: string;
}

/** Explicit exclusions apply to document paths and Markdown headings, never to prose. */
export function allowedMarkdownSources(bundle: string, excludedTerms: readonly string[]): MarkdownSource[] {
  const normalized = bundle.replace(/\r\n/g, "\n");
  const markers = [...normalized.matchAll(DOCUMENT_MARKER)];
  const sources = markers.length
    ? markers.map((marker, index) => ({
        path: marker[1]?.trim() || `document-${index + 1}.md`,
        content: normalized.slice((marker.index ?? 0) + marker[0].length, markers[index + 1]?.index ?? normalized.length)
      }))
    : normalized.trim() ? [{ path: "README.md", content: normalized }] : [];
  const terms = excludedTerms.map((term) => term.trim().toLocaleLowerCase()).filter(Boolean);
  return sources
    .filter(({ path }) => !terms.some((term) => path.toLocaleLowerCase().includes(term)))
    .map(({ path, content }) => ({ path, content: removeExcludedSections(content, terms) }))
    .filter(({ content }) => content.trim().length > 0);
}

function removeExcludedSections(content: string, terms: readonly string[]): string {
  if (!terms.length) return content;
  const lines = content.split("\n");
  let excludedLevel = 0;
  let fence: string | null = null;
  const kept: string[] = [];
  for (const line of lines) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1]!;
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
    }
    const heading = fence ? null : /^(#{1,6})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1]!.length;
      if (excludedLevel && level <= excludedLevel) excludedLevel = 0;
      if (!excludedLevel && terms.some((term) => heading[2]!.toLocaleLowerCase().includes(term))) {
        excludedLevel = level;
      }
    }
    if (!excludedLevel) kept.push(line);
  }
  return kept.join("\n");
}

/** Split without dropping words or paragraphs; every retained character appears in one chunk. */
export function splitMarkdownSources(sources: readonly MarkdownSource[], maxCharacters: number): string[] {
  if (maxCharacters < 100) throw new Error("Markdown chunk budget is too small.");
  const chunks: string[] = [];
  for (const source of sources) {
    const label = `DOCUMENT: ${source.path}\n`;
    const payloadSize = maxCharacters - label.length - 24;
    if (payloadSize < 20) throw new Error(`Markdown document path is too long: ${source.path}`);
    let offset = 0;
    let part = 1;
    while (offset < source.content.length) {
      const remaining = source.content.slice(offset);
      let length = Math.min(payloadSize, remaining.length);
      if (length < remaining.length) {
        const boundary = remaining.slice(0, length).lastIndexOf(" ");
        if (boundary > length / 2) length = boundary + 1;
      }
      chunks.push(`${label}PART: ${part}\n${remaining.slice(0, length)}`);
      offset += length;
      part += 1;
    }
  }
  return chunks;
}
