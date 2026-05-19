import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';
import {
  RANGE_DAYS,
  buildFrankfurterRangeUrl,
  isForexRange,
  isSupportedCurrency,
  parseFrankfurterRange,
} from '@uandi/investment-core';

const FIFTEEN_MINUTES = 15 * 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get('currency') ?? '';
  const range = searchParams.get('range') ?? '';

  if (!isSupportedCurrency(currency)) {
    return NextResponse.json(
      { error: '지원하지 않는 통화입니다' },
      { status: 400 }
    );
  }
  if (!isForexRange(range)) {
    return NextResponse.json({ error: '잘못된 기간입니다' }, { status: 400 });
  }

  const endDate = dayjs().format('YYYY-MM-DD');
  const startDate = dayjs()
    .subtract(RANGE_DAYS[range] + 10, 'day')
    .format('YYYY-MM-DD');
  const url = buildFrankfurterRangeUrl(currency, startDate, endDate);

  try {
    const res = await fetch(url, { next: { revalidate: FIFTEEN_MINUTES } });
    if (!res.ok) {
      return NextResponse.json(
        { error: '환율 데이터를 가져올 수 없습니다' },
        { status: 503 }
      );
    }
    const data = await res.json();
    const payload = parseFrankfurterRange(currency, data, new Date().toISOString());

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': `public, s-maxage=${FIFTEEN_MINUTES}, stale-while-revalidate=${FIFTEEN_MINUTES}`,
      },
    });
  } catch (error) {
    console.error('[forex/rates] 호출 실패:', error);
    return NextResponse.json(
      { error: '환율 데이터를 가져올 수 없습니다' },
      { status: 503 }
    );
  }
}
