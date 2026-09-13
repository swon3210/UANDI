import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dayjs from 'dayjs';
import { isCategorySlug, isSeriesSlug } from './taxonomy';

/**
 * 로컬 개발 서버 전용 글쓰기 기능.
 *
 * 블로그는 빌드 시점에 content/posts/를 읽어 전부 정적 생성하는 사이트다.
 * 배포본에 쓰기 경로가 열려 있으면 아무 의미도 없고(재빌드 전까지 반영 안 됨)
 * 위험하기만 하므로, 페이지·API 모두 이 플래그로 프로덕션에서 404를 낸다.
 */
export const WRITE_ENABLED = process.env.NODE_ENV !== 'production';

// dev 서버의 cwd는 apps/blog — posts.ts의 POSTS_ROOT와 같은 기준이다.
const POSTS_DIR = path.join(process.cwd(), '../../content/posts');
const IMAGES_DIR = path.join(process.cwd(), 'public/images/posts');

export const IMAGE_URL_BASE = '/images/posts';

// 경로 조작(../)을 막는 1차 방어선 — 파일명·slug는 이 형태만 허용한다.
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const FILE_NAME_RE = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/;

const IMAGE_EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type DraftMeta = {
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
  cover?: string;
  series?: string;
  seriesOrder?: number;
  featured?: boolean;
  draft?: boolean;
};

export type PostSummary = {
  fileName: string;
  slug: string;
  title: string;
  date: string;
  draft: boolean;
};

export type PostSource = {
  fileName: string;
  slug: string;
  meta: DraftMeta;
  body: string;
};

function fileNameToSlug(fileName: string): string {
  return fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

// gray-matter는 따옴표 없는 date를 Date 객체로 파싱한다. 문자열로 통일한다.
function toDateString(value: unknown): string {
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD');
  return typeof value === 'string' ? value : '';
}

export function listPosts(): PostSummary[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((fileName) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, fileName), 'utf-8');
      const { data } = matter(raw);
      return {
        fileName,
        slug: fileNameToSlug(fileName),
        title: (data.title as string) ?? fileName,
        date: toDateString(data.date),
        draft: (data.draft as boolean) ?? false,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function readPost(fileName: string): PostSource | null {
  if (!FILE_NAME_RE.test(fileName)) return null;

  const filePath = path.join(POSTS_DIR, fileName);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));

  return {
    fileName,
    slug: fileNameToSlug(fileName),
    meta: {
      title: (data.title as string) ?? '',
      date: toDateString(data.date),
      summary: (data.summary as string) ?? '',
      category: (data.category as string) ?? '',
      tags: (data.tags as string[]) ?? [],
      cover: data.cover as string | undefined,
      series: data.series as string | undefined,
      seriesOrder: data.seriesOrder as number | undefined,
      featured: (data.featured as boolean) ?? false,
      draft: (data.draft as boolean) ?? false,
    },
    body: content.replace(/^\n+/, ''),
  };
}

/** 저장 전 검증. 통과하면 null, 아니면 사용자에게 보여줄 한글 메시지를 반환한다. */
export function validateDraft(slug: string, meta: DraftMeta): string | null {
  if (!SLUG_RE.test(slug)) {
    return 'slug는 영소문자·숫자·하이픈만 쓸 수 있습니다. (예: markdown-editor)';
  }
  if (!DATE_RE.test(meta.date)) return '날짜는 YYYY-MM-DD 형식이어야 합니다.';
  if (!meta.title.trim()) return '제목을 입력해 주세요.';
  if (!meta.summary.trim()) return '요약을 입력해 주세요.';
  if (!isCategorySlug(meta.category)) {
    return '카테고리를 골라 주세요. (누락·오타면 블로그 빌드가 실패합니다)';
  }
  if (meta.tags.length === 0) return '태그를 1개 이상 입력해 주세요.';
  if (meta.series && !isSeriesSlug(meta.series)) {
    return `taxonomy.ts의 SERIES에 없는 시리즈입니다: ${meta.series}`;
  }
  return null;
}

function yamlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/** 손으로 쓴 기존 글과 같은 모양(작은따옴표 YAML)으로 직렬화한다. */
export function serializePost(meta: DraftMeta, body: string): string {
  const lines = [
    `title: ${yamlString(meta.title)}`,
    `date: ${yamlString(meta.date)}`,
    `summary: ${yamlString(meta.summary)}`,
    `category: ${yamlString(meta.category)}`,
    `tags: [${meta.tags.map(yamlString).join(', ')}]`,
  ];

  if (meta.cover) lines.push(`cover: ${yamlString(meta.cover)}`);
  if (meta.series) {
    lines.push(`series: ${yamlString(meta.series)}`);
    lines.push(`seriesOrder: ${meta.seriesOrder ?? 1}`);
  }
  if (meta.featured) lines.push('featured: true');
  lines.push(`draft: ${meta.draft ? 'true' : 'false'}`);

  return `---\n${lines.join('\n')}\n---\n\n${body.trim()}\n`;
}

export function savePost(params: {
  slug: string;
  meta: DraftMeta;
  body: string;
  originalFileName?: string;
}): { fileName: string } {
  const { slug, meta, body, originalFileName } = params;
  const fileName = `${meta.date}-${slug}.md`;

  if (!FILE_NAME_RE.test(fileName)) {
    throw new Error('파일명이 올바르지 않습니다.');
  }
  if (originalFileName && !FILE_NAME_RE.test(originalFileName)) {
    throw new Error('원본 파일명이 올바르지 않습니다.');
  }

  const filePath = path.join(POSTS_DIR, fileName);
  if (fileName !== originalFileName && fs.existsSync(filePath)) {
    throw new Error(`이미 같은 이름의 글이 있습니다: ${fileName}`);
  }

  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, serializePost(meta, body), 'utf-8');

  // 날짜나 slug를 바꿔 저장하면 파일명이 달라진다 — 옛 파일은 지워 중복 발행을 막는다.
  if (originalFileName && originalFileName !== fileName) {
    const oldPath = path.join(POSTS_DIR, originalFileName);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  return { fileName };
}

export function saveImage(params: { slug: string; mime: string; bytes: Buffer }): { url: string } {
  const { slug, mime, bytes } = params;

  const ext = IMAGE_EXT_BY_MIME[mime];
  if (!ext) throw new Error(`지원하지 않는 이미지 형식입니다: ${mime || '알 수 없음'}`);
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('이미지가 10MB를 넘습니다.');

  // slug가 아직 비어 있는 새 글은 _inbox에 모아두고, 나중에 옮길 수 있게 한다.
  const dirSlug = SLUG_RE.test(slug) ? slug : '_inbox';
  const dir = path.join(IMAGES_DIR, dirSlug);
  fs.mkdirSync(dir, { recursive: true });

  const fileName = `${dayjs().format('YYYYMMDD-HHmmss')}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  fs.writeFileSync(path.join(dir, fileName), bytes);

  return { url: `${IMAGE_URL_BASE}/${dirSlug}/${fileName}` };
}
