import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { z } from 'zod';
import type OpenAI from 'openai';
import { getOpenAIClient } from '@/lib/ai/openai';
import { verifyAuth } from '@/lib/ai/verify-auth';
import { checkAndIncrementUsage } from '@/lib/ai/rate-limit';

const imageDataUrlRegex = /^data:image\/(png|jpe?g|webp|gif);base64,/i;

// 한 요청에서 추출 가능한 최대 entry 수.
// 거래 내역 목록 스크린샷은 한 화면에 수십 건이 들어갈 수 있어 넉넉히 잡는다.
const MAX_ENTRIES = 100;

// OCR·자연어 파싱 모델. 거래 내역 스크린샷의 행 누락을 줄이기 위해 GPT-5 계열 사용.
// gpt-5-mini는 vision 입력을 지원하며, 추론 모델이라 max_tokens 대신
// max_completion_tokens / reasoning_effort 를 사용한다 (forex-outlook 라우트와 동일 패턴).
const PARSE_MODEL = 'gpt-5-mini';

const requestSchema = z
  .object({
    text: z.string().max(1000).optional(),
    categories: z.array(z.string()),
    images: z
      .array(z.string().regex(imageDataUrlRegex, '지원하지 않는 이미지 형식입니다'))
      .max(10)
      .optional(),
    // 첨부 이미지의 분류. 'account'(계좌/통장 내역)면 카드대금 일괄출금을 제외하고,
    // 'card'(카드 사용 내역)면 이미지가 실제 카드 내역인지 검증한다.
    imageKind: z.enum(['account', 'card']).optional(),
  })
  .refine((data) => (data.text?.trim().length ?? 0) > 0 || (data.images?.length ?? 0) > 0, {
    message: '텍스트 또는 이미지 중 하나는 반드시 포함되어야 합니다',
  });

const parsedEntrySchema = z.object({
  type: z.enum(['income', 'expense', 'flex']),
  amount: z.number().positive(),
  category: z.string(),
  description: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date는 YYYY-MM-DD 형식이어야 합니다'),
  confidence: z.number().min(0).max(1),
});

const responseSchema = z.object({
  entries: z.array(parsedEntrySchema).min(1).max(MAX_ENTRIES),
  // imageKind='card'로 첨부했지만 카드 내역이 아니라고 판단되면 true.
  imageKindMismatch: z.boolean().optional(),
});

function buildMockResponse(
  text: string | undefined,
  imagesCount: number,
  imageKind?: 'account' | 'card'
) {
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const textSegments = (text ?? '')
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
  const count = Math.min(Math.max(textSegments + imagesCount, 1), MAX_ENTRIES);

  const templates = [
    {
      type: 'expense' as const,
      amount: 9000,
      category: '식비',
      description: '김치찌개',
      date: today,
      confidence: 0.95,
    },
    {
      type: 'expense' as const,
      amount: 15000,
      category: '교통',
      description: '택시',
      date: yesterday,
      confidence: 0.9,
    },
    {
      type: 'income' as const,
      amount: 3500000,
      category: '정기급여',
      description: '월급',
      date: today,
      confidence: 0.98,
    },
  ];

  return {
    entries: Array.from({ length: count }, (_, i) => templates[i % templates.length]),
    // 테스트용 결정적 신호: 카드 분류인데 입력 텍스트에 'mismatch'가 있으면 불일치로 간주.
    imageKindMismatch: imageKind === 'card' && (text ?? '').includes('mismatch'),
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

  const { text, categories, images, imageKind } = parsed.data;
  const hasImages = (images?.length ?? 0) > 0;

  if (process.env.USE_AI_MOCK === 'true') {
    return NextResponse.json(buildMockResponse(text, images?.length ?? 0, imageKind));
  }

  const todayDayjs = dayjs().startOf('day');
  const today = todayDayjs.format('YYYY-MM-DD');
  const todayYear = todayDayjs.year();

  // 첨부 이미지에 분류가 지정된 경우에만 추가하는 규칙.
  // 계좌(통장) 내역이면 카드대금 일괄출금을 제외해 카드 내역과의 이중 집계를 막고,
  // 카드 내역이면 이미지가 실제 카드 사용 내역인지 검증한다.
  const imageKindSection =
    imageKind && hasImages
      ? imageKind === 'account'
        ? `
[이미지 분류 — 계좌(통장) 거래 내역]
첨부된 이미지는 은행 계좌/통장의 거래 내역이다.
신용카드 청구대금이 한 번에 빠져나가는 출금 행("OO카드", "카드대금", "신용카드", "체크카드 정산", 카드사명(예: 신한/삼성/현대/국민 등)으로 표시된 자동이체·출금)은
개별 소비가 아니라 카드 내역에서 따로 집계되므로 **절대 entry로 만들지 마라(이중 집계 방지)**.
그 외 일반 소비·이체·급여·이자 등 거래는 정상적으로 추출한다.

[이미지 종류 검증]
첨부 이미지가 계좌/통장 거래 내역이 아니라 명백히 다른 종류(예: 카드 사용 내역, 일반 사진)면 응답 JSON 최상위에 "imageKindMismatch": true 를 포함해라. 일치하거나 판단이 애매하면 생략하거나 false.`
        : `
[이미지 분류 — 신용/체크카드 사용 내역]
첨부된 이미지는 신용/체크카드 사용(승인) 내역이어야 한다. 화면에 보이는 카드 사용 한 건마다 개별 entry로 추출한다.

[이미지 종류 검증]
첨부 이미지가 카드 사용 내역이 아니라 명백히 다른 종류(예: 계좌/통장 거래 내역, 일반 사진)면 응답 JSON 최상위에 "imageKindMismatch": true 를 포함해라. 일치하거나 판단이 애매하면 생략하거나 false.`
      : '';

  const systemPrompt = `너는 자연어와 영수증 이미지를 구조화된 JSON으로 변환하는 가계부 파서야.

[절대 규칙 — 날짜]
오늘 날짜는 반드시 ${today} 다. 이것은 절대적 사실이며, 네가 학습한 어떤 날짜보다 우선한다.
사용자 입력에 연도가 명시되지 않았다면 무조건 ${todayYear}년을 사용해.
상대 표현("오늘", "어제", "그제", "이번주")은 반드시 ${today}를 기준으로 계산해.
이유 없이 과거 연도(특히 2023, 2024)를 date에 넣지 마.

사용 가능한 카테고리 목록:
${categories.join(', ')}

입력 구성:
- 텍스트: 여러 줄/쉼표/"그리고" 등으로 구분된 여러 건이 포함될 수 있음
- 이미지: 영수증 사진이거나, 카드/계좌의 거래 내역 목록 화면(스크린샷)일 수 있음
  - **단일 영수증 사진**: 여러 품목이 찍혀 있어도 영수증 1장 = entry 1개로 합쳐서 처리 (description에 상호명 + 대표 품목 요약)
  - **거래 내역 목록 화면**(카드 사용 내역, 통장/계좌 거래 내역 등 여러 거래가 행으로 나열된 화면): 화면에 보이는 **거래 한 건(한 행)마다 개별 entry를 만든다.** 한 화면에 20건이 보이면 20개의 entry를 생성하고, 절대 하나로 합치거나 일부만 추리지 마.
    - 각 행에서 가맹점/상호명 → description, 결제 금액 → amount, 거래 날짜 → date 로 추출
    - 합계·잔액·청구예정·카드번호·기간표시처럼 개별 거래가 아닌 행은 entry로 만들지 않는다
    - 승인취소된 거래는 제외한다
  - 날짜가 화면/영수증에 보이면 그 날짜를 사용하고, 없거나 인식 불가하면 오늘 날짜(${today}) 사용
  - 단, 인쇄된 날짜가 오늘보다 6개월 이상 과거라면 인식 오류 가능성이 있으므로 confidence 0.5 이하로 낮춤

텍스트와 이미지가 함께 오면 **둘을 합쳐서 하나의 entries 배열**로 응답해. 다른 텍스트는 절대 포함하지 마.

{
  "entries": [
    {
      "type": "income" | "expense" | "flex",
      "amount": number,
      "category": "카테고리 목록에서 가장 적합한 것",
      "description": "항목 설명 (영수증이면 상호명 + 대표 품목)",
      "date": "YYYY-MM-DD",
      "confidence": 0.0 ~ 1.0
    }
  ]
}

규칙:
- 최소 1개, 최대 ${MAX_ENTRIES}개의 entry를 생성 (거래 내역 목록 화면이면 보이는 거래를 빠짐없이 추출하되 ${MAX_ENTRIES}건은 넘지 않도록)
- amount는 반드시 양의 정수 (원 단위)
- "만원"은 10000, "천원"은 1000으로 변환
- date가 명시되지 않으면 반드시 오늘 날짜(${today})를 사용
- category는 반드시 제공된 목록에서 선택. 매칭되는 것이 없으면 가장 유사한 것 선택
- confidence는 파싱 확실도 (영수증이 흐리거나 정보가 불명확할수록 낮게)
- 영수증 이미지가 가계부 영수증이 아니거나 금액을 전혀 읽을 수 없으면 confidence 0.3 이하로 설정${imageKindSection}`;

  try {
    const client = getOpenAIClient();

    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    if (hasImages) {
      for (const url of images ?? []) {
        userContent.push({ type: 'image_url', image_url: { url, detail: 'high' } });
      }
    }
    const userText = text?.trim() || (hasImages ? '첨부된 영수증을 파싱해줘.' : '');
    if (userText) {
      userContent.push({ type: 'text', text: userText });
    }

    const completion = await client.chat.completions.create({
      model: PARSE_MODEL,
      // 추론 토큰 + 최대 100건 JSON 출력을 모두 수용하도록 넉넉히 확보
      max_completion_tokens: 16000,
      // OCR/추출 위주 작업이라 낮은 추론 강도로도 충분 (필요 시 'medium'까지 상향)
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: hasImages ? userContent : userText,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AI 응답을 처리할 수 없습니다' }, { status: 500 });
    }

    const result = responseSchema.parse(JSON.parse(content));

    const minAllowed = todayDayjs.subtract(2, 'year');
    const maxAllowed = todayDayjs.add(1, 'day');
    const normalizedEntries = result.entries.map((entry) => {
      const d = dayjs(entry.date);
      if (!d.isValid() || d.isBefore(minAllowed) || d.isAfter(maxAllowed)) {
        return {
          ...entry,
          date: today,
          confidence: Math.min(entry.confidence, 0.5),
        };
      }
      return entry;
    });

    return NextResponse.json({
      entries: normalizedEntries,
      imageKindMismatch: result.imageKindMismatch ?? false,
    });
  } catch (error) {
    console.error('[parse-entries] AI 호출 실패:', error);
    return NextResponse.json(
      { error: 'AI 서비스에 일시적인 문제가 발생했습니다' },
      { status: 500 }
    );
  }
}
