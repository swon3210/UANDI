import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { parseEntriesWithModel } from '@/lib/ai/parse-entries-llm';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import { getAiPreferences } from '@/lib/ai/preferences-store';
import { buildParseRulesSection } from '@/lib/ai/preferences';
import {
  imageDataUrlRegex,
  buildSystemPrompt,
  categoryHintsSchema,
  buildMockParseResponse,
  type ParsedEntry,
} from '@/lib/ai/parse-entries-core';

const requestSchema = z
  .object({
    text: z.string().max(1000).optional(),
    categories: z.array(z.string()),
    images: z
      .array(z.string().regex(imageDataUrlRegex, '지원하지 않는 이미지 형식입니다'))
      .max(10)
      .optional(),
    // 첨부 이미지의 분류. 'account'(계좌/통장 내역)면 카드대금 일괄출금을 제외하고,
    // 'card'(카드 사용 내역)면 이미지가 실제 카드 내역인지 검증한다.
    imageKind: z.enum(['account', 'card']).optional(),
    // 과거 내역 기반 "설명 → 카테고리" 힌트(클라이언트가 마지막 내역 기준 3개월에서 추출).
    categoryHints: categoryHintsSchema.optional(),
  })
  .refine((data) => (data.text?.trim().length ?? 0) > 0 || (data.images?.length ?? 0) > 0, {
    message: '텍스트 또는 이미지 중 하나는 반드시 포함되어야 합니다',
  });

export async function POST(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '잘못된 요청입니다', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const allowed = await checkAndIncrementUsage(authResult.coupleId);
  if (!allowed) {
    return NextResponse.json({ error: '일일 사용 한도를 초과했습니다' }, { status: 429 });
  }

  const { text, categories, images, imageKind, categoryHints } = parsed.data;
  const hasImages = (images?.length ?? 0) > 0;

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json(buildMockParseResponse(text, images?.length ?? 0, imageKind));
  }

  const preferences = await getAiPreferences(authResult.coupleId);
  const customRulesSection = buildParseRulesSection(preferences.parseEntries);

  const todayDayjs = dayjs().startOf('day');
  const today = todayDayjs.format('YYYY-MM-DD');
  const systemPrompt = buildSystemPrompt({
    categories,
    imageKind,
    hasImages,
    today,
    todayYear: todayDayjs.year(),
    customRulesSection,
    categoryHints,
  });

  try {
    const client = getOpenAIClient();
    const userText = text?.trim() ?? '';

    // 이미지는 1장당 1회 호출로 분리해 병렬 실행한다.
    // 여러 장을 한 호출에 넣으면 결과가 MAX_ENTRIES(100건) 하나로 묶여 잘리고 행 누락도 잦다.
    // 텍스트는 이미지가 있으면 첫 장의 호출에 함께 싣고(같은 맥락), 없으면 단독 호출한다.
    const jobs = hasImages
      ? (images ?? []).map((imageUrl, index) =>
          parseEntriesWithModel({
            client,
            systemPrompt,
            imageUrl,
            text: index === 0 && userText ? userText : '첨부된 영수증을 파싱해줘.',
            tag: 'parse-entries',
          })
        )
      : [parseEntriesWithModel({ client, systemPrompt, text: userText, tag: 'parse-entries' })];

    const results = await Promise.all(jobs);

    const entries: ParsedEntry[] = results.flatMap((r) => r.entries);
    const imageKindMismatch = results.some((r) => r.imageKindMismatch);

    return NextResponse.json({ entries, imageKindMismatch });
  } catch (error) {
    console.error('[parse-entries] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
