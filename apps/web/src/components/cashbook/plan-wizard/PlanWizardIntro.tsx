'use client';

import { Check } from 'lucide-react';
import { cn } from '@uandi/ui';
import { WIZARD_MODES, WIZARD_MODE_LABEL, type WizardMode } from '@/constants/plan-wizard';

export type WizardModeCounts = Record<WizardMode, { income: number; expense: number }>;

type PlanWizardIntroProps = {
  year: number;
  /** 모드별 포함 카테고리 수 */
  counts: WizardModeCounts;
  mode: WizardMode;
  onModeChange: (mode: WizardMode) => void;
};

/**
 * 위저드 인트로 — 모드(핵심만 빠르게 / 전체 항목 꼼꼼히)를 고르고 진행 흐름을 미리 본다.
 * 2026-11 첫 주 걷기: "26개 카테고리 × 평균+그리드"는 첫 주 부부에게 과했다 → 빠른 모드가 기본.
 */
export function PlanWizardIntro({ year, counts, mode, onModeChange }: PlanWizardIntroProps) {
  const { income, expense } = counts[mode];
  const total = income + expense;
  const isQuick = mode === 'quick';

  return (
    <div className="space-y-5" data-testid="wizard-intro">
      <section className="rounded-2xl bg-gradient-to-br from-coral-400 to-coral-500 p-6 text-white shadow-[0_6px_24px_hsl(4_74%_69%/0.3)]">
        <div className="text-[12px] opacity-85">{year}년 연간 예산</div>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">
          한 해 예산을
          <br />
          단계별로 세워볼게요
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed opacity-90">
          수입 → 지출 순서로 카테고리별 월 금액을 입력하면
          <br />
          연간 합계와 잉여를 자동으로 보여드려요.
        </p>
      </section>

      <section className="space-y-2" role="radiogroup" aria-label="예산 세우는 방식">
        {WIZARD_MODES.map((m) => {
          const selected = m === mode;
          const c = counts[m];
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`wizard-mode-${m}`}
              onClick={() => onModeChange(m)}
              className={cn(
                'flex w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors',
                selected
                  ? 'border-coral-400 ring-2 ring-coral-200'
                  : 'border-stone-200 hover:border-stone-300'
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                  selected ? 'border-coral-500 bg-coral-500 text-white' : 'border-stone-300'
                )}
                aria-hidden
              >
                {selected ? <Check size={12} strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-stone-900">
                  {WIZARD_MODE_LABEL[m].title}
                  <span className="ml-1.5 text-[12px] font-normal text-stone-400">
                    {c.income + c.expense}개
                  </span>
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-stone-500">
                  {WIZARD_MODE_LABEL[m].description}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-[14px] font-semibold text-stone-900">진행 흐름</h2>
        <ol className="mt-3 space-y-2.5 text-[13px] text-stone-700">
          <FlowItem
            num={1}
            label={`수입 카테고리 ${income}개 입력`}
            hint={isQuick ? '정기 수입을 월 평균으로' : '정기수입은 월 평균 → 12개월 그리드 순서'}
          />
          <FlowItem
            num={2}
            label={`지출 카테고리 ${expense}개 입력`}
            hint={
              isQuick
                ? '고정 지출·함께 쓰는 변동 지출을 월 평균으로'
                : '고정 지출은 평균 입력, 변동/명절은 그리드 직접'
            }
          />
          <FlowItem num={3} label="검증" hint="수입 ≥ 지출 인지 확인" />
          <FlowItem num={4} label="완료" hint="결과 요약 후 메인으로" />
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-[13px] font-semibold text-stone-700">알아두기</h2>
        <ul className="mt-2.5 space-y-1.5 text-[12px] leading-relaxed text-stone-600">
          <li>· 입력은 단계마다 즉시 저장돼요. 중간에 나가도 홈 카드에서 이어서 할 수 있어요.</li>
          <li>{'· 모르는 항목은 "이 항목은 건너뛰기"로 넘기고 나중에 채워도 돼요.'}</li>
          {isQuick ? (
            <li>
              · 나머지 항목은 0원으로 두고, 경제 목표 → 예산 항목 설정에서 언제든 채울 수 있어요.
            </li>
          ) : (
            <li>· 정기 항목은 평균을 입력한 뒤 12개월 그리드에서 특정 달만 조정할 수 있어요.</li>
          )}
        </ul>
      </section>

      <p className="text-center text-[12px] text-stone-400" data-testid="wizard-intro-total">
        총 {total}개 카테고리
      </p>
    </div>
  );
}

function FlowItem({ num, label, hint }: { num: number; label: string; hint: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-100 text-[12px] font-bold text-coral-600">
        {num}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-stone-900">{label}</div>
        <div className="text-[12px] text-stone-500">{hint}</div>
      </div>
    </li>
  );
}
