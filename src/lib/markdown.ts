export type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export function parseMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.split('\n');
  const blocks: MarkdownBlock[] = [];

  let paragraphBuffer: string[] = [];
  let listBuffer: string[] = [];

  function flushParagraph() {
    if (paragraphBuffer.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphBuffer.join(' ').trim() });
      paragraphBuffer = [];
    }
  }

  function flushList() {
    if (listBuffer.length > 0) {
      blocks.push({ type: 'list', items: listBuffer });
      listBuffer = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    const trimmed = line.trim();
    const listMatch = /^-\s+(.*)$/.exec(trimmed);
    if (listMatch) {
      flushParagraph();
      listBuffer.push(listMatch[1].trim());
      continue;
    }

    // Línea indentada que continúa el último ítem de lista (wrap del markdown
    // original), en vez de un párrafo nuevo.
    const estaIndentada = /^\s/.test(line);
    if (listBuffer.length > 0 && estaIndentada) {
      listBuffer[listBuffer.length - 1] += ` ${trimmed}`;
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();

  return blocks;
}

export function esParrafoItalico(texto: string): boolean {
  return texto.startsWith('*') && texto.endsWith('*') && !texto.startsWith('**');
}

export function quitarItalica(texto: string): string {
  return texto.slice(1, -1);
}

export function dividirEnNegrita(texto: string): { texto: string; negrita: boolean }[] {
  return texto
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((parte) => parte.length > 0)
    .map((parte) =>
      parte.startsWith('**') && parte.endsWith('**')
        ? { texto: parte.slice(2, -2), negrita: true }
        : { texto: parte, negrita: false }
    );
}
