import path from 'path';
import fs from 'fs';
import { markdownToHtml } from './markdown';

// apps/docs/ 기준 ../../docs = 모노레포 루트의 docs/ 폴더
const DOCS_ROOT = path.join(process.cwd(), '../../docs');

// "00-overview" → "overview", "03a-gallery-scaffold" → "gallery-scaffold"
function stripNumberPrefix(name: string): string {
  return name.replace(/^\d+[a-z]?-/, '');
}

// 파일 목록에서 slug → 절대 경로 맵 생성
function buildSlugMap(): Map<string, string> {
  const map = new Map<string, string>();

  if (!fs.existsSync(DOCS_ROOT)) return map;

  // 루트 레벨 .md 파일
  const rootFiles = fs.readdirSync(DOCS_ROOT).filter((f) => f.endsWith('.md'));
  for (const file of rootFiles) {
    const slug = stripNumberPrefix(path.basename(file, '.md'));
    map.set(slug, path.join(DOCS_ROOT, file));
  }

  // pages/ 서브디렉토리
  const pagesDir = path.join(DOCS_ROOT, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.md'));
    for (const file of pageFiles) {
      const slug = stripNumberPrefix(path.basename(file, '.md'));
      map.set(`pages/${slug}`, path.join(pagesDir, file));
    }
  }

  return map;
}

// generateStaticParams용 — 모든 slug 배열 반환
export function getAllSlugs(): string[][] {
  const map = buildSlugMap();
  return Array.from(map.keys()).map((slug) => slug.split('/'));
}

export type DocData = {
  content: string; // 렌더링된 HTML
  title: string;
  slug: string;
};

// slug 배열 → 문서 데이터
export async function getDocBySlug(slugParts: string[]): Promise<DocData | null> {
  const slugKey = slugParts.join('/');
  const map = buildSlugMap();
  const filePath = map.get(slugKey);

  if (!filePath || !fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const content = await markdownToHtml(raw);

  // 첫 번째 H1에서 제목 추출
  const titleMatch = raw.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1]! : slugParts[slugParts.length - 1]!;

  return { content, title, slug: slugKey };
}
