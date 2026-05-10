import Link from 'next/link';
import { SearchTrigger } from './SearchTrigger';

export function BlogHeader() {
  return (
    <header className="h-14 border-b border-gray-100 px-4 flex items-center justify-between">
      <Link
        href="/"
        className="font-semibold text-gray-900 hover:text-[var(--color-primary)] transition-colors"
      >
        독개의 개발블로그
      </Link>
      <nav className="flex items-center gap-4 text-sm text-gray-600">
        <SearchTrigger />
        <Link
          href="/about"
          className="hover:text-[var(--color-primary)] transition-colors"
        >
          소개
        </Link>
        <Link
          href="/feed.xml"
          className="hover:text-[var(--color-primary)] transition-colors"
        >
          RSS
        </Link>
      </nav>
    </header>
  );
}
