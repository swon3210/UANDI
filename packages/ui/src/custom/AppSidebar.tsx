import type { AnchorHTMLAttributes, ComponentType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../Logo';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../components/sheet';
import { cn } from '../lib/utils';

export type Space = 'inner' | 'outer';

export type SidebarLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
};

export type SidebarNavItem = {
  id: string;
  label: string;
  href: string;
  Icon: LucideIcon;
};

export type SidebarSection = {
  id: string;
  label: string;
  Icon: LucideIcon;
  items: SidebarNavItem[];
};

export type AppSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sections: SidebarSection[];
  /** 현재 경로. 활성 항목을 가장 긴 prefix 매칭으로 결정한다. */
  activePath: string;
  /** 현재 공간 톤(coral/indigo)을 활성 항목에 적용. 포털 밖이라 data-space를 직접 건다. */
  space?: Space;
  /** next/link 또는 호환 컴포넌트. 생략 시 기본 <a>. */
  LinkComponent?: ComponentType<SidebarLinkProps>;
  /** 항목 클릭 시 호출 — 보통 사이드바를 닫는 데 사용. */
  onNavigate?: () => void;
  footer?: ReactNode;
};

const DefaultLink: ComponentType<SidebarLinkProps> = (props) => <a {...props} />;

function getActiveHref(sections: SidebarSection[], activePath: string): string {
  let best = '';
  for (const section of sections) {
    for (const item of section.items) {
      const matches = activePath === item.href || activePath.startsWith(`${item.href}/`);
      if (matches && item.href.length > best.length) best = item.href;
    }
  }
  return best;
}

export function AppSidebar({
  open,
  onOpenChange,
  sections,
  activePath,
  space,
  LinkComponent = DefaultLink,
  onNavigate,
  footer,
}: AppSidebarProps) {
  const activeHref = getActiveHref(sections, activePath);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        data-testid="app-sidebar"
        data-space={space}
        className="flex w-[280px] max-w-[80vw] flex-col p-0"
      >
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="sr-only">메뉴</SheetTitle>
          <Logo variant="full" className="h-7 w-auto" />
          <SheetDescription className="sr-only">공간과 페이지로 이동합니다</SheetDescription>
        </SheetHeader>

        <nav aria-label="주요 메뉴" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {sections.map((section) => {
            const SectionIcon = section.Icon;
            return (
              <div key={section.id} className="space-y-1">
                <div className="flex items-center gap-2 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <SectionIcon size={14} />
                  <span>{section.label}</span>
                </div>
                {section.items.map((item) => {
                  const ItemIcon = item.Icon;
                  const active = activeHref === item.href;
                  return (
                    <LinkComponent
                      key={item.id}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      data-active={active || undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-accent font-semibold text-primary'
                          : 'text-foreground hover:bg-accent/60'
                      )}
                    >
                      <ItemIcon
                        size={18}
                        className={active ? 'text-primary' : 'text-muted-foreground'}
                      />
                      <span>{item.label}</span>
                    </LinkComponent>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {footer ? <div className="border-t border-border p-3">{footer}</div> : null}
      </SheetContent>
    </Sheet>
  );
}
