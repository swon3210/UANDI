import type { CashbookEntryType } from '@uandi/cashbook-core';
import { auth } from './firebase';

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL ?? '';

export type ParsedEntry = {
  type: CashbookEntryType;
  amount: number;
  category: string;
  description: string;
  date: string;
  confidence: number;
};

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function parseEntryFromText(
  text: string,
  categories: string[]
): Promise<ParsedEntry> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${WEB_APP_URL}/api/ai/parse-entry`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, categories }),
  });

  if (!res.ok) {
    let message = 'AI 파싱에 실패했습니다';
    try {
      const error = await res.json();
      if (error.error) message = error.error;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(message);
  }

  return res.json();
}
