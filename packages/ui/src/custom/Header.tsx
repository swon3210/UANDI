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
        'sticky top-0 z-50 h-14 flex items-center gap-2 px-4 bg-background border-b border-border',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1 min-w-10">{leftSlot}</div>
      {title ? (
        <span className="flex-1 text-center text-base font-semibold text-foreground truncate">
          {title}
        </span>
      ) : (
        <span className="flex-1" aria-hidden="true" />
      )}
      <div className="flex items-center gap-1 min-w-10 justify-end">{rightSlot}</div>
    </header>
  );
}
