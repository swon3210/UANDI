import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

const requestSchema = z.object({
  text: z.string().min(1).max(1000),
  categories: z.array(z.string()),
});

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

function buildMockResponse(text: string) {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const segments = text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const count = Math.min(Math.max(segments.length, 1), 10);

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

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json(buildMockResponse(parsed.data.text));
  }

  const { text, categories } = parsed.data;
  const today = dayjs().format('YYYY-MM-DD');

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `너는 여러 건의 자연어 가계부 입력을 한 번에 구조화된 JSON으로 변환하는 파서야.
오늘 날짜: ${today}

사용 가능한 카테고리 목록:
${categories.join(', ')}

입력에는 여러 항목이 줄바꿈, 쉼표(,), "그리고" 등으로 구분되어 포함될 수 있어.
각 항목마다 하나의 entry를 만들어서 entries 배열에 담아 아래 JSON 형식으로 응답해.
다른 텍스트는 절대 포함하지 마.

{
  "entries": [
    {
      "type": "income" | "expense" | "investment" | "flex",
      "amount": number,
      "category": "카테고리 목록에서 가장 적합한 것",
      "description": "항목 설명",
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
- confidence는 파싱 확실도 (모호한 입력일수록 낮게)
- 항목 구분이 모호하면 하나의 entry로 합쳐서 처리`,
        },
        { role: 'user', content: text },
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
