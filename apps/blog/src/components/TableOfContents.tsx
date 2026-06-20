'use client';

import { useEffect, useState } from 'react';
import type { TocItem } from '@/lib/markdown';

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState('');

  // 스크롤 위치에 따라 현재 섹션을 추적한다. 여러 헤딩을 한 번에 관찰해야 해서
  // 단일 요소용 훅 대신 IntersectionObserver를 직접 쓴다. (useEffect 허용 케이스: 외부 시스템 구독)
  useEffect(() => {
    const headings = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // 화면 상단 밴드 안에 있는 헤딩 중 문서 순서상 가장 위 것을 활성화
        const current = items.find((item) => visible.has(item.id));
        if (current) setActiveId(current.id);
      },
      { rootMargin: '-88px 0px -70% 0px' }
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  const minDepth = Math.min(...items.map((item) => item.depth));

  const jumpTo = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
    history.replaceState(null, '', `#${id}`);
  };

  // 데스크톱(≥xl)에서만 본문 오른쪽에 떠 있는 목차. 모바일/태블릿에선 표시하지 않는다.
  return (
    <nav
      aria-label="목차"
      className="fixed top-28 left-[calc(50%+25rem)] hidden max-h-[70vh] w-52 overflow-auto xl:block"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        목차
      </p>
      <ul className="space-y-1 text-sm">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(event) => jumpTo(event, item.id)}
                title={item.text}
                style={{ paddingLeft: `${12 + (item.depth - minDepth) * 12}px` }}
                className={[
                  'block border-l-2 py-0.5 leading-snug transition-colors line-clamp-2',
                  isActive
                    ? 'border-[var(--color-primary)] font-medium text-[var(--color-primary)]'
                    : 'border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-700',
                ].join(' ')}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
