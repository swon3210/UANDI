'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, type NavItem } from '@/lib/nav';
import { cn } from '@/lib/utils';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className={cn('transition-transform shrink-0', open && 'rotate-90')}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
  indent = false,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  const href = `/${item.slug}`;
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        'block py-1.5 text-sm rounded-lg transition-colors',
        indent ? 'pl-7 pr-3' : 'px-3',
        isActive
          ? 'bg-[#E8837A]/10 text-[#E8837A] font-medium'
          : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F3F0]'
      )}
    >
      {item.title}
    </Link>
  );
}

function CollapsibleNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const href = `/${item.slug}`;
  const isActive = pathname === href;
  const isChildActive = item.children?.some((child) => pathname === `/${child.slug}`);
  const [open, setOpen] = useState(isActive || !!isChildActive);

  return (
    <div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setOpen(!open)}
          className="p-1 rounded hover:bg-[#F5F3F0] text-[#A09890] transition-colors"
          aria-label={open ? '접기' : '펼치기'}
        >
          <ChevronIcon open={open} />
        </button>
        <Link
          href={href}
          onClick={onNavigate}
          className={cn(
            'flex-1 py-1.5 pr-3 text-sm rounded-lg transition-colors',
            isActive
              ? 'bg-[#E8837A]/10 text-[#E8837A] font-medium'
              : 'text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F3F0]'
          )}
        >
          {item.title}
        </Link>
      </div>
      {open && (
        <ul className="mt-0.5 space-y-0.5">
          {item.children!.map((child) => (
            <li key={child.slug}>
              <NavLink item={child} pathname={pathname} onNavigate={onNavigate} indent />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
            {group.items.map((item) => (
              <li key={item.slug}>
                {item.children ? (
                  <CollapsibleNavItem
                    item={item}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ) : (
                  <NavLink item={item} pathname={pathname} onNavigate={onNavigate} />
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
