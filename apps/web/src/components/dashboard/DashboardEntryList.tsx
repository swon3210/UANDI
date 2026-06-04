'use client';

import type { ComponentType } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type DashboardEntry = {
  id: string;
  label: string;
  description: string;
  href: string;
  Icon: ComponentType<{ size?: number }>;
  testId?: string;
};

type Props = {
  entries: DashboardEntry[];
};

/**
 * 우리집 홈의 진입 카드 목록. 예산 설정 등 다른 영역으로의 바로가기를
 * 전폭 가로 카드로 쌓아 보여준다.
 */
export function DashboardEntryList({ entries }: Props) {
  return (
    <div data-testid="dashboard-entry-list" className="space-y-3">
      {entries.map(({ id, label, description, href, Icon, testId }) => (
        <Link
          key={id}
          href={href}
          data-testid={testId}
          className="block rounded-xl border border-border bg-card p-4 text-card-foreground transition-colors hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={18} />
            </span>
            <div className="flex-1">
              <p className="text-base font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  );
}
