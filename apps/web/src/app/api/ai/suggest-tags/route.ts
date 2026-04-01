import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

const requestSchema = z.object({
  imageBase64: z.string().min(1),
  existingTags: z.array(z.string()),
});

const responseSchema = z.object({
  suggestedTags: z.array(z.string()),
});

const MOCK_RESPONSE = {
  suggestedTags: ['카페', '디저트', '데이트'],
};

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
    return NextResponse.json(MOCK_RESPONSE);
  }

  const { imageBase64, existingTags } = parsed.data;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `너는 사진 태그를 제안하는 AI야.
사진을 분석해서 적절한 한국어 태그 3~5개를 제안해.

기존에 사용된 태그 목록:
${existingTags.length > 0 ? existingTags.join(', ') : '(없음)'}

규칙:
- 기존 태그와 일관성 있게 (같은 대상이면 기존 태그명 재사용)
- 태그는 짧고 구체적으로 (1~3 단어)
- 한국어로 작성
- 반드시 아래 JSON 형식으로만 응답:
{ "suggestedTags": ["태그1", "태그2", "태그3"] }`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 },
            },
            { type: 'text', text: '이 사진에 적합한 태그를 제안해줘.' },
          ],
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
    console.error('[suggest-tags] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
