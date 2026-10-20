import { getAuth } from '@/lib/firebase/config';
import type { CashbookEntryType } from '@/types';
import type { CategoryHint } from '@/utils/category-hints';
import type { LlmPrediction } from '@/utils/cashflow';

async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = getAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── 자연어 가계부 다건 파싱 ──

export type ParsedEntry = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
  /** 계좌 내역 중 단순 송금으로 판단된 항목(확인 필요 그룹). 카드 내역은 항상 false/undefined. */
  isTransfer?: boolean;
};

export type SettlementImageKind = 'account' | 'card';

/** 일괄 분석 — 첨부 이미지 1장당 결과 */
export type AttachmentSyncResult = {
  attachmentId: string;
  kind: SettlementImageKind;
  detectedMonths: string[];
  imageKindMismatch: boolean;
  entries: ParsedEntry[];
};

/**
 * 결산 첨부 이미지 전체를 한 번에 분석한다.
 * 서버가 이미지 URL을 OpenAI vision에 직접 전달하므로 base64 재인코딩이 필요 없다.
 */
export async function syncAttachments(
  attachments: { id: string; url: string; kind: SettlementImageKind }[],
  categories: string[],
  categoryHints?: CategoryHint[]
): Promise<AttachmentSyncResult[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/sync-attachments', {
    method: 'POST',
    headers,
    body: JSON.stringify({ attachments, categories, categoryHints }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? '이미지 분석에 실패했습니다');
  }

  const { results } = (await res.json()) as { results: AttachmentSyncResult[] };
  return results;
}

export type ParseEntriesOptions = {
  /** 첨부 이미지 분류. 'account'면 카드대금 일괄출금 제외, 'card'면 카드 내역 검증. */
  imageKind?: 'account' | 'card';
  /** imageKind='card'인데 첨부 이미지가 카드 내역이 아니라고 판단됐을 때 호출된다. */
  onImageKindMismatch?: () => void;
  /** 과거 내역 기반 "설명 → 카테고리" 힌트(useCategoryHints). 비슷한 설명의 새 내역 분류에 쓰인다. */
  categoryHints?: CategoryHint[];
  /** 이용내역서 PDF. 클라이언트가 페이지별로 렌더링한 이미지 data URL 묶음. */
  pdfs?: ParsedPdfAttachment[];
};

export type ParsedPdfAttachment = {
  name: string;
  /** 페이지별 렌더링 이미지(data URL) */
  pages: string[];
};

export async function parseEntriesFromText(
  text: string,
  categories: string[],
  images?: string[],
  options?: ParseEntriesOptions
): Promise<ParsedEntry[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/parse-entries', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      text,
      categories,
      images,
      imageKind: options?.imageKind,
      categoryHints: options?.categoryHints,
      pdfs: options?.pdfs,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? 'AI 파싱에 실패했습니다');
  }

  const { entries, imageKindMismatch } = (await res.json()) as {
    entries: ParsedEntry[];
    imageKindMismatch?: boolean;
  };
  if (imageKindMismatch) options?.onImageKindMismatch?.();
  return entries;
}

// ── 사진 태그 제안 ──

export type SuggestedTags = {
  suggestedTags: string[];
};

export async function suggestPhotoTags(
  imageBase64: string,
  existingTags: string[]
): Promise<SuggestedTags> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/suggest-tags', {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64, existingTags }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? '태그 제안에 실패했습니다');
  }

  return res.json();
}

// ── 지출 분석 (스트리밍) ──

export type AnalyzeSpendingParams = {
  entries: {
    type: CashbookEntryType;
    amount: number;
    category: string;
    date: string;
    description: string;
  }[];
  year: number;
  month: number;
  budget?: {
    categoryId: string;
    budgetAmount: number;
    category: string;
  }[];
};

// ── 현금흐름 LLM 예측 ──

export type PredictCashflowParams = {
  entries: {
    type: CashbookEntryType;
    amount: number;
    category: string;
    date: string;
    description: string;
  }[];
  horizonStart: string;
  horizonEnd: string;
  declaredCategories: string[];
  categories: string[];
};

/** 과거 패턴 기반 예상 지출/수입을 LLM으로 추정한다(표시 전용, 잔액 미반영). */
export async function predictCashflow(params: PredictCashflowParams): Promise<LlmPrediction[]> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/predict-cashflow', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? 'AI 예측에 실패했습니다');
  }

  const { predictions } = (await res.json()) as { predictions: LlmPrediction[] };
  return predictions;
}

/** `data: {"text"}` SSE 응답을 텍스트 청크로 풀어낸다. `[DONE]`에서 끝난다. */
async function* readSseText(res: Response): AsyncGenerator<string> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error('스트리밍을 시작할 수 없습니다');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) yield parsed.text as string;
      } catch {
        // JSON 파싱 실패 시 무시
      }
    }
  }
}

export async function analyzeSpending(
  params: AnalyzeSpendingParams,
  onChunk: (text: string) => void
): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/analyze-spending', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? '지출 분석에 실패했습니다');
  }

  for await (const text of readSseText(res)) onChunk(text);
}

// ── 카테고리 AI 분석 (대시보드 "평소와 비교" 드릴다운) ──

export type CategoryAnalysisParams = {
  category: string;
  group: 'expense' | 'income';
  year: number;
  month: number; // 1~12
  current: {
    amount: number;
    count: number;
    entries: { date: string; amount: number; description: string }[];
  };
  /** 직전 달들, 오래된 순 */
  history: { year: number; month: number; amount: number; count: number }[];
  /** 표본 부족이면 null */
  median: number | null;
};

/** 카테고리 분석 보고서를 텍스트 청크 스트림으로 받는다 (streamedQuery용). */
export async function* streamCategoryAnalysis(
  params: CategoryAnalysisParams
): AsyncGenerator<string> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/analyze-category', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? '카테고리 분석에 실패했습니다');
  }

  yield* readSseText(res);
}
