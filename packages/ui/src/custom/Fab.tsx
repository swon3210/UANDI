import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/utils';

export type FabProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 버튼 아이콘 (lucide 아이콘 등) */
  icon: ReactNode;
  /** 스크린리더 라벨(필수). showLabel일 때는 텍스트로도 노출된다. */
  label: string;
  /** 라벨을 텍스트로 함께 노출하는 확장형(extended) FAB */
  showLabel?: boolean;
};

/**
 * 플로팅 액션 버튼. 화면의 주요 생성(추가/작성) 액션에 사용한다.
 * 우하단 고정(전역 하단탭 바로 위), 색은 조상 `data-space` 톤(`--primary`)을 따른다.
 */
export function Fab({ icon, label, showLabel = false, className, ...rest }: FabProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'fixed right-4 z-30 flex h-12 items-center gap-2 rounded-full bg-primary text-primary-foreground shadow-lg',
        'transition-transform hover:brightness-95 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // 하단 고정 네비가 없으므로 safe-area 위 여백만 확보 / 데스크톱은 고정 여백
        'bottom-[calc(1.5rem+var(--safe-bottom))] md:bottom-6',
        showLabel ? 'px-4' : 'w-12 justify-center',
        className
      )}
      {...rest}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">{icon}</span>
      {showLabel ? <span className="pr-1 text-sm font-semibold">{label}</span> : null}
    </button>
  );
}
