import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import { imageDataUrlRegex } from '@/lib/ai/parse-entries-core';
import {
  buildMockStockHoldingsParse,
  buildStockHoldingsPrompt,
  parseImageWithSchema,
  stockHoldingsParseSchema,
} from '@/lib/ai/parse-investment';

const requestSchema = z.object({
  image: z.string().regex(imageDataUrlRegex, '지원하지 않는 이미지 형식입니다'),
});

// POST /api/ai/parse-stock-holdings — 증권사 잔고 캡처 → 보유 종목 목록
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
    return NextResponse.json(buildMockStockHoldingsParse());
  }

  try {
    const result = await parseImageWithSchema({
      client: getOpenAIClient(),
      instructions: buildStockHoldingsPrompt(dayjs().format('YYYY-MM-DD')),
      imageUrl: parsed.data.image,
      schema: stockHoldingsParseSchema,
      name: 'stock_holdings',
    });
    // 수량·단가가 0 이하인 행(합계 오인식 등)은 버린다
    return NextResponse.json({
      ...result,
      holdings: result.holdings.filter((h) => h.quantity > 0 && h.averagePrice > 0),
    });
  } catch (error) {
    console.error('[parse-stock-holdings] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
