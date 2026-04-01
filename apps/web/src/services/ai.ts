import { getAuth } from '@/lib/firebase/config';
import type { CashbookEntryType } from '@/types';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = getAuth().currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── 자연어 가계부 파싱 ──

export type ParsedEntry = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

export async function parseEntryFromText(
  text: string,
  categories: string[]
): Promise<ParsedEntry> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/ai/parse-entry', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, categories }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error ?? 'AI 파싱에 실패했습니다');
  }

  return res.json();
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
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) onChunk(parsed.text);
        } catch {
          // JSON 파싱 실패 시 무시
        }
      }
    }
  }
}
