import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dayjs from 'dayjs';
import { markdownToHtml } from './markdown';
import {
  type CategorySlug,
  type SeriesSlug,
  isCategorySlug,
  isSeriesSlug,
  SERIES,
  CATEGORY_SLUGS,
} from './taxonomy';

const POSTS_ROOT = path.join(process.cwd(), '../../content/posts');

export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  category: CategorySlug;
  tags: string[];
  series?: SeriesSlug;
  seriesOrder?: number;
  featured?: boolean;
  draft?: boolean;
};

export type PostMeta = PostFrontmatter & {
  slug: string;
  readingTimeMinutes: number;
};

export type PostData = PostMeta & {
  content: string;
};

export type SeriesContext = {
  slug: SeriesSlug;
  title: string;
  posts: PostMeta[];
};

// 파일명에서 slug 추출: '2026-03-21-photo-gallery.md' → 'photo-gallery'
function fileNameToSlug(fileName: string): string {
  return fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

function findFileBySlug(slug: string): string | null {
  if (!fs.existsSync(POSTS_ROOT)) return null;
  const files = fs.readdirSync(POSTS_ROOT).filter((f) => f.endsWith('.md'));
  return files.find((f) => fileNameToSlug(f) === slug) ?? null;
}

// 한국어 기준 500자/분, 최소 1분
export function getReadingTimeMinutes(content: string): number {
  const charCount = content.replace(/\s+/g, '').length;
  return Math.max(1, Math.ceil(charCount / 500));
}

function readPostFile(fileName: string): { meta: PostMeta; markdown: string } {
  const filePath = path.join(POSTS_ROOT, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const category = data.category as string | undefined;
  if (!category || !isCategorySlug(category)) {
    throw new Error(
      `[blog] '${fileName}'의 frontmatter에 유효한 category가 없습니다. ` +
        `(받은 값: ${JSON.stringify(category)})`,
    );
  }

  const series = data.series as string | undefined;
  if (series !== undefined && !isSeriesSlug(series)) {
    throw new Error(
      `[blog] '${fileName}'의 frontmatter series가 SERIES에 등록되지 않았습니다. ` +
        `(받은 값: ${JSON.stringify(series)})`,
    );
  }

  const meta: PostMeta = {
    slug: fileNameToSlug(fileName),
    title: data.title as string,
    date: data.date as string,
    summary: data.summary as string,
    category,
    tags: (data.tags as string[]) ?? [],
    series: series as SeriesSlug | undefined,
    seriesOrder: data.seriesOrder as number | undefined,
    featured: (data.featured as boolean) ?? false,
    draft: (data.draft as boolean) ?? false,
    readingTimeMinutes: getReadingTimeMinutes(content),
  };

  return { meta, markdown: content };
}

// 모든 포스트 메타데이터 (날짜 역순, draft는 prod에서 제외)
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_ROOT)) return [];

  const files = fs.readdirSync(POSTS_ROOT).filter((f) => f.endsWith('.md'));
  const posts = files.map((fileName) => readPostFile(fileName).meta);

  const filtered =
    process.env.NODE_ENV === 'production'
      ? posts.filter((p) => !p.draft)
      : posts;

  return filtered.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
}

// slug로 개별 포스트 조회 (HTML 렌더링 포함)
export async function getPostBySlug(slug: string): Promise<PostData | null> {
  const fileName = findFileBySlug(slug);
  if (!fileName) return null;

  const { meta, markdown } = readPostFile(fileName);
  const content = await markdownToHtml(markdown);

  return { ...meta, content };
}

// generateStaticParams용
export function getAllSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

// 전체 고유 태그 목록 (가나다순)
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
}

// 태그별 필터링
export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((post) => post.tags.includes(tag));
}

// 사용 중인 카테고리 목록 (CATEGORY_SLUGS의 정의 순서 보존)
export function getAllCategories(): CategorySlug[] {
  const used = new Set<CategorySlug>();
  getAllPosts().forEach((post) => used.add(post.category));
  return CATEGORY_SLUGS.filter((slug) => used.has(slug));
}

// 카테고리별 포스트
export function getPostsByCategory(category: CategorySlug): PostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

// 사용 중인 시리즈 목록
export function getAllSeries(): { slug: SeriesSlug; title: string; count: number }[] {
  const posts = getAllPosts();
  const counts = new Map<SeriesSlug, number>();

  posts.forEach((post) => {
    if (post.series) {
      counts.set(post.series, (counts.get(post.series) ?? 0) + 1);
    }
  });

  return Array.from(counts.entries()).map(([slug, count]) => ({
    slug,
    title: SERIES[slug].title,
    count,
  }));
}

// 시리즈 단건 조회 (seriesOrder 오름차순)
export function getSeriesBySlug(slug: SeriesSlug): SeriesContext | null {
  const posts = getAllPosts()
    .filter((post) => post.series === slug)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));

  if (posts.length === 0) return null;

  return {
    slug,
    title: SERIES[slug].title,
    posts,
  };
}

// 시그니처 글 (featured 중 최신 1편)
export function getFeaturedPost(): PostMeta | null {
  return getAllPosts().find((post) => post.featured) ?? null;
}

// 관련 글 (같은 시리즈 → 같은 카테고리 → 태그 겹침 순으로 최대 limit개)
export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const all = getAllPosts();
  const current = all.find((post) => post.slug === slug);
  if (!current) return [];

  const candidates = all.filter((post) => post.slug !== slug);
  const picked: PostMeta[] = [];
  const pickedSlugs = new Set<string>();

  const take = (post: PostMeta) => {
    if (picked.length >= limit) return;
    if (pickedSlugs.has(post.slug)) return;
    picked.push(post);
    pickedSlugs.add(post.slug);
  };

  // 1) 같은 시리즈 (seriesOrder 오름차순, 없으면 날짜 역순)
  if (current.series) {
    candidates
      .filter((post) => post.series === current.series)
      .sort((a, b) => {
        const orderDiff = (a.seriesOrder ?? Infinity) - (b.seriesOrder ?? Infinity);
        if (orderDiff !== 0) return orderDiff;
        return dayjs(b.date).unix() - dayjs(a.date).unix();
      })
      .forEach(take);
  }

  // 2) 같은 카테고리 (날짜 역순)
  if (picked.length < limit) {
    candidates
      .filter((post) => post.category === current.category)
      .sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())
      .forEach(take);
  }

  // 3) 태그 겹침 (겹치는 태그 수 내림차순, 동률은 날짜 역순)
  if (picked.length < limit) {
    const currentTags = new Set(current.tags);
    candidates
      .map((post) => ({
        post,
        overlap: post.tags.filter((tag) => currentTags.has(tag)).length,
      }))
      .filter(({ overlap }) => overlap > 0)
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return dayjs(b.post.date).unix() - dayjs(a.post.date).unix();
      })
      .forEach(({ post }) => take(post));
  }

  return picked;
}

export type ArchiveMonth = {
  yearMonth: string; // 'YYYY-MM'
  year: number;
  month: number;
  label: string; // '2026년 3월'
  posts: PostMeta[];
};

function toYearMonth(date: string): string {
  return dayjs(date).format('YYYY-MM');
}

function buildArchiveMonth(yearMonth: string, posts: PostMeta[]): ArchiveMonth {
  const m = dayjs(`${yearMonth}-01`);
  return {
    yearMonth,
    year: m.year(),
    month: m.month() + 1,
    label: m.format('YYYY년 M월'),
    posts,
  };
}

// 모든 연-월 그룹 (최신 월부터)
export function getArchiveMonths(): ArchiveMonth[] {
  const grouped = new Map<string, PostMeta[]>();
  getAllPosts().forEach((post) => {
    const ym = toYearMonth(post.date);
    const list = grouped.get(ym) ?? [];
    list.push(post);
    grouped.set(ym, list);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([ym, posts]) => buildArchiveMonth(ym, posts));
}

// 특정 연-월 단건 조회
export function getArchiveByMonth(yearMonth: string): ArchiveMonth | null {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return null;
  const posts = getAllPosts().filter((post) => toYearMonth(post.date) === yearMonth);
  if (posts.length === 0) return null;
  return buildArchiveMonth(yearMonth, posts);
}

// /archive/[year-month] generateStaticParams용
export function getAllArchiveMonths(): string[] {
  return getArchiveMonths().map((m) => m.yearMonth);
}
