import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@uandi/ui';
import {
  type ForexIndicators,
  type SupportedCurrency,
  getDisplayRate,
} from '@uandi/investment-core';

type Props = {
  indicators: ForexIndicators;
  currency: SupportedCurrency;
};

type IndicatorMeta = {
  key: 'ma20' | 'ma60' | 'rsi14' | 'percentile52w';
  label: string;
  glossary: string;
  description: string;
};

const INDICATOR_META: IndicatorMeta[] = [
  {
    key: 'ma20',
    label: '20일 평균',
    glossary: 'MA20 — 20일 단순 이동평균',
    description:
      '최근 20영업일 환율의 평균이에요. 현재가가 이보다 높으면 단기적으로 비싼 편, 낮으면 싼 편이라는 신호로 봅니다.',
  },
  {
    key: 'ma60',
    label: '60일 평균',
    glossary: 'MA60 — 60일 단순 이동평균',
    description:
      '최근 60영업일 환율의 평균이에요. 더 긴 흐름을 보여주어 추세 판단에 도움이 됩니다. 20일 평균이 60일 평균을 위로 뚫고 올라가면 상승 추세 신호로 해석합니다.',
  },
  {
    key: 'rsi14',
    label: '단기 과열도',
    glossary: 'RSI(14) — 상대강도지수 (14일)',
    description:
      '최근 14일 동안 가격이 얼마나 과열·과매도 상태인지 0~100 사이로 나타내요. 70 이상이면 과열(곧 떨어질 가능성), 30 이하면 과매도(곧 오를 가능성)로 해석합니다.',
  },
  {
    key: 'percentile52w',
    label: '1년 중 위치',
    glossary: '52주 백분위',
    description:
      '지난 1년간(약 252영업일) 환율을 0~100%로 줄세웠을 때 현재가의 위치예요. 25% 이하면 1년 중 저점에 가깝고, 75% 이상이면 고점에 가깝습니다.',
  },
];

function formatRate(value: number | null, currency: SupportedCurrency): string {
  if (value === null) return '—';
  return `${getDisplayRate(value, currency).toFixed(2)}원`;
}

function formatNumber(value: number | null, digits = 1): string {
  if (value === null) return '—';
  return value.toFixed(digits);
}

function getValue(
  key: IndicatorMeta['key'],
  indicators: ForexIndicators,
  currency: SupportedCurrency
): string {
  switch (key) {
    case 'ma20':
      return formatRate(indicators.ma20, currency);
    case 'ma60':
      return formatRate(indicators.ma60, currency);
    case 'rsi14':
      return formatNumber(indicators.rsi14, 1);
    case 'percentile52w':
      return indicators.percentile52w === null
        ? '—'
        : `${indicators.percentile52w.toFixed(0)}%`;
  }
}

export function IndicatorPanel({ indicators, currency }: Props) {
  return (
    <div
      data-testid="indicator-panel"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        지표
      </h3>
      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
        {INDICATOR_META.map((meta) => (
          <div key={meta.key} className="flex items-baseline justify-between gap-2">
            <dt className="flex items-center gap-1 text-muted-foreground">
              <span>{meta.label}</span>
              <Popover>
                <PopoverTrigger
                  data-testid={`indicator-help-${meta.key}`}
                  aria-label={`${meta.label} 설명`}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground/70 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <HelpCircle size={14} />
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  className="w-64 text-sm leading-relaxed"
                >
                  <p className="font-semibold">{meta.label}</p>
                  <p className="mt-1 text-muted-foreground">{meta.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground/80">
                    원래 용어: {meta.glossary}
                  </p>
                </PopoverContent>
              </Popover>
            </dt>
            <dd className="font-semibold tabular-nums">{getValue(meta.key, indicators, currency)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
