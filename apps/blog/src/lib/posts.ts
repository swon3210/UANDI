import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import dayjs from 'dayjs';
import { markdownToHtml } from './markdown';

const POSTS_ROOT = path.join(process.cwd(), '../../content/posts');

export type PostFrontmatter = {
  title: string;
  date: string;
  summary: string;
  tags: string[];
  draft?: boolean;
};

export type PostMeta = PostFrontmatter & {
  slug: string;
};

export type PostData = PostMeta & {
  content: string;
};

// 파일명에서 slug 추출: '2026-03-21-photo-gallery.md' → 'photo-gallery'
function fileNameToSlug(fileName: string): string {
  return fileName.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

// slug에서 파일명 찾기
function findFileBySlug(slug: string): string | null {
  if (!fs.existsSync(POSTS_ROOT)) return null;

  const files = fs.readdirSync(POSTS_ROOT).filter((f) => f.endsWith('.md'));
  return files.find((f) => fileNameToSlug(f) === slug) ?? null;
}

// 모든 포스트 메타데이터 (날짜 역순)
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_ROOT)) return [];

  const files = fs.readdirSync(POSTS_ROOT).filter((f) => f.endsWith('.md'));

  const posts = files.map((fileName) => {
    const filePath = path.join(POSTS_ROOT, fileName);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);

    return {
      slug: fileNameToSlug(fileName),
      title: data.title as string,
      date: data.date as string,
      summary: data.summary as string,
      tags: (data.tags as string[]) ?? [],
      draft: (data.draft as boolean) ?? false,
    };
  });

  // 프로덕션에서는 draft 제외
  const filtered =
    process.env.NODE_ENV === 'production'
      ? posts.filter((p) => !p.draft)
      : posts;

  return filtered.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix());
}

// slug로 개별 포스트 조회 (HTML 렌더링 포함)
export async function getPostBySlug(
  slug: string,
): Promise<PostData | null> {
  const fileName = findFileBySlug(slug);
  if (!fileName) return null;

  const filePath = path.join(POSTS_ROOT, fileName);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content: markdownContent } = matter(raw);

  const content = await markdownToHtml(markdownContent);

  return {
    slug,
    title: data.title as string,
    date: data.date as string,
    summary: data.summary as string,
    tags: (data.tags as string[]) ?? [],
    draft: (data.draft as boolean) ?? false,
    content,
  };
}

// generateStaticParams용
export function getAllSlugs(): string[] {
  return getAllPosts().map((post) => post.slug);
}

// 전체 고유 태그 목록 (알파벳순)
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

// 태그별 필터링
export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((post) => post.tags.includes(tag));
}
