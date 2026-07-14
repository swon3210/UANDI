'use client';

import { useId, useState } from 'react';
import { Button } from '../../components/button';
import { Label } from '../../components/label';
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../../components/sheet';
import { Textarea } from '../../components/textarea';
import { COUPLE_MESSAGE_MAX } from './CoupleStatusCard';

/** 빠른 선택 문구 — 빈 칸을 마주하지 않도록 탭 한 번으로 채운다. */
export const COUPLE_MESSAGE_PRESETS = [
  '오늘도 고마워 ❤️',
  '사랑해',
  '먼저 자~',
  '보고싶어',
  '오늘도 화이팅!',
];

export type CoupleMessageComposerProps = {
  /** 받는 짝꿍 이름 (헤더 표시용). */
  partnerName: string;
  /** 현재 내 한마디 (편집 시작값). */
  initialMessage?: string | null;
  /** 빠른 선택 문구. 미지정 시 기본 프리셋. */
  presets?: string[];
  /** 저장 콜백. 최종 한마디를 전달한다. */
  onSubmit: (message: string) => void | Promise<void>;
  isPending?: boolean;
};

/**
 * "서로를 위한 한마디" 작성 UI (프레젠테이션 전용 — 도메인 타입과 디커플).
 * 빠른 선택 칩으로 채우거나 직접 입력한 한 줄(최대 30자)을 onSubmit으로 전달한다.
 * overlay-kit Sheet 안에서 사용한다.
 */
export function CoupleMessageComposer({
  partnerName,
  initialMessage,
  presets = COUPLE_MESSAGE_PRESETS,
  onSubmit,
  isPending,
}: CoupleMessageComposerProps) {
  const id = useId();
  const [value, setValue] = useState((initialMessage ?? '').slice(0, COUPLE_MESSAGE_MAX));

  const message = value.trim();
  const canSubmit = !isPending && message.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(message);
  };

  return (
    <SheetContent
      side="bottom"
      data-testid="couple-message-composer"
      className="rounded-t-[20px] max-h-[90vh]"
    >
      <SheetHeader>
        <SheetTitle>{partnerName}님에게 한마디 🐹</SheetTitle>
        <SheetDescription className="sr-only">짝꿍 화면에 보일 한마디를 남깁니다</SheetDescription>
      </SheetHeader>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setValue(preset.slice(0, COUPLE_MESSAGE_MAX))}
              className="rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:bg-primary/5"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${id}-input`} className="sr-only">
            한마디
          </Label>
          <Textarea
            id={`${id}-input`}
            data-testid="couple-message-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="예: 오늘도 고마워 ❤️"
            rows={2}
            maxLength={COUPLE_MESSAGE_MAX}
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground tabular-nums">
            {value.length}/{COUPLE_MESSAGE_MAX}
          </div>
        </div>

        <Button
          type="button"
          className="w-full"
          data-testid="couple-message-submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {isPending ? '남기는 중...' : '한마디 남기기'}
        </Button>
      </div>
    </SheetContent>
  );
}
