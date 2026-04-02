import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
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
          '## 📊 총정리\n**총수입** 3,500,000원 - **총지출** 2,100,000원 = **남은 금액 1,400,000원**\n\n## 💰 예산 분석\n이번 달은 식비에 80만원, 교통비에 15만원이 배정되어 있어요. 식비는 70% 사용 중이에요.\n\n## 📉 지출 분석\n이번 달은 **식비**를 많이 쓰고 **문화생활**은 적게 사용했네요.\n\n## 📈 월평균 대비 분석\n전체적으로 지출이 안정적이에요! 식비만 조금 줄이면 더 좋겠어요.\n\n## 🔮 미래 예측\n이 추세라면 12월 말에는 약 **16,800,000원** 정도 남을 것 같아요!';
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
    const client = getOpenAIClient();
    const stream = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `너는 커플 가계부 앱의 지출 분석 AI야.
주어진 데이터를 바탕으로 친근하고 실용적인 분석을 제공해.

반드시 아래 5개 섹션을 순서대로 작성해:

## 📊 총정리
총수입 - 총지출 = 남은 금액을 한 줄로 정리

## 💰 예산 분석
설정된 예산 항목별로 배정 금액과 현재 사용률을 간단히 언급

## 📉 지출 분석
이번 달에 많이 쓴 카테고리와 적게 쓴 카테고리를 비교 분석

## 📈 월평균 대비 분석
전체적인 지출 추세를 바탕으로 이번 달 조절이 필요한 부분 제안

## 🔮 미래 예측
현재 추세가 연말까지 계속된다면 예상되는 연말 잔액 예측

규칙:
- 한국어로 작성
- 마크다운 포맷 사용 (##, -, **강조**)
- 각 섹션은 1~2문장으로 간결하게
- 비판적이지 않고 격려하는 톤
- 커플 맥락 반영 (공동 지출 vs 개인 지출 언급 시)
- 예산 데이터가 없으면 예산 분석 섹션은 "예산을 설정하면 더 정확한 분석이 가능해요!" 로 대체`,
        },
        {
          role: 'user',
          content: `${year}년 ${month}월 가계부 데이터를 분석해줘.

현재 날짜: ${year}년 ${month}월 (연말까지 ${12 - month}개월 남음)

총 수입: ${totalIncome.toLocaleString()}원
총 지출: ${totalExpense.toLocaleString()}원
남은 금액: ${(totalIncome - totalExpense).toLocaleString()}원

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
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text })}\n\n`
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
