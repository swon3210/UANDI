import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: '소개 | Doggae Log',
  description:
    '프론트엔드 개발자로 일하면서, 프로덕트 엔지니어로 일의 범위를 넓혀가는 5년차의 기록',
};

export default function AboutPage() {
  return (
    <article className="space-y-12">
      {/* 정체성 */}
      <section>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot/face.png"
          alt="Doggae Log 마스코트"
          className="mb-5 h-20 w-20 rounded-full bg-[var(--color-primary)]/10 p-1"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          About
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-snug text-gray-900">
          &ldquo;프론트엔드 개발자&rdquo;로 일하면서,
          <br />
          프로덕트 엔지니어로 일을 넓혀가는 5년차{' '}
          <span className="text-[var(--color-primary)]">독개</span>입니다.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600">
          코드를 빨리 짜는 능력만으로는 5년차의 단가를 정당화할 수 없는
          시대라고 믿습니다. 그래서 코드 위에 세 가지를 더 쌓는 중입니다 —
          <strong className="text-gray-900">AI를 도구화하는 명세 인프라</strong>,{' '}
          <strong className="text-gray-900">사용자에게 가설을 깨뜨리는 작은 프로덕트</strong>,
          그리고 <strong className="text-gray-900">의사결정 과정을 남기는 기록</strong>.
          매주 한 편씩, 그 세 갈래의 흔적을 이 블로그에 모읍니다.
        </p>
      </section>

      {/* MOA 프로젝트 소개 */}
      <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <div className="sm:flex sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              지금 만들고 있는 것 — MOA
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              신혼부부를 위한 사진 갤러리 + 가계부 앱입니다. 아내와 둘이서 직접
              사용자가 되어 만들고 있고, AI를 어떻게 도구화하면 작은 팀이 빠르게
              제품을 검증할 수 있는지를 검증하는 실험장이기도 합니다. 이 블로그의
              많은 글은 MOA를 만들면서 마주친 문제들에서 나옵니다.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/splash.png"
            alt="둘이 함께 가계부를 쓰는 마스코트 커플"
            className="mx-auto mt-4 w-40 shrink-0 sm:mx-0 sm:mt-0"
          />
        </div>
      </section>

      {/* 콘텐츠 4분면 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">
          여기서 다루는 4가지 글
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          블로그의 모든 글은 아래 4가지 카테고리 중 하나에 속합니다.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {CATEGORY_SLUGS.map((slug) => {
            const meta = CATEGORIES[slug];
            return (
              <li key={slug}>
                <Link
                  href={`/categories/${slug}`}
                  className="block rounded-xl border border-gray-100 p-4 transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {meta.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {meta.description}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 연락처 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">연락</h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-600">
          <li>
            GitHub:{' '}
            <a
              href="https://github.com/swon3210"
              className="text-[var(--color-primary)] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              @swon3210
            </a>
          </li>
          <li>
            Email:{' '}
            <a
              href="mailto:swon3210@gmail.com"
              className="text-[var(--color-primary)] hover:underline"
            >
              swon3210@gmail.com
            </a>
          </li>
        </ul>
      </section>
    </article>
  );
}
