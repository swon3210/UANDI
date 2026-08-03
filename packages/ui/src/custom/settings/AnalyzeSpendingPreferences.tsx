'use client';

import { OptionGroup } from './OptionGroup';
import { PreferenceSection } from './PreferenceSection';
import {
  AI_FOCUS_OPTIONS,
  AI_LENGTH_OPTIONS,
  AI_TONE_OPTIONS,
  type AnalyzeSpendingPrefs,
} from './aiPreferences';

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
  return (
    <PreferenceSection
      title="지출 분석 맞춤화"
      description="월 지출 분석 보고서의 말투와 방향을 우리 커플에 맞게 바꿔요."
      enabled={value.enabled}
      onEnabledChange={(enabled) => onChange({ ...value, enabled })}
      enabledTestId="ai-analyze-enabled"
      disabled={disabled}
    >
      <OptionGroup
        testIdPrefix="ai-analyze-tone"
        legend="말투"
        options={AI_TONE_OPTIONS}
        value={value.tone}
        onValueChange={(tone) => onChange({ ...value, tone })}
        disabled={disabled}
      />
      <OptionGroup
        testIdPrefix="ai-analyze-focus"
        legend="분석 관점"
        options={AI_FOCUS_OPTIONS}
        value={value.focus}
        onValueChange={(focus) => onChange({ ...value, focus })}
        disabled={disabled}
      />
      <OptionGroup
        testIdPrefix="ai-analyze-length"
        legend="분량"
        options={AI_LENGTH_OPTIONS}
        value={value.length}
        onValueChange={(length) => onChange({ ...value, length })}
        disabled={disabled}
      />
    </PreferenceSection>
  );
}
