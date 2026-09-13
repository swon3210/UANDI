import { NextResponse } from 'next/server';
import { checkKoreanSpelling } from '@/lib/spellcheck';
import { WRITE_ENABLED } from '@/lib/write';

// POST /api/write/spellcheck — 본문의 한국어 맞춤법·띄어쓰기를 검사한다.
// 검사는 다음·네이버 온라인 검사기에 본문을 보내 이뤄진다 (hanspell).
export async function POST(request: Request) {
  if (!WRITE_ENABLED) return NextResponse.json({ error: 'Not Found' }, { status: 404 });

  const { markdown } = (await request.json()) as { markdown?: string };

  try {
    return NextResponse.json(await checkKoreanSpelling(markdown ?? ''));
  } catch (error) {
    // 어느 검사기가 왜 실패했는지 그대로 노출한다 — 패널만 보고 원인을 알 수 있어야 한다.
    const detail = error instanceof Error ? error.message : '';
    return NextResponse.json(
      { error: `맞춤법 검사기에 연결하지 못했습니다. ${detail}`.trim() },
      { status: 502 }
    );
  }
}
