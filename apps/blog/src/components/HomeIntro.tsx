import Link from 'next/link';

// 홈 상단 정체성 인트로 — 블로그가 어디로 가는 기록인지 첫 화면에서 밝힌다
export function HomeIntro() {
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
        <p className="text-sm leading-relaxed text-gray-700">
          만드는 데서 멈추지 않고, 만든 것이{' '}
          <strong className="text-gray-900">현장에서 실제로 쓰이게</strong>{' '}
          만드는 일을 파고 있습니다. AI를 팀과 제품에 배치해 정착시키는 과정을
          여기에 기록합니다.
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs font-medium">
          <Link
            href="/series/road-to-fde"
            className="text-[var(--color-primary)] hover:underline"
          >
            FDE로 가는 길 →
          </Link>
          <Link href="/about" className="text-gray-500 hover:underline">
            소개
          </Link>
        </div>
      </div>
    </section>
  );
}
