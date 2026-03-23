import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAnthropicClient } from '@/lib/ai/anthropic';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

const entrySchema = z.object({
  type: z.enum(['income', 'expense', 'investment', 'flex']),
  amount: z.number(),
  category: z.string(),
  date: z.string(),
  description: z.string(),
});

const requestSchema = z.object({
  entries: z.array(entrySchema),
  year: z.number(),
  month: z.number().min(1).max(12),
  budget: z
    .array(
      z.object({
        categoryId: z.string(),
        budgetAmount: z.number(),
        category: z.string(),
      })
    )
    .optional(),
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
    return NextResponse.json(
      { error: '일일 사용 한도를 초과했습니다' },
      { status: 429 }
    );
  }

  if (process.env.USE_AI_MOCK === 'true') {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const mockText =
          '## 이번 달 지출 분석\n\n- **식비**가 전체 지출의 35%를 차지하고 있어요.\n- 예산 대비 지출이 적절한 수준이에요.\n\n### 절약 팁\n- 주 2회 이상 외식을 줄이면 월 5만원 정도 절약할 수 있어요.';
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: mockText })}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  const { entries, year, month, budget } = parsed.data;

  // 카테고리별 지출 요약 생성
  const expenseEntries = entries.filter((e) => e.type === 'expense');
  const totalExpense = expenseEntries.reduce((sum, e) => sum + e.amount, 0);
  const categoryTotals: Record<string, number> = {};
  for (const entry of expenseEntries) {
    categoryTotals[entry.category] = (categoryTotals[entry.category] ?? 0) + entry.amount;
  }

  const incomeEntries = entries.filter((e) => e.type === 'income');
  const totalIncome = incomeEntries.reduce((sum, e) => sum + e.amount, 0);

  const budgetInfo = budget
    ? budget
        .map((b) => `  - ${b.category}: 예산 ${b.budgetAmount.toLocaleString()}원`)
        .join('\n')
    : '설정된 예산 없음';

  const categoryBreakdown = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => `  - ${cat}: ${amount.toLocaleString()}원 (${Math.round((amount / totalExpense) * 100)}%)`)
    .join('\n');

  try {
    const client = getAnthropicClient();
    const stream = client.messages.stream({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 1024,
      system: `너는 커플 가계부 앱의 지출 분석 AI야.
주어진 데이터를 바탕으로 친근하고 실용적인 분석을 제공해.

규칙:
- 한국어로 작성
- 마크다운 포맷 사용 (##, -, **강조**)
- 200~300자 내외로 간결하게
- 비판적이지 않고 격려하는 톤
- 구체적이고 실행 가능한 절약 팁 1~2개 포함
- 커플 맥락 반영 (공동 지출 vs 개인 지출 언급 시)`,
      messages: [
        {
          role: 'user',
          content: `${year}년 ${month}월 가계부 데이터를 분석해줘.

총 수입: ${totalIncome.toLocaleString()}원
총 지출: ${totalExpense.toLocaleString()}원

카테고리별 지출:
${categoryBreakdown || '  (지출 내역 없음)'}

예산:
${budgetInfo}

거래 건수: ${entries.length}건`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('[analyze-spending] 스트리밍 오류:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[analyze-spending] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
