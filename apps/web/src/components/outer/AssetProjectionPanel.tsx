'use client';

import { useState } from 'react';
import { AssetGrowthChart, Input, Label, Slider } from '@uandi/ui';
import {
  projectAssetGrowth,
  totalContributed,
  type AssetBucketKey,
} from '@/lib/outer/asset-projection';

type Ratio = Record<AssetBucketKey, number>;

type AssetProjectionPanelProps = {
  /** 현재(라이브) 예적금/주식/부동산/코인/외환 비율(%) */
  ratio: Ratio;
};

const RETURN_FIELDS: { key: AssetBucketKey; label: string; dotClass: string }[] = [
  { key: 'savings', label: '예적금', dotClass: 'bg-emerald-500' },
  { key: 'stocks', label: '주식', dotClass: 'bg-indigo-500' },
  { key: 'realEstate', label: '부동산', dotClass: 'bg-amber-500' },
  { key: 'crypto', label: '코인', dotClass: 'bg-fuchsia-500' },
  { key: 'forex', label: '외환', dotClass: 'bg-sky-500' },
];

// 기본 연 기대수익률(%) — 자산군별 보수적 추정치
const DEFAULT_RETURNS: Ratio = {
  savings: 3.5,
  stocks: 7,
  realEstate: 4,
  crypto: 10,
  forex: 2,
};

function formatKrw(n: number): string {
  return `₩${Math.round(n).toLocaleString('ko-KR')}`;
}

function parseAmount(raw: string): number {
  const n = Number(raw.replace(/[^0-9]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function AssetProjectionPanel({ ratio }: AssetProjectionPanelProps) {
  const [initialAssetKrw, setInitialAssetKrw] = useState(0);
  const [monthlyContributionKrw, setMonthlyContributionKrw] = useState(1_000_000);
  const [years, setYears] = useState(10);
  const [returns, setReturns] = useState<Ratio>(DEFAULT_RETURNS);

  const params = {
    ratio,
    initialAssetKrw,
    monthlyContributionKrw,
    years,
    annualReturns: {
      savings: returns.savings / 100,
      stocks: returns.stocks / 100,
      realEstate: returns.realEstate / 100,
      crypto: returns.crypto / 100,
      forex: returns.forex / 100,
    },
  };

  const data = projectAssetGrowth(params);
  const projectedTotal = data[data.length - 1]?.total ?? 0;
  const principal = totalContributed(params);
  const profit = projectedTotal - principal;

  return (
    <section className="space-y-5" data-testid="asset-projection-panel">
      <div>
        <h2 className="text-base font-semibold">미래 자산 추이</h2>
        <p className="text-xs text-muted-foreground">
          설정한 비율대로 매달 납입한다고 가정했을 때의 예상 자산이에요. 실제 수익을 보장하지
          않아요.
        </p>
      </div>

      {/* 입력 */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="projection-initial">시작 자산</Label>
            <Input
              id="projection-initial"
              data-testid="projection-input-initial"
              inputMode="numeric"
              value={initialAssetKrw === 0 ? '' : initialAssetKrw}
              placeholder="0"
              onChange={(e) => setInitialAssetKrw(parseAmount(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projection-monthly">월 납입액</Label>
            <Input
              id="projection-monthly"
              data-testid="projection-input-monthly"
              inputMode="numeric"
              value={monthlyContributionKrw === 0 ? '' : monthlyContributionKrw}
              placeholder="0"
              onChange={(e) => setMonthlyContributionKrw(parseAmount(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>투자 기간</Label>
            <span className="text-sm font-medium tabular-nums" data-testid="projection-years-value">
              {years}년
            </span>
          </div>
          <Slider
            min={1}
            max={30}
            step={1}
            value={[years]}
            onValueChange={([v]) => setYears(v)}
            aria-label="투자 기간"
          />
        </div>

        <div className="space-y-3 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground">연 기대수익률</p>
          {RETURN_FIELDS.map(({ key, label, dotClass }) => (
            <div key={key} className="space-y-2" data-testid={`projection-return-row-${key}`}>
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
                  {label}
                </Label>
                <span className="text-sm tabular-nums" data-testid={`projection-return-${key}`}>
                  {returns[key]}%
                </span>
              </div>
              <Slider
                min={0}
                max={15}
                step={0.5}
                value={[returns[key]]}
                onValueChange={([v]) => setReturns((prev) => ({ ...prev, [key]: v }))}
                aria-label={`${label} 연 기대수익률`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 결과 요약 */}
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs text-muted-foreground">{years}년 후 예상 자산</p>
        <p className="text-2xl font-bold tabular-nums" data-testid="projection-result">
          {formatKrw(projectedTotal)}
        </p>
        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>
            납입 원금 <span className="tabular-nums">{formatKrw(principal)}</span>
          </span>
          <span className="text-emerald-600">
            예상 수익 <span className="tabular-nums">+{formatKrw(profit)}</span>
          </span>
        </div>
      </div>

      <AssetGrowthChart data={data} />
    </section>
  );
}
