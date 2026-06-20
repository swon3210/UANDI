'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { TagBadge } from './TagBadge';
import { CategoryLabel } from './CategoryLabel';
import { ReadingTime } from './ReadingTime';
import { SeriesBadge } from './SeriesBadge';
import { RelatedPosts } from './RelatedPosts';
import { TableOfContents } from './TableOfContents';
import type { PostData, PostMeta } from '@/lib/posts';
import type { SeriesContext } from '@/lib/posts';

export function PostContent({
  post,
  series,
  relatedPosts = [],
}: {
  post: PostData;
  series?: SeriesContext | null;
  relatedPosts?: PostMeta[];
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const codeBlocks = ref.current.querySelectorAll('pre');
    codeBlocks.forEach((pre) => {
      if (pre.querySelector('[data-copy-btn]')) return;

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      const button = document.createElement('button');
      button.dataset.copyBtn = 'true';
      button.textContent = '복사';
      button.className =
        'absolute top-2 right-2 text-xs px-2 py-1 rounded ' +
        'bg-gray-200/70 hover:bg-gray-300/70 text-gray-700 transition-colors ' +
        'font-mono leading-none';

      button.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent ?? '').then(() => {
          button.textContent = '복사됨';
          setTimeout(() => {
            button.textContent = '복사';
          }, 2000);
        });
      });

      wrapper.appendChild(button);
    });
  }, [post.content]);

  const seriesTotal = series?.posts.length;
  const currentIndex = series?.posts.findIndex((p) => p.slug === post.slug);
  const prevInSeries: PostMeta | undefined =
    currentIndex !== undefined && currentIndex > 0
      ? series!.posts[currentIndex - 1]
      : undefined;
  const nextInSeries: PostMeta | undefined =
    currentIndex !== undefined &&
    series &&
    currentIndex >= 0 &&
    currentIndex < series.posts.length - 1
      ? series.posts[currentIndex + 1]
      : undefined;

  return (
    <div>
      {/* 메타데이터 */}
      <header className="mb-8 border-b border-gray-100 pb-8">
        <div className="mb-2">
          <CategoryLabel category={post.category} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-400">
          <span>{dayjs(post.date).format('YYYY년 M월 D일')}</span>
          <span>·</span>
          <ReadingTime minutes={post.readingTimeMinutes} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {post.series ? (
            <SeriesBadge
              series={post.series}
              order={post.seriesOrder}
              total={seriesTotal}
            />
          ) : null}
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </header>

      {/* 목차 — 데스크톱: 우측 플로팅 / 모바일: 상단 토글 드로어 */}
      <TableOfContents items={post.toc} />

      {/* 본문 */}
      <article
        ref={ref}
        className={[
          'prose prose-neutral max-w-none',
          'prose-headings:font-semibold prose-headings:text-gray-900',
          'prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline',
          'prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
          'prose-pre:rounded-xl prose-pre:overflow-hidden',
          'prose-table:text-sm',
        ].join(' ')}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* 시리즈 네비게이션 */}
      {series ? (
        <nav className="mt-12 rounded-xl border border-gray-100 p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            시리즈 · {series.title}
          </div>
          <ol className="space-y-1">
            {series.posts.map((p) => {
              const isCurrent = p.slug === post.slug;
              return (
                <li key={p.slug} className="flex items-baseline gap-2 text-sm">
                  <span className="w-6 shrink-0 text-gray-400">
                    {p.seriesOrder ?? '-'}.
                  </span>
                  {isCurrent ? (
                    <span className="font-semibold text-gray-900">
                      {p.title}
                    </span>
                  ) : (
                    <Link
                      href={`/posts/${p.slug}`}
                      className="text-gray-700 hover:text-[var(--color-primary)] transition-colors"
                    >
                      {p.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
          {(prevInSeries || nextInSeries) && (
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              {prevInSeries ? (
                <Link
                  href={`/posts/${prevInSeries.slug}`}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  &larr; 이전 편: {prevInSeries.title}
                </Link>
              ) : (
                <span />
              )}
              {nextInSeries ? (
                <Link
                  href={`/posts/${nextInSeries.slug}`}
                  className="hover:text-[var(--color-primary)] transition-colors"
                >
                  다음 편: {nextInSeries.title} &rarr;
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </nav>
      ) : null}

      <RelatedPosts posts={relatedPosts} />

      {/* 목록으로 돌아가기 */}
      <div className="mt-12 border-t border-gray-100 pt-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-[var(--color-primary)] transition-colors"
        >
          &larr; 목록으로
        </Link>
      </div>
    </div>
  );
}
