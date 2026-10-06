import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { parseEntriesWithModel } from '@/lib/ai/parse-entries-llm';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';
import { getAiPreferences } from '@/lib/ai/preferences-store';
import { buildParseRulesSection } from '@/lib/ai/preferences';
import {
  buildSystemPrompt,
  categoryHintsSchema,
  normalizeEntries,
  buildMockAttachmentEntries,
  detectedMonthsOf,
  type CategoryHint,
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
  // 과거 내역 기반 "설명 → 카테고리" 힌트(클라이언트가 마지막 내역 기준 3개월에서 추출).
  categoryHints: categoryHintsSchema.optional(),
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
  customRulesSection: string,
  categoryHints: CategoryHint[] | undefined
): Promise<AttachmentSyncResult> {
  const client = getOpenAIClient();
  const systemPrompt = buildSystemPrompt({
    categories,
    imageKind: attachment.kind,
    hasImages: true,
    today,
    todayYear,
    customRulesSection,
    categoryHints,
  });

  const { entries, imageKindMismatch } = await parseEntriesWithModel({
    client,
    systemPrompt,
    imageUrl: attachment.url,
    text: '첨부된 거래 내역을 파싱해줘.',
    tag: 'sync-attachments',
  });
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

  const { attachments, categories, categoryHints } = parsed.data;

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
      attachments.map((a) =>
        analyzeOne(a, categories, today, todayYear, customRulesSection, categoryHints)
      )
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
