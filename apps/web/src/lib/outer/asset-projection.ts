// 재테크 자산 배분 비율 기반 미래 자산 추이 추정
//
// 가정:
// - 매달 `monthlyContributionKrw`를 현금/예적금/투자 비율대로 나눠 납입한다.
// - 시작 자산 `initialAssetKrw`도 동일 비율로 배분돼 있다고 본다.
// - 각 항목은 연 기대수익률(annualReturns)로 "월복리" 적립된다.
// - 납입은 매월 말 이뤄진다(기말 연금).

export type AssetBucketKey = 'cash' | 'savings' | 'investment';

export type AssetProjectionParams = {
  /** 현금/예적금/투자 비율(%) — 합 100 가정. 합이 0이면 빈 결과. */
  ratio: Record<AssetBucketKey, number>;
  initialAssetKrw: number;
  monthlyContributionKrw: number;
  /** 추정 기간(년) */
  years: number;
  /** 항목별 연 기대수익률(소수, 예: 0.07 = 7%) */
  annualReturns: Record<AssetBucketKey, number>;
};

export type AssetProjectionPoint = {
  year: number;
  cash: number;
  savings: number;
  investment: number;
  total: number;
};

const BUCKETS: AssetBucketKey[] = ['cash', 'savings', 'investment'];

// 월복리 + 기말 연금 미래가치. months=0이면 원금만 반환.
function futureValue(
  principal: number,
  monthlyContribution: number,
  monthlyRate: number,
  months: number
): number {
  if (months <= 0) return principal;
  if (monthlyRate === 0) return principal + monthlyContribution * months;
  const growth = Math.pow(1 + monthlyRate, months);
  return principal * growth + monthlyContribution * ((growth - 1) / monthlyRate);
}

export function projectAssetGrowth(params: AssetProjectionParams): AssetProjectionPoint[] {
  const { ratio, initialAssetKrw, monthlyContributionKrw, years, annualReturns } = params;
  const totalRatio = BUCKETS.reduce((sum, b) => sum + (ratio[b] || 0), 0);

  // 항목별 사전 계산: 비중, 초기 배분액, 월 납입액, 월 이율
  const perBucket = BUCKETS.map((b) => {
    const weight = totalRatio > 0 ? (ratio[b] || 0) / totalRatio : 0;
    const monthlyRate = Math.pow(1 + (annualReturns[b] || 0), 1 / 12) - 1;
    return {
      key: b,
      principal: initialAssetKrw * weight,
      monthly: monthlyContributionKrw * weight,
      monthlyRate,
    };
  });

  const points: AssetProjectionPoint[] = [];
  for (let year = 0; year <= years; year++) {
    const months = year * 12;
    const values = perBucket.map((pb) =>
      Math.round(futureValue(pb.principal, pb.monthly, pb.monthlyRate, months))
    );
    const [cash, savings, investment] = values;
    points.push({
      year,
      cash,
      savings,
      investment,
      total: cash + savings + investment,
    });
  }
  return points;
}

// 납입 원금 합계(초기 자산 + 매월 납입 × 개월수)
export function totalContributed(params: AssetProjectionParams): number {
  return params.initialAssetKrw + params.monthlyContributionKrw * params.years * 12;
}
