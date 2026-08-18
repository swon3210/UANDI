'use client';

import Link from 'next/link';

type Props = {
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
};

/** /diary 영역 전용 최소 상단바 — 블로그 헤더 대신 쓴다. */
export function DiaryTopBar({ backHref, backLabel = '목록', children }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[720px] items-center justify-between px-5">
        {backHref ? (
          <Link
            href={backHref}
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            {backLabel}
          </Link>
        ) : (
          <span className="font-serif text-[15px] font-semibold tracking-tight text-gray-900">
            일기
          </span>
        )}
        <div className="flex items-center gap-1">{children}</div>
      </div>
    </header>
  );
}
