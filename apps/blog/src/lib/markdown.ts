import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';
import rehypeStringify from 'rehype-stringify';

export type TocItem = {
  id: string;
  text: string;
  depth: number;
};

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function nodeText(node: HastNode): string {
  if (node.type === 'text') return node.value ?? '';
  return (node.children ?? []).map(nodeText).join('');
}

// rehype-slug가 부여한 id를 그대로 읽어와 TOC를 만든다.
// 같은 트리에서 추출하므로 본문 헤딩의 id와 항상 일치한다.
function collectHeadings(node: HastNode, out: TocItem[]): void {
  if (node.tagName && /^h[1-6]$/.test(node.tagName)) {
    const id = node.properties?.id;
    if (typeof id === 'string') {
      out.push({
        id,
        text: nodeText(node).trim(),
        depth: Number(node.tagName.slice(1)),
      });
    }
  }
  for (const child of node.children ?? []) {
    collectHeadings(child, out);
  }
}

export async function markdownToHtml(
  markdown: string
): Promise<{ html: string; toc: TocItem[] }> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeShiki, {
      theme: 'github-light',
    })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const tree = await processor.run(processor.parse(markdown));

  const toc: TocItem[] = [];
  collectHeadings(tree as unknown as HastNode, toc);

  const html = processor.stringify(tree);

  return { html, toc };
}
