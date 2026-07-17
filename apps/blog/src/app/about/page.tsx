import type { Metadata } from 'next';
import Link from 'next/link';
import { CATEGORIES, CATEGORY_SLUGS } from '@/lib/taxonomy';

export const metadata: Metadata = {
  title: '소개 | Doggae Log',
  description:
    '화면을 만들어 온 5년차 프론트엔드 개발자. 요즘은 만든 것이 현장에서 실제로 쓰이게 만드는 일(Forward Deployed)을 파고 있습니다.',
};

export default function AboutPage() {
  return (
    <article className="space-y-12">
      {/* 정체성 */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
          About
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-snug text-gray-900">
          화면을 만들어 온 5년차{' '}
          <span className="text-[var(--color-primary)]">독개</span>입니다.
          <br />
          요즘은 만든 것이{' '}
          <span className="underline decoration-[var(--color-primary)]/40 decoration-4 underline-offset-4">
            현장에서 쓰이게
          </span>{' '}
          만드는 일을 파고 있습니다.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600">
          잘 만든 소프트웨어와 실제로 쓰이는 소프트웨어 사이에는 별개의 일이
          하나 더 있다고 믿게 됐습니다. 그래서 코드 위에 세 가지를 쌓는 중입니다
          — <strong className="text-gray-900">AI를 팀과 제품에 배치해 정착시키는 인프라</strong>,{' '}
          <strong className="text-gray-900">사용자에게 가설을 검증하는 작은 프로덕트</strong>,
          그리고 <strong className="text-gray-900">그 과정을 남기는 기록</strong>.
          매주 한 편씩, 그 흔적을 이 블로그에 모읍니다.
        </p>
      </section>

      {/* 지금 가는 방향 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">
          지금 가는 방향 — Forward Deployed
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          FDE(Forward Deployed Engineer)는 플랫폼을 들고 사용자 곁으로 가서
          진짜 문제를 찾고, 그들의 환경에 맞게 만들고, 실제로 쓰이는 단계까지
          책임지는 엔지니어를 말합니다. 회사에서 기획자·디자이너가 실제로 쓰는
          AI 워크플로우를 만들며 이 일의 성격을 몸으로 겪었고, 지금은 그 역량을
          의식적으로 넓혀가는 중입니다. 과정은 시리즈로 기록합니다.
        </p>
        <Link
          href="/series/road-to-fde"
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-4 py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
        >
          시리즈: FDE로 가는 길 →
        </Link>
      </section>

      {/* 말랑 가계부 프로젝트 소개 */}
      <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <div className="sm:flex sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              지금 만들고 있는 것 — 말랑 가계부
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              신혼부부를 위한 사진 갤러리 + 가계부 앱입니다. 아내와 둘이서 직접
              사용자가 되어 만들고 있고, AI를 어떻게 도구화하면 작은 팀이 빠르게
              제품을 검증할 수 있는지를 확인하는 실험장이기도 합니다. 만드는
              데서 끝나지 않고 실제로 쓰이는지까지 지켜보는 훈련장인 셈입니다.
              이 블로그의 많은 글은 말랑 가계부를 만들면서 마주친 문제들에서
              나옵니다.
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

      {/* 콘텐츠 분류 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900">
          여기서 다루는 글
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          글은 두 축으로 나눕니다 —{' '}
          <strong className="text-gray-900">기술 / 프로덕트</strong>, 그리고{' '}
          <strong className="text-gray-900">
            어떻게 만들었나(구현) / 왜 그렇게 했나(선택)
          </strong>
          . 여기에 가끔 짧은 에세이를 더합니다.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {CATEGORY_SLUGS.filter((slug) => slug !== 'essay').map((slug) => {
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
        <Link
          href="/categories/essay"
          className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-4 transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5"
        >
          <span className="text-sm font-semibold text-gray-900">
            {CATEGORIES.essay.label}
          </span>
          <span className="text-xs text-gray-500">
            {CATEGORIES.essay.description}
          </span>
        </Link>
      </section>

      {/* 이전 블로그 안내 */}
      <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
        <div className="sm:flex sm:items-center sm:gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot/sticker-wink.png"
            alt="윙크하는 마스코트"
            className="mx-auto w-28 shrink-0 sm:mx-0"
          />
          <div className="min-w-0 flex-1">
            <h2 className="mt-4 text-lg font-semibold text-gray-900 sm:mt-0">
              티스토리에서 이사 왔어요
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              원래는 티스토리에 글을 써왔습니다. AI를 도구화하는 실험을 제대로
              기록하고 싶어서, 레이아웃부터 내 손으로 만든 이 공간으로
              옮겼어요. 예전 글들은 따로 옮기지 않고 티스토리에 그대로 두었으니,
              지난 기록이 궁금하면 거기서 볼 수 있습니다.
            </p>
            <a
              href="https://codingmoondoll.tistory.com"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
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
              이전 블로그 보러 가기
            </a>
          </div>
        </div>
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
