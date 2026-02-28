'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="py-4 px-3 space-y-6">
      {NAV_ITEMS.map((group) => (
        <div key={group.group}>
          <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-[#A09890]">
            {group.group}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/${item.slug}`;
              const isActive = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      'block px-3 py-1.5 text-sm rounded-lg transition-colors',
                      isActive
                        ? 'bg-[#E8837A]/10 text-[#E8837A] font-medium'
                        : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F3F0]'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
