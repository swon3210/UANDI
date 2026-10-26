import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type HeaderProps = {
  /** 페이지 제목. 생략하면 가운데 영역이 비고 좌우 슬롯 사이 여백만 차지한다. */
  title?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>;

export function Header({ title, leftSlot, rightSlot, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        // 좌우 슬롯 폭이 달라도 제목이 화면 정중앙에 오도록 양옆 칸을 같은 폭(1fr)으로 둔다
        'sticky top-0 z-50 h-14 grid grid-cols-[minmax(2.5rem,1fr)_minmax(0,auto)_minmax(2.5rem,1fr)] items-center gap-2 px-4 bg-background border-b border-border',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1 justify-self-start">{leftSlot}</div>
      {title ? (
        <span className="text-center text-base font-semibold text-foreground truncate">
          {title}
        </span>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="flex items-center gap-1 justify-self-end">{rightSlot}</div>
    </header>
  );
}
