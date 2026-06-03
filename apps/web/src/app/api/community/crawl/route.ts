import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/ai/firebase-admin';
import { verifyAdmin } from '@/lib/community/verify-admin';
import { runCrawl } from '@/lib/community/crawl';

// 크롤 수동 트리거 — 두 경로의 호출자를 허용한다.
//  1) 어드민 UI "지금 수집" 버튼 → Bearer 토큰(verifyAdmin)
//  2) 스케줄 Cloud Function → x-crawl-secret 헤더(CRAWL_TRIGGER_SECRET와 일치)
// 둘 다 아니면 401/403. 실제 크롤 구현은 lib/community/crawl.ts(runCrawl) 단일 소스.

export const maxDuration = 300; // 다수 소스 fetch 대비 (Vercel 함수 타임아웃)

function hasValidSecret(req: NextRequest): boolean {
  const secret = process.env.CRAWL_TRIGGER_SECRET;
  if (!secret) return false;
  return req.headers.get('x-crawl-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!hasValidSecret(req)) {
    const result = await verifyAdmin(req);
    if (result instanceof NextResponse) return result;
  }

  try {
    const summary = await runCrawl(adminDb());
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : '크롤에 실패했습니다';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
