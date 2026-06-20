export interface TextChunk {
  content: string;
  index: number;
  pageNumber?: number;
  sectionTitle?: string;
}

export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number,
): TextChunk[] {
  const words = text.split(/\s+/);
  const chunks: TextChunk[] = [];
  let index = 0;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const slice = words.slice(i, i + chunkSize);
    if (slice.length === 0) break;
    chunks.push({
      content: slice.join(" "),
      index: index++,
    });
  }

  return chunks;
}

export function extractSections(text: string): TextChunk[] {
  const sectionPattern = /^(?:Chapter|Section|CHAPTER|SECTION)\s+\d+[.:]\s*(.+)$/gm;
  const chunks: TextChunk[] = [];
  let lastIndex = 0;
  let sectionTitle = "Introduction";
  let match: RegExpExecArray | null;

  const regex = new RegExp(sectionPattern);
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const content = text.slice(lastIndex, match.index).trim();
      if (content.length > 50) {
        chunks.push({ content, index: chunks.length, sectionTitle });
      }
    }
    sectionTitle = match[1]?.trim() ?? sectionTitle;
    lastIndex = match.index;
  }

  const remaining = text.slice(lastIndex).trim();
  if (remaining.length > 50) {
    chunks.push({ content: remaining, index: chunks.length, sectionTitle });
  }

  return chunks.length > 0 ? chunks : chunkText(text, 512, 64);
}
