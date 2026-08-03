import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { aiPreferencesSchema } from '@/lib/ai/preferences';
import { getAiPreferences, saveAiPreferences } from '@/lib/ai/preferences-store';

// 가계부 AI 프롬프트 맞춤화 설정. LLM 호출이 아니므로 일일 사용 한도(rate-limit)는 걸지 않는다.
// verifyAuth 가 커플 멤버(coupleId)를 보장하고, 값은 aiPreferencesSchema 로 검증·정규화된다.

const putSchema = z.object({ preferences: aiPreferencesSchema });

export async function GET(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const preferences = await getAiPreferences(authResult.coupleId);
  return NextResponse.json({ preferences });
}

export async function PUT(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
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
