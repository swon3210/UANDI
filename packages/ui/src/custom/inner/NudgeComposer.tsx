'use client';

import { useId, useState } from 'react';
import { Button } from '../../components/button';
import { Label } from '../../components/label';
import { RadioGroup, RadioGroupItem } from '../../components/radio-group';
import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/sheet';
import { Textarea } from '../../components/textarea';

export const NUDGE_PRESETS = [
  '오늘 쓴 거 입력해줘',
  '이번 주 가계부 정리하자',
  '카드값 기록 부탁해',
];

export const NUDGE_MAX_MESSAGE = 100;

const CUSTOM_VALUE = '__custom__';

export type NudgeComposerProps = {
  /** 받는 파트너 이름 (헤더 표시용). */
  partnerName: string;
  /** 프리셋 문구. 미지정 시 기본 프리셋. */
  presets?: string[];
  /** 발송 콜백. 최종 문구(프리셋 또는 커스텀)를 전달한다. */
  onSubmit: (message: string) => void | Promise<void>;
  isPending?: boolean;
  /** 이미 보낸 미응답 요청이 있어 발송할 수 없는 상태. */
  disabled?: boolean;
  /** disabled일 때 노출할 안내 문구. */
  disabledReason?: string;
};

/**
 * 가계부 입력 요청 "콕 찌르기" 작성 UI (프레젠테이션 전용 — 도메인 타입과 디커플).
 * 프리셋 중 택1 또는 직접 입력한 한 줄을 onSubmit으로 전달한다.
 */
export function NudgeComposer({
  partnerName,
  presets = NUDGE_PRESETS,
  onSubmit,
  isPending,
  disabled,
  disabledReason,
}: NudgeComposerProps) {
  const groupId = useId();
  const [selected, setSelected] = useState<string>(presets[0] ?? CUSTOM_VALUE);
  const [custom, setCustom] = useState('');

  const isCustom = selected === CUSTOM_VALUE;
  const message = (isCustom ? custom : selected).trim();
  const canSubmit = !disabled && !isPending && message.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(message);
  };

  return (
    <SheetContent
      side="bottom"
      data-testid="nudge-composer"
      className="rounded-t-[20px] max-h-[90vh]"
    >
      <SheetHeader>
        <SheetTitle>{partnerName}님에게 입력 요청 보내기 🐹</SheetTitle>
        <SheetDescription className="sr-only">
          파트너에게 가계부 입력을 콕 찔러 요청합니다
        </SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <RadioGroup
          value={selected}
          onValueChange={setSelected}
          className="space-y-2"
          disabled={disabled}
        >
          {presets.map((preset) => {
            const id = `${groupId}-${preset}`;
            return (
              <label
                key={preset}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border px-3 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <RadioGroupItem value={preset} id={id} />
                <span>{preset}</span>
              </label>
            );
          })}

          <label
            htmlFor={`${groupId}-custom`}
            className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border px-3 py-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem value={CUSTOM_VALUE} id={`${groupId}-custom`} />
            <span>직접 입력</span>
          </label>
        </RadioGroup>

        {isCustom ? (
          <div className="space-y-1">
            <Label htmlFor={`${groupId}-textarea`} className="sr-only">
              직접 입력
            </Label>
            <Textarea
              id={`${groupId}-textarea`}
              data-testid="nudge-custom-input"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="예: 어제 데이트 비용 기록해줘"
              rows={2}
              maxLength={NUDGE_MAX_MESSAGE}
              disabled={disabled}
              className="resize-none"
            />
            <div className="text-right text-xs text-muted-foreground tabular-nums">
              {custom.length}/{NUDGE_MAX_MESSAGE}
            </div>
          </div>
        ) : null}

        {disabled && disabledReason ? (
          <p className="text-xs text-muted-foreground" data-testid="nudge-disabled-reason">
            {disabledReason}
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          data-testid="nudge-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isPending ? '보내는 중...' : '콕 찌르기'}
        </Button>
      </div>
    </SheetContent>
  );
}
