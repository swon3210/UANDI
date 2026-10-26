import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import { imageDataUrlRegex } from '@/lib/ai/parse-entries-core';
import {
  buildMockSavingsParse,
  buildSavingsPrompt,
  parseImageWithSchema,
  savingsParseSchema,
} from '@/lib/ai/parse-investment';

const requestSchema = z.object({
  image: z.string().regex(imageDataUrlRegex, '지원하지 않는 이미지 형식입니다'),
});

// POST /api/ai/parse-savings — 예적금 상품설명 캡처 → 상품 조건
export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
  }

  const allowed = await checkAndIncrementUsage(authResult.coupleId);
  if (!allowed) {
    return NextResponse.json({ error: '일일 사용 한도를 초과했습니다' }, { status: 429 });
  }

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json(buildMockSavingsParse());
  }

  try {
    const result = await parseImageWithSchema({
      client: getOpenAIClient(),
      instructions: buildSavingsPrompt(dayjs().format('YYYY-MM-DD')),
      imageUrl: parsed.data.image,
      schema: savingsParseSchema,
      name: 'savings_product',
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('[parse-savings] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
