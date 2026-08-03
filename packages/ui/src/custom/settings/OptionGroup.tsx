'use client';

import { useId } from 'react';
import { RadioGroup, RadioGroupItem } from '../../components/radio-group';
import type { AiPreferenceOption } from './aiPreferences';

export type OptionGroupProps<T extends string> = {
  /** testid 접두사 — 각 옵션은 `${testIdPrefix}-${value}` 가 된다. */
  testIdPrefix: string;
  legend: string;
  options: AiPreferenceOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
};

/** 설명이 붙은 라디오 옵션 카드 그룹 (AI 설정 knob 공용). */
export function OptionGroup<T extends string>({
  testIdPrefix,
  legend,
  options,
  value,
  onValueChange,
  disabled,
}: OptionGroupProps<T>) {
  const groupId = useId();
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium">{legend}</legend>
      <RadioGroup
        value={value}
        onValueChange={(next) => onValueChange(next as T)}
        className="grid gap-2"
      >
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border px-3 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem
                value={option.value}
                id={id}
                data-testid={`${testIdPrefix}-${option.value}`}
              />
              <span className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
