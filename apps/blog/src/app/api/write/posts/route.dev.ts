import { NextResponse } from 'next/server';
import {
  WRITE_ENABLED,
  listPosts,
  readPost,
  savePost,
  validateDraft,
  type DraftMeta,
} from '@/lib/write';

function notFound() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

// GET /api/write/posts             → content/posts/ 목록
// GET /api/write/posts?file=<파일명> → 글 1편의 frontmatter + 본문
export async function GET(request: Request) {
  if (!WRITE_ENABLED) return notFound();

  const fileName = new URL(request.url).searchParams.get('file');
  if (!fileName) return NextResponse.json({ posts: listPosts() });

  const post = readPost(fileName);
  if (!post) return NextResponse.json({ error: '글을 찾을 수 없습니다.' }, { status: 404 });

  return NextResponse.json(post);
}

// POST /api/write/posts → content/posts/<date>-<slug>.md 로 저장
export async function POST(request: Request) {
  if (!WRITE_ENABLED) return notFound();

  const payload = (await request.json()) as {
    slug?: string;
    meta?: DraftMeta;
    body?: string;
    originalFileName?: string;
  };

  const slug = payload.slug?.trim() ?? '';
  const meta = payload.meta;
  if (!meta) return NextResponse.json({ error: 'frontmatter가 없습니다.' }, { status: 400 });

  const invalid = validateDraft(slug, meta);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  try {
    const { fileName } = savePost({
      slug,
      meta,
      body: payload.body ?? '',
      originalFileName: payload.originalFileName,
    });
    return NextResponse.json({ fileName });
  } catch (error) {
    const message = error instanceof Error ? error.message : '저장에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
