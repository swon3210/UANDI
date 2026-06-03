import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/community/verify-admin';
import { discoverFeed } from '@/lib/community/discover-feed';

// 페이지 URL → RSS 피드 자동 탐지 (admin만). 서버에서 페이지를 fetch해야 하므로 라우트로 둔다.
export const maxDuration = 60;

function isValidHttpUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length === 0) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const result = await verifyAdmin(req);
  if (result instanceof NextResponse) return result;

  let body: { url?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!isValidHttpUrl(url)) {
    return NextResponse.json({ error: '유효한 페이지 URL을 입력해주세요' }, { status: 400 });
  }

  const found = await discoverFeed(url);
  if (!found) {
    return NextResponse.json(
      { error: '이 페이지에서 RSS 피드를 찾지 못했어요. 피드 URL을 직접 입력해주세요.' },
      { status: 404 }
    );
  }

  return NextResponse.json(found);
}
