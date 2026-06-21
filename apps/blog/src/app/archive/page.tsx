import Link from 'next/link';
import type { Metadata } from 'next';
import dayjs from 'dayjs';
import { getArchiveMonths } from '@/lib/posts';
import { CategoryLabel } from '@/components/CategoryLabel';

export const metadata: Metadata = {
  title: '아카이브 | Doggae Log',
  description: '월별로 정리된 글 목록',
};

export default function ArchivePage() {
  const months = getArchiveMonths();
  const totalPosts = months.reduce((sum, m) => sum + m.posts.length, 0);

  return (
    <>
      <header className="mb-8 border-b border-gray-100 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">아카이브</h1>
        <p className="mt-1 text-sm text-gray-500">
          총 {totalPosts}편 · {months.length}개월
        </p>
      </header>

      {months.length === 0 ? (
        <p className="text-sm text-gray-400">아직 작성된 글이 없습니다.</p>
      ) : (
        <div className="space-y-10">
          {months.map((month) => (
            <section key={month.yearMonth}>
              <div className="mb-4 flex items-baseline gap-2">
                <Link
                  href={`/archive/${month.yearMonth}`}
                  className="text-base font-semibold text-gray-900 hover:text-[var(--color-primary)] transition-colors"
                >
                  {month.label}
                </Link>
                <span className="text-xs text-gray-400">{month.posts.length}편</span>
              </div>
              <ul className="space-y-4">
                {month.posts.map((post) => (
                  <li key={post.slug} className="space-y-1">
                    <CategoryLabel category={post.category} />
                    <Link href={`/posts/${post.slug}`} className="block group">
                      <h2 className="text-sm font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                        {post.title}
                      </h2>
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{dayjs(post.date).format('YYYY년 M월 D일')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
