'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { TagBadge } from './TagBadge';
import type { PostData } from '@/lib/posts';

export function PostContent({ post }: { post: PostData }) {
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
        'bg-white/10 hover:bg-white/20 text-white/70 transition-colors ' +
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

  return (
    <div>
      {/* 메타데이터 */}
      <header className="mb-8 border-b border-gray-100 pb-8">
        <h1 className="text-3xl font-bold text-gray-900">{post.title}</h1>
        <p className="mt-2 text-sm text-gray-400">
          {dayjs(post.date).format('YYYY년 M월 D일')}
        </p>
        <div className="mt-3 flex gap-2">
          {post.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      </header>

      {/* 본문 */}
      <article
        ref={ref}
        className={[
          'prose prose-neutral max-w-none',
          'prose-headings:font-semibold prose-headings:text-gray-900',
          'prose-a:text-[var(--color-primary)] prose-a:no-underline hover:prose-a:underline',
          'prose-code:text-sm prose-code:before:content-none prose-code:after:content-none',
          'prose-pre:p-0 prose-pre:bg-transparent prose-pre:rounded-xl prose-pre:overflow-hidden',
          'prose-table:text-sm',
        ].join(' ')}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

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
