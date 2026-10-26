import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import { normalizeAptName, type AptTrade, type AptTradesResponse } from '@/utils/apt-trades';

// 국토교통부 아파트 매매 실거래가 (공공데이터포털). DATA_GO_KR_API_KEY는 "Decoding" 키를 넣는다.
const ENDPOINT = 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade';
const ONE_DAY = 24 * 60 * 60;
const DEFAULT_MONTHS = 6;

type RawTrade = {
  aptNm?: string;
  umdNm?: string;
  excluUseAr?: string | number;
  dealAmount?: string | number;
  dealYear?: string | number;
  dealMonth?: string | number;
  dealDay?: string | number;
  floor?: string | number;
  cdealType?: string;
};

async function fetchMonth(apiKey: string, lawdCd: string, ym: string): Promise<RawTrade[]> {
  const url = new URL(ENDPOINT);
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('LAWD_CD', lawdCd);
  url.searchParams.set('DEAL_YMD', ym);
  url.searchParams.set('numOfRows', '1000');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('_type', 'json');

  // 실거래 신고는 하루 단위로 갱신되므로 1일 캐시 ("1일 기준 실거래가")
  const res = await fetch(url, { next: { revalidate: ONE_DAY } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const code = data?.response?.header?.resultCode;
  if (code !== '00' && code !== '000') {
    throw new Error(`API ${code}: ${data?.response?.header?.resultMsg ?? ''}`);
  }
  const items = data?.response?.body?.items?.item ?? [];
  return Array.isArray(items) ? items : [items];
}

function toTrade(raw: RawTrade): AptTrade | null {
  if (typeof raw.cdealType === 'string' && raw.cdealType.trim() === 'O') return null; // 해제 거래
  const amountMan = Number(String(raw.dealAmount ?? '').replace(/,/g, ''));
  const area = Number(raw.excluUseAr);
  if (!raw.aptNm || !amountMan || !area) return null;
  const date = dayjs(
    `${raw.dealYear}-${String(raw.dealMonth).padStart(2, '0')}-${String(raw.dealDay).padStart(2, '0')}`
  );
  const floor = Number(raw.floor);
  return {
    aptName: String(raw.aptNm).trim(),
    dong: String(raw.umdNm ?? '').trim(),
    area,
    price: amountMan * 10_000,
    date: date.isValid() ? date.format('YYYY-MM-DD') : '',
    floor: Number.isFinite(floor) ? floor : null,
  };
}

// GET /api/investment/apt-trades?lawdCd=11710&aptName=헬리오시티
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lawdCd = searchParams.get('lawdCd') ?? '';
  const aptName = (searchParams.get('aptName') ?? '').trim();

  if (!/^\d{5}$/.test(lawdCd) || aptName.length < 2 || aptName.length > 50) {
    return NextResponse.json({ error: '지역과 아파트명을 확인해 주세요' }, { status: 400 });
  }

  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: '실거래가 API가 설정되지 않았어요', code: 'NO_API_KEY' },
      { status: 503 }
    );
  }

  const months = Array.from({ length: DEFAULT_MONTHS }, (_, i) =>
    dayjs().subtract(i, 'month').format('YYYYMM')
  );
  const query = normalizeAptName(aptName);

  try {
    const monthly = await Promise.all(months.map((ym) => fetchMonth(apiKey, lawdCd, ym)));
    const trades = monthly
      .flat()
      .map(toTrade)
      .filter((t): t is AptTrade => t !== null && normalizeAptName(t.aptName).includes(query))
      .sort((a, b) => b.date.localeCompare(a.date));

    const payload: AptTradesResponse = { trades, fetchedAt: new Date().toISOString() };
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_DAY}`,
      },
    });
  } catch (error) {
    console.error('[investment/apt-trades] 호출 실패:', error);
    return NextResponse.json({ error: '실거래가를 가져올 수 없어요' }, { status: 503 });
  }
}
