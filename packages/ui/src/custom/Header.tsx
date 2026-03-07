import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

type HeaderProps = {
  title: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>;

export function Header({ title, leftSlot, rightSlot, className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        'h-14 flex items-center justify-between px-4 bg-background border-b border-border',
        className
      )}
      {...props}
    >
      <div className="w-10">{leftSlot}</div>
      <span className="text-base font-semibold text-foreground">{title}</span>
      <div className="w-10 flex justify-end">{rightSlot}</div>
    </header>
  );
}
