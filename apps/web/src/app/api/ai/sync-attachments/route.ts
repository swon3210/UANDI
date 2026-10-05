import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import { getAiPreferences } from '@/lib/ai/preferences-store';
import { buildParseRulesSection } from '@/lib/ai/preferences';
import {
  PARSE_MODEL,
  buildSystemPrompt,
  parseOutputSchema,
  fromParseOutput,
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
  todayYear: number,
  customRulesSection: string
): Promise<AttachmentSyncResult> {
  const client = getOpenAIClient();
  const systemPrompt = buildSystemPrompt({
    categories,
    imageKind: attachment.kind,
    hasImages: true,
    today,
    todayYear,
    customRulesSection,
  });

  const response = await client.responses.parse({
    model: PARSE_MODEL,
    store: false,
    max_output_tokens: 16000,
    reasoning: { effort: 'low' },
    instructions: systemPrompt,
    input: [
      {
        role: 'user',
        content: [
          // 거래내역 스크린샷 OCR → 원본 해상도 유지
          { type: 'input_image', image_url: attachment.url, detail: 'original' },
          { type: 'input_text', text: '첨부된 거래 내역을 파싱해줘.' },
        ],
      },
    ],
    text: { format: zodTextFormat(parseOutputSchema, 'parse_entries') },
  });

  if (!response.output_parsed) {
    throw new Error(`빈 응답 (status=${response.status})`);
  }

  const { entries, imageKindMismatch } = fromParseOutput(response.output_parsed);
  return {
    attachmentId: attachment.id,
    kind: attachment.kind,
    detectedMonths: detectedMonthsOf(entries),
    imageKindMismatch,
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

  const preferences = await getAiPreferences(authResult.coupleId);
  const customRulesSection = buildParseRulesSection(preferences.parseEntries);

  const todayDayjs = dayjs().startOf('day');
  const today = todayDayjs.format('YYYY-MM-DD');
  const todayYear = todayDayjs.year();

  try {
    // 이미지별로 개별 분석한다(이미지↔거래 귀속을 명확히 하기 위함). 동시 호출.
    const results = await Promise.all(
      attachments.map((a) => analyzeOne(a, categories, today, todayYear, customRulesSection))
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
