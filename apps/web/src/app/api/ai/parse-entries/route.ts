import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import type OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import {
  PARSE_MODEL,
  imageDataUrlRegex,
  buildSystemPrompt,
  parseResponseSchema,
  normalizeEntries,
  buildMockParseResponse,
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

  const { text, categories, images, imageKind } = parsed.data;
  const hasImages = (images?.length ?? 0) > 0;

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json(buildMockParseResponse(text, images?.length ?? 0, imageKind));
  }

  const todayDayjs = dayjs().startOf('day');
  const today = todayDayjs.format('YYYY-MM-DD');
  const systemPrompt = buildSystemPrompt({
    categories,
    imageKind,
    hasImages,
    today,
    todayYear: todayDayjs.year(),
  });

  try {
    const client = getOpenAIClient();

    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    if (hasImages) {
      for (const url of images ?? []) {
        userContent.push({ type: 'image_url', image_url: { url, detail: 'high' } });
      }
    }
    const userText = text?.trim() || (hasImages ? '첨부된 영수증을 파싱해줘.' : '');
    if (userText) {
      userContent.push({ type: 'text', text: userText });
    }

    const completion = await client.chat.completions.create({
      model: PARSE_MODEL,
      // 추론 토큰 + 최대 100건 JSON 출력을 모두 수용하도록 넉넉히 확보
      max_completion_tokens: 16000,
      // OCR/추출 위주 작업이라 낮은 추론 강도로도 충분 (필요 시 'medium'까지 상향)
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: hasImages ? userContent : userText,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI 응답을 처리할 수 없습니다' }, { status: 500 });
    }

    const result = parseResponseSchema.parse(JSON.parse(content));

    return NextResponse.json({
      entries: normalizeEntries(result.entries),
      imageKindMismatch: result.imageKindMismatch ?? false,
    });
  } catch (error) {
    console.error('[parse-entries] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
