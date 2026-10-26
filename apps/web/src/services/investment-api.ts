import { getAuth } from '@/lib/firebase/config';
import type { StockQuotesResponse } from '@/utils/stock-portfolio';
import type { AptTradesResponse } from '@/utils/apt-trades';
import type { SavingsAccountInput, StockHoldingInput } from '@/types';

async function getAuthHeaders(): Promise<HeadersInit> {
  const auth = getAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error('NOT_AUTHENTICATED');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await user.getIdToken()}`,
  };
}

async function readError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => ({}));
  return new Error(body.error ?? fallback);
}

export async function fetchStockQuotes(keys: string[]): Promise<StockQuotesResponse> {
  const res = await fetch(`/api/investment/quotes?symbols=${encodeURIComponent(keys.join(','))}`);
  if (!res.ok) throw await readError(res, '시세를 가져올 수 없습니다');
  return res.json();
}

export async function fetchAptTrades(lawdCd: string, aptName: string): Promise<AptTradesResponse> {
  const params = new URLSearchParams({ lawdCd, aptName });
  const res = await fetch(`/api/investment/apt-trades?${params}`);
  if (!res.ok) throw await readError(res, '실거래가를 가져올 수 없어요');
  return res.json();
}

// ── AI 캡처 파싱 ──

export type ParsedSavingsProduct = {
  isSavingsProduct: boolean;
  product: Pick<
    SavingsAccountInput,
    'name' | 'bank' | 'productType' | 'interestMethod' | 'depositCycle' | 'taxType'
  > & {
    interestRate: number | null;
    termMonths: number | null;
    startDate: string | null;
    maturityDate: string | null;
    depositAmount: number | null;
    depositDay: number | null;
  };
};

export async function parseSavingsScreenshot(image: string): Promise<ParsedSavingsProduct> {
  const res = await fetch('/api/ai/parse-savings', {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw await readError(res, '캡처를 분석하지 못했어요');
  return res.json();
}

export type ParsedStockHoldings = {
  isHoldingsScreen: boolean;
  holdings: StockHoldingInput[];
};

export async function parseStockHoldingsScreenshot(image: string): Promise<ParsedStockHoldings> {
  const res = await fetch('/api/ai/parse-stock-holdings', {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({ image }),
  });
  if (!res.ok) throw await readError(res, '캡처를 분석하지 못했어요');
  return res.json();
}
