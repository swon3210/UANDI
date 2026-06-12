import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import {
  PARSE_MODEL,
  buildSystemPrompt,
  parseResponseSchema,
  normalizeEntries,
  buildMockAttachmentEntries,
  detectedMonthsOf,
  type ImageKind,
  type ParsedEntry,
} from '@/lib/ai/parse-entries-core';

const requestSchema = z.object({
  attachments: z
    .array(
      z.object({
        id: z.string(),
        url: z.string().url(),
        kind: z.enum(['account', 'card']),
      })
    )
    .min(1)
    .max(10),
  categories: z.array(z.string()),
});

export type AttachmentSyncResult = {
  attachmentId: string;
  kind: ImageKind;
  detectedMonths: string[];
  imageKindMismatch: boolean;
  entries: ParsedEntry[];
};

async function analyzeOne(
  attachment: { id: string; url: string; kind: ImageKind },
  categories: string[],
  today: string,
  todayYear: number
): Promise<AttachmentSyncResult> {
  const client = getOpenAIClient();
  const systemPrompt = buildSystemPrompt({
    categories,
    imageKind: attachment.kind,
    hasImages: true,
    today,
    todayYear,
  });

  const completion = await client.chat.completions.create({
    model: PARSE_MODEL,
    max_completion_tokens: 16000,
    reasoning_effort: 'low',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: attachment.url, detail: 'high' } },
          { type: 'text', text: '첨부된 거래 내역을 파싱해줘.' },
        ],
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('빈 응답');

  const result = parseResponseSchema.parse(JSON.parse(content));
  const entries = normalizeEntries(result.entries);
  return {
    attachmentId: attachment.id,
    kind: attachment.kind,
    detectedMonths: detectedMonthsOf(entries),
    imageKindMismatch: result.imageKindMismatch ?? false,
    entries,
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
    return NextResponse.json({ error: '일일 사용 한도를 초과했습니다' }, { status: 429 });
  }

  const { attachments, categories } = parsed.data;

  if (process.env.USE_AI_MOCK === 'true') {
    const results: AttachmentSyncResult[] = attachments.map((a) => {
      const entries = normalizeEntries(buildMockAttachmentEntries(a.kind));
      return {
        attachmentId: a.id,
        kind: a.kind,
        detectedMonths: detectedMonthsOf(entries),
        imageKindMismatch: false,
        entries,
      };
    });
    return NextResponse.json({ results });
  }

  const todayDayjs = dayjs().startOf('day');
  const today = todayDayjs.format('YYYY-MM-DD');
  const todayYear = todayDayjs.year();

  try {
    // 이미지별로 개별 분석한다(이미지↔거래 귀속을 명확히 하기 위함). 동시 호출.
    const results = await Promise.all(
      attachments.map((a) => analyzeOne(a, categories, today, todayYear))
    );
    return NextResponse.json({ results });
  } catch (error) {
    console.error('[sync-attachments] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
