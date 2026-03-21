import Link from 'next/link';

export function BlogHeader() {
  return (
    <header className="h-14 border-b border-gray-100 px-4 flex items-center">
      <Link
        href="/"
        className="font-semibold text-gray-900 hover:text-[var(--color-primary)] transition-colors"
      >
        UANDI Dev Blog
      </Link>
    </header>
  );
}
