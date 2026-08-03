import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { aiPreferencesSchema } from '@/lib/ai/preferences';
import { getAiPreferences, saveAiPreferences } from '@/lib/ai/preferences-store';

// 가계부 AI 프롬프트 맞춤화 설정. LLM 호출이 아니므로 일일 사용 한도(rate-limit)는 걸지 않는다.
// verifyAuth 가 커플 멤버(coupleId)를 보장하고, 값은 aiPreferencesSchema 로 검증·정규화된다.

const putSchema = z.object({ preferences: aiPreferencesSchema });

// 정상 설정 문서는 수 KB 수준(규칙 20개·키워드 20개·제외 100개). 그보다 훨씬 큰 바디는
// 파싱하기 전에 거절해 DoS(거대 배열/문자열 버퍼링)를 막는다.
const MAX_BODY_BYTES = 64 * 1024;

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const preferences = await getAiPreferences(authResult.coupleId);
  return NextResponse.json({ preferences });
}

export async function PUT(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const declaredLength = Number(req.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: '요청이 너무 큽니다' }, { status: 413 });
  }

  // content-length 가 없거나 속여도, 실제 본문 길이로 한 번 더 방어한 뒤 파싱한다.
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: '요청이 너무 큽니다' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '잘못된 요청입니다', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const preferences = await saveAiPreferences(
    authResult.coupleId,
    authResult.uid,
    parsed.data.preferences
  );
  return NextResponse.json({ preferences });
}
