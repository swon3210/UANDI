'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@uandi/ui';
import { WIZARD_MODES, type WizardMode } from '@/constants/plan-wizard';

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
  const t = useTranslations('cashbook.wizard.intro');
  const { income, expense } = counts[mode];
  const total = income + expense;
  const isQuick = mode === 'quick';

  return (
    <div className="space-y-5" data-testid="wizard-intro">
      <section className="rounded-2xl bg-gradient-to-br from-coral-400 to-coral-500 p-6 text-white shadow-[0_6px_24px_hsl(4_74%_69%/0.3)]">
        <div className="text-[12px] opacity-85">{t('eyebrow', { year })}</div>
        <h1 className="mt-1 text-[22px] font-extrabold leading-tight">
          {t.rich('headline', { br: () => <br /> })}
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed opacity-90">
          {t.rich('description', { br: () => <br /> })}
        </p>
      </section>

      <section className="space-y-2" role="radiogroup" aria-label={t('modeGroup')}>
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
                  {t(`modes.${m}.title`)}
                  <span className="ml-1.5 text-[12px] font-normal text-stone-400">
                    {t('count', { count: c.income + c.expense })}
                  </span>
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-stone-500">
                  {t(`modes.${m}.description`)}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="text-[14px] font-semibold text-stone-900">{t('flowTitle')}</h2>
        <ol className="mt-3 space-y-2.5 text-[13px] text-stone-700">
          <FlowItem
            num={1}
            label={t('flowIncome', { count: income })}
            hint={isQuick ? t('flowIncomeHintQuick') : t('flowIncomeHintFull')}
          />
          <FlowItem
            num={2}
            label={t('flowExpense', { count: expense })}
            hint={isQuick ? t('flowExpenseHintQuick') : t('flowExpenseHintFull')}
          />
          <FlowItem num={3} label={t('flowValidate')} hint={t('flowValidateHint')} />
          <FlowItem num={4} label={t('flowDone')} hint={t('flowDoneHint')} />
        </ol>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="text-[13px] font-semibold text-stone-700">{t('notesTitle')}</h2>
        <ul className="mt-2.5 space-y-1.5 text-[12px] leading-relaxed text-stone-600">
          <li>{t('note1')}</li>
          <li>{t('note2')}</li>
          {isQuick ? <li>{t('noteQuick')}</li> : <li>{t('noteFull')}</li>}
        </ul>
      </section>

      <p className="text-center text-[12px] text-stone-400" data-testid="wizard-intro-total">
        {t('total', { count: total })}
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
