import { NextResponse } from 'next/server';
import { markdownToHtml } from '@/lib/markdown';
import { WRITE_ENABLED } from '@/lib/write';

// 실제 글 페이지와 같은 파이프라인(remark-gfm + shiki)으로 렌더링해,
// 프리뷰와 발행 결과가 어긋나지 않게 한다.
export async function POST(request: Request) {
  if (!WRITE_ENABLED) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const { markdown } = (await request.json()) as { markdown?: string };
  const { html } = await markdownToHtml(markdown ?? '');

  return NextResponse.json({ html });
}
