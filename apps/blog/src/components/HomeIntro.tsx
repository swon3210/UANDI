import Link from 'next/link';

import { getHomeIntro } from '@/lib/home-intro';
import { markdownToHtml } from '@/lib/markdown';

// 홈 상단 정체성 인트로 — 문구·링크·노출 여부는 content/home-intro.md 가 정한다.
// 본문은 글과 같은 마크다운 파이프라인을 타므로 **강조**·링크를 그대로 쓸 수 있다.
export async function HomeIntro() {
  const intro = getHomeIntro();
  if (!intro) return null;

  const { html } = await markdownToHtml(intro.markdown);

  return (
    <section className="mb-8 flex items-center gap-5 rounded-2xl border border-gray-200/80 bg-gray-50 p-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot/face.png"
        alt=""
        aria-hidden="true"
        className="hidden w-14 shrink-0 sm:block"
      />
      <div className="min-w-0">
        <div
          className="text-sm leading-relaxed text-gray-700 [&_a]:text-[var(--color-primary)] [&_a:hover]:underline [&_p+p]:mt-2 [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-gray-900"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {intro.links.length > 0 ? (
          <div className="mt-2 flex items-center gap-4 text-xs font-medium">
            {intro.links.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={
                  link.primary
                    ? 'text-[var(--color-primary)] hover:underline'
                    : 'text-gray-500 hover:underline'
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
