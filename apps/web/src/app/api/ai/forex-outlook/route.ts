import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  type ExchangeRatePoint,
  type ForexIndicators,
  type SupportedCurrency,
  CURRENCY_META,
  RECOMMENDATION_LABEL,
  SUPPORTED_CURRENCIES,
  TREND_LABEL,
  computeRecommendation,
} from '@uandi/investment-core';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

const FOREX_MODEL = 'gpt-5-mini';

const requestSchema = z.object({
  currency: z.enum(SUPPORTED_CURRENCIES as [SupportedCurrency, ...SupportedCurrency[]]),
  points: z
    .array(
      z.object({
        date: z.string(),
        rate: z.number(),
      })
    )
    .min(2),
  indicators: z.object({
    current: z.number(),
    ma5: z.number().nullable(),
    ma20: z.number().nullable(),
    ma60: z.number().nullable(),
    rsi14: z.number().nullable(),
    percentile52w: z.number().nullable(),
    percentile13w: z.number().nullable(),
    trend: z.enum(['up', 'down', 'sideways']),
  }),
});

function summarizeSeries(points: ExchangeRatePoint[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  const mid = points[Math.floor(points.length / 2)];
  const sorted = [...points].sort((a, b) => a.rate - b.rate);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const fmt = (p: ExchangeRatePoint) => `${p.date}=${p.rate.toFixed(2)}`;
  return [
    `시작: ${fmt(first)}`,
    `중간: ${fmt(mid)}`,
    `최근: ${fmt(last)}`,
    `최저: ${fmt(min)}`,
    `최고: ${fmt(max)}`,
  ].join(', ');
}

function indicatorLines(indicators: ForexIndicators): string {
  const fmt = (v: number | null) => (v === null ? 'n/a' : v.toFixed(2));
  return [
    `현재가: ${indicators.current.toFixed(2)}`,
    `MA20: ${fmt(indicators.ma20)}`,
    `MA60: ${fmt(indicators.ma60)}`,
    `RSI(14): ${fmt(indicators.rsi14)}`,
    `52주 백분위: ${fmt(indicators.percentile52w)}`,
    `13주 백분위: ${fmt(indicators.percentile13w)}`,
    `추세: ${indicators.trend} (${TREND_LABEL[indicators.trend]})`,
  ].join('\n');
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
    return NextResponse.json({ error: '일일 사용 한도를 초과했습니다' }, { status: 429 });
  }

  const { currency, points, indicators } = parsed.data;
  const recommendation = computeRecommendation(indicators);
  const recommendationLabel = RECOMMENDATION_LABEL[recommendation];

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json({
      summary: `${CURRENCY_META[currency].label} 환율은 최근 완만한 흐름이며, 단기 지표는 ${recommendationLabel} 구간입니다.`,
      confidence: 0.6,
    });
  }

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: FOREX_MODEL,
      response_format: { type: 'json_object' },
      max_completion_tokens: 2000,
      reasoning_effort: 'minimal',
      messages: [
        {
          role: 'system',
          content: `당신은 외환 시장 분석 어시스턴트입니다.
한국 개인 투자자가 환테크 의사결정에 참고할 수 있도록 최근 90일 시계열과 기술 지표를 바탕으로
이미 결정된 추천(매수/매도/관망)을 뒷받침하는 근거를 1~3문장 한국어로 제시하세요.

규칙:
- 추천(recommendation)은 시스템이 이미 결정했으며 변경할 수 없습니다. summary는 이 추천과 일치하는 방향으로 작성하세요.
- 단정적 예측("반드시", "100%")은 금지. "가능성", "경향" 같은 표현 사용
- 출력은 반드시 JSON: { "summary": string, "confidence": 0~1 }
- summary는 한국어 1~3문장, 추천 근거 중심
- confidence는 0~1 사이의 숫자 (지표가 추천 방향을 얼마나 뚜렷이 가리키는지)

지표 해석 가이드:
- 추세(trend)는 MA20/MA60의 위치와 MA20의 5일 기울기를 합산해 산출됩니다. 'up'은 원화 약세(환율 상승) 국면, 'down'은 원화 강세(환율 하락) 국면, 'sideways'는 횡보를 의미합니다.
- 52주 백분위가 높아도(75% 이상) 추세가 'up'이면 평균회귀가 즉시 일어나지 않을 수 있으므로 매도 신호를 신중히 해석하세요(이 경우 추천은 'hold'로 다운그레이드됩니다).
- 13주 백분위는 최근 분기 내 위치로, 추세가 길게 이어지는 장에서도 단기 진입 타이밍을 보조합니다.
- summary는 가능하면 "추세가 X이고 단기(13주) 백분위가 Y%이므로 …" 형태로 추세-단기 결합 해석을 권장합니다.`,
        },
        {
          role: 'user',
          content: `통화: ${currency}/KRW (${CURRENCY_META[currency].label})

기술적 추천(고정): ${recommendation} (${recommendationLabel})

시계열 요약 (KRW per 1 ${currency}):
${summarizeSeries(points)}

기술 지표:
${indicatorLines(indicators)}

위 추천을 뒷받침하는 근거를 JSON으로 응답하세요.`,
        },
      ],
    });

    const choice = completion.choices[0];
    const content = choice?.message?.content;
    if (!content) {
      console.error('[forex-outlook] 빈 응답', {
        model: FOREX_MODEL,
        finishReason: choice?.finish_reason,
        usage: completion.usage,
      });
      return NextResponse.json({ error: 'AI 응답이 비어 있습니다' }, { status: 502 });
    }

    const parsedContent = JSON.parse(content) as { summary?: unknown; confidence?: unknown };
    const summary = typeof parsedContent.summary === 'string' ? parsedContent.summary : '';
    const confidence =
      typeof parsedContent.confidence === 'number' ? parsedContent.confidence : 0.5;
    return NextResponse.json({ summary, confidence });
  } catch (error) {
    console.error('[forex-outlook] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
