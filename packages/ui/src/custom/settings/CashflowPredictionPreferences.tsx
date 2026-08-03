'use client';

import { cn } from '../../lib/utils';
import { OptionGroup } from './OptionGroup';
import { PreferenceSection } from './PreferenceSection';
import { AI_PREDICTION_STANCE_OPTIONS, type CashflowPredictionPrefs } from './aiPreferences';

export type CashflowPredictionPreferencesProps = {
  value: CashflowPredictionPrefs;
  onChange: (value: CashflowPredictionPrefs) => void;
  /** 커플 카테고리 이름들 — 제외 대상 선택지. */
  categories: string[];
  disabled?: boolean;
};

/**
 * B. 현금흐름 예측 맞춤화 — 예측 성향(보수/표준/적극) + 예측에서 제외할 카테고리.
 * 성향은 enum, 제외 카테고리는 커플 카테고리에서만 고르므로 자유 텍스트가 없다(인젝션 표면 0).
 */
export function CashflowPredictionPreferences({
  value,
  onChange,
  categories,
  disabled,
}: CashflowPredictionPreferencesProps) {
  const excluded = new Set(value.excludedCategories);

  const toggleExcluded = (category: string) => {
    const next = new Set(excluded);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange({ ...value, excludedCategories: [...next] });
  };

  return (
    <PreferenceSection
      title="현금흐름 예측 맞춤화"
      description="캘린더의 'AI 예상 내역' 추정 방식을 조정해요."
      enabled={value.enabled}
      onEnabledChange={(enabled) => onChange({ ...value, enabled })}
      enabledTestId="ai-predict-enabled"
      disabled={disabled}
    >
      <OptionGroup
        testIdPrefix="ai-predict-stance"
        legend="예측 성향"
        options={AI_PREDICTION_STANCE_OPTIONS}
        value={value.stance}
        onValueChange={(stance) => onChange({ ...value, stance })}
        disabled={disabled}
      />

      <fieldset className="space-y-2" disabled={disabled}>
        <legend className="text-sm font-medium">예측에서 제외할 카테고리</legend>
        {categories.length === 0 ? (
          <p className="text-xs text-muted-foreground">등록된 카테고리가 없어요.</p>
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
        <p className="text-xs text-muted-foreground">
          선택한 카테고리는 예측 목록에 나타나지 않아요.
        </p>
      </fieldset>
    </PreferenceSection>
  );
}
