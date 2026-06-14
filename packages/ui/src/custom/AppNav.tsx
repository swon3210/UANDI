import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';

export type AppNavLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export type AppNavItem = {
  id: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  /** 활성 판정용 경로 prefix. 생략 시 href를 사용. 진입 경로와 활성 영역이 다를 때 지정. */
  match?: string;
};

export type AppNavProps = {
  items: AppNavItem[];
  /** 현재 경로. 활성 탭을 가장 긴 prefix 매칭으로 결정한다. */
  activePath: string;
  /** next/link 또는 호환 컴포넌트. 생략 시 기본 <a>. */
  LinkComponent?: ComponentType<AppNavLinkProps>;
  className?: string;
};

const DefaultLink: ComponentType<AppNavLinkProps> = (props) => <a {...props} />;

/** 활성 탭 id를 가장 긴 prefix 매칭으로 결정. (예: /inner/cashbook/history → 가계부 탭) */
export function getActiveNavId(items: AppNavItem[], activePath: string): string {
  let bestId = '';
  let bestLen = -1;
  for (const item of items) {
    const prefix = item.match ?? item.href;
    const matches = activePath === prefix || activePath.startsWith(`${prefix}/`);
    if (matches && prefix.length > bestLen) {
      bestId = item.id;
      bestLen = prefix.length;
    }
  }
  return bestId;
}

/**
 * 전역 하단탭 네비게이션. AppShell 안에서 인증·커플 연결 사용자에게 상시 노출한다.
 * 활성 탭 색(text-primary)은 조상 요소의 `data-space` 톤(coral/indigo/violet)을 자동으로 따른다.
 * (데스크톱 좌측 레일 전환은 후속 단계에서 추가)
 */
export function AppNav({ items, activePath, LinkComponent = DefaultLink, className }: AppNavProps) {
  const activeId = getActiveNavId(items, activePath);

  return (
    <nav
      aria-label="주요 메뉴"
      data-testid="app-nav"
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur',
        // 데스크톱(≥md): 하단 바 → 좌측 고정 레일
        'md:inset-x-auto md:left-0 md:top-0 md:h-full md:w-20 md:border-r md:border-t-0',
        className
      )}
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch md:mx-0 md:h-full md:max-w-none md:flex-col md:items-stretch md:gap-1 md:py-3">
        {items.map((item) => {
          const ItemIcon = item.Icon;
          const active = activeId === item.id;
          return (
            <li key={item.id} className="flex-1 md:flex-none">
              <LinkComponent
                href={item.href}
                data-testid={`nav-tab-${item.id}`}
                aria-current={active ? 'page' : undefined}
                data-active={active || undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs transition-colors md:h-16',
                  active
                    ? 'font-semibold text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <ItemIcon
                  size={22}
                  aria-hidden
                  className={active ? 'text-primary' : 'text-muted-foreground'}
                />
                <span>{item.label}</span>
              </LinkComponent>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
