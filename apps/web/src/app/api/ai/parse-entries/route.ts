import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import type OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

const imageDataUrlRegex = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

const requestSchema = z
  .object({
    text: z.string().max(1000).optional(),
    categories: z.array(z.string()),
    images: z
      .array(z.string().regex(imageDataUrlRegex, '지원하지 않는 이미지 형식입니다'))
      .max(10)
      .optional(),
  })
  .refine(
    (data) => (data.text?.trim().length ?? 0) > 0 || (data.images?.length ?? 0) > 0,
    { message: '텍스트 또는 이미지 중 하나는 반드시 포함되어야 합니다' }
  );

const parsedEntrySchema = z.object({
  type: z.enum(['income', 'expense', 'investment', 'flex']),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string(),
  date: z.string(),
  confidence: z.number().min(0).max(1),
});

const responseSchema = z.object({
  entries: z.array(parsedEntrySchema).min(1).max(10),
});

function buildMockResponse(text: string | undefined, imagesCount: number) {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const textSegments = (text ?? '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const count = Math.min(Math.max(textSegments + imagesCount, 1), 10);

  const templates = [
    { type: 'expense' as const, amount: 9000, category: '식비', description: '김치찌개', date: today, confidence: 0.95 },
    { type: 'expense' as const, amount: 15000, category: '교통', description: '택시', date: yesterday, confidence: 0.9 },
    { type: 'income' as const, amount: 3500000, category: '정기급여', description: '월급', date: today, confidence: 0.98 },
  ];

  return {
    entries: Array.from({ length: count }, (_, i) => templates[i % templates.length]),
  };
}

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
    return NextResponse.json(
      { error: '일일 사용 한도를 초과했습니다' },
      { status: 429 }
    );
  }

  const { text, categories, images } = parsed.data;
  const hasImages = (images?.length ?? 0) > 0;

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json(buildMockResponse(text, images?.length ?? 0));
  }

  const today = dayjs().format('YYYY-MM-DD');

  const systemPrompt = `너는 자연어와 영수증 이미지를 구조화된 JSON으로 변환하는 가계부 파서야.
오늘 날짜: ${today}

사용 가능한 카테고리 목록:
${categories.join(', ')}

입력 구성:
- 텍스트: 여러 줄/쉼표/"그리고" 등으로 구분된 여러 건이 포함될 수 있음
- 이미지: 영수증/결제 내역 사진. 각 이미지에서 상호명, 품목, 금액, 결제 날짜를 추출
  - 여러 품목이 한 영수증에 있어도 영수증 1장 = entry 1개로 합쳐서 처리 (description에 대표 품목/상호명 요약)
  - 영수증에 날짜가 찍혀 있으면 해당 날짜 사용, 없거나 인식 불가하면 오늘 날짜 사용

텍스트와 이미지가 함께 오면 **둘을 합쳐서 하나의 entries 배열**로 응답해. 다른 텍스트는 절대 포함하지 마.

{
  "entries": [
    {
      "type": "income" | "expense" | "investment" | "flex",
      "amount": number,
      "category": "카테고리 목록에서 가장 적합한 것",
      "description": "항목 설명 (영수증이면 상호명 + 대표 품목)",
      "date": "YYYY-MM-DD",
      "confidence": 0.0 ~ 1.0
    }
  ]
}

규칙:
- 최소 1개, 최대 10개의 entry를 생성
- amount는 반드시 양의 정수 (원 단위)
- "만원"은 10000, "천원"은 1000으로 변환
- date가 명시되지 않으면 오늘 날짜 사용
- "어제", "그제" 등 상대 날짜도 올바르게 변환
- category는 반드시 제공된 목록에서 선택. 매칭되는 것이 없으면 가장 유사한 것 선택
- confidence는 파싱 확실도 (영수증이 흐리거나 정보가 불명확할수록 낮게)
- 영수증 이미지가 가계부 영수증이 아니거나 금액을 전혀 읽을 수 없으면 confidence 0.3 이하로 설정`;

  try {
    const client = getOpenAIClient();

    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    if (hasImages) {
      for (const url of images ?? []) {
        userContent.push({ type: 'image_url', image_url: { url, detail: 'high' } });
      }
    }
    const userText =
      text?.trim() ||
      (hasImages ? '첨부된 영수증을 파싱해줘.' : '');
    if (userText) {
      userContent.push({ type: 'text', text: userText });
    }

    const completion = await client.chat.completions.create({
      model: hasImages ? 'gpt-4o' : 'gpt-4o-mini',
      max_tokens: 1024,
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
      return NextResponse.json(
        { error: 'AI 응답을 처리할 수 없습니다' },
        { status: 500 }
      );
    }

    const result = responseSchema.parse(JSON.parse(content));
    return NextResponse.json(result);
  } catch (error) {
    console.error('[parse-entries] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
