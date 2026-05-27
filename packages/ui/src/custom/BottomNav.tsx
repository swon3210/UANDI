import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export type BottomNavLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export type BottomNavItem = {
  id: string;
  label: string;
  href: string;
  Icon: LucideIcon;
};

export type BottomNavProps = {
  items: BottomNavItem[];
  activeId: string;
  /** next/link 또는 호환 컴포넌트. 생략 시 기본 <a>. */
  LinkComponent?: ComponentType<BottomNavLinkProps>;
  className?: string;
};

const DefaultLink: ComponentType<BottomNavLinkProps> = (props) => <a {...props} />;

export function BottomNav({
  items,
  activeId,
  LinkComponent = DefaultLink,
  className,
}: BottomNavProps) {
  return (
    <nav
      data-testid="bottom-nav"
      aria-label="하단 네비게이션"
      className={cn(
        'fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center md:hidden',
        className
      )}
    >
      {items.map(({ id, label, href, Icon }) => {
        const isActive = activeId === id;
        return (
          <LinkComponent
            key={id}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </LinkComponent>
        );
      })}
    </nav>
  );
}
