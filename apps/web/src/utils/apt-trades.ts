// 아파트 실거래 → 현재 시세 산출 (docs/pages/outer/investment.md §2).

export type AptTrade = {
  aptName: string;
  dong: string;
  /** 전용면적 ㎡ */
  area: number;
  /** 거래금액 (원) */
  price: number;
  /** 계약일 YYYY-MM-DD */
  date: string;
  floor: number | null;
};

export type AptTradesResponse = {
  trades: AptTrade[];
  fetchedAt: string;
};

export type AptAreaOption = {
  area: number;
  dong: string;
  count: number;
  latest: AptTrade;
};

const AREA_TOLERANCE = 1;

/** 같은 면적끼리 묶어 평형 선택지로 만든다 (최근 거래순 정렬된 거래 기준). */
export function groupTradesByArea(trades: AptTrade[]): AptAreaOption[] {
  const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));
  const options: AptAreaOption[] = [];
  for (const trade of sorted) {
    const existing = options.find(
      (o) => Math.abs(o.area - trade.area) < 0.5 && o.latest.aptName === trade.aptName
    );
    if (existing) existing.count++;
    else options.push({ area: trade.area, dong: trade.dong, count: 1, latest: trade });
  }
  return options.sort((a, b) => a.area - b.area);
}

export type AptMarketPrice = {
  price: number;
  /** 시세 산출에 쓴 가장 최근 거래 */
  latest: AptTrade;
  sampleSize: number;
};

/** 전용면적 ±1㎡ 거래 중 최근 3건의 중앙값을 현재 시세로 사용한다. */
export function estimateMarketPrice(
  trades: AptTrade[],
  exclusiveArea: number
): AptMarketPrice | null {
  const matched = trades
    .filter((t) => Math.abs(t.area - exclusiveArea) <= AREA_TOLERANCE)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  if (matched.length === 0) return null;

  const prices = matched.map((t) => t.price).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const price = prices.length % 2 === 1 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2;
  return { price, latest: matched[0], sampleSize: matched.length };
}

/** 단지명 비교용 정규화 (공백·괄호·"아파트" 접미사 제거) */
export function normalizeAptName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/아파트$/, '')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** 금액을 "18억 5,000만원" 형태로 */
export function formatEokMan(won: number): string {
  const sign = won < 0 ? '-' : '';
  const man = Math.round(Math.abs(won) / 10_000);
  const eok = Math.floor(man / 10_000);
  const rest = man % 10_000;
  if (eok === 0) return `${sign}${rest.toLocaleString('ko-KR')}만원`;
  if (rest === 0) return `${sign}${eok}억원`;
  return `${sign}${eok}억 ${rest.toLocaleString('ko-KR')}만원`;
}
