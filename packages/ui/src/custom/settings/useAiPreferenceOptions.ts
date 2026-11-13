'use client';

import { useTranslations } from 'use-intl';
import {
  AI_FOCUS_VALUES,
  AI_LENGTH_VALUES,
  AI_PREDICTION_STANCE_VALUES,
  AI_TONE_VALUES,
  type AiPreferenceOption,
} from './aiPreferences';

type OptionKind = 'tone' | 'focus' | 'length' | 'stance';

/** `ui.aiPrefs.{kind}.{value}.label|description` 으로 라벨·설명을 채운 옵션 목록 + 범례. */
export function useAiPreferenceOptions<T extends string>(kind: OptionKind, values: T[]) {
  const t = useTranslations('ui.aiPrefs');
  const options: AiPreferenceOption<T>[] = values.map((value) => ({
    value,
    label: t(`${kind}.${value}.label` as never),
    description: t(`${kind}.${value}.description` as never),
  }));
  return { legend: t(`${kind}.legend` as never), options };
}

export const useAiToneOptions = () => useAiPreferenceOptions('tone', AI_TONE_VALUES);
export const useAiFocusOptions = () => useAiPreferenceOptions('focus', AI_FOCUS_VALUES);
export const useAiLengthOptions = () => useAiPreferenceOptions('length', AI_LENGTH_VALUES);
export const useAiStanceOptions = () =>
  useAiPreferenceOptions('stance', AI_PREDICTION_STANCE_VALUES);
