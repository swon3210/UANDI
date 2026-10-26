'use client';

import { useRef, type ReactNode } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@uandi/ui';

type ScreenshotPickButtonProps = {
  /** 선택된 이미지 파일. 압축·인코딩·AI 호출은 호출자가 담당한다. */
  onPick: (file: File) => void;
  isLoading?: boolean;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
  'data-testid'?: string;
};

/** 캡처 이미지를 골라 AI 자동 입력을 시작하는 버튼 (숨김 file input 래핑). */
export function ScreenshotPickButton({
  onPick,
  isLoading,
  children,
  variant = 'outline',
  className,
  'data-testid': testId,
}: ScreenshotPickButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
        data-testid={testId}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {isLoading ? '캡처 분석 중…' : children}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid={testId ? `${testId}-input` : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
    </>
  );
}
