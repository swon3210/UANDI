'use client';

import Link from 'next/link';
import { Home, Image, BookOpen } from 'lucide-react';
import { cn } from '@uandi/ui';

type Tab = 'home' | 'photos' | 'cashbook';

type BottomNavProps = {
  activeTab: Tab;
};

const TABS = [
  { id: 'home' as Tab, label: '홈', href: '/', Icon: Home },
  { id: 'photos' as Tab, label: '사진', href: '/photos', Icon: Image },
  { id: 'cashbook' as Tab, label: '가계부', href: '/cashbook', Icon: BookOpen },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border flex items-center md:hidden">
      {TABS.map(({ id, label, href, Icon }) => {
        const isActive = activeTab === id;
        return (
          <Link
            key={id}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon size={22} />
            <span className="text-xs">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
