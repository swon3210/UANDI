import Link from 'next/link';
import dayjs from 'dayjs';
import type { PostMeta } from '@/lib/posts';
import { CategoryLabel } from './CategoryLabel';

export function FeaturedPostHero({ post }: { post: PostMeta }) {
  return (
    <section className="relative mb-10 overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent p-6">
      {/* 마스코트 — 우측 하단에서 빼꼼 (장식, 텍스트 영역과 겹치지 않게) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/face.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-4 -right-3 hidden w-28 select-none sm:block"
      />
      <div className="relative sm:pr-28">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            PINNED
          </span>
          <CategoryLabel category={post.category} />
        </div>
        <Link href={`/posts/${post.slug}`} className="group block">
          <h2 className="text-2xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
            {post.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {post.summary}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
            <span>{dayjs(post.date).format('YYYY년 M월 D일')}</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
