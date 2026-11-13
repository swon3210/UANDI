'use client';

import { useTranslations } from 'use-intl';
import { OptionGroup } from './OptionGroup';
import { PreferenceSection } from './PreferenceSection';
import type { AnalyzeSpendingPrefs } from './aiPreferences';
import { useAiFocusOptions, useAiLengthOptions, useAiToneOptions } from './useAiPreferenceOptions';

export type AnalyzeSpendingPreferencesProps = {
  value: AnalyzeSpendingPrefs;
  onChange: (value: AnalyzeSpendingPrefs) => void;
  disabled?: boolean;
};

/**
 * A. 지출 분석(월 점검 보고서) 맞춤화 — 말투/관점/분량 knob.
 * 자유 텍스트 없음 → 프롬프트 인젝션 표면 0. 실제 프롬프트 문장은 서버가 소유한다.
 */
export function AnalyzeSpendingPreferences({
  value,
  onChange,
  disabled,
}: AnalyzeSpendingPreferencesProps) {
  const t = useTranslations('ui.aiPrefs.analyze');
  const tone = useAiToneOptions();
  const focus = useAiFocusOptions();
  const length = useAiLengthOptions();

  return (
    <PreferenceSection
      title={t('title')}
      description={t('description')}
      enabled={value.enabled}
      onEnabledChange={(enabled) => onChange({ ...value, enabled })}
      enabledTestId="ai-analyze-enabled"
      disabled={disabled}
    >
      <OptionGroup
        testIdPrefix="ai-analyze-tone"
        legend={tone.legend}
        options={tone.options}
        value={value.tone}
        onValueChange={(tone) => onChange({ ...value, tone })}
        disabled={disabled}
      />
      <OptionGroup
        testIdPrefix="ai-analyze-focus"
        legend={focus.legend}
        options={focus.options}
        value={value.focus}
        onValueChange={(focus) => onChange({ ...value, focus })}
        disabled={disabled}
      />
      <OptionGroup
        testIdPrefix="ai-analyze-length"
        legend={length.legend}
        options={length.options}
        value={value.length}
        onValueChange={(length) => onChange({ ...value, length })}
        disabled={disabled}
      />
    </PreferenceSection>
  );
}
