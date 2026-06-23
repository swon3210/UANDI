import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

// 과거 소비/수입 패턴을 LLM으로 분석해 호라이즌(향후 N개월) 내 "예상되는" 비정기 지출·수입을
// 추정한다. 결과는 잔액에 반영하지 않고 캘린더에 "AI 예상 내역"으로만 표시한다(읽기 시점 파생).
// 패턴: analyze-spending/route.ts와 동일 — verifyAuth → zod → rate-limit → mock 분기 → OpenAI.

const entrySchema = z.object({
  type: z.enum(['income', 'expense', 'flex']),
  amount: z.number(),
  category: z.string(),
  date: z.string(),
  description: z.string().optional().default(''),
});

const requestSchema = z.object({
  /** 과거 실거래(최근 N개월). 패턴 추정 입력. */
  entries: z.array(entrySchema),
  /** 호라이즌 시작/끝(YYYY-MM-DD). 이 구간 안의 발생만 예측. */
  horizonStart: z.string(),
  horizonEnd: z.string(),
  /** 이미 정기 발생으로 선언된 카테고리 이름(중복 예측 방지 — 이미 캘린더 ◇로 노출됨). */
  declaredCategories: z.array(z.string()).optional().default([]),
  /** 현재 커플 카테고리 이름 목록(예측 category 매칭용). */
  categories: z.array(z.string()).optional().default([]),
});

const MODEL = 'gpt-4o';
const MAX_PREDICTIONS = 20;

const predictionSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string(),
  amount: z.number().positive(),
  date: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional().default(''),
});
const responseSchema = z.object({ predictions: z.array(predictionSchema) });

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

  const { entries, horizonStart, horizonEnd, declaredCategories, categories } = parsed.data;

  if (process.env.USE_AI_MOCK === 'true') {
    // 호라이즌 시작 기준으로 결정적인 mock 2건(지출/수입). E2E용 — 선언 카테고리는 제외.
    const base = dayjs(horizonStart);
    const mock = [
      {
        type: 'expense' as const,
        category: '외식',
        amount: 120000,
        date: base.add(10, 'day').format('YYYY-MM-DD'),
        confidence: 0.7,
        reason: '최근 3개월 매월 외식 지출 반복',
      },
      {
        type: 'income' as const,
        category: '부수입',
        amount: 200000,
        date: base.add(20, 'day').format('YYYY-MM-DD'),
        confidence: 0.6,
        reason: '분기마다 들어온 부수입 패턴',
      },
    ].filter((m) => !declaredCategories.includes(m.category));
    return NextResponse.json({ predictions: mock });
  }

  // 카테고리별 월별 집계로 요약(토큰 절약). 같은 카테고리가 여러 달 반복되는지 보이게 한다.
  const byCatMonth = new Map<string, { type: string; total: number; count: number }>();
  for (const e of entries) {
    if (e.type === 'flex') continue;
    const month = dayjs(e.date).format('YYYY-MM');
    const key = `${e.type}|${e.category}|${month}`;
    const agg = byCatMonth.get(key) ?? { type: e.type, total: 0, count: 0 };
    agg.total += e.amount;
    agg.count += 1;
    byCatMonth.set(key, agg);
  }
  const summaryLines = [...byCatMonth.entries()]
    .map(([key, v]) => {
      const [type, category, month] = key.split('|');
      return `- ${month} | ${type === 'income' ? '수입' : '지출'} | ${category} | ${v.total.toLocaleString()}원 (${v.count}건)`;
    })
    .sort()
    .join('\n');

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `너는 커플 가계부 앱의 현금흐름 예측 AI야.
과거 거래 패턴을 보고, 주어진 기간(호라이즌) 안에 발생할 "예상되는" 지출·수입을 추정해.

규칙:
- 출력은 JSON 객체 하나: { "predictions": [ { "type", "category", "amount", "date", "confidence", "reason" } ] }
- type: "income" 또는 "expense"
- category: 가능하면 제공된 카테고리 목록에서 고르고, 과거 내역의 카테고리 이름을 그대로 사용
- amount: 과거 평균에 근거한 양수 정수(원)
- date: 호라이즌(${horizonStart} ~ ${horizonEnd}) 안의 YYYY-MM-DD
- confidence: 0~1, 반복이 뚜렷할수록 높게. 불확실하면 낮게
- reason: 왜 이렇게 예측했는지 한국어 한 줄(예: "최근 3개월 매월 반복")
- **이미 정기 발생으로 선언된 카테고리는 제외**(중복): ${declaredCategories.join(', ') || '(없음)'}
- 매월 고정된 정기 항목보다는, 비정기·계절성·반복되지만 들쭉날쭉한 패턴 위주로 추정
- 근거가 약하면 적게 만들어도 된다. 최대 ${MAX_PREDICTIONS}건
- 패턴이 거의 없으면 predictions: [] 로 반환`,
        },
        {
          role: 'user',
          content: `오늘: ${dayjs().format('YYYY-MM-DD')}
호라이즌: ${horizonStart} ~ ${horizonEnd}
사용 가능한 카테고리: ${categories.join(', ') || '(목록 없음)'}
이미 선언된 정기 카테고리(예측 제외): ${declaredCategories.join(', ') || '(없음)'}

과거 카테고리별 월별 거래 요약:
${summaryLines || '(과거 내역 없음)'}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI 응답을 처리할 수 없습니다' }, { status: 500 });
    }

    const result = responseSchema.parse(JSON.parse(content));
    return NextResponse.json({ predictions: result.predictions.slice(0, MAX_PREDICTIONS) });
  } catch (error) {
    console.error('[predict-cashflow] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
