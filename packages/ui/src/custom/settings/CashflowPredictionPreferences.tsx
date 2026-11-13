'use client';

import { useTranslations } from 'use-intl';
import { cn } from '../../lib/utils';
import { OptionGroup } from './OptionGroup';
import { PreferenceSection } from './PreferenceSection';
import type { CashflowPredictionPrefs } from './aiPreferences';
import { useAiStanceOptions } from './useAiPreferenceOptions';

export type CashflowPredictionPreferencesProps = {
  value: CashflowPredictionPrefs;
  onChange: (value: CashflowPredictionPrefs) => void;
  /** 커플 카테고리 이름들 — 제외 대상 선택지. */
  categories: string[];
  disabled?: boolean;
};

/**
 * B. 현금흐름 예측 맞춤화 — 예측 성향(보수/표준/적극) + 예측에서 제외할 카테고리.
 * 성향은 enum, 제외 카테고리는 UI에서 커플 카테고리만 고른다. 최종 안전은 서버가
 * excludedCategories 를 sanitize+캡 재검증하는 것으로 보장한다(직접 쓰기 우회 대비).
 */
export function CashflowPredictionPreferences({
  value,
  onChange,
  categories,
  disabled,
}: CashflowPredictionPreferencesProps) {
  const t = useTranslations('ui.aiPrefs.predict');
  const stance = useAiStanceOptions();
  const excluded = new Set(value.excludedCategories);

  const toggleExcluded = (category: string) => {
    const next = new Set(excluded);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange({ ...value, excludedCategories: [...next] });
  };

  return (
    <PreferenceSection
      title={t('title')}
      description={t('description')}
      enabled={value.enabled}
      onEnabledChange={(enabled) => onChange({ ...value, enabled })}
      enabledTestId="ai-predict-enabled"
      disabled={disabled}
    >
      <OptionGroup
        testIdPrefix="ai-predict-stance"
        legend={stance.legend}
        options={stance.options}
        value={value.stance}
        onValueChange={(stance) => onChange({ ...value, stance })}
        disabled={disabled}
      />

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">{t('excludeLegend')}</legend>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('noCategories')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isExcluded = excluded.has(category);
              return (
                <button
                  key={category}
                  type="button"
                  data-testid={`ai-predict-exclude-${category}`}
                  aria-pressed={isExcluded}
                  onClick={() => toggleExcluded(category)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs transition-colors',
                    isExcluded
                      ? 'border-primary bg-primary/10 text-primary line-through'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{t('excludeHint')}</p>
      </fieldset>
    </PreferenceSection>
  );
}
