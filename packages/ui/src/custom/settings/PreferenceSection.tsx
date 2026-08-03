'use client';

import { type ReactNode, useId } from 'react';
import { Label } from '../../components/label';
import { Switch } from '../../components/switch';

export type PreferenceSectionProps = {
  title: string;
  description: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  /** enable Switch 의 testid. */
  enabledTestId: string;
  disabled?: boolean;
  /** enabled 일 때만 노출되는 본문(knob 들). */
  children?: ReactNode;
};

/**
 * AI 설정의 한 기능 섹션 — 제목 + 설명 + on/off 토글, 켜졌을 때만 knob 본문 노출.
 * 세 기능(지출 분석/현금흐름 예측/거래 파싱)이 동일 골격을 공유한다.
 */
export function PreferenceSection({
  title,
  description,
  enabled,
  onEnabledChange,
  enabledTestId,
  disabled,
  children,
}: PreferenceSectionProps) {
  const switchId = useId();
  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor={switchId} className="text-sm font-semibold">
            {title}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Switch
          id={switchId}
          data-testid={enabledTestId}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>
      {enabled ? <div className="space-y-6">{children}</div> : null}
    </section>
  );
}
