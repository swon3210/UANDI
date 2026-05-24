import { ArrowDownRight, ArrowRight, ArrowUpRight, HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger, cn } from '@uandi/ui';
import {
  type ForexIndicators,
  type ForexTrend,
  type SupportedCurrency,
  TREND_LABEL,
  getDisplayRate,
} from '@uandi/investment-core';

type Props = {
  indicators: ForexIndicators;
  currency: SupportedCurrency;
};

type IndicatorMeta = {
  key: 'ma20' | 'ma60' | 'rsi14' | 'percentile52w' | 'percentile13w';
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
  {
    key: 'percentile13w',
    label: '3개월 중 위치',
    glossary: '13주 백분위',
    description:
      '최근 3개월(약 63영업일) 환율 중 현재가의 상대 위치예요. 추세가 길게 이어지는 장에서도 단기 저점/고점을 잡는 데 유용합니다. 20% 이하면 최근 분기 저점, 80% 이상이면 분기 고점으로 봅니다.',
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
    case 'percentile13w':
      return indicators.percentile13w === null
        ? '—'
        : `${indicators.percentile13w.toFixed(0)}%`;
  }
}

const TREND_BADGE_CLASS: Record<ForexTrend, string> = {
  up: 'bg-coral-100 text-coral-700 border-coral-200',
  down: 'bg-sage-100 text-sage-700 border-sage-200',
  sideways: 'bg-muted text-muted-foreground border-border',
};

const TREND_DESCRIPTION: Record<ForexTrend, string> = {
  up: '20일 평균이 60일 평균을 위로 뚫고 기울기도 양수인 상태예요. 원화 약세(환율 상승) 국면이 이어질 가능성이 있어 매도/매수 신호 모두 신중히 해석합니다.',
  down: '20일 평균이 60일 평균 아래로 내려갔고 기울기도 음수예요. 환율 하락 국면이 이어질 가능성이 있습니다.',
  sideways: '방향성이 뚜렷하지 않은 횡보 구간입니다. 평균회귀(저점 매수·고점 매도)가 비교적 잘 통하는 시기입니다.',
};

function TrendIcon({ trend }: { trend: ForexTrend }) {
  if (trend === 'up') return <ArrowUpRight size={14} aria-hidden />;
  if (trend === 'down') return <ArrowDownRight size={14} aria-hidden />;
  return <ArrowRight size={14} aria-hidden />;
}

export function IndicatorPanel({ indicators, currency }: Props) {
  const trend = indicators.trend;
  return (
    <div
      data-testid="indicator-panel"
      className="rounded-xl border border-border bg-card p-4 text-card-foreground"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">지표</h3>
        <Popover>
          <PopoverTrigger
            data-testid="trend-badge"
            aria-label={`현재 추세: ${TREND_LABEL[trend]}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              TREND_BADGE_CLASS[trend]
            )}
          >
            <TrendIcon trend={trend} />
            <span>{TREND_LABEL[trend]}</span>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 text-sm leading-relaxed">
            <p className="font-semibold">{TREND_LABEL[trend]}</p>
            <p className="mt-1 text-muted-foreground">{TREND_DESCRIPTION[trend]}</p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              추세는 MA20/MA60 위치와 MA20의 5일 기울기를 합산해 결정됩니다.
            </p>
          </PopoverContent>
        </Popover>
      </div>
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
            <dd
              data-testid={`indicator-${meta.key}`}
              className="font-semibold tabular-nums"
            >
              {getValue(meta.key, indicators, currency)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
