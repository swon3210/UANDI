import Link from 'next/link';

const year = new Date().getFullYear();

export function BlogFooter() {
  return (
    <footer className="mt-16 border-t border-gray-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {year} Doggae Log</p>
        <nav className="flex flex-wrap items-center gap-4">
          <a
            href="https://codingmoondoll.tistory.com"
            className="inline-flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/old-blog-favicon.png"
              alt=""
              aria-hidden="true"
              className="h-4 w-4 rounded-sm"
            />
            이전 블로그
          </a>
          <a
            href="https://github.com/swon3210"
            className="hover:text-[var(--color-primary)] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <Link
            href="/feed.xml"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            RSS
          </Link>
          <a
            href="mailto:swon3210@gmail.com"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            Email
          </a>
        </nav>
      </div>
    </footer>
  );
}
